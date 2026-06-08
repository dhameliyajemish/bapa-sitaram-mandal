const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');
let dbPath;

if (process.env.DATABASE_PATH) {
  try {
    const customPath = process.env.DATABASE_PATH;
    const customDir = path.dirname(customPath);
    if (fs.existsSync(customDir)) {
      dbPath = customPath;
    }
  } catch (e) {
    console.error('Error verifying custom DATABASE_PATH:', e.message);
  }
}

if (!dbPath) {
  try {
    
    const { app } = require('electron');
    if (app) {
      dbPath = path.join(app.getPath('userData'), 'database.db');
    }
  } catch (e) {
    
  }
}

if (!dbPath) {
  dbPath = path.join(__dirname, '../database.db');
}

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

console.log(`Connecting to SQLite database at: ${dbPath}`);
const db = new DatabaseSync(dbPath);

const connectDB = () => {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'admin',
        resetPasswordOTP TEXT,
        resetPasswordExpires INTEGER,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        memberId TEXT UNIQUE,
        fataNo TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        mobile TEXT NOT NULL,
        email TEXT,
        openingBalance REAL DEFAULT 0,
        familyGroup TEXT DEFAULT '',
        isActive INTEGER DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    db.exec(`DROP TABLE IF EXISTS loans;`);

    db.exec(`
      CREATE TABLE IF NOT EXISTS monthly_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        memberId INTEGER NOT NULL,
        month TEXT NOT NULL,
        hapto REAL DEFAULT 0,
        upad REAL DEFAULT 0,
        vyaj REAL DEFAULT 0,
        creditVyaj REAL DEFAULT 0,
        dand REAL DEFAULT 0,
        total REAL DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (memberId) REFERENCES members(id) ON DELETE CASCADE
      );
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        creditInterestRate REAL DEFAULT 1,
        debitInterestRate REAL DEFAULT 1,
        penaltyAmount REAL DEFAULT 100,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    try {
      db.exec(`ALTER TABLE settings ADD COLUMN penaltyAmount REAL DEFAULT 100;`);
      console.log('Added penaltyAmount column to settings table.');
    } catch (e) {
      // Column might already exist, ignore error
    }

    db.exec(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        memberId INTEGER NOT NULL,
        type TEXT CHECK(type IN ('deposit', 'withdraw', 'interest', 'penalty')) NOT NULL,
        amount REAL NOT NULL,
        month TEXT NOT NULL,
        date TEXT DEFAULT (datetime('now', 'localtime')),
        note TEXT,
        createdBy INTEGER,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (memberId) REFERENCES members(id) ON DELETE CASCADE,
        FOREIGN KEY (createdBy) REFERENCES admins(id) ON DELETE SET NULL
      );
    `);

    const settingsCount = db.prepare('SELECT COUNT(*) as count FROM settings').get();
    if (settingsCount.count === 0) {
      db.prepare('INSERT INTO settings (creditInterestRate, debitInterestRate, penaltyAmount) VALUES (?, ?, ?)').run(1, 1, 100);
      console.log('Seeded default settings.');
    }

    console.log('SQLite Database connected and tables initialized.');
  } catch (error) {
    console.error('Error during SQLite DB setup:', error.message);
  }
};

module.exports = { db, connectDB, dbPath };
