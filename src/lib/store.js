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
import { sessionKey } from "./time.js";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Three sessions a week: enough to be a target, attainable in the first week
// you see it. A meter that reads as unreachable the first time it's shown is
// worse than no meter. Only a default — the dashboard's ring edits it in place.
export const DEFAULT_WEEKLY_GOAL = 3;
export const MIN_WEEKLY_GOAL = 1;
export const MAX_WEEKLY_GOAL = 7;

function read(key) {
  return JSON.parse(localStorage.getItem(key) || "[]");
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// The same read-time normalisation logs get, for the same reason: profiles
// created before weekly goals existed have no such field, and every one of them
// is real data sitting in someone's browser. Filling the gap on read means they
// come back complete without a migration pass rewriting rows that are otherwise
// fine. Storage keeps whatever shape it had until a write touches that row.
function normalizeUser(user) {
  if (!user) return null;
  return { ...user, weeklyGoal: user.weeklyGoal ?? DEFAULT_WEEKLY_GOAL };
}

function clampGoal(goal) {
  const n = Math.round(Number(goal));
  if (!Number.isFinite(n)) return DEFAULT_WEEKLY_GOAL;
  return Math.min(MAX_WEEKLY_GOAL, Math.max(MIN_WEEKLY_GOAL, n));
}

export function createUser({ name, bodyweight, height, age, weeklyGoal }) {
  const users = read(STORAGE_KEYS.users);
  const user = {
    id: crypto.randomUUID(),
    name: name.trim(),
    bodyweight: bodyweight ? Number(bodyweight) : null,
    height: height ? Number(height) : null,
    age: age ? Number(age) : null,
    weeklyGoal: clampGoal(weeklyGoal ?? DEFAULT_WEEKLY_GOAL),
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  write(STORAGE_KEYS.users, users);
  return user;
}

// Just id + name, for the compare roster and anything else that only needs to
// say who exists.
export function listUsers() {
  return read(STORAGE_KEYS.users)
    .map((u) => ({ id: u.id, name: u.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// The sign-in screen's cards: who each profile is, plus enough history to tell
// two similar names apart ("Joel — 40 entries, trained yesterday"). One read of
// the log for every profile rather than getLogsForUser per card. loggedAt is
// present in every shape a row has ever had, so normalising isn't needed to
// count or date them.
export function listProfiles() {
  const stats = new Map();
  for (const log of read(STORAGE_KEYS.logs)) {
    const s = stats.get(log.userId) || { entries: 0, lastTrained: null };
    s.entries += 1;
    if (!s.lastTrained || log.loggedAt > s.lastTrained) s.lastTrained = log.loggedAt;
    stats.set(log.userId, s);
  }
  return read(STORAGE_KEYS.users)
    .map((u) => ({
      id: u.id,
      name: u.name,
      createdAt: u.createdAt ?? null,
      ...(stats.get(u.id) || { entries: 0, lastTrained: null }),
    }))
    .sort((a, b) => (b.lastTrained ?? "").localeCompare(a.lastTrained ?? "") || a.name.localeCompare(b.name));
}

export function getUser(id) {
  return normalizeUser(read(STORAGE_KEYS.users).find((u) => u.id === id) || null);
}

// Rewrites one row and leaves the rest untouched, the way updateLog does — a
// profile saved under an older shape stays that way unless this is what edits
// it. The goal is clamped here rather than at the input, so a hand-edited
// localStorage value can't put the meter into a state the stepper can't leave.
export function updateUser(id, patch) {
  const users = read(STORAGE_KEYS.users);
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) return null;

  const next = { ...users[index], ...patch };
  if ("weeklyGoal" in patch) next.weeklyGoal = clampGoal(patch.weeklyGoal);
  // An empty name would leave a profile card nobody can pick out, so a blank
  // edit keeps the old one rather than writing it.
  if ("name" in patch) next.name = String(patch.name).trim() || users[index].name;

  users[index] = next;
  write(STORAGE_KEYS.users, users);
  return normalizeUser(next);
}

// Removes a profile and everything filed under it. The only destructive write
// in the app that reaches across rows, so it filters by userId and leaves every
// other profile's rows byte-for-byte as they were.
export function deleteUser(id) {
  const users = read(STORAGE_KEYS.users);
  const remaining = users.filter((u) => u.id !== id);
  if (remaining.length === users.length) return false;
  write(STORAGE_KEYS.users, remaining);
  write(STORAGE_KEYS.logs, read(STORAGE_KEYS.logs).filter((log) => log.userId !== id));
  localStorage.removeItem(STORAGE_KEYS.activeWorkout(id));
  localStorage.removeItem(STORAGE_KEYS.hasSeenGuide(id));
  if (getLastUserId() === id) localStorage.removeItem(STORAGE_KEYS.lastUserId);
  return true;
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

export function getWorkoutLogs(userId, workoutId) {
  if (!workoutId) return [];
  return getLogsForUser(userId).filter((log) => log.workoutId === workoutId);
}

// Sessions per group, plus distinct sessions overall. Every group is present
// and zeroed, so callers never have to guess which keys exist.
//
// Counted by session (lib/time.js's sessionKey), not by log row. This used to
// add one per row, so a single evening of squats, leg press and curls showed on
// the compare page as "3 sessions" — the same entry-versus-session confusion
// heat.js was rewritten to stop. `total` is distinct sessions across every
// group, which is why it isn't the sum of the per-group counts: one full-body
// workout is one session, not seven.
export function getSummary(userId, range = "all") {
  const byGroup = Object.fromEntries(BODY_GROUPS.map((g) => [g.id, new Set()]));
  const all = new Set();
  const cutoff = range === "week" ? Date.now() - WEEK_MS : null;
  for (const log of getLogsForUser(userId)) {
    if (cutoff !== null && new Date(log.loggedAt).getTime() < cutoff) continue;
    if (!(log.bodyGroup in byGroup)) continue;
    const key = sessionKey(log);
    byGroup[log.bodyGroup].add(key);
    all.add(key);
  }
  return {
    groups: Object.fromEntries(Object.entries(byGroup).map(([g, keys]) => [g, keys.size])),
    total: all.size,
  };
}

export function getCompareData() {
  return listUsers().map((u) => {
    const { groups, total } = getSummary(u.id, "week");
    return { ...u, summary: groups, sessions: total };
  });
}

// Naru is opt-out, not opt-in: it stays out of the way until clicked, so
// defaulting it on costs nothing, and someone who does not want it can turn it
// off from inside the panel. Absent means never touched, which means on.
export function getCoachEnabled() {
  return localStorage.getItem(STORAGE_KEYS.coach) !== "off";
}

export function setCoachEnabled(enabled) {
  localStorage.setItem(STORAGE_KEYS.coach, enabled ? "on" : "off");
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

// Undoing the entry that opened a session should close the session too, or the
// dashboard is left claiming a workout is in progress with nothing in it. Only
// ever drops a session that holds no rows, so it can't discard real work.
export function discardWorkoutIfEmpty(userId) {
  const workout = getActiveWorkout(userId);
  if (!workout || getWorkoutLogs(userId, workout.id).length > 0) return false;
  localStorage.removeItem(STORAGE_KEYS.activeWorkout(userId));
  return true;
}

/* ---- Backup ---- */

// The web app and the desktop app keep separate localStorage, so a file is the
// only way history moves between them (or to a new laptop).
//
// Rows are exported raw, exactly as stored, not normalised. A backup is a copy
// of storage, and the read-time normalisation is what makes old shapes safe —
// doing it on the way out would be a migration by another name.
export const BACKUP_FORMAT = 1;

export function exportBackup() {
  return {
    app: "tsyoku-naru",
    format: BACKUP_FORMAT,
    exportedAt: new Date().toISOString(),
    users: read(STORAGE_KEYS.users),
    logs: read(STORAGE_KEYS.logs),
  };
}

const isText = (v) => typeof v === "string" && v.trim() !== "";
const isDate = (v) => isText(v) && !Number.isNaN(new Date(v).getTime());

// Enough to know a row will load. Shape beyond this is normalizeLog's job — a
// legacy row with `sets: 4` in a backup is as valid as one in storage.
function isUserRow(u) {
  return u && isText(u.id) && isText(u.name);
}

function isLogRow(log) {
  return (
    log && isText(log.id) && isText(log.userId) && isText(log.bodyGroup) &&
    isText(log.exerciseName) && isDate(log.loggedAt)
  );
}

// Merges, never replaces. A row whose id already exists here is skipped rather
// than overwritten, so importing the same file twice — or importing an older
// backup over newer edits — can't roll anything back. Logs whose profile is in
// neither this browser nor the file are dropped: nothing could ever show them.
export function importBackup(data) {
  if (!data || typeof data !== "object" || !Array.isArray(data.users) || !Array.isArray(data.logs)) {
    throw new Error("That file isn't a Tsyoku-naru backup.");
  }
  if (data.app && data.app !== "tsyoku-naru") {
    throw new Error("That backup came from a different app.");
  }

  const users = read(STORAGE_KEYS.users);
  const logs = read(STORAGE_KEYS.logs);
  const userIds = new Set(users.map((u) => u.id));
  const logIds = new Set(logs.map((l) => l.id));
  const result = { users: 0, logs: 0, skipped: 0 };

  for (const user of data.users) {
    if (!isUserRow(user) || userIds.has(user.id)) {
      result.skipped += 1;
      continue;
    }
    users.push(user);
    userIds.add(user.id);
    result.users += 1;
  }
  for (const log of data.logs) {
    if (!isLogRow(log) || logIds.has(log.id) || !userIds.has(log.userId)) {
      result.skipped += 1;
      continue;
    }
    logs.push(log);
    logIds.add(log.id);
    result.logs += 1;
  }

  if (result.users) write(STORAGE_KEYS.users, users);
  if (result.logs) write(STORAGE_KEYS.logs, logs);
  return result;
}

/* ---- Preferences ---- */

export function getUnit() {
  return localStorage.getItem(STORAGE_KEYS.unit) === "lb" ? "lb" : "kg";
}

export function setUnit(unit) {
  localStorage.setItem(STORAGE_KEYS.unit, unit === "lb" ? "lb" : "kg");
}

// Rest between sets. Ninety seconds is the common middle ground — long enough
// for hypertrophy work, short of the three minutes a heavy triple wants — and
// the timer's own ± buttons cover the rest. Clamped so a hand-edited value
// can't produce a timer that never ends.
export const DEFAULT_REST_SECONDS = 90;

export function getRestSeconds() {
  const n = Number(localStorage.getItem(STORAGE_KEYS.restSeconds));
  return Number.isFinite(n) && n >= 15 && n <= 600 ? Math.round(n) : DEFAULT_REST_SECONDS;
}

export function setRestSeconds(seconds) {
  const n = Math.min(600, Math.max(15, Math.round(Number(seconds) || DEFAULT_REST_SECONDS)));
  localStorage.setItem(STORAGE_KEYS.restSeconds, String(n));
  return n;
}
