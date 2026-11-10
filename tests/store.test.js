import { beforeEach, describe, expect, it } from "vitest";
import { STORAGE_KEYS } from "../src/lib/storageKeys.js";
import {
  addLog,
  createUser,
  deleteUser,
  discardWorkoutIfEmpty,
  endWorkout,
  exportBackup,
  getActiveWorkout,
  getLogsForUser,
  getSummary,
  getUser,
  importBackup,
  updateLog,
  updateUser,
} from "../src/lib/store.js";

const put = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const get = (key) => JSON.parse(localStorage.getItem(key));

beforeEach(() => localStorage.clear());

describe("storage keys", () => {
  it("are a fixed wire format", () => {
    // Real history sits under these on the live site. A rename orphans it.
    expect(STORAGE_KEYS.users).toBe("workoutTracker.users");
    expect(STORAGE_KEYS.logs).toBe("workoutTracker.logs");
    expect(STORAGE_KEYS.activeWorkout("u1")).toBe("workoutTracker.activeWorkout.u1");
  });
});

describe("old data keeps loading", () => {
  it("expands the count-plus-reps shape into one row per set", () => {
    put(STORAGE_KEYS.logs, [
      { id: "l1", userId: "u1", bodyGroup: "chest", exerciseName: "Bench Press (Barbell)", sets: 3, reps: 10, weight: 60, loggedAt: "2025-01-02T10:00:00Z" },
    ]);
    const [log] = getLogsForUser("u1");
    expect(log.sets).toEqual([
      { id: "l1:0", reps: 10, weight: 60 },
      { id: "l1:1", reps: 10, weight: 60 },
      { id: "l1:2", reps: 10, weight: 60 },
    ]);
    expect(log).not.toHaveProperty("reps");
    expect(log.workoutId).toBeNull();
    // Storage itself is left exactly as it was.
    expect(get(STORAGE_KEYS.logs)[0].sets).toBe(3);
  });

  it("never invents sets for rows that recorded none", () => {
    put(STORAGE_KEYS.logs, [{ id: "l1", userId: "u1", bodyGroup: "abs", exerciseName: "Plank", loggedAt: "2025-01-02T10:00:00Z" }]);
    const [log] = getLogsForUser("u1");
    expect(log.sets).toEqual([]);
    // Flags fall back to the exercise library for rows written before them.
    expect(log.timed).toBe(true);
    expect(log.bodyweight).toBe(true);
  });

  it("totals the same before and after an edit promotes a legacy row", () => {
    put(STORAGE_KEYS.logs, [
      { id: "l1", userId: "u1", bodyGroup: "legs", exerciseName: "Squat (Barbell)", sets: 2, reps: 5, weight: 100, loggedAt: "2025-01-02T10:00:00Z" },
    ]);
    const before = getLogsForUser("u1")[0].sets.map(({ reps, weight }) => ({ reps, weight }));
    updateLog("u1", "l1", { sets: getLogsForUser("u1")[0].sets });
    const raw = get(STORAGE_KEYS.logs)[0];
    expect(raw).not.toHaveProperty("reps");
    expect(raw.sets.map(({ reps, weight }) => ({ reps, weight }))).toEqual(before);
  });

  it("gives profiles from before weekly goals the default goal", () => {
    put(STORAGE_KEYS.users, [{ id: "u1", name: "Joel" }]);
    expect(getUser("u1").weeklyGoal).toBe(3);
  });

  it("sets unreadable storage aside instead of losing it", () => {
    localStorage.setItem(STORAGE_KEYS.logs, "{not json");
    expect(getLogsForUser("u1")).toEqual([]);
    expect(localStorage.getItem(STORAGE_KEYS.unreadable(STORAGE_KEYS.logs))).toBe("{not json");
  });
});

describe("profiles", () => {
  it("clamps the weekly goal and refuses a blank name", () => {
    const user = createUser({ name: "  Joel  ", weeklyGoal: 12 });
    expect(user.name).toBe("Joel");
    expect(user.weeklyGoal).toBe(7);
    expect(updateUser(user.id, { weeklyGoal: 0 }).weeklyGoal).toBe(1);
    expect(updateUser(user.id, { name: "   " }).name).toBe("Joel");
  });

  it("deletes one profile's rows and leaves everyone else's alone", () => {
    const a = createUser({ name: "A" });
    const b = createUser({ name: "B" });
    addLog(a.id, { bodyGroup: "chest", exerciseName: "Bench Press (Barbell)", sets: [{ reps: 5, weight: 80 }] });
    addLog(b.id, { bodyGroup: "back", exerciseName: "Pull-Up", sets: [{ reps: 8, weight: null }], bodyweight: true });
    const bRows = JSON.stringify(get(STORAGE_KEYS.logs).filter((l) => l.userId === b.id));
    expect(deleteUser(a.id)).toBe(true);
    expect(getLogsForUser(a.id)).toEqual([]);
    expect(getActiveWorkout(a.id)).toBeNull();
    expect(JSON.stringify(get(STORAGE_KEYS.logs))).toBe(bRows);
  });
});

