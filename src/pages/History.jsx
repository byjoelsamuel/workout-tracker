// Everything you look at between workouts: this week, the group breakdown,
// personal bests, and the full history with the ability to correct it.
//
// These used to sit on the dashboard alongside the log form, which meant the
// screen you use mid-set was mostly things you don't read mid-set. This page
// also absorbed the old Compare tab: one person's week is the first card here,
// and the other profiles on the device only appear (as a short list) when there
// are any — a tab that was empty for a one-profile install earned no place in
// the nav.
import { motion } from "motion/react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { BodyMap } from "../components/BodyMap.jsx";
import { HistoryList } from "../components/HistoryList.jsx";
import { AnimatedList, AnimatedListItem, PageHeader, XpWindow } from "../components/primitives.jsx";
import { useWeekData, useExerciseLog, useUnit, useUser } from "../hooks/useStore.js";
import { BODY_GROUPS } from "../lib/bodyGroups.js";
import { countHeat, recencyHeat } from "../lib/heat.js";
import { pageVariants } from "../lib/motionVariants.js";
import { personalBests } from "../lib/records.js";
import { relativeDay } from "../lib/time.js";
import { formatVolume, formatWeight, totalVolume } from "../lib/units.js";

export function History() {
  const userId = useSearchParams()[0].get("user");
  const [user] = useUser(userId);
  const { logs, editEntry, removeEntry } = useExerciseLog(userId);
  const [unit, setUnit] = useUnit();
  const week = useWeekData();

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

  const mine = week.find((u) => u.id === userId);
  const others = week.filter((u) => u.id !== userId);

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
        title={`${user.name}'s history`}
        subhead="Every set you've logged. Open a row to correct or remove it."
      />

      <div className="progress-grid">
        <div className="dashboard-column">
          {mine && (
            <XpWindow title="last 7 days" className="week-card">
              {/* Workouts, not log rows — see getSummary in store.js. */}
              <p className="subhead small">
                {mine.sessions} {mine.sessions === 1 ? "session" : "sessions"}
              </p>
              {/* The toggle is needed here as much as on the dashboard: back
                  and hamstrings only exist on the posterior view, so without
                  it a week of nothing but back reads as an untouched body.
                  A flat count rather than the dashboard's decay — this is one
                  fixed week, so there is no "stale" for decay to express. */}
              <BodyMap heat={countHeat(mine.summary)} showToggle />
            </XpWindow>
          )}

          <XpWindow title="muscle groups" ext="dat">
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
          </XpWindow>

          <XpWindow title="personal bests" ext="sav">
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
          </XpWindow>

          {others.length > 0 && (
            <XpWindow title="everyone's week">
              <AnimatedList>
                {others.map((other) => (
                  <AnimatedListItem key={other.id}>
                    <Link to={`/history?user=${other.id}`}>{other.name}</Link>
                    <span className="count">
                      {other.sessions} {other.sessions === 1 ? "session" : "sessions"}
                    </span>
                  </AnimatedListItem>
                ))}
              </AnimatedList>
            </XpWindow>
          )}
        </div>

        <XpWindow title="full history">
          <HistoryList
            logs={logs}
            unit={unit}
            onUnitChange={setUnit}
            onEdit={editEntry}
            onDelete={removeEntry}
            empty="Nothing logged yet. Head to the dashboard to start a workout."
          />
        </XpWindow>
      </div>
    </motion.main>
  );
}
