// Live running total for the workout in progress.
//
// Before this, the first feedback you got was the summary after pressing "End
// workout" — everything up to that point was typing into a form with no sense
// of accumulation. The volume counts up as sets land so the number reads as
// something you are adding to.
import { useEffect } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { BODY_GROUPS } from "../lib/bodyGroups.js";
import { describeReps, formatVolume, fromKg, logVolume, totalSets } from "../lib/units.js";
import { listItemVariants, listVariants } from "../lib/motionVariants.js";

const GROUP_LABELS = Object.fromEntries(BODY_GROUPS.map((g) => [g.id, g.label]));

// Counts from where it was to where it now is, rather than snapping. Rounding
// happens inside the transform so every intermediate frame is a whole number.
function CountUp({ value, unit }) {
  const reduced = useReducedMotion();
  const target = useMotionValue(value);
  const eased = useSpring(target, { stiffness: 90, damping: 22, mass: 0.6 });
  const shown = useTransform(reduced ? target : eased, (n) =>
    `${Math.round(fromKg(Math.max(n, 0), unit)).toLocaleString()} ${unit}`
  );

  useEffect(() => {
    target.set(value);
  }, [value, target]);

  return <motion.span>{shown}</motion.span>;
}

// Which group took the most work this session. Volume is the honest measure,
// but a session of nothing but pull-ups and planks has none, so sets are the
// fallback rather than reporting nothing.
function hardestGroup(logs) {
  const totals = new Map();
  for (const log of logs) {
    const current = totals.get(log.bodyGroup) || { volume: 0, sets: 0 };
    current.volume += logVolume(log);
    current.sets += log.sets.length;
    totals.set(log.bodyGroup, current);
  }
  const entries = [...totals.entries()];
  if (entries.length === 0) return null;
  const byVolume = entries.some(([, t]) => t.volume > 0);
  entries.sort((a, b) => (byVolume ? b[1].volume - a[1].volume : b[1].sets - a[1].sets));
  return GROUP_LABELS[entries[0][0]] ?? entries[0][0];
}

export function SessionPanel({ logs, unit, active }) {
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
  const top = hardestGroup(logs);

  return (
    <div className="card session-panel">
      <h2>This session</h2>

      <div className="session-total">
        <span className="session-total-value">
          <CountUp value={volume} unit={unit} />
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
