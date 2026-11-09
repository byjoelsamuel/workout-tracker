import { describe, expect, it } from "vitest";
import { countHeat, recencyHeat } from "../src/lib/heat.js";

const DAY = 24 * 60 * 60 * 1000;
const now = Date.UTC(2026, 10, 11, 12);
const daysAgo = (n) => new Date(now - n * DAY).toISOString();

describe("recencyHeat", () => {
  it("fades a session as it gets older", () => {
    const fresh = recencyHeat([{ bodyGroup: "chest", workoutId: "a", loggedAt: daysAgo(0) }], now).chest.value;
    const weekOld = recencyHeat([{ bodyGroup: "chest", workoutId: "a", loggedAt: daysAgo(7) }], now).chest.value;
    const monthOld = recencyHeat([{ bodyGroup: "chest", workoutId: "a", loggedAt: daysAgo(30) }], now).chest.value;
    expect(fresh).toBeGreaterThan(weekOld);
    expect(weekOld).toBeGreaterThan(monthOld);
    expect(monthOld).toBeGreaterThan(0);
  });

  it("counts several entries in one workout as one session", () => {
    const oneWorkout = [
      { bodyGroup: "chest", workoutId: "a", loggedAt: daysAgo(1) },
      { bodyGroup: "chest", workoutId: "a", loggedAt: daysAgo(1) },
      { bodyGroup: "chest", workoutId: "a", loggedAt: daysAgo(1) },
    ];
    const single = [{ bodyGroup: "chest", workoutId: "a", loggedAt: daysAgo(1) }];
    const heat = recencyHeat(oneWorkout, now);
    expect(heat.chest.sessions).toBe(1);
    expect(heat.chest.value).toBeCloseTo(recencyHeat(single, now).chest.value);
    expect(heat.chest.lastTrained).toBe(daysAgo(1));
  });

  it("stays between 0 and 1 however much is logged", () => {
    const lots = Array.from({ length: 40 }, (_, i) => ({ bodyGroup: "legs", workoutId: `w${i}`, loggedAt: daysAgo(i % 3) }));
    expect(recencyHeat(lots, now).legs.value).toBe(1);
    expect(recencyHeat([], now)).toEqual({});
  });
});

describe("countHeat", () => {
  it("maps a plain count onto the same 0-1 scale", () => {
    const heat = countHeat({ chest: 0, back: 2, legs: 9 });
    expect(heat.chest.value).toBe(0);
    expect(heat.back.value).toBeGreaterThan(0);
    expect(heat.back.value).toBeLessThan(1);
    expect(heat.legs.value).toBe(1);
  });
});
