// Everything you look at between workouts: the group breakdown, personal
// bests, and the full history with the ability to correct it.
//
// These used to sit on the dashboard alongside the log form, which meant the
// screen you use mid-set was mostly things you don't read mid-set.
import { motion } from "motion/react";
import { Navigate, useSearchParams } from "react-router-dom";
import { HistoryList } from "../components/HistoryList.jsx";
import {
  AnimatedList,
  AnimatedListItem,
  Card,
  PageHeader,
} from "../components/primitives.jsx";
import { useExerciseLog, useUnit, useUser } from "../hooks/useStore.js";
import { BODY_GROUPS } from "../lib/bodyGroups.js";
import { pageVariants } from "../lib/motionVariants.js";
import { formatVolume, formatWeight, logVolume, topWeight } from "../lib/units.js";

// Heaviest set per movement, best first. Derived here rather than stored, so
// it can never disagree with the log it came from — including after an edit.
function personalBests(logs, limit = 8) {
  const best = new Map();
  for (const log of logs) {
    if (log.timed) continue;
    const top = topWeight(log);
    if (top == null) continue;
    const current = best.get(log.exerciseName);
    if (!current || top > current.weight) {
      best.set(log.exerciseName, { name: log.exerciseName, weight: top, loggedAt: log.loggedAt });
    }
  }
  return [...best.values()].sort((a, b) => b.weight - a.weight).slice(0, limit);
}

export function Progress() {
  const userId = useSearchParams()[0].get("user");
  const user = useUser(userId);
  const { logs, summary, editEntry, removeEntry } = useExerciseLog(userId);
  const [unit, setUnit] = useUnit();

  if (!user) return <Navigate to="/onboarding" replace />;

  const ranked = BODY_GROUPS.map((group) => ({
    ...group,
    count: summary[group.id] || 0,
  })).sort((a, b) => b.count - a.count);

  const bests = personalBests(logs);
  const lifetimeVolume = logs.reduce((sum, log) => sum + logVolume(log), 0);

  return (
    <motion.main
      className="page"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <PageHeader
        eyebrow={`${formatVolume(lifetimeVolume, unit)} moved all time`}
        title={`${user.name}'s progress`}
        subhead="Every set you've logged. Open a row to correct or remove it."
      />

      <div className="progress-grid">
        <div className="dashboard-column">
          <Card>
            <h2>Sessions by muscle group</h2>
            <AnimatedList>
              {ranked.map((group) => (
                <AnimatedListItem key={group.id}>
                  <span>{group.label}</span>
                  <span className={`count ${group.count === 0 ? "zero" : ""}`}>{group.count}</span>
                </AnimatedListItem>
              ))}
            </AnimatedList>
          </Card>

          <Card>
            <h2>Personal bests</h2>
            {bests.length === 0 ? (
              <p className="empty">Log a loaded set and your bests will show up here.</p>
            ) : (
              <AnimatedList>
                {bests.map((best) => (
                  <AnimatedListItem key={best.name}>
                    <span>{best.name}</span>
                    <span className="count">{formatWeight(best.weight, unit)}</span>
                  </AnimatedListItem>
                ))}
              </AnimatedList>
            )}
          </Card>
        </div>

        <Card>
          <h2>Full history</h2>
          <HistoryList
            logs={logs}
            unit={unit}
            onUnitChange={setUnit}
            onEdit={editEntry}
            onDelete={removeEntry}
            empty="Nothing logged yet. Head to the dashboard to start a workout."
          />
        </Card>
      </div>
    </motion.main>
  );
}
