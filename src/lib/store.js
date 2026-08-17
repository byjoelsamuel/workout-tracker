// All persistence. There's no server — profiles and exercise logs live in
// this browser's localStorage, which is why data is per-browser and the
// compare page really means "every profile created here."
//
// These stay plain functions rather than hooks: hooks in src/hooks/ wrap
// them for reactivity, but the read/write shapes are deliberately kept
// identical to the pre-React version so existing data keeps loading.
import { STORAGE_KEYS } from "./storageKeys.js";
import { BODY_GROUPS } from "./bodyGroups.js";
import { findExercise } from "./exercises.js";

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

// An entry holds one set per row, each with its own reps and weight, because a
// real session isn't uniform — a warmup at 60, working sets at 80, a top set at
// 85. The old shape stored a count plus the single reps/weight every set
// shared, which could only ever describe identical sets.
//
// Rows written under that shape are converted here, on read, rather than by
// rewriting storage: the keys in storageKeys.js are a live wire format with
// real user data behind them, so a migration pass is the risky option and buys
// nothing. Legacy rows stay as they are on disk until something edits them.
//
// Set ids are derived from the entry id rather than generated, so they stay
// stable across reads and can be used as React keys.
function toSetArray(log) {
  if (Array.isArray(log.sets)) return log.sets;
  const count = Number(log.sets);
  // Older still: rows saved before sets/reps existed at all. They carry no set
  // information, and inventing one would put numbers in the UI that nobody
  // ever entered.
  if (!count || !log.reps) return [];
  return Array.from({ length: count }, (_, i) => ({
    id: `${log.id}:${i}`,
    reps: Number(log.reps),
    weight: log.weight ?? null,
  }));
}

// Fills in fields that older rows predate, so the rest of the app can treat
// every log as complete. `timed`/`bodyweight` are looked up from the library
// only as a fallback: they're written onto new logs precisely so that editing
// or removing a movement later can't retroactively change what a past session
// meant. `workoutId` stays null for rows logged before sessions existed —
// those simply don't belong to any workout.
function normalizeLog(log) {
  const exercise = findExercise(log.bodyGroup, log.exerciseName);
  // reps/weight are the legacy scalars, now folded into the sets array. Drop
  // them so nothing downstream can read a stale copy of the same numbers.
  const { reps, weight, ...rest } = log;
  return {
    ...rest,
    sets: toSetArray(log),
    timed: log.timed ?? Boolean(exercise?.timed),
    bodyweight: log.bodyweight ?? Boolean(exercise?.bodyweight),
    workoutId: log.workoutId ?? null,
  };
}

// Weights arrive in kilograms; the form converts at its boundary, so the stored
// unit never varies. An empty weight is null rather than 0 — a bodyweight set
// carries no load, and 0 would imply one.
function toStoredSets(sets) {
  return sets.map((set) => ({
    id: set.id ?? crypto.randomUUID(),
    reps: Number(set.reps) || null,
    weight: set.weight === "" || set.weight == null ? null : Number(set.weight),
  }));
}

// Logging opens a workout if none is running, which is what makes "End workout"
// have something to summarise without the user having to press Start first.
export function addLog(userId, { bodyGroup, exerciseName, sets, timed, bodyweight }) {
  const logs = read(STORAGE_KEYS.logs);
  const log = {
    id: crypto.randomUUID(),
    userId,
    bodyGroup,
    exerciseName: exerciseName.trim(),
    sets: toStoredSets(sets),
    timed: Boolean(timed),
    bodyweight: Boolean(bodyweight),
    workoutId: ensureActiveWorkout(userId).id,
    loggedAt: new Date().toISOString(),
  };
  logs.push(log);
  write(STORAGE_KEYS.logs, logs);
  return normalizeLog(log);
}

