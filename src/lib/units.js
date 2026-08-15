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

// One set of a loaded movement moves `reps × weight`; an entry moves that once
// per set. Bodyweight and timed work carries no external load and adds nothing
// here — this is the weight actually put on the bar, which is why the UI calls
// it loaded volume rather than "work done".
export function logVolume(log) {
  if (log.timed || !log.weight || !log.sets || !log.reps) return 0;
  return log.sets * log.reps * log.weight;
}

export function totalVolume(logs) {
  return logs.reduce((sum, log) => sum + logVolume(log), 0);
}

// Seconds under tension don't convert to reps, so holds are excluded rather
// than counted as one rep each.
export function totalReps(logs) {
  return logs.reduce((sum, log) => {
    if (log.timed || !log.sets || !log.reps) return sum;
    return sum + log.sets * log.reps;
  }, 0);
}

export function totalSets(logs) {
  return logs.reduce((sum, log) => sum + (log.sets || 0), 0);
}

export function totalSeconds(logs) {
  return logs.reduce((sum, log) => {
    if (!log.timed || !log.sets || !log.reps) return sum;
    return sum + log.sets * log.reps;
  }, 0);
}
