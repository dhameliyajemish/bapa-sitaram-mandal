const { db } = require('../config/db');

const getEntries = async (req, res) => {
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
    `).all();

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
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createEntry = async (req, res) => {
  try {
    const { memberId, month, hapto = 0, upad = 0, vyaj = 0, creditVyaj = 0, dand = 0 } = req.body;
    
    // Auto-calculate total: hapto - upad + vyaj + dand
    const total = Number(hapto) - Number(upad) + Number(vyaj) + Number(dand);

    const result = db.prepare(`
      INSERT INTO monthly_entries (memberId, month, hapto, upad, vyaj, creditVyaj, dand, total)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(memberId, month, Number(hapto), Number(upad), Number(vyaj), Number(creditVyaj), Number(dand), total);

    const inserted = db.prepare(`
      SELECT 
        me.*, 
        m.name AS m_name, 
        m.mobile AS m_mobile, 
        m.fataNo AS m_fataNo, 
        m.email AS m_email
      FROM monthly_entries me
      LEFT JOIN members m ON me.memberId = m.id
      WHERE me.id = ?
    `).get(result.lastInsertRowid);

    const formatted = {
      _id: inserted.id,
      month: inserted.month,
      hapto: inserted.hapto,
      upad: inserted.upad,
      vyaj: inserted.vyaj,
      creditVyaj: inserted.creditVyaj,
      dand: inserted.dand,
      total: inserted.total,
      createdAt: inserted.createdAt,
      updatedAt: inserted.updatedAt,
      memberId: {
        _id: inserted.memberId,
        name: inserted.m_name,
        mobile: inserted.m_mobile,
        fataNo: inserted.m_fataNo,
        email: inserted.m_email
      }
    };

    res.status(201).json(formatted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteEntry = async (req, res) => {
  try {
    const entry = db.prepare('SELECT * FROM monthly_entries WHERE id = ?').get(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Entry not found' });
    
    db.prepare('DELETE FROM monthly_entries WHERE id = ?').run(req.params.id);
    res.json({ message: 'Entry deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getEntries, createEntry, deleteEntry };
