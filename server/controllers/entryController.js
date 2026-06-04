const MonthlyEntry = require('../models/MonthlyEntry');

const getEntries = async (req, res) => {
  const entries = await MonthlyEntry.find({}).populate('memberId', 'name mobile fataNo email');
  res.json(entries);
};

const createEntry = async (req, res) => {
  const { memberId, month, hapto, upad, vyaj, dand } = req.body;
  const entry = await MonthlyEntry.create({ memberId, month, hapto, upad, vyaj, dand });
  const populatedEntry = await MonthlyEntry.findById(entry._id).populate('memberId', 'name mobile fataNo email');
  res.status(201).json(populatedEntry);
};

const deleteEntry = async (req, res) => {
  try {
    const entry = await MonthlyEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Entry not found' });
    await entry.deleteOne();
    res.json({ message: 'Entry deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getEntries, createEntry, deleteEntry };
