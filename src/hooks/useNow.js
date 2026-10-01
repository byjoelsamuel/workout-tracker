// The current time, re-read on an interval, for anything that counts while you
// watch it — the workout clock, the rest timer. Off when `enabled` is false so
// an idle dashboard isn't re-rendering every second for nothing.
import { useEffect, useState } from "react";

export function useNow(intervalMs = 1000, enabled = true) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!enabled) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, enabled]);
  return now;
}
