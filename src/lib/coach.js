// Logic for Naru, the dashboard's optional workout coach. No network calls
// and no AI model — this is a deterministic Push/Pull/Legs generator built
// entirely on top of the existing exercise library, so it works offline and
// costs nothing to run.
//
// "Goals" are inferred from training balance (which groups the user hasn't
// trained recently), not from height/weight/BMI — guessing a bulk/cut intent
// from body stats would be presumptuous and, for some users, actively
// unwelcome. Balance across logged history is a signal the app already
// trusts (it's what the body map itself visualizes).
import { EXERCISES } from "./exercises.js";

export const DAY_LABELS = { push: "Push", pull: "Pull", legs: "Legs" };

const CYCLE = ["push", "pull", "legs"];

const GROUP_TO_DAY = {
  chest: "push",
  shoulders: "push",
  back: "pull",
  legs: "legs",
  calves: "legs",
};

// The arms group mixes biceps and triceps movements together (see
// exercises.js), so a PPL split needs its own classifier rather than a
// group-level lookup. Anything unmatched (e.g. a grip carry) is simply left
// out of both days.
const PUSH_ARM_HINTS = ["triceps", "pushdown", "extension", "skullcrusher", "jm press", "close grip", "dip", "kickback", "push-up"];
const PULL_ARM_HINTS = ["curl"];

function classifyArmExercise(name) {
  const lower = name.toLowerCase();
  if (PUSH_ARM_HINTS.some((hint) => lower.includes(hint))) return "push";
  if (PULL_ARM_HINTS.some((hint) => lower.includes(hint))) return "pull";
  return null;
}

// How many movements each day pulls from which pool. Totals to 7 per day —
// the minimum requested — with one core exercise folded into every day
// rather than given its own fourth session, which is how most PPL routines
// actually schedule abs.
const DAY_DEFS = {
  push: { label: "Push Day", groups: [{ bodyGroup: "chest", count: 3 }, { bodyGroup: "shoulders", count: 2 }], armFilter: "push", armCount: 1 },
  pull: { label: "Pull Day", groups: [{ bodyGroup: "back", count: 4 }], armFilter: "pull", armCount: 2 },
  legs: { label: "Leg Day", groups: [{ bodyGroup: "legs", count: 5 }, { bodyGroup: "calves", count: 1 }], armFilter: null, armCount: 0 },
};

// Deterministic PRNG (mulberry32) seeded from the date + day, so reopening
// the chat gets the same plan all day, but tomorrow's Push Day looks
// different from today's — a fixed pick would go stale fast for a
// regular user.
function mulberry32(seed) {
  let t = seed;
  return function () {
    t |= 0;
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFrom(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return h;
}

function shuffled(list, seed) {
  const rng = mulberry32(seed);
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Suggested effort for a movement the user hasn't logged yet — this is a
// starting point to write on the log form, not a stored value.
export function schemeFor(exercise) {
  if (exercise.timed) return "3 sets × 30–45s";
  if (exercise.bodyweight) return "3 sets × max reps";
  return "3 sets × 8–12 reps";
}

export function buildWorkout(dayKey) {
  const def = DAY_DEFS[dayKey];
  const seed = seedFrom(new Date().toDateString() + dayKey);
  const exercises = [];

  def.groups.forEach(({ bodyGroup, count }, i) => {
    shuffled(EXERCISES[bodyGroup] || [], seed + i * 97)
      .slice(0, count)
      .forEach((ex) => exercises.push({ ...ex, bodyGroup }));
  });

  if (def.armFilter && def.armCount) {
    shuffled(EXERCISES.arms.filter((ex) => classifyArmExercise(ex.name) === def.armFilter), seed + 500)
      .slice(0, def.armCount)
      .forEach((ex) => exercises.push({ ...ex, bodyGroup: "arms" }));
  }

  const core = shuffled(EXERCISES.abs, seed + 999)[0];
  if (core) exercises.push({ ...core, bodyGroup: "abs" });

  return { dayKey, label: def.label, exercises };
}

// Which PPL bucket a past log belongs to, or null if it doesn't map cleanly
// (e.g. an abs entry, or free text from before the exercise library existed).
function dayForLog(log) {
  if (log.bodyGroup === "arms") {
    const kind = classifyArmExercise(log.exerciseName);
    return kind === "push" ? "push" : kind === "pull" ? "pull" : null;
  }
  return GROUP_TO_DAY[log.bodyGroup] || null;
}

function weakestDay(summary) {
  const totals = {
    push: (summary.chest || 0) + (summary.shoulders || 0),
    pull: summary.back || 0,
    legs: (summary.legs || 0) + (summary.calves || 0),
  };
  return CYCLE.reduce((min, day) => (totals[day] < totals[min] ? day : min), CYCLE[0]);
}

// Decides today's day for the "choose for me" path. `logs` must be newest
// first (getLogsForUser's order) so the "last session" lookup is correct.
export function chooseDay(logs, summary) {
  if (!logs.length) return { dayKey: "push", reason: "fresh-start" };

  const recent = logs.find((log) => dayForLog(log) !== null);
  if (recent) {
    const lastDay = dayForLog(recent);
    return { dayKey: CYCLE[(CYCLE.indexOf(lastDay) + 1) % CYCLE.length], reason: "rotation", lastDay };
  }

  return { dayKey: weakestDay(summary), reason: "balance" };
}

export function explainChoice({ reason, lastDay }, dayLabel) {
  if (reason === "fresh-start") {
    return `You don't have any sessions logged yet, so let's kick off a Push/Pull/Legs split — here's ${dayLabel} to start.`;
  }
  if (reason === "rotation") {
    return `Your last session leaned ${DAY_LABELS[lastDay]}, so let's roll into ${dayLabel} today.`;
  }
  return `${dayLabel.replace(" Day", "")} has had the least attention lately — let's fix that.`;
}
