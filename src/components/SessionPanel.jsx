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
import { CountUp } from "./primitives.jsx";
import { GROUP_LABELS } from "../lib/bodyGroups.js";
import { describeReps, formatVolume, fromKg, logVolume, rankGroups, totalSets } from "../lib/units.js";

export function SessionPanel({ logs, unit, active }) {
  if (!active) {
    return (
      <div className="card session-panel idle">
        <h2>This session</h2>
        <p className="empty">Your workout starts the moment you log your first exercise.</p>
      </div>
    );
  }

  const volume = logs.reduce((sum, log) => sum + logVolume(log), 0);
  // Same ranking the end-of-workout summary uses, so the group named here can't
  // disagree with the one named seconds later.
  const hardest = rankGroups(logs)[0];
  const top = hardest ? GROUP_LABELS[hardest.group] ?? hardest.group : null;

  return (
    <div className="card session-panel">
      <h2>This session</h2>

      <div className="session-total">
        <span className="session-total-value">
          <CountUp value={volume} format={(n) => `${Math.round(fromKg(n, unit)).toLocaleString()} ${unit}`} />
        </span>
        <span className="session-total-label">moved so far</span>
      </div>

      <div className="session-meta">
        <span>
          <strong>{logs.length}</strong> {logs.length === 1 ? "exercise" : "exercises"}
        </span>
        <span>
          <strong>{totalSets(logs)}</strong> sets
        </span>
        {top && (
          <span>
            mostly <strong>{top}</strong>
          </span>
        )}
      </div>

      {logs.length > 0 && (
        <ul className="data-list">
          {/* Newest on top, sliding the rest down — the one you just logged is
              the one you're checking. Exits are tweens (see CLAUDE.md). */}
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
    </div>
  );
}
