// Desktop only: is there a newer release? The startup prompt and the row in
// Settings share one answer, so opening Settings right after launch shows what
// the prompt already found instead of asking GitHub a second time.
import { useCallback, useEffect, useState } from "react";
import { checkForUpdate } from "../lib/platform.js";

let latest = null;
let inFlight = null;

export function runUpdateCheck() {
  inFlight ??= checkForUpdate()
    .catch(() => ({ failed: true }))
    .then((result) => {
      latest = result;
      inFlight = null;
      return result;
    });
  return inFlight;
}

export function useUpdateCheck() {
  const [status, setStatus] = useState(latest);
  const [checking, setChecking] = useState(false);

  const check = useCallback(async () => {
    setChecking(true);
    setStatus(await runUpdateCheck());
    setChecking(false);
  }, []);

  // Picks up a check that was already running when the page opened.
  useEffect(() => {
    if (inFlight) check();
  }, [check]);

  return { status, checking, check };
}
