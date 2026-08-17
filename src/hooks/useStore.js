// Thin reactive wrappers over src/lib/store.js. The store itself stays
// pure I/O; these add just enough local state to re-render after a write.
// An app this small doesn't need a state library — mutations are rare and
// always originate from one component.
import { useCallback, useEffect, useState } from "react";
import {
  addLog,
  deleteLog,
  endWorkout,
  getActiveWorkout,
  getCompareData,
  getLogsForUser,
  getRecentExercises,
  getSummary,
  getUnit,
  getUser,
  getWorkoutLogs,
  listUsers,
  setUnit,
  updateLog,
} from "../lib/store.js";

export function useUsers() {
  const [users] = useState(listUsers);
  return users;
}

export function useUser(userId) {
  const [user, setUser] = useState(() => (userId ? getUser(userId) : null));
  // Routes are keyed on the query string, so switching profiles usually
  // remounts this. Reacting to the id anyway means the hook is correct on its
  // own terms rather than relying on a router detail holding still.
  useEffect(() => {
    setUser(userId ? getUser(userId) : null);
  }, [userId]);
  return user;
}

export function useCompareData() {
  const [data] = useState(getCompareData);
  return data;
}

// Bundles what the dashboard and progress views need, so any write refreshes
// the history, the body map, the recents and the in-progress workout together.
// Every mutation goes through `refresh` rather than patching local state,
// because the derived values (summary, recents, personal bests) are computed
// across the whole log and can't be updated incrementally without drifting.
export function useExerciseLog(userId) {
  const readAll = useCallback(
    () => ({
      logs: getLogsForUser(userId),
      summary: getSummary(userId, "all"),
      workout: getActiveWorkout(userId),
      recents: getRecentExercises(userId, 10),
    }),
    [userId]
  );

  const [state, setState] = useState(readAll);

  useEffect(() => {
    setState(readAll());
  }, [readAll]);

  const refresh = useCallback(() => setState(readAll()), [readAll]);

  const log = useCallback(
    (entry) => {
      addLog(userId, entry);
      refresh();
    },
    [userId, refresh]
  );

  const editEntry = useCallback(
    (logId, patch) => {
      updateLog(userId, logId, patch);
      refresh();
    },
    [userId, refresh]
  );

  const removeEntry = useCallback(
    (logId) => {
      deleteLog(userId, logId);
      refresh();
    },
    [userId, refresh]
  );

  // Hands back the finished workout so the caller can show its summary; the
  // session itself is gone from storage by the time this resolves.
  const finish = useCallback(() => {
    const finished = endWorkout(userId);
    refresh();
    return finished;
  }, [userId, refresh]);

  const workoutLogs = state.workout ? getWorkoutLogs(userId, state.workout.id) : [];

  return { ...state, workoutLogs, log, editEntry, removeEntry, finish };
}

// Display unit for weights, mirrored into localStorage so it survives a
// reload. Kept here rather than in each component so the log form, history
// list and workout summary can't disagree about what "60" means.
export function useUnit() {
  const [unit, setUnitState] = useState(getUnit);

  const change = useCallback((next) => {
    setUnit(next);
    setUnitState(next);
  }, []);

  return [unit, change];
}
