const mongoose = require('mongoose');

const loanSchema = mongoose.Schema({
  memberId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
  loanNumber:  { type: String, required: true, unique: true },
  amount:      { type: Number, required: true },
  interestRate:{ type: Number, required: true, default: 12 }, // yearly %
  termMonths:  { type: Number, required: true },
  emi:         { type: Number, required: true },
  totalPayable:{ type: Number, required: true },
  paidAmount:  { type: Number, default: 0 },
  remainingBalance:{ type: Number, required: true },
  startDate:   { type: Date, default: Date.now },
  status:      { type: String, enum: ['Active', 'Completed', 'Defaulted'], default: 'Active' },
  notes:       { type: String },
}, { timestamps: true });

loanSchema.pre('save', function(next) {
  // Auto-calculate EMI using standard formula: P * r * (1+r)^n / ((1+r)^n - 1)
  if (this.isNew || this.isModified('amount') || this.isModified('interestRate') || this.isModified('termMonths')) {
    const P = Number(this.amount);
    const annualRate = Number(this.interestRate);
    const n = Number(this.termMonths);
    const r = annualRate / 12 / 100; // monthly rate
    if (r === 0) {
      this.emi = P / n;
    } else {
      this.emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    }
    this.totalPayable = Math.round(this.emi * n);
    this.remainingBalance = this.totalPayable - Number(this.paidAmount || 0);
  }
  next();
});

const Loan = mongoose.model('Loan', loanSchema);
module.exports = Loan;
