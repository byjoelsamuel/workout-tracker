// All persistence. There's no server — profiles and exercise logs live in
// this browser's localStorage, which is why data is per-browser and the
// compare page really means "every profile created here."
//
// These stay plain functions rather than hooks: hooks in src/hooks/ wrap
// them for reactivity, but the read/write shapes are deliberately kept
// identical to the pre-React version so existing data keeps loading.
import { STORAGE_KEYS } from "./storageKeys.js";
import { BODY_GROUPS } from "./bodyGroups.js";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function read(key) {
  return JSON.parse(localStorage.getItem(key) || "[]");
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function createUser({ name, bodyweight, height, age }) {
  const users = read(STORAGE_KEYS.users);
  const user = {
    id: crypto.randomUUID(),
    name: name.trim(),
    bodyweight: bodyweight ? Number(bodyweight) : null,
    height: height ? Number(height) : null,
    age: age ? Number(age) : null,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  write(STORAGE_KEYS.users, users);
  return user;
}

// Just id + name, for the profile picker and the compare roster.
export function listUsers() {
  return read(STORAGE_KEYS.users)
    .map((u) => ({ id: u.id, name: u.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getUser(id) {
  return read(STORAGE_KEYS.users).find((u) => u.id === id) || null;
}

export function addLog(userId, { bodyGroup, exerciseName }) {
  const logs = read(STORAGE_KEYS.logs);
  const log = {
    id: crypto.randomUUID(),
    userId,
    bodyGroup,
    exerciseName: exerciseName.trim(),
    loggedAt: new Date().toISOString(),
  };
  logs.push(log);
  write(STORAGE_KEYS.logs, logs);
  return log;
}

export function getLogsForUser(userId) {
  return read(STORAGE_KEYS.logs)
    .filter((log) => log.userId === userId)
    .sort((a, b) => new Date(b.loggedAt) - new Date(a.loggedAt));
}

// Every group is present and zeroed, so callers never have to guess which
// keys exist on a summary object.
export function getSummary(userId, range = "all") {
  const summary = Object.fromEntries(BODY_GROUPS.map((g) => [g.id, 0]));
  const cutoff = range === "week" ? Date.now() - WEEK_MS : null;
  for (const log of getLogsForUser(userId)) {
    if (cutoff !== null && new Date(log.loggedAt).getTime() < cutoff) continue;
    if (log.bodyGroup in summary) summary[log.bodyGroup] += 1;
  }
  return summary;
}

export function getCompareData() {
  return listUsers().map((u) => ({
    ...u,
    summary: getSummary(u.id, "week"),
  }));
}

export function getLastUserId() {
  return localStorage.getItem(STORAGE_KEYS.lastUserId);
}

export function setLastUserId(userId) {
  localStorage.setItem(STORAGE_KEYS.lastUserId, userId);
}
