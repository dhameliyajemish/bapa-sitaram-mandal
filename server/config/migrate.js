const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mandalDB';

// Initialize SQLite database and tables
const { connectDB, db } = require('./db');

async function migrate() {
  console.log('Starting MongoDB to SQLite Migration...');
  
  // 1. Setup SQLite tables
  connectDB();

  // 2. Connect to MongoDB
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');
  } catch (err) {
    console.error('Failed to connect to MongoDB. Make sure MongoDB is running!', err.message);
    process.exit(1);
  }

  // 3. Define MongoDB schemas for reading
  const AdminSchema = new mongoose.Schema({}, { strict: false });
  const MemberSchema = new mongoose.Schema({}, { strict: false });
  const EntrySchema = new mongoose.Schema({}, { strict: false });
  const SettingSchema = new mongoose.Schema({}, { strict: false });
  const TransactionSchema = new mongoose.Schema({}, { strict: false });

  const MongoAdmin = mongoose.models.Admin || mongoose.model('Admin', AdminSchema, 'admins');
  const MongoMember = mongoose.models.Member || mongoose.model('Member', MemberSchema, 'members');
  const MongoEntry = mongoose.models.MonthlyEntry || mongoose.model('MonthlyEntry', EntrySchema, 'monthlyentries');
  const MongoSetting = mongoose.models.Setting || mongoose.model('Setting', SettingSchema, 'settings');
  const MongoTransaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema, 'transactions');

  // Translation maps for MongoDB _id Hex to SQLite Integer primary keys
  const memberIdMap = {};
  const adminIdMap = {};

  // --- A. Migrate Admins ---
  console.log('Migrating Admins...');
  const mongoAdmins = await MongoAdmin.find({});
  console.log(`Found ${mongoAdmins.length} Admins in MongoDB.`);
  
  db.exec('DELETE FROM admins');
  const insertAdmin = db.prepare(`
    INSERT INTO admins (username, email, password, role, resetPasswordOTP, resetPasswordExpires, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const admin of mongoAdmins) {
    const res = insertAdmin.run(
      admin.get('username') || '',
      admin.get('email') || '',
      admin.get('password') || '',
      admin.get('role') || 'admin',
      admin.get('resetPasswordOTP') || null,
      admin.get('resetPasswordExpires') ? new Date(admin.get('resetPasswordExpires')).getTime() : null,
      admin.get('createdAt') ? new Date(admin.get('createdAt')).toISOString() : new Date().toISOString(),
      admin.get('updatedAt') ? new Date(admin.get('updatedAt')).toISOString() : new Date().toISOString()
    );
    adminIdMap[String(admin._id)] = res.lastInsertRowid;
  }
  console.log('Admins migration complete.');

  // --- B. Migrate Members ---
  console.log('Migrating Members...');
  const mongoMembers = await MongoMember.find({});
  console.log(`Found ${mongoMembers.length} Members in MongoDB.`);

  db.exec('DELETE FROM members');
  const insertMember = db.prepare(`
    INSERT INTO members (memberId, fataNo, name, mobile, email, openingBalance, familyGroup, isActive, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const member of mongoMembers) {
    const isActive = member.get('isActive') === false ? 0 : 1;
    const res = insertMember.run(
      member.get('memberId') || null,
      member.get('fataNo') || '',
      member.get('name') || '',
      member.get('mobile') || '',
      member.get('email') || '',
      Number(member.get('openingBalance') || 0),
      member.get('familyGroup') || '',
      isActive,
      member.get('createdAt') ? new Date(member.get('createdAt')).toISOString() : new Date().toISOString(),
      member.get('updatedAt') ? new Date(member.get('updatedAt')).toISOString() : new Date().toISOString()
    );
    memberIdMap[String(member._id)] = res.lastInsertRowid;
  }
  console.log('Members migration complete.');

  // --- C. Migrate Settings ---
  console.log('Migrating Settings...');
  const mongoSettings = await MongoSetting.find({});
  console.log(`Found ${mongoSettings.length} Settings in MongoDB.`);

  db.exec('DELETE FROM settings');
  const insertSetting = db.prepare(`
    INSERT INTO settings (creditInterestRate, debitInterestRate, createdAt, updatedAt)
    VALUES (?, ?, ?, ?)
  `);

  for (const setting of mongoSettings) {
    insertSetting.run(
      Number(setting.get('creditInterestRate') || 1),
      Number(setting.get('debitInterestRate') || 1),
      setting.get('createdAt') ? new Date(setting.get('createdAt')).toISOString() : new Date().toISOString(),
      setting.get('updatedAt') ? new Date(setting.get('updatedAt')).toISOString() : new Date().toISOString()
    );
  }
  console.log('Settings migration complete.');

  // --- E. Migrate Monthly Entries ---
  console.log('Migrating Monthly Entries...');
  const mongoEntries = await MongoEntry.find({});
  console.log(`Found ${mongoEntries.length} Monthly Entries in MongoDB.`);

  db.exec('DELETE FROM monthly_entries');
  const insertEntry = db.prepare(`
    INSERT INTO monthly_entries (memberId, month, hapto, upad, vyaj, creditVyaj, dand, total, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const entry of mongoEntries) {
    const mongoMemberId = String(entry.get('memberId'));
    const sqliteMemberId = memberIdMap[mongoMemberId];

    if (!sqliteMemberId) {
      console.warn(`Skipping monthly entry for month ${entry.get('month')} because member ID ${mongoMemberId} was not migrated.`);
      continue;
    }

    insertEntry.run(
      sqliteMemberId,
      entry.get('month') || '',
      Number(entry.get('hapto') || 0),
      Number(entry.get('upad') || 0),
      Number(entry.get('vyaj') || 0),
      Number(entry.get('creditVyaj') || 0),
      Number(entry.get('dand') || 0),
      Number(entry.get('total') || 0),
      entry.get('createdAt') ? new Date(entry.get('createdAt')).toISOString() : new Date().toISOString(),
      entry.get('updatedAt') ? new Date(entry.get('updatedAt')).toISOString() : new Date().toISOString()
    );
  }
  console.log('Monthly entries migration complete.');

  // --- F. Migrate Transactions ---
  console.log('Migrating Transactions...');
  const mongoTransactions = await MongoTransaction.find({});
  console.log(`Found ${mongoTransactions.length} Transactions in MongoDB.`);

  db.exec('DELETE FROM transactions');
  const insertTransaction = db.prepare(`
    INSERT INTO transactions (memberId, type, amount, month, date, note, createdBy, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const tx of mongoTransactions) {
    const mongoMemberId = String(tx.get('memberId'));
    const sqliteMemberId = memberIdMap[mongoMemberId];

    if (!sqliteMemberId) {
      console.warn(`Skipping transaction of type ${tx.get('type')} because member ID ${mongoMemberId} was not migrated.`);
      continue;
    }

    const mongoCreatedBy = tx.get('createdBy') ? String(tx.get('createdBy')) : null;
    const sqliteCreatedBy = mongoCreatedBy ? adminIdMap[mongoCreatedBy] : null;

    insertTransaction.run(
      sqliteMemberId,
      tx.get('type') || 'deposit',
      Number(tx.get('amount') || 0),
      tx.get('month') || '',
      tx.get('date') ? new Date(tx.get('date')).toISOString() : new Date().toISOString(),
      tx.get('note') || '',
      sqliteCreatedBy,
      tx.get('createdAt') ? new Date(tx.get('createdAt')).toISOString() : new Date().toISOString(),
      tx.get('updatedAt') ? new Date(tx.get('updatedAt')).toISOString() : new Date().toISOString()
    );
  }
  console.log('Transactions migration complete.');

  console.log('All data migrated successfully from MongoDB to SQLite!');
  await mongoose.disconnect();
  process.exit(0);
}

migrate();