// Reads raw and rewrites a single row, so legacy rows sitting either side of it
// are left exactly as they were.
export function updateLog(userId, logId, patch) {
  const logs = read(STORAGE_KEYS.logs);
  const index = logs.findIndex((log) => log.id === logId && log.userId === userId);
  if (index === -1) return null;

  const next = { ...logs[index], ...patch };
  if (patch.sets) {
    next.sets = toStoredSets(patch.sets);
    // Editing a legacy row promotes it to the current shape. Its old scalars
    // have to go, or toSetArray would keep preferring them on the next read.
    delete next.reps;
    delete next.weight;
  }

  logs[index] = next;
  write(STORAGE_KEYS.logs, logs);
  return normalizeLog(next);
}

export function deleteLog(userId, logId) {
  const logs = read(STORAGE_KEYS.logs);
  const remaining = logs.filter((log) => !(log.id === logId && log.userId === userId));
  if (remaining.length === logs.length) return false;
  write(STORAGE_KEYS.logs, remaining);
  return true;
}

export function getLogsForUser(userId) {
  return read(STORAGE_KEYS.logs)
    .filter((log) => log.userId === userId)
    .map(normalizeLog)
    .sort((a, b) => new Date(b.loggedAt) - new Date(a.loggedAt));
}

// Most-recently-used movements, newest first, for the picker's shortcut rows.
// Deduplicated by name: what's wanted is "the lifts you actually do", not a
// replay of the log.
export function getRecentExercises(userId, limit = 10) {
  const seen = new Map();
  for (const log of getLogsForUser(userId)) {
    if (!seen.has(log.exerciseName)) {
      seen.set(log.exerciseName, { name: log.exerciseName, bodyGroup: log.bodyGroup });
    }
    if (seen.size >= limit) break;
  }
  return [...seen.values()];
}

// Heaviest single set ever recorded for a movement. Timed work is excluded —
// seconds under load don't compare against reps.
export function getPersonalBest(userId, exerciseName) {
  let best = null;
  for (const log of getLogsForUser(userId)) {
    if (log.timed || log.exerciseName !== exerciseName) continue;
    for (const set of log.sets) {
      if (set.weight == null) continue;
      if (!best || set.weight > best.weight) {
        best = { weight: set.weight, reps: set.reps, loggedAt: log.loggedAt };
      }
    }
  }
  return best;
}

export function getWorkoutLogs(userId, workoutId) {
  if (!workoutId) return [];
  return getLogsForUser(userId).filter((log) => log.workoutId === workoutId);
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

/* ---- Workout sessions ---- */

// A workout is just an id and a start time; the logs carry the membership.
// Storing it that way means ending a workout is a delete rather than a
// migration, and a browser that closes mid-session simply resumes — the
// session is only over when the user says it is.
export function getActiveWorkout(userId) {
  if (!userId) return null;
  const raw = localStorage.getItem(STORAGE_KEYS.activeWorkout(userId));
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    // Unparseable means something else wrote the key. Drop it rather than
    // wedging the dashboard on every render.
    localStorage.removeItem(STORAGE_KEYS.activeWorkout(userId));
    return null;
  }
}

function ensureActiveWorkout(userId) {
  const existing = getActiveWorkout(userId);
  if (existing) return existing;
  const workout = { id: crypto.randomUUID(), startedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEYS.activeWorkout(userId), JSON.stringify(workout));
  return workout;
}

// Returns the finished workout plus its logs, so the caller can render a
// summary of something that no longer exists in storage.
export function endWorkout(userId) {
  const workout = getActiveWorkout(userId);
  if (!workout) return null;
  const logs = getWorkoutLogs(userId, workout.id);
  localStorage.removeItem(STORAGE_KEYS.activeWorkout(userId));
  return { ...workout, endedAt: new Date().toISOString(), logs };
}

/* ---- Preferences ---- */

export function getUnit() {
  return localStorage.getItem(STORAGE_KEYS.unit) === "lb" ? "lb" : "kg";
}

export function setUnit(unit) {
  localStorage.setItem(STORAGE_KEYS.unit, unit === "lb" ? "lb" : "kg");
}
