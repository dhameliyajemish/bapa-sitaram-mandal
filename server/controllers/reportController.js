const { db } = require('../config/db');

const fmtMoney = n => "?" + Number(n || 0).toFixed(2);
const pad = (s, len) => s.padStart(len, " ");
const monthLabel = m => {
  const [yr, mo] = m.split("-");
  const M = ["જાન્યુઆરી", "ફેબ્રુઆરી", "માર્ચ", "એપ્રિલ", "મે", "જૂન", "જુલાઈ", "ઓગસ્ટ", "સપ્ટેમ્બર", "ઓક્ટોબર", "નવેમ્બર", "ડિસેમ્બર"];
  return M[+mo - 1] + " " + yr;
};

const calculateChronologicalBalance = (mEntries, targetMonth, openingBalance = 0, creditInterestRate = 1, debitInterestRate = 1) => {
  if ((!mEntries || mEntries.length === 0) && !openingBalance) return 0;

  
  const sorted = mEntries && mEntries.length > 0 ? [...mEntries].sort((a, b) => a.month.localeCompare(b.month)) : [];
  
  if (sorted.length === 0) return Number(openingBalance || 0);

  const minMonth = sorted[0].month;

  if (targetMonth.localeCompare(minMonth) < 0) return Number(openingBalance || 0);

  const entryMap = {};
  sorted.forEach(e => {
    if (!entryMap[e.month]) entryMap[e.month] = [];
    entryMap[e.month].push(e);
  });

  let balance = Number(openingBalance || 0);
  let currentMonth = minMonth;

  while (currentMonth.localeCompare(targetMonth) <= 0) {
    const mMonthEntries = entryMap[currentMonth] || [];
    const hasExplicitCreditVyaj = mMonthEntries.some(e => Number(e.creditVyaj || 0) > 0);

    if (balance > 0) {
      if (!hasExplicitCreditVyaj) {
        balance = balance * (1 + creditInterestRate / 100);
      }
    } else if (balance < 0) {
      balance = balance * (1 + debitInterestRate / 100);
    }

    let net = 0;
    mMonthEntries.forEach(e => {
      net += Number(e.hapto || 0) - Number(e.upad || 0) + Number(e.vyaj || 0) + Number(e.creditVyaj || 0) + Number(e.dand || 0);
    });
    balance += net;

    
    let [yr, mo] = currentMonth.split('-').map(Number);
    mo++;
    if (mo > 12) {
      mo = 1;
      yr++;
    }
    currentMonth = `${yr}-${String(mo).padStart(2, '0')}`;
  }

  return balance;
};

