const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
  type: {
    type: String,
    enum: ['deposit', 'withdraw', 'interest', 'penalty', 'loan_repayment'],
    required: true
  },
  amount: { type: Number, required: true },
  month: { type: String, required: true },   // "2026-05"
  date: { type: Date, default: Date.now },
  note: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
