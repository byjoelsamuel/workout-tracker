import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Navigate, useSearchParams } from "react-router-dom";
import { BodyMap } from "../components/BodyMap.jsx";
import { HistoryList } from "../components/HistoryList.jsx";
import { LogForm } from "../components/LogForm.jsx";
import { OnboardingGuide } from "../components/OnboardingGuide.jsx";
import { WorkoutSummary } from "../components/WorkoutSummary.jsx";
import {
  AnimatedList,
  AnimatedListItem,
  Button,
  Card,
  PageHeader,
  StatRow,
} from "../components/primitives.jsx";
import { useExerciseLog, useUnit, useUser } from "../hooks/useStore.js";
import { useOnboardingGuide } from "../hooks/useOnboardingGuide.js";
import { BODY_GROUPS } from "../lib/bodyGroups.js";
import { onGuideReplay } from "../lib/guideBus.js";
import { pageVariants } from "../lib/motionVariants.js";
import { setLastUserId } from "../lib/store.js";
import { formatVolume, totalVolume } from "../lib/units.js";

export function Dashboard() {
  const userId = useSearchParams()[0].get("user");
  const user = useUser(userId);
  const { logs, summary, log, workout, workoutLogs, finish } = useExerciseLog(userId);
  const guide = useOnboardingGuide(userId, logs.length);
  const [unit, setUnit] = useUnit();
  // The workout that just ended, held only long enough to summarise it.
  const [finished, setFinished] = useState(null);

  useEffect(() => {
    if (user) setLastUserId(user.id);
  }, [user]);

  // Lets the nav's help button reopen the walkthrough on demand.
  useEffect(() => onGuideReplay(guide.replay), [guide.replay]);

  // No profile, or one that doesn't exist in this browser — there's nothing
  // to show, so send them somewhere they can pick or make one.
  if (!user) return <Navigate to="/onboarding" replace />;

  const ranked = BODY_GROUPS.map((group) => ({
    ...group,
    count: summary[group.id] || 0,
  })).sort((a, b) => b.count - a.count);

  const liveVolume = totalVolume(workoutLogs);

  return (
    <>
      <motion.main
        className="page"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <PageHeader
          eyebrow={`${logs.length} ${logs.length === 1 ? "session" : "sessions"} logged`}
          title={`${user.name}'s progress`}
        />

        <div className="dashboard-grid">
          <Card className="map-card">
            <div data-guide="body-map">
              <BodyMap summary={summary} showToggle />
            </div>
            <div className="map-legend">
              <span>Less</span>
              <span className="legend-ramp" />
              <span>More</span>
            </div>
            <StatRow user={user} />
          </Card>

          <div className="dashboard-column">
            <Card data-guide="log-form">
              <h2>Log an exercise</h2>
              <LogForm onLog={log} unit={unit} onUnitChange={setUnit} />
            </Card>

            <Card>
              <h2>Breakdown</h2>
              <AnimatedList>
                {ranked.map((group) => (
                  <AnimatedListItem key={group.id}>
                    <span>{group.label}</span>
                    <span className={`count ${group.count === 0 ? "zero" : ""}`}>
                      {group.count}
                    </span>
                  </AnimatedListItem>
                ))}
              </AnimatedList>
            </Card>

            <Card>
              <h2>Recent activity</h2>
              <HistoryList logs={logs.slice(0, 8)} unit={unit} />
            </Card>
          </div>
        </div>

        {/* A workout opens on the first log of the session, so there's only
            something to end once the user has actually started training. */}
        {workout && (
          <Card className="end-workout">
            <div className="end-workout-stats">
              <span className="eyebrow">Workout in progress</span>
              <span className="end-workout-total">
                {workoutLogs.length} {workoutLogs.length === 1 ? "exercise" : "exercises"}
                {liveVolume > 0 && <> · {formatVolume(liveVolume, unit)} moved</>}
              </span>
            </div>
            <Button size="large" onClick={() => setFinished(finish())}>
              End workout
            </Button>
          </Card>
        )}
      </motion.main>

      {finished && (
        <WorkoutSummary workout={finished} unit={unit} onClose={() => setFinished(null)} />
      )}
      {guide.visible && <OnboardingGuide onDismiss={guide.dismiss} />}
    </>
  );
}
