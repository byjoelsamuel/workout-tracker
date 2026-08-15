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

// Fills in fields that older rows predate, so the rest of the app can treat
// every log as complete. `timed`/`bodyweight` are looked up from the library
// only as a fallback: they're written onto new logs precisely so that editing
// or removing a movement later can't retroactively change what a past session
// meant. `workoutId` stays null for rows logged before sessions existed —
// those simply don't belong to any workout.
function normalizeLog(log) {
  const exercise = findExercise(log.bodyGroup, log.exerciseName);
  return {
    ...log,
    timed: log.timed ?? Boolean(exercise?.timed),
    bodyweight: log.bodyweight ?? Boolean(exercise?.bodyweight),
    workoutId: log.workoutId ?? null,
  };
}

// sets/reps/weight are newer than the app itself, so they're written as
// nullable rather than required — logs saved before they existed are still
// valid rows and simply render without them.
//
// `weight` arrives in kilograms; the form converts before calling in, so the
// stored unit never varies. Logging also opens a workout if none is running,
// which is what makes "End workout" have something to summarise without the
// user having to remember to press Start first.
export function addLog(userId, { bodyGroup, exerciseName, sets, reps, weight, timed, bodyweight }) {
  const logs = read(STORAGE_KEYS.logs);
  const log = {
    id: crypto.randomUUID(),
    userId,
    bodyGroup,
    exerciseName: exerciseName.trim(),
    sets: sets ? Number(sets) : null,
    reps: reps ? Number(reps) : null,
    weight: weight ? Number(weight) : null,
    timed: Boolean(timed),
    bodyweight: Boolean(bodyweight),
    workoutId: ensureActiveWorkout(userId).id,
    loggedAt: new Date().toISOString(),
  };
  logs.push(log);
  write(STORAGE_KEYS.logs, logs);
  return log;
}

export function getLogsForUser(userId) {
  return read(STORAGE_KEYS.logs)
    .filter((log) => log.userId === userId)
    .map(normalizeLog)
    .sort((a, b) => new Date(b.loggedAt) - new Date(a.loggedAt));
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
