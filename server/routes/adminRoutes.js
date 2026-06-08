const express = require('express');
const router = express.Router();
const { db } = require('../config/db');
const { protect } = require('../middleware/authMiddleware');

// Backup Endpoint
router.get('/backup', protect, async (req, res) => {
  try {
    const members = db.prepare('SELECT * FROM members').all().map(m => ({
      ...m,
      _id: m.id,
      isActive: m.isActive === 1
    }));
    
    const entries = db.prepare('SELECT * FROM monthly_entries').all().map(e => ({
      ...e,
      _id: e.id
    }));
    
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
    // Clear current database tables
    db.prepare('DELETE FROM members').run();
    db.prepare('DELETE FROM monthly_entries').run();

    // Restore members
    if (members.length > 0) {
      const insertMember = db.prepare(`
        INSERT INTO members (id, memberId, fataNo, name, mobile, email, openingBalance, familyGroup, isActive, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      for (const m of members) {
        const idVal = isNaN(parseInt(m._id || m.id)) ? null : parseInt(m._id || m.id);
        const isActiveVal = (m.isActive === true || m.isActive === 1) ? 1 : 0;
        
        insertMember.run(
          idVal,
          m.memberId || null,
          m.fataNo || '',
          m.name || '',
          m.mobile || '',
          m.email || '',
          Number(m.openingBalance || 0),
          m.familyGroup || '',
          isActiveVal,
          m.createdAt || new Date().toISOString(),
          m.updatedAt || new Date().toISOString()
        );
      }
    }
    
    // Restore entries
    if (entries.length > 0) {
      const insertEntry = db.prepare(`
        INSERT INTO monthly_entries (id, memberId, month, hapto, upad, vyaj, creditVyaj, dand, total, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      for (const e of entries) {
        const idVal = isNaN(parseInt(e._id || e.id)) ? null : parseInt(e._id || e.id);
        let memberIdVal = null;
        if (e.memberId) {
          const rawMemberId = typeof e.memberId === 'object' ? (e.memberId._id || e.memberId.id) : e.memberId;
          memberIdVal = isNaN(parseInt(rawMemberId)) ? null : parseInt(rawMemberId);
        }
        
        insertEntry.run(
          idVal,
          memberIdVal,
          e.month || '',
          Number(e.hapto || 0),
          Number(e.upad || 0),
          Number(e.vyaj || 0),
          Number(e.creditVyaj || 0),
          Number(e.dand || 0),
          Number(e.total || 0),
          e.createdAt || new Date().toISOString(),
          e.updatedAt || new Date().toISOString()
        );
      }
    }

    res.json({ message: 'Database restored successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Restore failed', error: error.message });
  }
});

module.exports = router;
