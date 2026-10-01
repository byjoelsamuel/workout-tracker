// Pinned to the bottom of the viewport while a workout is running: the clock,
// the rest timer, and the one control that ends the session.
//
// Unpinned, "End workout" sat below the map, the form and the whole session
// list, so ending a session meant scrolling past everything you'd just logged.
//
// The rest timer starts itself each time you log, because the moment you've
// just finished a set is exactly when you'd otherwise have to remember to
// start it. ±30s and Skip cover the sets that need more or less.
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "./primitives.jsx";
import { useNow } from "../hooks/useNow.js";
import { formatClock } from "../lib/time.js";

function RestTimer({ rest, now, onAdjust, onSkip }) {
  const remaining = Math.max(0, rest.endsAt - now);
  const done = remaining === 0;
  const fraction = rest.total > 0 ? remaining / rest.total : 0;
  const buzzed = useRef(false);

  // A short buzz on phones when rest is up — the phone is usually face-down on
  // the bench, not in your hand.
  useEffect(() => {
    if (done && !buzzed.current) {
      buzzed.current = true;
      navigator.vibrate?.([140, 80, 140]);
    }
    if (!done) buzzed.current = false;
  }, [done]);

  return (
    <motion.div
      className={`rest ${done ? "done" : ""}`.trim()}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.14, ease: "easeIn" } }}
    >
      <svg className="rest-ring" viewBox="0 0 36 36" aria-hidden="true">
        <circle cx="18" cy="18" r="15" className="rest-ring-track" />
        <circle
          cx="18"
          cy="18"
          r="15"
          className="rest-ring-arc"
          pathLength="1"
          strokeDasharray="1"
          strokeDashoffset={1 - fraction}
        />
      </svg>
      <span className="rest-text" role="timer" aria-live={done ? "assertive" : "off"}>
        {done ? "Rest over" : `Rest ${formatClock(remaining)}`}
      </span>
      {!done && (
        <>
          <button type="button" className="row-action" onClick={() => onAdjust(-30)} aria-label="Thirty seconds less">
            −30s
          </button>
          <button type="button" className="row-action" onClick={() => onAdjust(30)} aria-label="Thirty seconds more">
            +30s
          </button>
        </>
      )}
      <button type="button" className="row-action" onClick={onSkip}>
        {done ? "Dismiss" : "Skip"}
      </button>
    </motion.div>
  );
}

export function WorkoutBar({ startedAt, logs, rest, onRestAdjust, onRestSkip, onEnd }) {
  const now = useNow(1000);

  return (
    <div className="card end-workout">
      <div className="end-workout-stats">
        <span className="eyebrow">
          Workout in progress · <span className="num">{formatClock(now - new Date(startedAt).getTime())}</span>
        </span>
        <span className="end-workout-total">
          {logs.length} {logs.length === 1 ? "exercise" : "exercises"} so far
        </span>
      </div>

      <AnimatePresence>
        {rest && <RestTimer key={rest.id} rest={rest} now={now} onAdjust={onRestAdjust} onSkip={onRestSkip} />}
      </AnimatePresence>

      <Button size="large" onClick={onEnd} className="end-workout-button">
        End workout
      </Button>
    </div>
  );
}
