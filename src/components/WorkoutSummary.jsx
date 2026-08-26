// Shown once, when a workout ends. Summarises only the session that just
// finished — the dashboard behind it already covers all-time totals.
import { motion } from "motion/react";
import { Button } from "./primitives.jsx";
import { GROUP_LABELS } from "../lib/bodyGroups.js";
import { formatDuration } from "../lib/time.js";
import { listItemVariants, listVariants, snappy } from "../lib/motionVariants.js";
import {
  describeReps,
  formatVolume,
  formatWeight,
  logVolume,
  rankGroups,
  topWeight,
  totalReps,
  totalSeconds,
  totalSets,
  totalVolume,
} from "../lib/units.js";

const countSets = (n) => `${n} ${n === 1 ? "set" : "sets"}`;

export function WorkoutSummary({ workout, unit, onClose }) {
  const { logs, startedAt, endedAt } = workout;
  const volume = totalVolume(logs);
  const ranked = rankGroups(logs);
  const top = ranked[0];
  const seconds = totalSeconds(logs);

  // The other unit, shown alongside rather than behind a toggle — the whole
  // point of the summary is to be read at a glance.
  const otherUnit = unit === "kg" ? "lb" : "kg";

  return (
    <div className="summary-backdrop" role="dialog" aria-modal="true" aria-label="Workout summary">
      <motion.div
        className="summary-panel"
        initial={{ scale: 0.92, y: 28, opacity: 0.5 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={snappy}
      >
        <header className="summary-header">
          <p className="eyebrow">Workout complete</p>
          <h2>
            {logs.length} {logs.length === 1 ? "exercise" : "exercises"} ·{" "}
            {formatDuration(startedAt, endedAt)}
          </h2>
        </header>

        {logs.length === 0 ? (
          <p className="empty">
            Nothing was logged in this session, so there's nothing to add up.
          </p>
        ) : (
          <>
            <div className="summary-hero">
              <span className="summary-hero-label">Total weight moved</span>
              <span className="summary-hero-value">{formatVolume(volume, unit)}</span>
              <span className="summary-hero-alt">{formatVolume(volume, otherUnit)}</span>
            </div>

            <div className="stat-row">
              <div className="stat">
                <span className="stat-value">{totalReps(logs)}</span>
                <span className="stat-label">Reps</span>
              </div>
              <div className="stat">
                <span className="stat-value">{totalSets(logs)}</span>
                <span className="stat-label">Sets</span>
              </div>
              <div className="stat">
                <span className="stat-value">{seconds ? `${seconds}s` : "—"}</span>
                <span className="stat-label">Held</span>
              </div>
            </div>

            {top && (
              <p className="summary-top">
                Worked <strong>{GROUP_LABELS[top.group] ?? top.group}</strong> the most
                {top.volume > 0 && <> — {formatVolume(top.volume, unit)} across {countSets(top.sets)}</>}
                {top.volume === 0 && <> — {countSets(top.sets)}</>}
              </p>
            )}

            <section className="summary-section">
              <h3>By muscle group</h3>
              <motion.ul className="data-list" variants={listVariants} initial="hidden" animate="show">
                {ranked.map((entry) => (
                  <motion.li key={entry.group} variants={listItemVariants}>
                    <span>{GROUP_LABELS[entry.group] ?? entry.group}</span>
                    <span className="count">
                      {entry.volume > 0 ? formatVolume(entry.volume, unit) : countSets(entry.sets)}
                    </span>
                  </motion.li>
                ))}
              </motion.ul>
            </section>

            <section className="summary-section">
              <h3>Every set</h3>
              <motion.ul className="data-list" variants={listVariants} initial="hidden" animate="show">
                {logs.map((log) => (
                  <motion.li key={log.id} variants={listItemVariants}>
                    <span className="log-main">
                      <span className="log-name">{log.exerciseName}</span>
                      <span className="log-detail">
                        {describeReps(log)}
                        {topWeight(log) != null ? ` · ${formatWeight(topWeight(log), unit)}` : ""}
                      </span>
                    </span>
                    <span className="count">
                      {logVolume(log) > 0 ? formatVolume(logVolume(log), unit) : "—"}
                    </span>
                  </motion.li>
                ))}
              </motion.ul>
            </section>
          </>
        )}

        <Button onClick={onClose} block>
          Done
        </Button>
      </motion.div>
    </div>
  );
}
