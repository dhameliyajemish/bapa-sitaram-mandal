const mongoose = require('mongoose');
const Member = require('../models/Member');
const MonthlyEntry = require('../models/MonthlyEntry');
const Loan = require('../models/Loan');

const fmtMoney = n => '?' + Number(n || 0).toFixed(2);
const pad = (s, len) => s.padStart(len, ' ');
const monthLabel = m => {
  const [yr, mo] = m.split('-');
  const M = ["જાન્યુઆરી", "ફેબ્રુઆરી", "માર્ચ", "એપ્રિલ", "મે", "જૂન", "જુલાઈ", "ઓગસ્ટ", "સપ્ટેમ્બર", "ઓક્ટોબર", "નવેમ્બર", "ડિસેમ્બર"];
  return M[+mo - 1] + ' ' + yr;
};

const getMonthlyReport = async (req, res) => {
  try {
    const { month } = req.query;
    if (!month) return res.status(400).json({ message: 'Month is required' });

    const [members, entries] = await Promise.all([
      Member.find({}),
      MonthlyEntry.find({ month }).populate('memberId', 'name fataNo')
    ]);

    const memberMap = {};
    members.forEach(m => { memberMap[m._id] = m; });

    let tHapto = 0, tUpad = 0, tVyaj = 0, tDand = 0;
    const rows = entries.map(e => {
      const memberIdStr = String(e.memberId?._id || e.memberId);
      const m = memberMap[memberIdStr] || {};
      tHapto += Number(e.hapto || 0);
      tUpad  += Number(e.upad  || 0);
      tVyaj  += Number(e.vyaj  || 0);
      tDand  += Number(e.dand  || 0);
      return { ...e.toObject(), member: m };
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
