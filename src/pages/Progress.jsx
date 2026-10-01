// Everything you look at between workouts: the group breakdown, personal
// bests, and the full history with the ability to correct it.
//
// These used to sit on the dashboard alongside the log form, which meant the
// screen you use mid-set was mostly things you don't read mid-set.
import { motion } from "motion/react";
import { Navigate, useSearchParams } from "react-router-dom";
import { HistoryList } from "../components/HistoryList.jsx";
import { AnimatedList, AnimatedListItem, Card, PageHeader } from "../components/primitives.jsx";
import { useExerciseLog, useUnit, useUser } from "../hooks/useStore.js";
import { BODY_GROUPS } from "../lib/bodyGroups.js";
import { recencyHeat } from "../lib/heat.js";
import { pageVariants } from "../lib/motionVariants.js";
import { personalBests } from "../lib/records.js";
import { relativeDay } from "../lib/time.js";
import { formatVolume, formatWeight, totalVolume } from "../lib/units.js";

export function Progress() {
  const userId = useSearchParams()[0].get("user");
  const [user] = useUser(userId);
  const { logs, editEntry, removeEntry } = useExerciseLog(userId);
  const [unit, setUnit] = useUnit();

  if (!user) return <Navigate to="/welcome" replace />;

  // Real sessions, not log rows. The heading has always said "sessions" while
  // the number underneath counted entries, so four chest movements inside one
  // workout read as four sessions. recencyHeat counts them the way lib/time.js
  // does, and carries the last-trained date the rows now show.
  const heat = recencyHeat(logs);
  const ranked = BODY_GROUPS.map((group) => ({
    ...group,
    sessions: heat[group.id]?.sessions || 0,
    lastTrained: heat[group.id]?.lastTrained || null,
  })).sort((a, b) => b.sessions - a.sessions);
  const busiest = ranked[0]?.sessions || 0;

  const bests = personalBests(logs);

  return (
    <motion.main
      className="page"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <PageHeader
        eyebrow={`${formatVolume(totalVolume(logs), unit)} moved all time`}
        title={`${user.name}'s progress`}
        subhead="Every set you've logged. Open a row to correct or remove it."
      />

      <div className="progress-grid">
        <div className="dashboard-column">
          <Card>
            <h2>Sessions by muscle group</h2>
            {/* A bare column of numbers made you do the comparing yourself.
                The bar carries the ranking, and the date is the part that
                actually prompts action — a group last trained a month ago is
                worth knowing about whether its count is high or low. */}
            <AnimatedList className="data-list group-list">
              {ranked.map((group) => (
                <AnimatedListItem key={group.id}>
                  <span className="group-name">{group.label}</span>
                  <span
                    className="group-bar"
                    style={{ "--fill": busiest ? group.sessions / busiest : 0 }}
                    aria-hidden="true"
                  />
                  <span className={`count ${group.sessions === 0 ? "zero" : ""}`}>
                    {group.sessions}
                  </span>
                  <span className="group-when">
                    {group.lastTrained ? relativeDay(group.lastTrained) : "never"}
                  </span>
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
                    <span className="log-name">{best.name}</span>
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
