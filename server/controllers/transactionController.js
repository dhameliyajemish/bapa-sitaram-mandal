const Transaction = require('../models/Transaction');
const Member = require('../models/Member');

// @desc  Get all transactions (with filters)
// @route GET /api/transactions
exports.getTransactions = async (req, res, next) => {
  try {
    const { month, memberId, type, page = 1, limit = 100 } = req.query;
    const query = {};
    if (month) query.month = month;
    if (memberId) query.memberId = memberId;
    if (type) query.type = type;

    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .populate('memberId', 'name fataNo memberId mobile')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.json({ success: true, total, data: transactions });
  } catch (err) { next(err); }
};

// @desc  Add transaction
// @route POST /api/transactions
exports.addTransaction = async (req, res, next) => {
  try {
    const tx = await Transaction.create({ ...req.body, createdBy: req.admin._id });
    const populated = await tx.populate('memberId', 'name fataNo memberId');
    res.status(201).json({ success: true, data: populated });
  } catch (err) { next(err); }
};

// @desc  Delete transaction
// @route DELETE /api/transactions/:id
exports.deleteTransaction = async (req, res, next) => {
  try {
    const tx = await Transaction.findByIdAndDelete(req.params.id);
    if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found' });
    res.json({ success: true, message: 'Transaction deleted' });
  } catch (err) { next(err); }
};

// @desc  Dashboard summary (aggregated)
// @route GET /api/transactions/summary
exports.getSummary = async (req, res, next) => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const [agg] = await Transaction.aggregate([
      { $group: {
        _id: null,
        totalDeposit: { $sum: { $cond: [{ $eq: ['$type','deposit'] }, '$amount', 0] } },
        totalWithdraw: { $sum: { $cond: [{ $eq: ['$type','withdraw'] }, '$amount', 0] } },
        totalInterest: { $sum: { $cond: [{ $eq: ['$type','interest'] }, '$amount', 0] } },
        totalPenalty: { $sum: { $cond: [{ $eq: ['$type','penalty'] }, '$amount', 0] } },
      }}
    ]);
    const [monthAgg] = await Transaction.aggregate([
      { $match: { month: currentMonth } },
      { $group: {
        _id: null,
        monthDeposit: { $sum: { $cond: [{ $eq: ['$type','deposit'] }, '$amount', 0] } },
        monthWithdraw: { $sum: { $cond: [{ $eq: ['$type','withdraw'] }, '$amount', 0] } },
      }}
    ]);
    const memberCount = await Member.countDocuments({ isActive: true });
    // Monthly trend (last 6 months)
    const trend = await Transaction.aggregate([
      { $match: { type: 'deposit' } },
      { $group: { _id: '$month', total: { $sum: '$amount' } } },
      { $sort: { _id: -1 } },
      { $limit: 6 }
    ]);

    res.json({
      success: true,
      data: {
        memberCount,
        totalDeposit: agg?.totalDeposit || 0,
        totalWithdraw: agg?.totalWithdraw || 0,
        totalInterest: agg?.totalInterest || 0,
        totalPenalty: agg?.totalPenalty || 0,
        netBalance: (agg?.totalDeposit || 0) - (agg?.totalWithdraw || 0),
        monthDeposit: monthAgg?.monthDeposit || 0,
        monthWithdraw: monthAgg?.monthWithdraw || 0,
        monthlyTrend: trend.reverse(),
      }
    });
  } catch (err) { next(err); }
};

// @desc  Member ledger (all transactions for a member)
// @route GET /api/transactions/ledger/:memberId
exports.getMemberLedger = async (req, res, next) => {
  try {
    const member = await Member.findById(req.params.memberId);
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
    const transactions = await Transaction.find({ memberId: req.params.memberId }).sort({ date: 1 });
    let balance = member.openingBalance || 0;
    const ledger = transactions.map(tx => {
      if (tx.type === 'deposit' || tx.type === 'interest') balance += tx.amount;
      else balance -= tx.amount;
      return { ...tx.toObject(), runningBalance: balance };
    });
    res.json({ success: true, member, data: ledger });
  } catch (err) { next(err); }
};
