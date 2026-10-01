// What you have done before with a given movement: your best set, and the
// session you last did it in. All of it is derived from the log on demand, so
// it can never disagree with history — including after an entry is edited.
//
// Progress, Naru and the log form all ask these questions. Each used to keep
// its own loop over the log, which is how two of them could reach different
// answers about the same lift.
import { topWeight } from "./units.js";

// Heaviest set per movement. Timed work is excluded: seconds under load don't
// compare against reps, so a weighted plank has no "best" in this sense.
export function bestByMovement(logs) {
  const best = new Map();
  for (const log of logs) {
    if (log.timed) continue;
    const top = topWeight(log);
    if (top == null || top <= 0) continue;
    const current = best.get(log.exerciseName);
    if (!current || top > current.weight) {
      best.set(log.exerciseName, { name: log.exerciseName, weight: top, loggedAt: log.loggedAt });
    }
  }
  return best;
}

export function personalBests(logs, limit = 8) {
  return [...bestByMovement(logs).values()].sort((a, b) => b.weight - a.weight).slice(0, limit);
}

// The most recent entry for a movement. `logs` is newest-first, as
// getLogsForUser returns it, so the first match is the latest.
export function lastTimeFor(logs, exerciseName) {
  if (!exerciseName) return null;
  return logs.find((log) => log.exerciseName === exerciseName && log.sets.length > 0) ?? null;
}

// Whether an entry about to be logged beats every earlier set of the same
// movement. The first time you log a lift is not a record — there is nothing it
// beat — so a movement with no loaded history returns false.
export function beatsBest(logs, { exerciseName, timed, sets }) {
  if (timed) return false;
  const weights = sets.map((s) => s.weight).filter((w) => w != null && w > 0);
  if (!weights.length) return false;
  const previous = bestByMovement(logs.filter((l) => l.exerciseName === exerciseName)).get(exerciseName);
  return Boolean(previous) && Math.max(...weights) > previous.weight + 1e-9;
}
