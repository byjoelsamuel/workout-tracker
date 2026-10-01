// Shown once, when a workout ends. Summarises only the session that just
// finished — the dashboard behind it already covers all-time totals.
//
// Now a real dialog (focus moves in, Escape closes, focus comes back), and it
// names any personal bests set in the session: that was the single most
// motivating fact about a workout, and the old summary never said it.
import { useMemo } from "react";
import { motion } from "motion/react";
import { Dialog } from "./Dialog.jsx";
import { Burst } from "./Burst.jsx";
import { Button, CountUp } from "./primitives.jsx";
import { GROUP_LABELS } from "../lib/bodyGroups.js";
import { beatsBest } from "../lib/records.js";
import { formatDuration } from "../lib/time.js";
import { listItemVariants, listVariants } from "../lib/motionVariants.js";
import {
  describeReps,
  formatVolume,
  formatWeight,
  fromKg,
  logVolume,
  rankGroups,
  topWeight,
  totalReps,
  totalSeconds,
  totalSets,
  totalVolume,
} from "../lib/units.js";

const countSets = (n) => `${n} ${n === 1 ? "set" : "sets"}`;

// Records against everything before this session, so two heavy sets of the
// same lift in one workout count as one new best, not two.
function sessionRecords(workout, allLogs) {
  const prior = allLogs.filter((log) => log.workoutId !== workout.id);
  const best = new Map();
  for (const log of workout.logs) {
    if (!beatsBest(prior, log)) continue;
    const top = topWeight(log);
    if (!best.has(log.exerciseName) || top > best.get(log.exerciseName)) best.set(log.exerciseName, top);
  }
  return [...best.entries()].map(([name, weight]) => ({ name, weight }));
}

export function WorkoutSummary({ workout, allLogs = [], unit, onClose }) {
  const open = Boolean(workout);
  const logs = workout?.logs ?? [];
  const volume = totalVolume(logs);
  const ranked = rankGroups(logs);
  const top = ranked[0];
  const seconds = totalSeconds(logs);
  const records = useMemo(() => (workout ? sessionRecords(workout, allLogs) : []), [workout, allLogs]);

  // The other unit, shown alongside rather than behind a toggle — the whole
  // point of the summary is to be read at a glance.
  const otherUnit = unit === "kg" ? "lb" : "kg";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={workout ? `${logs.length} ${logs.length === 1 ? "exercise" : "exercises"} · ${formatDuration(workout.startedAt, workout.endedAt)}` : ""}
      description="Workout complete"
      className="summary-dialog"
    >
      {logs.length === 0 ? (
        <p className="empty">Nothing was logged in this session, so there's nothing to add up.</p>
      ) : (
        <div className="summary">
          <div className="summary-hero">
            <Burst trigger={open ? workout.id : null} count={24} />
            <span className="summary-hero-label">Total weight moved</span>
            <span className="summary-hero-value">
              <CountUp value={volume} from={0} format={(n) => `${Math.round(fromKg(n, unit)).toLocaleString()} ${unit}`} />
            </span>
            <span className="summary-hero-alt">{formatVolume(volume, otherUnit)}</span>
          </div>

          <div className="stat-row">
            <div className="stat">
              <span className="stat-value num">{totalReps(logs)}</span>
              <span className="stat-label">Reps</span>
            </div>
            <div className="stat">
              <span className="stat-value num">{totalSets(logs)}</span>
              <span className="stat-label">Sets</span>
            </div>
            <div className="stat">
              <span className="stat-value num">{seconds ? `${seconds}s` : "—"}</span>
              <span className="stat-label">Held</span>
            </div>
          </div>

          {records.length > 0 && (
            <section className="summary-records" aria-label="New personal bests">
              {records.map((r, i) => (
                <motion.p
                  key={r.name}
                  className="record-line"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 22, delay: 0.3 + i * 0.12 }}
                >
                  <span>
                    New best — <strong>{r.name}</strong>, {formatWeight(r.weight, unit)}
                  </span>
                </motion.p>
              ))}
            </section>
          )}

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
            <h3>Every exercise</h3>
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
                  <span className="count">{logVolume(log) > 0 ? formatVolume(logVolume(log), unit) : "—"}</span>
                </motion.li>
              ))}
            </motion.ul>
          </section>
        </div>
      )}

      <div className="dialog-actions summary-actions">
        <Button onClick={onClose} block data-autofocus>
          Done
        </Button>
      </div>
    </Dialog>
  );
}
