const express = require('express');
const router = express.Router();
const { getEntries, createEntry, deleteEntry } = require('../controllers/entryController');
const { protect } = require('../middleware/authMiddleware');
const { db } = require('../config/db');

router.route('/')
  .get(protect, getEntries)
  .post(protect, createEntry);

router.route('/:id')
  .delete(protect, deleteEntry);

router.get('/month/:month', protect, async (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT 
        me.*, 
        m.name AS m_name, 
        m.mobile AS m_mobile, 
        m.fataNo AS m_fataNo, 
        m.email AS m_email
      FROM monthly_entries me
      LEFT JOIN members m ON me.memberId = m.id
      WHERE me.month = ?
    `).all(req.params.month);

    const formatted = rows.map(r => ({
      _id: r.id,
      month: r.month,
      hapto: r.hapto,
      upad: r.upad,
      vyaj: r.vyaj,
      creditVyaj: r.creditVyaj,
      dand: r.dand,
      total: r.total,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      memberId: r.memberId ? {
        _id: r.memberId,
        name: r.m_name,
        mobile: r.m_mobile,
        fataNo: r.m_fataNo,
        email: r.m_email
      } : null
    }));

    res.json(formatted);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
