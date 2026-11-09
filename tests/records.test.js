import { describe, expect, it } from "vitest";
import { beatsBest, bestByMovement, lastTimeFor, personalBests } from "../src/lib/records.js";

const entry = (name, weights, loggedAt, extra = {}) => ({
  exerciseName: name,
  loggedAt,
  timed: false,
  sets: weights.map((weight) => ({ reps: 5, weight })),
  ...extra,
});

// Newest first, the order getLogsForUser returns.
const logs = [
  entry("Bench Press (Barbell)", [80, 85], "2026-11-08T10:00:00Z"),
  entry("Squat (Barbell)", [120], "2026-11-06T10:00:00Z"),
  entry("Bench Press (Barbell)", [90], "2026-11-01T10:00:00Z"),
  entry("Pull-Up", [null], "2026-11-01T10:00:00Z"),
  entry("Weighted Plank", [20], "2026-10-30T10:00:00Z", { timed: true }),
];

describe("records", () => {
  it("keeps the heaviest set per movement, skipping timed and unloaded work", () => {
    const best = bestByMovement(logs);
    expect(best.get("Bench Press (Barbell)").weight).toBe(90);
    expect(best.has("Pull-Up")).toBe(false);
    expect(best.has("Weighted Plank")).toBe(false);
  });

  it("lists personal bests heaviest first", () => {
    expect(personalBests(logs).map((b) => b.name)).toEqual(["Squat (Barbell)", "Bench Press (Barbell)"]);
    expect(personalBests(logs, 1)).toHaveLength(1);
  });

  it("finds the most recent session of a movement", () => {
    expect(lastTimeFor(logs, "Bench Press (Barbell)").loggedAt).toBe("2026-11-08T10:00:00Z");
    expect(lastTimeFor(logs, "Deadlift (Barbell)")).toBeNull();
    expect(lastTimeFor(logs, null)).toBeNull();
  });

  it("only calls a new best when it beats an earlier one", () => {
    const next = (weight) => ({ exerciseName: "Bench Press (Barbell)", timed: false, sets: [{ weight }] });
    expect(beatsBest(logs, next(92.5))).toBe(true);
    expect(beatsBest(logs, next(90))).toBe(false);
    // The first time a lift is logged isn't a record: there's nothing it beat.
    expect(beatsBest(logs, { exerciseName: "Deadlift (Barbell)", timed: false, sets: [{ weight: 200 }] })).toBe(false);
  });
});
