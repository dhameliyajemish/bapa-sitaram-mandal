const { db } = require('../config/db');

// @desc  Get mandal settings
// @route GET /api/settings
exports.getSettings = async (req, res, next) => {
  try {
    let settings = db.prepare('SELECT * FROM settings LIMIT 1').get();
    if (!settings) {
      const result = db.prepare('INSERT INTO settings (creditInterestRate, debitInterestRate) VALUES (?, ?)').run(1, 1);
      settings = db.prepare('SELECT * FROM settings WHERE id = ?').get(result.lastInsertRowid);
    }
    res.json({ 
      success: true, 
      data: {
        ...settings,
        _id: settings.id
      } 
    });
  } catch (err) { next(err); }
};

// @desc  Update mandal settings
// @route PUT /api/settings
exports.updateSettings = async (req, res, next) => {
  try {
    let settings = db.prepare('SELECT * FROM settings LIMIT 1').get();
    const { creditInterestRate, debitInterestRate } = req.body;

    if (!settings) {
      const result = db.prepare('INSERT INTO settings (creditInterestRate, debitInterestRate) VALUES (?, ?)').run(
        creditInterestRate !== undefined ? Number(creditInterestRate) : 1,
        debitInterestRate !== undefined ? Number(debitInterestRate) : 1
      );
      settings = db.prepare('SELECT * FROM settings WHERE id = ?').get(result.lastInsertRowid);
    } else {
      const credit = creditInterestRate !== undefined ? Number(creditInterestRate) : settings.creditInterestRate;
      const debit = debitInterestRate !== undefined ? Number(debitInterestRate) : settings.debitInterestRate;
      
      db.prepare('UPDATE settings SET creditInterestRate = ?, debitInterestRate = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?')
        .run(credit, debit, settings.id);
        
      settings = db.prepare('SELECT * FROM settings WHERE id = ?').get(settings.id);
    }

    res.json({ 
      success: true, 
      data: {
        ...settings,
        _id: settings.id
      } 
    });
  } catch (err) { next(err); }
};
