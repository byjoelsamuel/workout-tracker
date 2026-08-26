// How recently each muscle group has been worked, and how that becomes ink on
// the body map.
//
// The map used to read a lifetime session count, so it could only ever go up.
// Train chest five times and it sat pinned at full accent forever — whether
// that was this week or last spring. After a couple of months everything is
// saturated, and a figure where every muscle is bright says exactly as much as
// one where none of them are.
//
// So a session's contribution decays. Today's work counts fully, a week later
// it counts half, three weeks later it has almost gone. The map answers "what
// have I been working lately, and what have I let go stale" — which is a
// question with a changing answer. "What have I ever done" is a real question
// too, and it's the one the Progress page's lifetime counts exist to answer.
import { sessionKey } from "./time.js";

const DAY_MS = 24 * 60 * 60 * 1000;

// Seven days to halve, which lines up with how training is actually planned: a
// group hit once a week holds a steady mid-tone, twice a week climbs near the
// top, and one missed week reads as a dip rather than a wipe.
const HALF_LIFE_DAYS = 7;

// What "fully lit" means. Training a group twice a week converges on about 3.4
// once the decayed tail is summed, so 3 puts a consistent twice-a-week group at
// the top of the scale with a little headroom above it.
const FULL = 3;

// A curve rather than the linear ramp with a 0.28 floor bolted underneath it.
// That floor existed so a single session stayed visible, but it fights decay
// directly — it would freeze three-week-old work at the same tone as this
// morning's, which is the exact thing being fixed. Gamma keeps the bottom of
// the range visible without ever flattening it.
const GAMMA = 0.65;

// Weight of one session, given how long ago it happened.
function decayWeight(loggedAt, now = Date.now()) {
  const days = Math.max(0, (now - new Date(loggedAt).getTime()) / DAY_MS);
  return 0.5 ** (days / HALF_LIFE_DAYS);
}

function toValue(score) {
  if (score <= 0) return 0;
  return Math.min(score / FULL, 1) ** GAMMA;
}

// group → { value, sessions, lastTrained }
//
//   value        0–1, the fillOpacity the map animates to
//   sessions     distinct real sessions, undecayed — decay changes how loudly a
//                group is drawn, never what the tooltip claims you did
//   lastTrained  ISO timestamp of the most recent one, or null
//
// Sessions are counted the way lib/time.js counts them (workoutId, falling back
// to the calendar day for pre-session rows) rather than by counting log rows.
// The old tooltip said "4 sessions" when it meant four *entries* — four chest
// movements inside one workout read as four sessions.
export function recencyHeat(logs, now = Date.now()) {
  // Keyed by session, not by log row. Summing a weight per row would let one
  // workout with four chest movements in it score four times as loud as the
  // same workout with one — which is the entry-vs-session confusion that made
  // the old tooltip claim four sessions for a single evening. A session counts
  // once, at the time it happened.
  const groups = new Map();

  for (const log of logs) {
    let g = groups.get(log.bodyGroup);
    if (!g) {
      g = { sessions: new Map(), lastTrained: null };
      groups.set(log.bodyGroup, g);
    }
    const key = sessionKey(log);
    // Several entries share a session; the latest of them dates it.
    const at = g.sessions.get(key);
    if (!at || log.loggedAt > at) g.sessions.set(key, log.loggedAt);
    if (!g.lastTrained || log.loggedAt > g.lastTrained) g.lastTrained = log.loggedAt;
  }

  const heat = {};
  for (const [group, g] of groups) {
    let score = 0;
    for (const at of g.sessions.values()) score += decayWeight(at, now);
    heat[group] = {
      value: toValue(score),
      sessions: g.sessions.size,
      lastTrained: g.lastTrained,
    };
  }
  return heat;
}

// The undecayed reading, for the compare page — five profiles side by side are
// being measured against each other over one fixed week, so there is no "stale"
// for decay to express. Same shape, so BodyMap doesn't care which it was given.
export function countHeat(summary = {}, full = 5) {
  const heat = {};
  for (const [group, count] of Object.entries(summary)) {
    heat[group] = {
      value: count ? Math.min(count / full, 1) ** GAMMA : 0,
      sessions: count,
      lastTrained: null,
    };
  }
  return heat;
}

// What a single session looks like at 0, 1, 2 and 3 weeks old. The legend draws
// these to show the decay itself, since a bare "less → more" ramp can't explain
// why a muscle you trained hard last month is dim.
export const DECAY_SAMPLES = [0, 1, 2, 3].map((weeks) => ({
  weeks,
  value: toValue(0.5 ** ((weeks * 7) / HALF_LIFE_DAYS)),
}));
