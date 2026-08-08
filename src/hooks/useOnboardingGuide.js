// Decides whether the first-run guide shows.
//
// The empty-log check matters as much as the flag: everyone already using
// the app upgraded without a hasSeenGuide flag ever having existed, so
// checking the flag alone would pop a "first time here?" tutorial at people
// with months of history. No logs is the real signal that someone is new.
import { useCallback, useState } from "react";
import { STORAGE_KEYS } from "../lib/storageKeys.js";

export function useOnboardingGuide(userId, logCount) {
  const [visible, setVisible] = useState(() => {
    if (!userId || logCount > 0) return false;
    return !localStorage.getItem(STORAGE_KEYS.hasSeenGuide(userId));
  });

  const dismiss = useCallback(() => {
    if (userId) localStorage.setItem(STORAGE_KEYS.hasSeenGuide(userId), "1");
    setVisible(false);
  }, [userId]);

  // Replaying from the help button deliberately doesn't clear the flag —
  // asking for help again shouldn't re-arm the automatic popup.
  const replay = useCallback(() => setVisible(true), []);

  return { visible, dismiss, replay };
}
