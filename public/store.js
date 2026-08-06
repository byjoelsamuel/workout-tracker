// All persistence for the app. There's no server — GitHub Pages only
// hosts static files — so every profile and exercise log lives in this
// browser's localStorage. That means data is per-browser, not shared
// across devices or people; "everyone" on the compare page really means
// "every profile created in this browser."
//
// Depends on the BODY_GROUPS global from shared/bodyGroups.js, so that
// script must be loaded on the page before this one.

const STORAGE_KEYS = {
  users: "workoutTracker.users",
  logs: "workoutTracker.logs",
};

function readUsers() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || "[]");
}

function writeUsers(users) {
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
}

function readLogs() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.logs) || "[]");
}

function writeLogs(logs) {
  localStorage.setItem(STORAGE_KEYS.logs, JSON.stringify(logs));
}

function createUser({ name, bodyweight, height, age }) {
  const users = readUsers();
  const user = {
    id: crypto.randomUUID(),
    name: name.trim(),
    bodyweight: bodyweight ? Number(bodyweight) : null,
    height: height ? Number(height) : null,
    age: age ? Number(age) : null,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  writeUsers(users);
  return user;
}

// Lightweight list (id + name) for the "returning user" picker and the
// compare page's roster — mirrors what the old API's GET /api/users returned.
function listUsers() {
  return readUsers()
    .map((u) => ({ id: u.id, name: u.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function getUser(id) {
  return readUsers().find((u) => u.id === id) || null;
}

function addLog(userId, { bodyGroup, exerciseName }) {
  const logs = readLogs();
  const log = {
    id: crypto.randomUUID(),
    userId,
    bodyGroup,
    exerciseName: exerciseName.trim(),
    loggedAt: new Date().toISOString(),
  };
  logs.push(log);
  writeLogs(logs);
  return log;
}

function getLogsForUser(userId) {
  return readLogs()
    .filter((log) => log.userId === userId)
    .sort((a, b) => new Date(b.loggedAt) - new Date(a.loggedAt));
}

function emptySummary() {
  const summary = {};
  for (const group of BODY_GROUPS) summary[group.id] = 0;
  return summary;
}

// range: "all" for lifetime totals (dashboard), "week" for the last
// 7 days (compare page).
function getSummary(userId, range = "all") {
  const summary = emptySummary();
  const cutoff = range === "week" ? Date.now() - 7 * 24 * 60 * 60 * 1000 : null;
  for (const log of getLogsForUser(userId)) {
    if (cutoff !== null && new Date(log.loggedAt).getTime() < cutoff) continue;
    if (log.bodyGroup in summary) summary[log.bodyGroup] += 1;
  }
  return summary;
}

function getCompareData() {
  return listUsers().map((u) => ({
    id: u.id,
    name: u.name,
    summary: getSummary(u.id, "week"),
  }));
}
