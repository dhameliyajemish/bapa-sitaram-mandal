const mongoose = require('mongoose');

const entrySchema = mongoose.Schema({
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
  month: { type: String, required: true }, // Format: YYYY-MM
  hapto: { type: Number, default: 0 },
  upad: { type: Number, default: 0 },
  vyaj: { type: Number, default: 0 },
  dand: { type: Number, default: 0 },
  total: { type: Number, default: 0 }
}, {
  timestamps: true
});

entrySchema.pre('save', function() {
  this.total = Number(this.hapto || 0) - Number(this.upad || 0) + Number(this.vyaj || 0) + Number(this.dand || 0);
});

const MonthlyEntry = mongoose.model('MonthlyEntry', entrySchema);
module.exports = MonthlyEntry;