describe("workouts", () => {
  it("opens on the first log, groups entries, and ends with a summary", () => {
    const user = createUser({ name: "Joel" });
    const first = addLog(user.id, { bodyGroup: "chest", exerciseName: "Bench Press (Barbell)", sets: [{ reps: 5, weight: 80 }] });
    const second = addLog(user.id, { bodyGroup: "legs", exerciseName: "Squat (Barbell)", sets: [{ reps: 5, weight: 120 }] });
    expect(first.workoutId).toBe(second.workoutId);

    const ended = endWorkout(user.id);
    expect(ended.logs).toHaveLength(2);
    expect(getActiveWorkout(user.id)).toBeNull();
    // One workout is one session, however many groups it hit.
    expect(getSummary(user.id).total).toBe(1);
    expect(getSummary(user.id).groups.chest).toBe(1);
  });

  it("stores no load as null, never zero or negative", () => {
    const user = createUser({ name: "Joel" });
    const log = addLog(user.id, { bodyGroup: "chest", exerciseName: "Push-Up", sets: [{ reps: 10, weight: "" }, { reps: 10, weight: -5 }] });
    expect(log.sets.map((s) => s.weight)).toEqual([null, null]);
  });

  it("only discards a workout that has nothing in it", () => {
    const user = createUser({ name: "Joel" });
    addLog(user.id, { bodyGroup: "chest", exerciseName: "Bench Press (Barbell)", sets: [{ reps: 5, weight: 80 }] });
    expect(discardWorkoutIfEmpty(user.id)).toBe(false);
    expect(getActiveWorkout(user.id)).not.toBeNull();
  });
});

describe("backups", () => {
  function seedOneProfile() {
    const user = createUser({ name: "Joel" });
    addLog(user.id, { bodyGroup: "chest", exerciseName: "Bench Press (Barbell)", sets: [{ reps: 5, weight: 80 }] });
    return user;
  }

  it("round-trips into an empty browser", () => {
    seedOneProfile();
    const backup = JSON.parse(JSON.stringify(exportBackup()));
    localStorage.clear();
    expect(importBackup(backup)).toEqual({ users: 1, logs: 1, food: 0, skipped: 0 });
    expect(get(STORAGE_KEYS.logs)).toEqual(backup.logs);
  });

  it("merges without overwriting, so importing twice changes nothing", () => {
    const user = seedOneProfile();
    const backup = exportBackup();
    updateUser(user.id, { name: "Joel S" });
    expect(importBackup(backup)).toEqual({ users: 0, logs: 0, food: 0, skipped: 2 });
    expect(getUser(user.id).name).toBe("Joel S");
  });

  it("drops rows that can't load and logs with no profile", () => {
    const result = importBackup({
      app: "tsyoku-naru",
      users: [{ id: "u1", name: "Joel" }, { id: "", name: "No id" }],
      logs: [
        { id: "l1", userId: "u1", bodyGroup: "chest", exerciseName: "Bench Press (Barbell)", loggedAt: "2025-01-01T00:00:00Z", sets: [] },
        { id: "l2", userId: "ghost", bodyGroup: "chest", exerciseName: "Bench Press (Barbell)", loggedAt: "2025-01-01T00:00:00Z", sets: [] },
        { id: "l3", userId: "u1", bodyGroup: "chest", exerciseName: "Bench Press (Barbell)", loggedAt: "not a date" },
      ],
    });
    expect(result).toEqual({ users: 1, logs: 1, food: 0, skipped: 3 });
  });

  it("rejects files that aren't backups", () => {
    expect(() => importBackup(null)).toThrow();
    expect(() => importBackup({ users: "x", logs: [] })).toThrow();
    expect(() => importBackup({ app: "other", users: [], logs: [] })).toThrow("Not a backup file.");
  });
});
