const express = require('express');
const router = express.Router();
const { getEntries, createEntry, deleteEntry } = require('../controllers/entryController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getEntries)
  .post(protect, createEntry);

router.route('/:id')
  .delete(protect, deleteEntry);

router.get('/month/:month', protect, async (req, res) => {
  try {
    const entries = await require('../models/MonthlyEntry')
      .find({ month: req.params.month }).populate('memberId', 'name mobile fataNo email');
    res.json(entries);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
