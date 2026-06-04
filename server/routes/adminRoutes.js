const express = require('express');
const router = express.Router();
const Member = require('../models/Member');
const MonthlyEntry = require('../models/MonthlyEntry');
const { protect } = require('../middleware/authMiddleware');

// Backup Endpoint
router.get('/backup', protect, async (req, res) => {
  try {
    const members = await Member.find({});
    const entries = await MonthlyEntry.find({});
    
    res.json({
      members,
      entries,
      backedUpAt: new Date(),
    });
  } catch (error) {
    res.status(500).json({ message: 'Backup failed', error: error.message });
  }
});

// Restore Endpoint
router.post('/restore', protect, async (req, res) => {
  const { members, entries } = req.body;
  
  if (!members || !entries) {
    return res.status(400).json({ message: 'Invalid backup format' });
  }

  try {
    // Clear current database collections
    await Member.deleteMany({});
    await MonthlyEntry.deleteMany({});

    // Restore members
    if (members.length > 0) {
      await Member.insertMany(members);
    }
    
    // Restore entries
    if (entries.length > 0) {
      await MonthlyEntry.insertMany(entries);
    }

    res.json({ message: 'Database restored successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Restore failed', error: error.message });
  }
});

module.exports = router;
