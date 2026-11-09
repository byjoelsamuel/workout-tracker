import { describe, expect, it } from "vitest";
import { planWorkout } from "../src/lib/coach.js";
import { EXERCISES } from "../src/lib/exercises.js";

const library = new Set(Object.values(EXERCISES).flat().map((ex) => ex.name));
const now = new Date(2026, 10, 11, 18);

describe("Naru's planner", () => {
  it("builds a full-body session from the library on day one", () => {
    const plan = planWorkout([], { now });
    expect(plan.sessions).toBe(0);
    expect(plan.exercises.map((ex) => ex.patternLabel).slice(0, 3)).toEqual(["Push", "Pull", "Legs"]);
    expect(plan.exercises.at(-1).patternLabel).toBe("Core");
    for (const ex of plan.exercises) expect(library.has(ex.name)).toBe(true);
    expect(new Set(plan.exercises.map((ex) => ex.name)).size).toBe(plan.exercises.length);
    expect(plan.totalSets).toBe(plan.exercises.reduce((sum, ex) => sum + ex.sets, 0));
  });

  it("is the same plan all day until rerolled", () => {
    const names = (plan) => plan.exercises.map((ex) => ex.name);
    expect(names(planWorkout([], { now }))).toEqual(names(planWorkout([], { now })));
    const rerolls = new Set([1, 2, 3, 4, 5].map((nonce) => names(planWorkout([], { now, nonce })).join()));
    expect(rerolls.size).toBeGreaterThan(1);
  });

  it("suggests a starting weight a little under your best", () => {
    const logs = Array.from({ length: 6 }, (_, i) => ({
      exerciseName: "Bench Press (Barbell)",
      bodyGroup: "chest",
      workoutId: `w${i}`,
      timed: false,
      loggedAt: new Date(2026, 10, 1 + i).toISOString(),
      sets: [{ reps: 5, weight: 100 }],
    })).reverse();
    for (let nonce = 0; nonce < 10; nonce++) {
      const bench = planWorkout(logs, { now, nonce }).exercises.find((ex) => ex.name === "Bench Press (Barbell)");
      if (bench) {
        expect(bench.load).toEqual({ kg: 90, best: 100 });
        return;
      }
    }
    throw new Error("A lift with history should come up in the plan");
  });
});
