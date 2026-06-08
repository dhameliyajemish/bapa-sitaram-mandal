const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

if (process.env.DATABASE_PATH) {
  dbPath = process.env.DATABASE_PATH;
} else {
  try {
    // Check if we are running inside Electron (main process)
    const { app } = require('electron');
    if (app) {
      dbPath = path.join(app.getPath('userData'), 'database.db');
    }
  } catch (e) {
    // Fallback for standalone Express runner
  }
}

if (!dbPath) {
  dbPath = path.join(__dirname, '../database.db');
}

// Ensure the directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

console.log(`Connecting to SQLite database at: ${dbPath}`);
const db = new DatabaseSync(dbPath);

const connectDB = () => {
  try {
    // 1. Admins Table
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

    // 2. Members Table
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

    // Drop loans table if it existed historically
    db.exec(`DROP TABLE IF EXISTS loans;`);

    // 3. Monthly Entries Table
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

    // 4. Settings Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        creditInterestRate REAL DEFAULT 1,
        debitInterestRate REAL DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Transactions Table
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

    // Seed default settings if empty
    const settingsCount = db.prepare('SELECT COUNT(*) as count FROM settings').get();
    if (settingsCount.count === 0) {
      db.prepare('INSERT INTO settings (creditInterestRate, debitInterestRate) VALUES (?, ?)').run(1, 1);
      console.log('Seeded default settings.');
    }

    console.log('SQLite Database connected and tables initialized.');
  } catch (error) {
    console.error('Error during SQLite DB setup:', error.message);
  }
};

module.exports = { db, connectDB };
