const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  creditInterestRate: { type: Number, default: 1 },
  debitInterestRate: { type: Number, default: 1 }
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingsSchema);
