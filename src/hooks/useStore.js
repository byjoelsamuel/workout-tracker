// Thin reactive wrappers over src/lib/store.js. The store itself stays
// pure I/O; these add just enough local state to re-render after a write.
// An app this small doesn't need a state library — mutations are rare and
// always originate from one component.
import { useCallback, useState } from "react";
import {
  addLog,
  endWorkout,
  getActiveWorkout,
  getCompareData,
  getLogsForUser,
  getSummary,
  getUnit,
  getUser,
  getWorkoutLogs,
  listUsers,
  setUnit,
} from "../lib/store.js";

export function useUsers() {
  const [users] = useState(listUsers);
  return users;
}

export function useUser(userId) {
  const [user] = useState(() => (userId ? getUser(userId) : null));
  return user;
}

export function useCompareData() {
  const [data] = useState(getCompareData);
  return data;
}

// Bundles what the dashboard needs together, so logging an exercise refreshes
// the history list, the body map and the in-progress workout in one go.
export function useExerciseLog(userId) {
  const [logs, setLogs] = useState(() => getLogsForUser(userId));
  const [summary, setSummary] = useState(() => getSummary(userId, "all"));
  const [workout, setWorkout] = useState(() => getActiveWorkout(userId));

  const log = useCallback(
    (entry) => {
      addLog(userId, entry);
      setLogs(getLogsForUser(userId));
      setSummary(getSummary(userId, "all"));
      // addLog opens a workout when none is running, so re-read rather than
      // assuming the previous value still holds.
      setWorkout(getActiveWorkout(userId));
    },
    [userId]
  );

  // Hands back the finished workout so the caller can show its summary; the
  // session itself is gone from storage by the time this resolves.
  const finish = useCallback(() => {
    const finished = endWorkout(userId);
    setWorkout(null);
    return finished;
  }, [userId]);

  const workoutLogs = workout ? getWorkoutLogs(userId, workout.id) : [];

  return { logs, summary, log, workout, workoutLogs, finish };
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
