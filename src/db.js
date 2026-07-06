'use strict';

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'app.db');

// Ensure the data directory exists
const dataDir = path.dirname(dbPath);
fs.mkdirSync(dataDir, { recursive: true });

// Open the database
const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Create migrations tracking table
db.exec(`
  CREATE TABLE IF NOT EXISTS _migrations (
    id INTEGER PRIMARY KEY,
    filename TEXT UNIQUE,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Run unapplied migrations in filename order
const migrationsDir = path.join(__dirname, '..', 'migrations');
const migrationFiles = fs.readdirSync(migrationsDir)
  .filter(f => f.endsWith('.sql'))
  .sort();

const checkApplied = db.prepare('SELECT 1 FROM _migrations WHERE filename = ?');
const recordMigration = db.prepare('INSERT INTO _migrations (filename) VALUES (?)');

for (const filename of migrationFiles) {
  const alreadyApplied = checkApplied.get(filename);
  if (!alreadyApplied) {
    const sql = fs.readFileSync(path.join(migrationsDir, filename), 'utf8');
    db.exec(sql);
    recordMigration.run(filename);
    console.log(`[db] Applied migration: ${filename}`);
  }
}

module.exports = db;
