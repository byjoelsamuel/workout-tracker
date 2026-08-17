// Weight units.
//
// Kilograms are the storage unit, always — every weight in localStorage is a
// number of kg, including rows written before this module existed. Pounds
// exist only at the edges: what the user types, and what gets rendered.
// Converting on the way in and out keeps one canonical number in the data, so
// switching units never rewrites history or drifts through rounding.
const KG_PER_LB = 0.45359237;

export const UNITS = [
  { id: "kg", label: "kg" },
  { id: "lb", label: "lb" },
];

export function toKg(value, unit) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return unit === "lb" ? n * KG_PER_LB : n;
}

export function fromKg(kg, unit) {
  if (kg == null) return null;
  return unit === "lb" ? kg / KG_PER_LB : kg;
}

// Weights are display values, not measurements — a bar loaded to 42.5 kg should
// read "42.5 kg", not "42.50 kg", so a trailing zero is dropped.
export function formatWeight(kg, unit) {
  const value = fromKg(kg, unit);
  if (value == null) return "—";
  const rounded = Math.round(value * 10) / 10;
  return `${rounded % 1 === 0 ? rounded : rounded.toFixed(1)} ${unit}`;
}

// Totals reach the thousands within a single session, where a decimal place is
// noise and the thousands separator is what actually helps.
export function formatVolume(kg, unit) {
  const value = fromKg(kg, unit);
  if (!value) return `0 ${unit}`;
  return `${Math.round(value).toLocaleString()} ${unit}`;
}

// Every total below walks `log.sets`, which the store guarantees is an array —
// legacy rows are expanded into one entry per set on read, so nothing here has
// to know two shapes.

// A set of a loaded movement moves `reps × weight`. Bodyweight and timed work
// carries no external load and adds nothing — this is the weight actually put
// on the bar, which is why the UI calls it loaded volume rather than "work
// done".
export function setVolume(set) {
  if (!set.weight || !set.reps) return 0;
  return set.reps * set.weight;
}

export function logVolume(log) {
  if (log.timed) return 0;
  return log.sets.reduce((sum, set) => sum + setVolume(set), 0);
}

export function totalVolume(logs) {
  return logs.reduce((sum, log) => sum + logVolume(log), 0);
}

// Seconds under tension don't convert to reps, so holds are excluded rather
// than counted as one rep each.
export function totalReps(logs) {
  return logs.reduce((sum, log) => {
    if (log.timed) return sum;
    return sum + log.sets.reduce((n, set) => n + (set.reps || 0), 0);
  }, 0);
}

export function totalSets(logs) {
  return logs.reduce((sum, log) => sum + log.sets.length, 0);
}

export function totalSeconds(logs) {
  return logs.reduce((sum, log) => {
    if (!log.timed) return sum;
    return sum + log.sets.reduce((n, set) => n + (set.reps || 0), 0);
  }, 0);
}

// "3 × 10" when every set matches, "10, 8, 8, 6" when they don't. Collapsing
// the uniform case keeps the common row short while still showing a ramp
// honestly.
export function describeReps(log) {
  if (log.sets.length === 0) return null;
  const reps = log.sets.map((set) => set.reps ?? 0);
  const suffix = log.timed ? "s" : "";
  const uniform = reps.every((r) => r === reps[0]);
  return uniform ? `${reps.length} × ${reps[0]}${suffix}` : reps.join(", ") + suffix;
}

// The heaviest weight in an entry, for the row's at-a-glance load. Null when
// nothing was loaded, so callers can tell "bodyweight" from "0 kg".
export function topWeight(log) {
  const weights = log.sets.map((set) => set.weight).filter((w) => w != null);
  return weights.length ? Math.max(...weights) : null;
}
