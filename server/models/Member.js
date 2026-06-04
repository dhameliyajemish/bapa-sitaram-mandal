const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  memberId: { type: String, unique: true },
  fataNo: { type: String, required: true, unique: true },
  name: { type: String, required: true, trim: true },
  mobile: { type: String, required: true },
  email: { type: String, trim: true, lowercase: true },
  openingBalance: { type: Number, default: 0 },
  familyGroup: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Auto-generate memberId before save
memberSchema.pre('save', async function () {
  if (!this.memberId) {
    const count = await mongoose.model('Member').countDocuments();
    this.memberId = `M-${1000 + count}`;
  }
});

module.exports = mongoose.model('Member', memberSchema);
