// Naru: the workout planner. No network call and no language model — this is a
// deterministic generator built on the exercise library and your own logs, so
// it works offline, costs nothing, and can't invent a movement that isn't in
// the picker.
//
// It plans **full-body** sessions rather than a Push/Pull/Legs split. A split
// only pays off if you train four-plus times a week; below that each muscle
// waits a full cycle between sessions, and the app's own weekly goal defaults
// to three. Hitting push, pull and legs in every session trains each pattern
// two or three times a week instead of once, at a volume you can actually
// recover from — which is also why a session here is five movements rather
// than the seven the old Push Day used.
//
// "Custom" means read from history, not guessed from body stats. Inferring a
// bulk or a cut from height and weight would be presumptuous and, for some
// people, unwelcome. What the logs honestly support is: which patterns you've
// neglected, what you lifted last time, and how much you're used to doing.
import { EXERCISES } from "./exercises.js";
import { recencyHeat } from "./heat.js";
import { bestByMovement } from "./records.js";
import { sessionKey } from "./time.js";

// The three movement patterns a full-body session has to cover, and which
// muscle groups feed each. Arms are handled separately — the group mixes
// biceps and triceps, so it can't be bucketed by group alone.
const PATTERNS = {
  push: { label: "Push", groups: ["chest", "shoulders"] },
  pull: { label: "Pull", groups: ["back"] },
  legs: { label: "Legs", groups: ["legs", "calves"] },
};

const PATTERN_ORDER = ["push", "pull", "legs"];

// Compound movements first: they need the most from you, so they belong at the
// front of a session while you are fresh. Matching on name because the library
// has no such flag and adding one would mean touching 157 entries.
const COMPOUND_HINTS = [
  "squat", "deadlift", "bench press", "overhead press", "row", "pull-up",
  "chin-up", "pulldown", "dip", "lunge", "press (barbell)", "hip thrust",
  "romanian", "push press", "clean",
];

function isCompound(name) {
  const lower = name.toLowerCase();
  return COMPOUND_HINTS.some((hint) => lower.includes(hint));
}

// Arms split by movement, not by group. Anything unmatched (a grip carry, say)
// is left out of both buckets rather than guessed at.
const PUSH_ARM_HINTS = ["triceps", "pushdown", "extension", "skullcrusher", "jm press", "close grip", "dip", "kickback"];
const PULL_ARM_HINTS = ["curl"];

function armPattern(name) {
  const lower = name.toLowerCase();
  if (PUSH_ARM_HINTS.some((h) => lower.includes(h))) return "push";
  if (PULL_ARM_HINTS.some((h) => lower.includes(h))) return "pull";
  return null;
}

// Every movement in the library, tagged with the pattern it trains.
function pooled() {
  const pool = [];
  for (const [pattern, { groups }] of Object.entries(PATTERNS)) {
    for (const group of groups) {
      for (const ex of EXERCISES[group] || []) pool.push({ ...ex, bodyGroup: group, pattern });
    }
  }
  for (const ex of EXERCISES.arms || []) {
    const pattern = armPattern(ex.name);
    if (pattern) pool.push({ ...ex, bodyGroup: "arms", pattern, isolation: true });
  }
  return pool;
}

