const Loan = require('../models/Loan');
const Member = require('../models/Member');
const mongoose = require('mongoose');

const getLoans = async (req, res) => {
  try {
    const { memberId, status, search } = req.query;
    const filter = {};
    if (memberId) filter.memberId = memberId;
    if (status) filter.status = status;
    if (search) {
      filter['$or'] = [{ loanNumber: { '$regex': search, '$options': 'i' } }];
    }
    const loans = await Loan.find(filter).populate('memberId', 'name fataNo mobile');
    res.json(loans);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createLoan = async (req, res) => {
  try {
    const loanData = { ...req.body };
    loanData.loanNumber = 'LN-' + Date.now();
    const loan = await Loan.create(loanData);
    const populated = await Loan.findById(loan._id).populate('memberId', 'name fataNo mobile');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const updateLoan = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) return res.status(404).json({ message: 'Loan not found' });
    Object.assign(loan, req.body);
    if (loan.remainingBalance <= loan.emi * 1) {
      loan.status = 'Completed';
    }
    await loan.save();
    const populated = await Loan.findById(loan._id).populate('memberId', 'name fataNo mobile');
    res.json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const deleteLoan = async (req, res) => {
  const loan = await Loan.findById(req.params.id);
  if (!loan) return res.status(404).json({ message: 'Loan not found' });
  await loan.deleteOne();
  res.json({ message: 'Loan deleted' });
};

const getLoanStats = async (req, res) => {
  try {
    const totalLoaned = await Loan.aggregate([{$group: { _id: null, total: { $sum: '$amount' } } }]);
    const totalPaid = await Loan.aggregate([{$group: { _id: null, total: { $sum: '$paidAmount' } } }]);
    const activeCount = await Loan.countDocuments({ status: 'Active' });
    const completedCount = await Loan.countDocuments({ status: 'Completed' });
    res.json({
      totalLoaned: totalLoaned[0]?.total || 0,
      totalPaid: totalPaid[0]?.total || 0,
      remainingTotal: (totalLoaned[0]?.total || 0) - (totalPaid[0]?.total || 0),
      activeLoans: activeCount,
      completedLoans: completedCount,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getLoans, createLoan, updateLoan, deleteLoan, getLoanStats };

