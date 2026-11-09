import { describe, expect, it } from "vitest";
import {
  checkSets,
  describeReps,
  formatVolume,
  formatWeight,
  fromKg,
  logVolume,
  rankGroups,
  roundToPlate,
  toKg,
  topWeight,
  totalReps,
  totalSeconds,
  totalSets,
} from "../src/lib/units.js";

const log = (fields) => ({ timed: false, bodyGroup: "chest", sets: [], ...fields });

describe("unit conversion", () => {
  it("stores kilograms and converts pounds at the edges", () => {
    expect(toKg(100, "kg")).toBe(100);
    expect(toKg(225, "lb")).toBeCloseTo(102.06, 2);
    expect(fromKg(toKg(225, "lb"), "lb")).toBeCloseTo(225, 10);
  });

  it("treats unparseable input and missing weights as no value", () => {
    expect(toKg("abc", "kg")).toBeNull();
    expect(fromKg(null, "lb")).toBeNull();
  });

  it("snaps suggested loads to real plates in the unit shown", () => {
    expect(roundToPlate(81, "kg")).toBe(80);
    expect(roundToPlate(82, "kg")).toBe(82.5);
    expect(fromKg(roundToPlate(toKg(137, "lb"), "lb"), "lb")).toBeCloseTo(135, 10);
    // Never below one step: an empty bar suggestion still means some load.
    expect(roundToPlate(0.4, "kg")).toBe(2.5);
  });
});

describe("formatting", () => {
  it("drops a trailing .0 but keeps a real half", () => {
    expect(formatWeight(80, "kg")).toBe("80 kg");
    expect(formatWeight(42.5, "kg")).toBe("42.5 kg");
    expect(formatWeight(null, "kg")).toBe("—");
  });

  it("rounds volume to whole units", () => {
    expect(formatVolume(1749.6, "kg")).toBe(`${(1750).toLocaleString()} kg`);
    expect(formatVolume(0, "lb")).toBe("0 lb");
  });

  it("collapses uniform sets and lists a ramp", () => {
    expect(describeReps(log({ sets: [{ reps: 10 }, { reps: 10 }, { reps: 10 }] }))).toBe("3 × 10");
    expect(describeReps(log({ sets: [{ reps: 10 }, { reps: 8 }, { reps: 6 }] }))).toBe("10, 8, 6");
    expect(describeReps(log({ timed: true, sets: [{ reps: 45 }, { reps: 45 }] }))).toBe("2 × 45s");
    expect(describeReps(log({ sets: [] }))).toBeNull();
  });
});

describe("totals", () => {
  const bench = log({ sets: [{ reps: 10, weight: 60 }, { reps: 8, weight: 80 }] });
  const pullUps = log({ bodyGroup: "back", sets: [{ reps: 10, weight: null }] });
  const plank = log({ bodyGroup: "abs", timed: true, sets: [{ reps: 60, weight: null }] });

  it("counts loaded volume only", () => {
    expect(logVolume(bench)).toBe(10 * 60 + 8 * 80);
    expect(logVolume(pullUps)).toBe(0);
    expect(logVolume(plank)).toBe(0);
  });

  it("keeps reps and held seconds apart", () => {
    expect(totalReps([bench, pullUps, plank])).toBe(28);
    expect(totalSeconds([bench, pullUps, plank])).toBe(60);
    expect(totalSets([bench, pullUps, plank])).toBe(4);
  });

  it("tells bodyweight apart from zero", () => {
    expect(topWeight(bench)).toBe(80);
    expect(topWeight(pullUps)).toBeNull();
  });

  it("ranks groups by volume, or by sets when nothing was loaded", () => {
    const legs = log({ bodyGroup: "legs", sets: [{ reps: 5, weight: 140 }] });
    expect(rankGroups([bench, legs]).map((g) => g.group)).toEqual(["chest", "legs"]);
    const twoSets = log({ bodyGroup: "back", sets: [{ reps: 10 }, { reps: 10 }] });
    expect(rankGroups([plank, twoSets]).map((g) => g.group)).toEqual(["back", "abs"]);
  });
});

describe("checkSets", () => {
  const row = (reps, weight = "") => ({ reps, weight });

  it("accepts ordinary sets", () => {
    expect(checkSets([row("10", "80"), row("8", "")])).toBe("");
  });

  it("rejects missing, fractional and absurd reps", () => {
    expect(checkSets([row("")])).toBe("Add reps to every set.");
    expect(checkSets([row("8.5")])).toBe("Use whole numbers.");
    expect(checkSets([row("1001")])).toBe("Too many reps.");
    expect(checkSets([row("")], { timed: true })).toBe("Add a time to every set.");
  });

  it("rejects negative or impossible loads, in either unit", () => {
    expect(checkSets([row("5", "-10")])).toBe("Weight can't be negative.");
    expect(checkSets([row("5", "1001")])).toBe("Weight is too high.");
    expect(checkSets([row("5", "2000")], { unit: "lb" })).toBe("");
    expect(checkSets([row("5", "2300")], { unit: "lb" })).toBe("Weight is too high.");
  });

  it("ignores the weight field for bodyweight movements", () => {
    expect(checkSets([row("10", "-5")], { bodyweight: true })).toBe("");
  });
});
