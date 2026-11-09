import { describe, expect, it } from "vitest";
import { formatClock, formatDuration, relativeDay, sessionKey, weeklyProgress } from "../src/lib/time.js";

// Local-time dates, since weeks and days are counted in local time.
const at = (y, m, d, h = 18) => new Date(y, m - 1, d, h).toISOString();
// Wednesday 11 November 2026, early evening.
const now = new Date(2026, 10, 11, 19).getTime();

describe("sessions", () => {
  it("groups by workout id, and by calendar day for older rows", () => {
    expect(sessionKey({ workoutId: "w1", loggedAt: at(2026, 11, 9) })).toBe("w1");
    expect(sessionKey({ workoutId: null, loggedAt: at(2026, 11, 9, 8) })).toBe(
      sessionKey({ workoutId: null, loggedAt: at(2026, 11, 9, 21) })
    );
  });
});

describe("weeklyProgress", () => {
  it("counts distinct workouts this Monday-to-Sunday week", () => {
    const logs = [
      { workoutId: "a", loggedAt: at(2026, 11, 9) },
      { workoutId: "a", loggedAt: at(2026, 11, 9) },
      { workoutId: "b", loggedAt: at(2026, 11, 11) },
      // Sunday of the week before: not this week.
      { workoutId: "c", loggedAt: at(2026, 11, 8) },
    ];
    const p = weeklyProgress(logs, 3, now);
    expect(p.done).toBe(2);
    expect(p.met).toBe(false);
    expect(p.progress).toBeCloseTo(2 / 3);
  });

  it("keeps a streak alive through the week in progress", () => {
    const lastTwoWeeks = [
      { workoutId: "a", loggedAt: at(2026, 11, 3) },
      { workoutId: "b", loggedAt: at(2026, 10, 27) },
    ];
    // Nothing yet this week, but the week isn't over.
    expect(weeklyProgress(lastTwoWeeks, 3, now).streak).toBe(2);
    const withGap = [{ workoutId: "a", loggedAt: at(2026, 11, 3) }, { workoutId: "b", loggedAt: at(2026, 10, 20) }];
    expect(weeklyProgress(withGap, 3, now).streak).toBe(1);
  });

  it("never reports progress past full", () => {
    const logs = ["a", "b", "c", "d"].map((id) => ({ workoutId: id, loggedAt: at(2026, 11, 10) }));
    const p = weeklyProgress(logs, 3, now);
    expect(p.done).toBe(4);
    expect(p.progress).toBe(1);
    expect(p.met).toBe(true);
  });
});

describe("readable times", () => {
  it("counts calendar days, not elapsed hours", () => {
    expect(relativeDay(at(2026, 11, 11, 7), now)).toBe("today");
    expect(relativeDay(at(2026, 11, 10, 23), now)).toBe("yesterday");
    expect(relativeDay(at(2026, 11, 8), now)).toBe("3 days ago");
    expect(relativeDay(at(2026, 11, 2), now)).toBe("last week");
    expect(relativeDay(at(2026, 10, 14), now)).toBe("4 weeks ago");
  });

  it("formats durations and running clocks", () => {
    const start = new Date(2026, 10, 11, 18, 0);
    expect(formatDuration(start, new Date(2026, 10, 11, 18, 0, 20))).toBe("< 1m");
    expect(formatDuration(start, new Date(2026, 10, 11, 18, 45))).toBe("45m");
    expect(formatDuration(start, new Date(2026, 10, 11, 19, 20))).toBe("1h 20m");
    expect(formatClock(247_000)).toBe("4:07");
    expect(formatClock(3_765_000)).toBe("1:02:45");
    expect(formatClock(-5)).toBe("0:00");
  });
});
