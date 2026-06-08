const { db, dbPath } = require('../config/db');
const fs = require('fs');



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



exports.exportDatabase = async (req, res, next) => {
  try {
    res.download(dbPath, 'database_backup.db');
  } catch (err) { next(err); }
};



exports.importDatabase = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'કોઈ ફાઈલ અપલોડ થઈ નથી! (No file uploaded)' });
    }
    
    const tempFilePath = req.file.path;
    
    db.exec('PRAGMA foreign_keys = OFF;');
    try {
      db.exec(`ATTACH DATABASE '${tempFilePath.replace(/\\/g, '/')}' AS backup_db;`);
      db.exec('BEGIN TRANSACTION;');
      
      const tables = ['admins', 'members', 'monthly_entries', 'settings', 'transactions'];
      for (const table of tables) {
        db.exec(`DELETE FROM ${table};`);
        db.exec(`INSERT INTO ${table} SELECT * FROM backup_db.${table};`);
      }
      
      db.exec('COMMIT;');
      db.exec('DETACH DATABASE backup_db;');
    } catch (err) {
      try { db.exec('ROLLBACK;'); } catch (x) {}
      try { db.exec('DETACH DATABASE backup_db;'); } catch (x) {}
      throw err;
    } finally {
      db.exec('PRAGMA foreign_keys = ON;');
      try { fs.unlinkSync(tempFilePath); } catch (e) {}
    }
    
    res.json({ success: true, message: 'ડેટાબેઝ સફળતાપૂર્વક આયાત થયો! (Database imported successfully!)' });
  } catch (err) { next(err); }
};
