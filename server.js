const express = require("express");
const path = require("node:path");
const db = require("./db");
const { BODY_GROUPS } = require("./public/shared/bodyGroups.js");

const BODY_GROUP_IDS = BODY_GROUPS.map((g) => g.id);
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Prepared statements are compiled once and reused — cheaper than
// re-parsing SQL on every request, and they parameterize inputs for us
// (protects against SQL injection).
const insertUser = db.prepare(
  "INSERT INTO users (name, bodyweight, height, age, created_at) VALUES (?, ?, ?, ?, ?)"
);
const getUserStmt = db.prepare("SELECT * FROM users WHERE id = ?");
const listUsersStmt = db.prepare("SELECT id, name FROM users ORDER BY name");
const insertLog = db.prepare(
  "INSERT INTO exercise_logs (user_id, body_group, exercise_name, logged_at) VALUES (?, ?, ?, ?)"
);
const recentLogsStmt = db.prepare(
  "SELECT * FROM exercise_logs WHERE user_id = ? ORDER BY logged_at DESC LIMIT 20"
);
const countsSinceStmt = db.prepare(
  "SELECT body_group, COUNT(*) as count FROM exercise_logs WHERE user_id = ? AND logged_at >= ? GROUP BY body_group"
);
const countsAllStmt = db.prepare(
  "SELECT body_group, COUNT(*) as count FROM exercise_logs WHERE user_id = ? GROUP BY body_group"
);

// Every body group defaults to 0 so the client never has to guess which
// keys might be missing from a summary object.
function emptySummary() {
  const summary = {};
  for (const id of BODY_GROUP_IDS) summary[id] = 0;
  return summary;
}

function summaryFor(userId, range) {
  const summary = emptySummary();
  const rows =
    range === "week"
      ? countsSinceStmt.all(userId, new Date(Date.now() - WEEK_MS).toISOString())
      : countsAllStmt.all(userId);
  for (const row of rows) {
    if (row.body_group in summary) summary[row.body_group] = row.count;
  }
  return summary;
}

function requireUser(req, res) {
  const user = getUserStmt.get(req.params.id);
  if (!user) {
    res.status(404).json({ error: "User not found." });
    return null;
  }
  return user;
}

// The list of trackable body groups, shared with the client so the
// exercise-log dropdown and the body-map SVG always stay in sync with it.
app.get("/api/body-groups", (req, res) => {
  res.json(BODY_GROUPS);
});

// Creates a profile (the "information seeker" page's target).
app.post("/api/users", (req, res) => {
  const { name, bodyweight, height, age } = req.body ?? {};
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: "Name is required." });
  }
  const result = insertUser.run(
    String(name).trim(),
    bodyweight ? Number(bodyweight) : null,
    height ? Number(height) : null,
    age ? Number(age) : null,
    new Date().toISOString()
  );
  res.status(201).json(getUserStmt.get(result.lastInsertRowid));
});

// Lightweight list (id + name only) for the "returning user" picker and
// the compare page's roster.
app.get("/api/users", (req, res) => {
  res.json(listUsersStmt.all());
});

app.get("/api/users/:id", (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;
  res.json(user);
});

// ?range=week scopes counts to the last 7 days (used by the compare page);
// anything else returns all-time totals (used by the personal dashboard).
app.get("/api/users/:id/summary", (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;
  const range = req.query.range === "week" ? "week" : "all";
  res.json(summaryFor(user.id, range));
});

app.get("/api/users/:id/exercises", (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;
  res.json(recentLogsStmt.all(user.id));
});

app.post("/api/users/:id/exercises", (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;

  const { bodyGroup, exerciseName } = req.body ?? {};
  if (!BODY_GROUP_IDS.includes(bodyGroup)) {
    return res.status(400).json({ error: "Invalid body group." });
  }
  if (!exerciseName || !String(exerciseName).trim()) {
    return res.status(400).json({ error: "Exercise name is required." });
  }

  const loggedAt = new Date().toISOString();
  const result = insertLog.run(user.id, bodyGroup, String(exerciseName).trim(), loggedAt);
  res.status(201).json({
    id: result.lastInsertRowid,
    user_id: user.id,
    body_group: bodyGroup,
    exercise_name: String(exerciseName).trim(),
    logged_at: loggedAt,
  });
});

// Powers the "everyone, this week" comparison page: every user paired
// with their weekly per-body-group counts.
app.get("/api/compare", (req, res) => {
  const users = listUsersStmt.all().map((user) => ({
    id: user.id,
    name: user.name,
    summary: summaryFor(user.id, "week"),
  }));
  res.json(users);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Workout Tracker running at http://localhost:${PORT}`);
});
