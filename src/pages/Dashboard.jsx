// The mid-workout screen. Deliberately only three things: what you've trained,
// what you're logging, and where the session stands. The breakdown, personal
// bests and full history live on /progress — they're what you read between
// workouts, not between sets.
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Navigate, useSearchParams } from "react-router-dom";
import { BodyMap } from "../components/BodyMap.jsx";
import { LogForm } from "../components/LogForm.jsx";
import { OnboardingGuide } from "../components/OnboardingGuide.jsx";
import { SessionPanel } from "../components/SessionPanel.jsx";
import { WorkoutSummary } from "../components/WorkoutSummary.jsx";
import { Button, Card, PageHeader, StatRow } from "../components/primitives.jsx";
import { useExerciseLog, useUnit, useUser } from "../hooks/useStore.js";
import { useOnboardingGuide } from "../hooks/useOnboardingGuide.js";
import { onGuideReplay } from "../lib/guideBus.js";
import { pageVariants } from "../lib/motionVariants.js";
import { setLastUserId } from "../lib/store.js";

export function Dashboard() {
  const userId = useSearchParams()[0].get("user");
  const user = useUser(userId);
  const { logs, summary, recents, log, workout, workoutLogs, finish } = useExerciseLog(userId);
  const guide = useOnboardingGuide(userId, logs.length);
  const [unit, setUnit] = useUnit();
  // The workout that just ended, held only long enough to summarise it.
  const [finished, setFinished] = useState(null);
  const [confirmingEnd, setConfirmingEnd] = useState(false);

  useEffect(() => {
    if (user) setLastUserId(user.id);
  }, [user]);

  // Lets the nav's help button reopen the walkthrough on demand.
  useEffect(() => onGuideReplay(guide.replay), [guide.replay]);

  // No profile, or one that doesn't exist in this browser — there's nothing
  // to show, so send them somewhere they can pick or make one.
  if (!user) return <Navigate to="/onboarding" replace />;

  function endWorkout() {
    setFinished(finish());
    setConfirmingEnd(false);
  }

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
          eyebrow={`${logs.length} ${logs.length === 1 ? "entry" : "entries"} logged`}
          title={`${user.name}'s workout`}
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
              <LogForm onLog={log} recents={recents} unit={unit} onUnitChange={setUnit} />
            </Card>

            <SessionPanel logs={workoutLogs} unit={unit} active={Boolean(workout)} />
          </div>
        </div>

        {/* A workout opens on the first entry of the session, so there's only
            something to end once the user has actually started training. */}
        {workout && (
          <Card className="end-workout">
            <div className="end-workout-stats">
              <span className="eyebrow">Workout in progress</span>
              <span className="end-workout-total">
                {confirmingEnd
                  ? "End it and see your summary?"
                  : `${workoutLogs.length} ${workoutLogs.length === 1 ? "exercise" : "exercises"} so far`}
              </span>
            </div>
            {/* Ending is irreversible — the session is deleted and can't be
                reopened — so it asks once rather than firing on a stray click. */}
            {confirmingEnd ? (
              <div className="end-workout-actions">
                <Button size="large" onClick={endWorkout}>
                  End workout
                </Button>
                <Button size="large" variant="secondary" onClick={() => setConfirmingEnd(false)}>
                  Keep going
                </Button>
              </div>
            ) : (
              <Button size="large" onClick={() => setConfirmingEnd(true)}>
                End workout
              </Button>
            )}
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