const getMonthlyReport = async (req, res) => {
  try {
    const { month } = req.query;
    if (!month) return res.status(400).json({ message: "Month is required" });

    
    const members = db.prepare('SELECT * FROM members').all();
    const settings = db.prepare('SELECT * FROM settings LIMIT 1').get();

    const creditRate = settings ? settings.creditInterestRate : 1;
    const debitRate = settings ? settings.debitInterestRate : 1;

    const memberMap = {};
    members.forEach(m => {
      memberMap[m.id] = {
        ...m,
        _id: m.id,
        isActive: m.isActive === 1
      };
    });

    const entries = db.prepare('SELECT * FROM monthly_entries WHERE month = ?').all(month);

    
    const allHistoricalEntries = db.prepare('SELECT * FROM monthly_entries WHERE month <= ?').all(month);
    
    const entriesByMember = {};
    allHistoricalEntries.forEach(e => {
      const mId = String(e.memberId);
      if (!entriesByMember[mId]) entriesByMember[mId] = [];
      entriesByMember[mId].push(e);
    });

    let tHapto = 0, tUpad = 0, tVyaj = 0, tDand = 0;
    const rows = entries.map(e => {
      const memberIdStr = String(e.memberId);
      const m = memberMap[memberIdStr] || {};
      tHapto += Number(e.hapto || 0);
      tUpad  += Number(e.upad  || 0);
      tVyaj  += Number(e.vyaj  || 0);
      tDand  += Number(e.dand  || 0);
      
      const balance = calculateChronologicalBalance(entriesByMember[memberIdStr], month, Number(m.openingBalance || 0), creditRate, debitRate);
      
      return {
        _id: e.id,
        memberId: e.memberId,
        month: e.month,
        hapto: e.hapto,
        upad: e.upad,
        vyaj: e.vyaj,
        creditVyaj: e.creditVyaj,
        dand: e.dand,
        total: e.total,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
        member: m,
        balance: Math.round(balance * 100) / 100
      };
    });

    
    rows.sort((a, b) => {
      const fataA = a.member?.fataNo || '';
      const fataB = b.member?.fataNo || '';
      const numA = parseInt(fataA, 10);
      const numB = parseInt(fataB, 10);
      if (isNaN(numA) && isNaN(numB)) return fataA.localeCompare(fataB);
      if (isNaN(numA)) return 1;
      if (isNaN(numB)) return -1;
      return numA - numB;
    });

    res.json({
      month, label: monthLabel(month),
      rows,
      summary: { totalHapto: tHapto, totalUpad: tUpad, totalVyaj: tVyaj, totalDand: tDand }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getYearlyReport = async (req, res) => {
  try {
    const { year } = req.query;
    if (!year) return res.status(400).json({ message: "Year is required" });

    
    const entries = db.prepare("SELECT * FROM monthly_entries WHERE month LIKE ?").all(`${year}-%`);

    const monthlyMap = {};
    entries.forEach(e => {
      if (!monthlyMap[e.month]) monthlyMap[e.month] = { mh: 0, mu: 0, mv: 0, md: 0 };
      monthlyMap[e.month].mh += Number(e.hapto || 0);
      monthlyMap[e.month].mu += Number(e.upad  || 0);
      monthlyMap[e.month].mv += Number(e.vyaj  || 0);
      monthlyMap[e.month].md += Number(e.dand  || 0);
    });

    let yrHapto = 0, yrUpad = 0, yrVyaj = 0, yrDand = 0;
    const months = Object.keys(monthlyMap).sort().map(m => {
      const v = monthlyMap[m];
      yrHapto += v.mh; yrUpad += v.mu; yrVyaj += v.mv; yrDand += v.md;
      return { month: m, label: monthLabel(m), ...v };
    });

    res.json({
      year,
      months,
      grandTotal: {
        totalHapto: yrHapto,
        totalUpad: yrUpad,
        totalVyaj: yrVyaj,
        totalDand: yrDand,
        totalLoaned: 0
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMemberLedger = async (req, res) => {
  try {
    const { memberId } = req.params;
    const parsedMemberId = parseInt(memberId, 10);
    if (isNaN(parsedMemberId))
      return res.status(400).json({ message: "Invalid member ID" });

    const member = db.prepare('SELECT * FROM members WHERE id = ?').get(parsedMemberId);
    if (!member) return res.status(404).json({ message: "Member not found" });

    const settings = db.prepare('SELECT * FROM settings LIMIT 1').get();
    const creditRate = settings ? settings.creditInterestRate : 1;
    const debitRate = settings ? settings.debitInterestRate : 1;

    const entries = db.prepare('SELECT * FROM monthly_entries WHERE memberId = ? ORDER BY month ASC').all(parsedMemberId);

    let totalH = 0, totalU = 0, totalV = 0, totalD = 0;
    const rows = entries.map(e => {
      totalH += Number(e.hapto || 0);
      totalU += Number(e.upad  || 0);
      totalV += Number(e.vyaj  || 0);
      totalD += Number(e.dand  || 0);
      
      const runningBalance = calculateChronologicalBalance(entries, e.month, Number(member.openingBalance || 0), creditRate, debitRate);

      return {
        _id: e.id, 
        month: e.month,
        hapto: e.hapto, 
        upad: e.upad, 
        vyaj: e.vyaj, 
        dand: e.dand,
        total: Math.round(runningBalance * 100) / 100
      };
    });

    res.json({ 
      member: { 
        _id: member.id, 
        name: member.name, 
        fataNo: member.fataNo 
      },
      totalHapto: totalH, 
      totalUpad: totalU, 
      totalVyaj: totalV, 
      totalDand: totalD, 
      rows 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const currentMonth = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");

    const mCountRes = db.prepare('SELECT COUNT(*) as count FROM members').get();

    const allEntries = db.prepare('SELECT * FROM monthly_entries').all();
    
    
    const monthEntriesRaw = db.prepare(`
      SELECT 
        me.*, 
        m.name AS m_name, 
        m.fataNo AS m_fataNo
      FROM monthly_entries me
      LEFT JOIN members m ON me.memberId = m.id
      WHERE me.month = ?
    `).all(currentMonth);

    const monthEntries = monthEntriesRaw.map(e => ({
      _id: e.id,
      memberId: e.memberId ? {
        _id: e.memberId,
        name: e.m_name,
        fataNo: e.m_fataNo
      } : null,
      month: e.month,
      hapto: e.hapto,
      upad: e.upad,
      vyaj: e.vyaj,
      creditVyaj: e.creditVyaj,
      dand: e.dand,
      total: e.total,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt
    }));

    let totalH = 0, totalU = 0, totalV = 0, totalD = 0;
    allEntries.forEach(e => {
      totalH += Number(e.hapto || 0); 
      totalU += Number(e.upad || 0);
      totalV += Number(e.vyaj  || 0); 
      totalD += Number(e.dand  || 0);
    });

    const mTotalH = monthEntries.reduce((s, e) => s + Number(e.hapto || 0), 0);
    const mTotalU = monthEntries.reduce((s, e) => s + Number(e.upad  || 0), 0);

    res.json({
      totalMembers: mCountRes.count,
      totalHapto: totalH, 
      totalUpad: totalU, 
      totalVyaj: totalV, 
      totalDand: totalD,
      totalDeposits: totalH,
      totalWithdrawals: totalU,
      netBalance: totalH - totalU + totalV + totalD,
      thisMonth: { 
        month: currentMonth, 
        label: monthLabel(currentMonth),
        hapto: mTotalH, 
        upad: mTotalU, 
        entries: monthEntries.length 
      },
      totalLoans: 0, 
      activeLoans: 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMonthlyTrend = async (req, res) => {
  try {
    const raw = db.prepare(`
      SELECT 
        month AS _id,
        SUM(hapto) AS hapto,
        SUM(upad) AS upad,
        SUM(vyaj) AS vyaj,
        SUM(dand) AS dand
      FROM monthly_entries
      GROUP BY month
      ORDER BY month ASC
    `).all();

    const trend = raw.map(r => ({
      month: r._id, label: monthLabel(r._id),
      hapto: r.hapto, upad: r.upad, vyaj: r.vyaj, dand: r.dand
    }));
    res.json(trend);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getMonthlyReport, getYearlyReport, getMemberLedger,
  getDashboardStats, getMonthlyTrend
};
