// Thin reactive wrappers over src/lib/store.js. The store itself stays
// pure I/O; these add just enough local state to re-render after a write.
// An app this small doesn't need a state library — mutations are rare and
// always originate from one component.
import { useCallback, useEffect, useState } from "react";
import {
  addLog,
  deleteLog,
  discardWorkoutIfEmpty,
  endWorkout,
  getActiveWorkout,
  getCoachEnabled,
  getCompareData,
  getLogsForUser,
  getRecentExercises,
  getRestSeconds,
  getUnit,
  getUser,
  getWorkoutLogs,
  listProfiles,
  setCoachEnabled,
  setRestSeconds,
  setUnit,
  updateLog,
  updateUser,
} from "../lib/store.js";

// The sign-in screen's roster. Read once per mount — every change to it
// (creating or deleting a profile) navigates to that screen afresh.
export function useProfiles() {
  const [profiles] = useState(listProfiles);
  return profiles;
}

// Returns [user, update] rather than the bare user, the way useUnit below
// returns a pair: the weekly goal is edited from the dashboard, so the profile
// is no longer read-only for the lifetime of the screen.
export function useUser(userId) {
  const [user, setUser] = useState(() => (userId ? getUser(userId) : null));
  // Routes are keyed on the query string, so switching profiles usually
  // remounts this. Reacting to the id anyway means the hook is correct on its
  // own terms rather than relying on a router detail holding still.
  useEffect(() => {
    setUser(userId ? getUser(userId) : null);
  }, [userId]);

  const update = useCallback(
    (patch) => {
      if (!userId) return;
      const next = updateUser(userId, patch);
      if (next) setUser(next);
    },
    [userId]
  );

  return [user, update];
}

// Same shape as useUnit: a global preference plus its setter. Naru reads this
// to decide whether to mount at all, so turning it off removes the corner
// button entirely rather than just collapsing it.
export function useCoachEnabled() {
  const [enabled, setEnabled] = useState(getCoachEnabled);
  const update = useCallback((next) => {
    setCoachEnabled(next);
    setEnabled(next);
  }, []);
  return [enabled, update];
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
  // No all-time summary here any more: nothing read it, and it was a third
  // full scan of the log on every write.
  const readAll = useCallback(
    () => ({
      logs: getLogsForUser(userId),
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

  // Hands back the stored row so the caller can offer to undo it.
  const log = useCallback(
    (entry) => {
      const created = addLog(userId, entry);
      refresh();
      return created;
    },
    [userId, refresh]
  );

  // Removing a just-logged entry, as opposed to deleting one from history: if
  // it was the entry that opened the session, the session goes with it.
  const undo = useCallback(
    (logId) => {
      deleteLog(userId, logId);
      discardWorkoutIfEmpty(userId);
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

  return { ...state, workoutLogs, log, undo, editEntry, removeEntry, finish, refresh };
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

// Rest timer length, same shape as useUnit.
export function useRestSeconds() {
  const [seconds, setSecondsState] = useState(getRestSeconds);
  const change = useCallback((next) => setSecondsState(setRestSeconds(next)), []);
  return [seconds, change];
}
