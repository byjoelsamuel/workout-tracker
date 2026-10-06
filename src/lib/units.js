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

// Plate maths, not round numbers: 2.5 kg is the smallest pair of plates on a
// bar, and 5 lb its imperial equivalent.
export const PLATE_STEP = { kg: 2.5, lb: 5 };

// A suggested load snapped to what can actually be put on a bar in the unit
// being read, then handed back in kilograms like every other weight.
export function roundToPlate(kg, unit) {
  if (kg == null) return null;
  const step = PLATE_STEP[unit] ?? 2.5;
  const snapped = Math.max(step, Math.round(fromKg(kg, unit) / step) * step);
  return toKg(snapped, unit);
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

// Limits that catch a typo (800 for 80, 100 reps for 10 is fine, 1000 isn't)
// without policing anyone's training. Weight is checked in kilograms after
// conversion, so the line sits in the same place whichever unit was typed.
const MAX_REPS = 1000;
const MAX_SECONDS = 3600;
const MAX_KG = 1000;

// The one check the log form and the history editor both run before writing.
// The editor used to save whatever it was given — a negative weight went into
// storage and was subtracted from every total it fed. `sets` are the forms'
// string rows; returns a message, or "" when they're fine to store.
export function checkSets(sets, { timed = false, bodyweight = false, unit = "kg" } = {}) {
  for (const set of sets) {
    const reps = Number(set.reps);
    if (set.reps === "" || !Number.isFinite(reps) || reps < 1) {
      return timed ? "Every set needs a hold time of at least a second." : "Every set needs at least one rep.";
    }
    if (!Number.isInteger(reps)) return timed ? "Hold times are whole seconds." : "Reps are whole numbers.";
    if (reps > (timed ? MAX_SECONDS : MAX_REPS)) {
      return timed ? "A hold over an hour looks like a typo." : `More than ${MAX_REPS} reps in one set looks like a typo.`;
    }
    if (bodyweight || set.weight === "" || set.weight == null) continue;
    const weight = Number(set.weight);
    if (!Number.isFinite(weight) || weight < 0) return "Weight can't be negative.";
    if (toKg(weight, unit) > MAX_KG) return `More than ${formatWeight(MAX_KG, unit)} on one set looks like a typo.`;
  }
  return "";
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

// Which groups took the most work, hardest first.
//
// Volume is the honest measure — but a session of nothing but pull-ups and
// planks has none, and calling that an empty workout would be wrong. Sets are
// the fallback ranking there, chosen per call rather than per group so one
// loaded movement doesn't push every bodyweight group to the bottom.
//
// Lives here rather than in the two components that used to own a copy each:
// the live session panel and the end-of-workout summary were ranking the same
// logs by subtly different rules, so the group named mid-session could differ
// from the one named seconds later in the summary.
export function rankGroups(logs) {
  const totals = new Map();
  for (const log of logs) {
    const current = totals.get(log.bodyGroup) || { volume: 0, sets: 0, exercises: 0 };
    current.volume += logVolume(log);
    current.sets += log.sets.length;
    current.exercises += 1;
    totals.set(log.bodyGroup, current);
  }

  const byVolume = [...totals.values()].some((t) => t.volume > 0);
  return [...totals.entries()]
    .map(([group, groupTotals]) => ({ group, ...groupTotals }))
    .sort((a, b) => (byVolume ? b.volume - a.volume : b.sets - a.sets));
}
