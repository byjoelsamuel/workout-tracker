// Live running total for the workout in progress.
//
// Before this, the first feedback you got was the summary after pressing "End
// workout" — everything up to that point was typing into a form with no sense
// of accumulation. The volume counts up as sets land so the number reads as
// something you are adding to.
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { CountUp } from "./primitives.jsx";
import { GROUP_LABELS } from "../lib/bodyGroups.js";
import { formatDuration } from "../lib/time.js";
import {
  describeReps,
  formatVolume,
  fromKg,
  logVolume,
  rankGroups,
  totalSets,
} from "../lib/units.js";
import { listItemVariants, listVariants } from "../lib/motionVariants.js";

export function SessionPanel({ logs, unit, active, startedAt }) {
  // Ticks so a session left open in a tab doesn't keep reporting the minute it
  // started. Once a minute is enough for a number rendered in whole minutes.
  //
  // Above the early return below, not inside the active branch: this component
  // renders two different trees, and a hook that only runs in one of them
  // changes the hook order between them.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, [active]);

  if (!active) {
    return (
      <div className="card session-panel idle">
        <h2>This session</h2>
        <p className="empty">
          Your workout starts the moment you log your first exercise.
        </p>
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
          <CountUp
            value={volume}
            format={(n) => `${Math.round(fromKg(n, unit)).toLocaleString()} ${unit}`}
          />
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
        {startedAt && (
          <span>
            <strong>{formatDuration(startedAt, now)}</strong> elapsed
          </span>
        )}
        {top && (
          <span>
            mostly <strong>{top}</strong>
          </span>
        )}
      </div>

      {logs.length > 0 && (
        <motion.ul className="data-list" variants={listVariants} initial="hidden" animate="show">
          {logs.map((log) => (
            <motion.li key={log.id} variants={listItemVariants}>
              <span className="log-main">
                <span className="log-name">{log.exerciseName}</span>
                <span className="log-detail">{describeReps(log)}</span>
              </span>
              <span className="count">
                {logVolume(log) > 0 ? formatVolume(logVolume(log), unit) : "—"}
              </span>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </div>
  );
}
