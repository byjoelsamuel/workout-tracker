// Live running total for the workout in progress.
//
// Before this, the first feedback you got was the summary after pressing "End
// workout" — everything up to that point was typing into a form with no sense
// of accumulation. The volume counts up as sets land so the number reads as
// something you are adding to.
//
// Elapsed time lives on the pinned workout bar now, which ticks every second
// and is on screen for the whole session.
import { AnimatePresence, motion } from "motion/react";
import { CountUp, AppWindow } from "./primitives.jsx";
import { describeReps, formatVolume, fromKg, logVolume, totalSets } from "../lib/units.js";

export function SessionPanel({ logs, unit, active }) {
  if (!active) {
    return (
      <AppWindow title="This session" className="session-panel idle">
        <p className="empty">Nothing logged yet.</p>
      </AppWindow>
    );
  }

  const volume = logs.reduce((sum, log) => sum + logVolume(log), 0);

  return (
    <AppWindow title="This session" className="session-panel">

      <div className="session-total">
        <span className="session-total-label">Total</span>
        <span className="session-total-value">
          <CountUp value={volume} format={(n) => `${Math.round(fromKg(n, unit)).toLocaleString()} ${unit}`} />
        </span>
      </div>

      <p className="session-meta">
        {logs.length} {logs.length === 1 ? "exercise" : "exercises"} · {totalSets(logs)} sets
      </p>

      {logs.length > 0 && (
        <ul className="data-list">
          {/* Newest on top, sliding the rest down — the one you just logged is
              the one you're checking. Exits are tweens (see motionVariants.js). */}
          <AnimatePresence initial={false}>
            {logs.map((log) => (
              <motion.li
                key={log.id}
                layout="position"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12, transition: { duration: 0.15, ease: "easeIn" } }}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              >
                <span className="log-main">
                  <span className="log-name">{log.exerciseName}</span>
                  <span className="log-detail">{describeReps(log)}</span>
                </span>
                <span className="count">{logVolume(log) > 0 ? formatVolume(logVolume(log), unit) : "—"}</span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </AppWindow>
  );
}
