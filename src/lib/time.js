// Turning timestamps into the things people actually read: which week a set
// belongs to, how many workouts that week held, how long a run of weeks has
// been kept alive, and how long ago something happened.
//
// Finished workouts are not persisted — endWorkout deletes the session record
// and hands its contents to the summary — so "workouts this week" can only ever
// be derived from the logs themselves.
//
// Everything here is a pure function of an array of already-normalised logs
// rather than a userId, because the dashboard is holding that array already.
// getLogsForUser is a full scan plus a normalise pass on every call, and
// useStore runs it more than once per render as it is.
const DAY_MS = 24 * 60 * 60 * 1000;

// Local calendar day. Deliberately not toISOString().slice(0, 10), which is
// UTC — an evening session west of Greenwich would be filed under the next day.
function dayKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

// Monday, local midnight. getDay() is Sunday-based, so (day + 6) % 7 is
// days-since-Monday. setHours runs a second time because stepping a date across
// a daylight-saving boundary can land at 23:00 the evening before.
export function startOfWeek(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  d.setHours(0, 0, 0, 0);
  return d;
}

// Calendar arithmetic rather than `weekStart - 7 * DAY_MS`: subtracting a fixed
// number of milliseconds across a clock change lands an hour either side of
// midnight, which either misses a week or counts one twice.
function previousWeek(weekStartMs) {
  const d = new Date(weekStartMs);
  d.setDate(d.getDate() - 7);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

// What counts as one workout.
//
// Rows written since sessions existed carry a workoutId and group themselves.
// Rows from before that carry workoutId: null (backfilled by normalizeLog) and
// belong to no session — there's no way to recover how many one day held, so a
// day of them counts as one workout, which is the honest floor. The `day:`
// prefix keeps the two keyspaces apart, so a legacy row and a real session on
// the same date stay two workouts rather than one absorbing the other.
function sessionKey(log) {
  return log.workoutId ?? `day:${dayKey(log.loggedAt)}`;
}

// weekStart (ms) → Set of session keys. One pass over the log; every reading of
// "workouts in week N" comes out of this map.
function sessionsByWeek(logs) {
  const weeks = new Map();
  for (const log of logs) {
    const key = startOfWeek(log.loggedAt).getTime();
    if (!weeks.has(key)) weeks.set(key, new Set());
    weeks.get(key).add(sessionKey(log));
  }
  return weeks;
}

// Consecutive weeks holding at least one workout, counting back from this one.
//
// Deliberately not "weeks that met the goal": the goal is editable, so tying
// the streak to it would rewrite the user's past the moment they raised it —
// bump the target from three to four and a year of history retroactively stops
// counting. And deliberately not consecutive days: rest days are training, and
// a streak that punishes them is one nobody can hold.
//
// The week in progress cannot break it. A five-week run still reads five at 9am
// on Monday and only falls away once that week has ended empty; counting it
// like any other week would delete the number the user is proudest of at the
// one moment they've had no chance to do anything about it.
function currentStreak(weeks, thisWeek) {
  let streak = weeks.has(thisWeek) ? 1 : 0;
  for (let week = previousWeek(thisWeek); weeks.has(week); week = previousWeek(week)) {
    streak += 1;
  }
  return streak;
}

// A calendar week (Mon–Sun), not the rolling seven days getSummary("week") and
// the compare page use. A goal needs an edge the user can name: on a rolling
// window the count drops silently overnight as old sessions age out, so a meter
// reading 3 of 3 last night reads 2 of 3 this morning with nothing having
// happened. That's fine for a leaderboard and wrong for a target.
export function weeklyProgress(logs, goal, now = Date.now()) {
  const weeks = sessionsByWeek(logs);
  const thisWeek = startOfWeek(now).getTime();
  const done = weeks.get(thisWeek)?.size ?? 0;
  return {
    done,
    // Clamped for the ring only — `done` stays honest for the copy, so a fifth
    // workout against a goal of four still reads as five.
    progress: goal > 0 ? Math.min(done / goal, 1) : 0,
    met: goal > 0 && done >= goal,
    streak: currentStreak(weeks, thisWeek),
  };
}

// Whole calendar days apart, not elapsed hours: a set logged at 11pm last night
// is "yesterday", not "ten hours ago". Both ends snap to local midnight first,
// so the ±1h a clock-change week introduces rounds away.
export function relativeDay(iso, now = Date.now()) {
  const then = new Date(iso);
  then.setHours(0, 0, 0, 0);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const days = Math.round((today - then) / DAY_MS);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "last week";
  return `${Math.floor(days / 7)} weeks ago`;
}

// Moved here from WorkoutSummary — the live session panel needs the same
// reading now, while the workout is still running.
export function formatDuration(startedAt, endedAt = new Date()) {
  const minutes = Math.round((new Date(endedAt) - new Date(startedAt)) / 60000);
  if (minutes < 1) return "< 1m";
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}
