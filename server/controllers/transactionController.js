const { db } = require('../config/db');

// @desc  Get all transactions (with filters)
// @route GET /api/transactions
exports.getTransactions = async (req, res, next) => {
  try {
    const { month, memberId, type, page = 1, limit = 100 } = req.query;
    
    let whereClauses = [];
    let params = [];

    if (month) {
      whereClauses.push('t.month = ?');
      params.push(month);
    }
    if (memberId) {
      whereClauses.push('t.memberId = ?');
      params.push(memberId);
    }
    if (type) {
      whereClauses.push('t.type = ?');
      params.push(type);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countRes = db.prepare(`SELECT COUNT(*) as count FROM transactions t ${whereSql}`).get(...params);
    const total = countRes.count;

    const limitVal = parseInt(limit);
    const offsetVal = (parseInt(page) - 1) * limitVal;

    const rows = db.prepare(`
      SELECT 
        t.*, 
        m.name AS m_name, 
        m.fataNo AS m_fataNo, 
        m.memberId AS m_memberId, 
        m.mobile AS m_mobile
      FROM transactions t
      LEFT JOIN members m ON t.memberId = m.id
      ${whereSql}
      ORDER BY t.date DESC
      LIMIT ? OFFSET ?
    `).all(...params, limitVal, offsetVal);

    const formatted = rows.map(r => ({
      _id: r.id,
      type: r.type,
      amount: r.amount,
      month: r.month,
      date: r.date,
      note: r.note,
      createdBy: r.createdBy,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      memberId: r.memberId ? {
        _id: r.memberId,
        name: r.m_name,
        fataNo: r.m_fataNo,
        memberId: r.m_memberId,
        mobile: r.m_mobile
      } : null
    }));

    res.json({ success: true, total, data: formatted });
  } catch (err) { next(err); }
};

// @desc  Add transaction
// @route POST /api/transactions
exports.addTransaction = async (req, res, next) => {
  try {
    const { memberId, type, amount, month, date, note } = req.body;
    const createdBy = req.admin ? req.admin.id : null;

    const insertDate = date || new Date().toISOString();

    const result = db.prepare(`
      INSERT INTO transactions (memberId, type, amount, month, date, note, createdBy)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(memberId, type, Number(amount), month, insertDate, note || '', createdBy);

    const inserted = db.prepare(`
      SELECT 
        t.*, 
        m.name AS m_name, 
        m.fataNo AS m_fataNo, 
        m.memberId AS m_memberId
      FROM transactions t
      LEFT JOIN members m ON t.memberId = m.id
      WHERE t.id = ?
    `).get(result.lastInsertRowid);

    const formatted = {
      _id: inserted.id,
      type: inserted.type,
      amount: inserted.amount,
      month: inserted.month,
      date: inserted.date,
      note: inserted.note,
      createdBy: inserted.createdBy,
      createdAt: inserted.createdAt,
      updatedAt: inserted.updatedAt,
      memberId: {
        _id: inserted.memberId,
        name: inserted.m_name,
        fataNo: inserted.m_fataNo,
        memberId: inserted.m_memberId
      }
    };

    res.status(201).json({ success: true, data: formatted });
  } catch (err) { next(err); }
};

// @desc  Delete transaction
// @route DELETE /api/transactions/:id
exports.deleteTransaction = async (req, res, next) => {
  try {
    const tx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id);
    if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found' });

    db.prepare('DELETE FROM transactions WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Transaction deleted' });
  } catch (err) { next(err); }
};

// @desc  Dashboard summary (aggregated)
// @route GET /api/transactions/summary
exports.getSummary = async (req, res, next) => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);

    // Aggregate totals
    const agg = db.prepare(`
      SELECT 
        SUM(CASE WHEN type = 'deposit' THEN amount ELSE 0 END) AS totalDeposit,
        SUM(CASE WHEN type = 'withdraw' THEN amount ELSE 0 END) AS totalWithdraw,
        SUM(CASE WHEN type = 'interest' THEN amount ELSE 0 END) AS totalInterest,
        SUM(CASE WHEN type = 'penalty' THEN amount ELSE 0 END) AS totalPenalty
      FROM transactions
    `).get();

    // Aggregate month totals
    const monthAgg = db.prepare(`
      SELECT 
        SUM(CASE WHEN type = 'deposit' THEN amount ELSE 0 END) AS monthDeposit,
        SUM(CASE WHEN type = 'withdraw' THEN amount ELSE 0 END) AS monthWithdraw
      FROM transactions
      WHERE month = ?
    `).get(currentMonth);

    const memberCountRes = db.prepare('SELECT COUNT(*) as count FROM members WHERE isActive = 1').get();
    const memberCount = memberCountRes.count;

    // Monthly trend (last 6 months deposits)
    const trendRows = db.prepare(`
      SELECT month AS _id, SUM(amount) AS total
      FROM transactions
      WHERE type = 'deposit'
      GROUP BY month
      ORDER BY month DESC
      LIMIT 6
    `).all();

    // Reverse trend to be chronological
    const trend = trendRows.map(r => ({
      _id: r._id,
      total: r.total
    })).reverse();

    res.json({
      success: true,
      data: {
        memberCount,
        totalDeposit: agg.totalDeposit || 0,
        totalWithdraw: agg.totalWithdraw || 0,
        totalInterest: agg.totalInterest || 0,
        totalPenalty: agg.totalPenalty || 0,
        netBalance: (agg.totalDeposit || 0) - (agg.totalWithdraw || 0),
        monthDeposit: monthAgg.monthDeposit || 0,
        monthWithdraw: monthAgg.monthWithdraw || 0,
        monthlyTrend: trend,
      }
    });
  } catch (err) { next(err); }
};

// @desc  Member ledger (all transactions for a member)
// @route GET /api/transactions/ledger/:memberId
exports.getMemberLedger = async (req, res, next) => {
  try {
    const member = db.prepare('SELECT * FROM members WHERE id = ?').get(req.params.memberId);
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });

    const transactions = db.prepare('SELECT * FROM transactions WHERE memberId = ? ORDER BY date ASC').all(req.params.memberId);

    let balance = member.openingBalance || 0;
    const ledger = transactions.map(tx => {
      if (tx.type === 'deposit' || tx.type === 'interest') balance += tx.amount;
      else balance -= tx.amount;
      
      return {
        _id: tx.id,
        memberId: tx.memberId,
        type: tx.type,
        amount: tx.amount,
        month: tx.month,
        date: tx.date,
        note: tx.note,
        createdBy: tx.createdBy,
        createdAt: tx.createdAt,
        updatedAt: tx.updatedAt,
        runningBalance: balance
      };
    });

    res.json({ 
      success: true, 
      member: {
        ...member,
        _id: member.id,
        isActive: member.isActive === 1
      }, 
      data: ledger 
    });
  } catch (err) { next(err); }
};
