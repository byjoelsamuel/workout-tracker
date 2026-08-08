// Thin reactive wrappers over src/lib/store.js. The store itself stays
// pure I/O; these add just enough local state to re-render after a write.
// An app this small doesn't need a state library — mutations are rare and
// always originate from one component.
import { useCallback, useState } from "react";
import {
  addLog,
  getCompareData,
  getLogsForUser,
  getSummary,
  getUser,
  listUsers,
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

// Bundles the three things the dashboard needs together, so logging an
// exercise refreshes the history list and the body map in one go.
export function useExerciseLog(userId) {
  const [logs, setLogs] = useState(() => getLogsForUser(userId));
  const [summary, setSummary] = useState(() => getSummary(userId, "all"));

  const log = useCallback(
    (entry) => {
      addLog(userId, entry);
      setLogs(getLogsForUser(userId));
      setSummary(getSummary(userId, "all"));
    },
    [userId]
  );

  return { logs, summary, log };
}