// Deterministic PRNG (mulberry32). Reopening the panel has to give the same
// plan back — a session that reshuffled on every render would be impossible to
// follow while you are actually training. The seed carries the date, so
// tomorrow's plan differs from today's without anything being stored.
function mulberry32(seed) {
  let t = seed;
  return () => {
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

function shuffled(list, rng) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Movements from the most recent session, so today's plan doesn't hand back
// the exact same list you just finished. Grouped by sessionKey like every other
// session count — this used to compare UTC dates, so an evening workout west of
// Greenwich was split from its own earlier sets.
function lastSessionNames(logs) {
  if (!logs.length) return new Set();
  const newest = sessionKey(logs[0]);
  return new Set(logs.filter((log) => sessionKey(log) === newest).map((log) => log.exerciseName));
}

// Sets scale with how much you have actually been doing. Someone eight logs in
// does not need five sets of anything, and prescribing it is how people injure
// themselves in week two. Capped at three even for a seasoned lifter: this is a
// full-body session they might run three times a week, not a once-a-week blitz.
function setsFor({ sessions, isolation }) {
  const base = sessions < 6 ? 2 : 3;
  return isolation ? Math.max(2, base - 1) : base;
}

// Rep range follows the movement. Compounds sit lower and heavier, isolation
// higher, bodyweight is capped by what you have rather than a number.
function schemeFor(exercise, sets) {
  if (exercise.timed) return { sets, detail: "30–45s" };
  if (exercise.bodyweight) return { sets, detail: "max reps" };
  if (isCompound(exercise.name)) return { sets, detail: "6–8 reps" };
  return { sets, detail: "10–12 reps" };
}

// A starting weight, taken from your own best set rather than a table. Backed
// off slightly because that best was a top set, not a working one, and the
// number here is what you put on the bar for the first of several.
//
// Left unrounded. Rounding to 2.5 kg here meant a pound user was offered
// "159.8 lb"; plates exist in the display unit, so roundToPlate does it there.
function loadFor(exercise, history) {
  if (exercise.bodyweight || exercise.timed) return null;
  const past = history.get(exercise.name);
  if (!past) return null;
  return { kg: past.weight * 0.9, best: past.weight };
}

// Which patterns are furthest behind. recencyHeat already decays a session's
// weight by how long ago it was, which is exactly the question here — "what
// have I not trained lately" — so this reuses it rather than re-deriving it.
function stalestFirst(logs) {
  const heat = recencyHeat(logs);
  const score = (pattern) => {
    const groups = PATTERNS[pattern].groups;
    const values = groups.map((g) => heat[g]?.value ?? 0);
    return values.reduce((a, b) => a + b, 0) / values.length;
  };
  return [...PATTERN_ORDER].sort((a, b) => score(a) - score(b));
}

/**
 * A full-body session: one compound per pattern, then two accessories weighted
 * toward whatever has gone stalest, then core.
 *
 * `logs` must be newest-first (getLogsForUser's order).
 */
export function planWorkout(logs = [], { now = new Date(), nonce = 0 } = {}) {
  const rng = mulberry32(seedFrom(now.toDateString() + ":" + nonce));
  const pool = pooled();
  const history = bestByMovement(logs);
  const avoid = lastSessionNames(logs);
  const sessions = new Set(logs.map(sessionKey)).size;
  const stale = stalestFirst(logs);

  const chosen = [];
  const used = new Set();

  // Movements you have lifted before come first. That is what makes a plan
  // yours rather than a list off a poster: a lift with history behind it can be
  // handed back with a real working weight, and progressive overload needs the
  // same movement to come round again.
  //
  // Repeating last session is fine for a compound and wrong for an accessory.
  // You are supposed to squat again on Wednesday; you do not need the same
  // lateral raise twice in a row. So allowRepeat is set per call, not globally.
  //
  // Shuffle first, then a stable sort by rank — that keeps the choice random
  // *within* a tier, so someone who knows four chest compounds rotates through
  // them instead of seeing one forever.
  function take(candidates, { allowRepeat = false } = {}) {
    const available = candidates.filter((ex) => !used.has(ex.name));
    if (!available.length) return null;
    const rank = (ex) => {
      const known = history.has(ex.name);
      if (avoid.has(ex.name) && !allowRepeat) return known ? 2 : 3;
      return known ? 0 : 1;
    };
    const pick = shuffled(available, rng).sort((a, b) => rank(a) - rank(b))[0];
    used.add(pick.name);
    return pick;
  }

  // One compound per pattern, in push → pull → legs order so the session reads
  // the way it should be performed.
  for (const pattern of PATTERN_ORDER) {
    const pick =
      take(pool.filter((ex) => ex.pattern === pattern && isCompound(ex.name) && !ex.isolation), {
        allowRepeat: true,
      }) || take(pool.filter((ex) => ex.pattern === pattern), { allowRepeat: true });
    if (pick) chosen.push(pick);
  }

  // Two accessories, aimed at the two stalest patterns.
  for (const pattern of stale.slice(0, 2)) {
    const pick = take(pool.filter((ex) => ex.pattern === pattern && !isCompound(ex.name)));
    if (pick) chosen.push(pick);
  }

  const core = shuffled(EXERCISES.abs || [], rng)[0];
  if (core) chosen.push({ ...core, bodyGroup: "abs", pattern: "core", isolation: true });

  const exercises = chosen.map((ex) => {
    const sets = setsFor({ sessions, isolation: ex.isolation });
    return {
      ...ex,
      ...schemeFor(ex, sets),
      load: loadFor(ex, history),
      patternLabel: ex.pattern === "core" ? "Core" : PATTERNS[ex.pattern].label,
    };
  });

  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets, 0);
  return {
    exercises,
    totalSets,
    // Roughly three minutes a set, warmup included. A range, because a precise
    // figure here would be false confidence.
    minutes: Math.round((totalSets * 3 + 8) / 5) * 5,
    sessions,
    stalest: stale[0],
  };
}

// One line explaining why this plan looks the way it does. Naru should be able
// to justify itself — a plan you can't interrogate is just a random list.
export function explainPlan({ sessions, stalest }) {
  const name = PATTERNS[stalest]?.label.toLowerCase() ?? stalest;
  if (sessions === 0) {
    return "Nothing logged yet, so this is a balanced first session — one push, one pull, one leg movement, and some core.";
  }
  if (sessions < 6) {
    return `Kept light while you're finding your footing. Extra ${name} work, since that's had the least attention lately.`;
  }
  return `Weighted toward ${name} — that's what your body map says has gone stalest. Loads come from your own best sets, backed off about 10%.`;
}
