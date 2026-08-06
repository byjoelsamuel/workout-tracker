// Database setup. Uses Node's built-in `node:sqlite` (stable since Node 22.5,
// still flagged "experimental" by Node itself) so the project needs zero
// native dependencies to persist data — just a single file on disk.
const { DatabaseSync } = require("node:sqlite");
const path = require("node:path");
const fs = require("node:fs");

const dataDir = path.join(__dirname, "data");
fs.mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(path.join(dataDir, "workout.db"));

// IF NOT EXISTS makes this safe to run on every server start.
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    bodyweight REAL,
    height REAL,
    age INTEGER,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS exercise_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    body_group TEXT NOT NULL,
    exercise_name TEXT NOT NULL,
    logged_at TEXT NOT NULL
  );
`);

module.exports = db;
