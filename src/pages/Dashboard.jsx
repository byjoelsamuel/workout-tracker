// The mid-workout screen. Deliberately only three things: what you've trained,
// what you're logging, and where the session stands. The breakdown, personal
// bests and full history live on /progress — they're what you read between
// workouts, not between sets.
import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Navigate, useSearchParams } from "react-router-dom";
import { BodyMap } from "../components/BodyMap.jsx";
import { HeatLegend } from "../components/HeatLegend.jsx";
import { LogForm } from "../components/LogForm.jsx";
import { OnboardingGuide } from "../components/OnboardingGuide.jsx";
import { SessionPanel } from "../components/SessionPanel.jsx";
import { WeeklyGoal } from "../components/WeeklyGoal.jsx";
import { WorkoutSummary } from "../components/WorkoutSummary.jsx";
import { Button, Card, PageHeader, StatRow } from "../components/primitives.jsx";
import { useExerciseLog, useUnit, useUser } from "../hooks/useStore.js";
import { useOnboardingGuide } from "../hooks/useOnboardingGuide.js";
import { onGuideReplay } from "../lib/guideBus.js";
import { pageVariants } from "../lib/motionVariants.js";
import { setLastUserId } from "../lib/store.js";
import { recencyHeat } from "../lib/heat.js";
import { relativeDay } from "../lib/time.js";

export function Dashboard() {
  const userId = useSearchParams()[0].get("user");
  const [user, saveUser] = useUser(userId);
  const { logs, recents, log, workout, workoutLogs, finish } = useExerciseLog(userId);
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

  // Recency-weighted, so the figure shows what you have been working lately
  // rather than everything you have ever done. Sits with the other hooks, above
  // the early return below — a useMemo that only runs when a profile exists
  // changes the hook count between renders.
  const heat = useMemo(() => recencyHeat(logs), [logs]);

  // No profile, or one that doesn't exist in this browser — there's nothing
  // to show, so send them somewhere they can pick or make one.
  if (!user) return <Navigate to="/onboarding" replace />;

  function endWorkout() {
    setFinished(finish());
    setConfirmingEnd(false);
  }

  // "N entries logged" was a lifetime tally that never changed meaningfully and
  // said nothing you'd want mid-set. What you actually want to know opening
  // this screen is whether you're already training and, if not, how long it's
  // been. `logs` is sorted newest-first by getLogsForUser.
  const eyebrow = workout
    ? "Workout in progress"
    : logs.length > 0
      ? `Last trained ${relativeDay(logs[0].loggedAt)}`
      : "Ready when you are";

  return (
    <>
      <motion.main
        className="page"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <PageHeader eyebrow={eyebrow} title={`${user.name}'s workout`} />

        <WeeklyGoal
          logs={logs}
          goal={user.weeklyGoal}
          onGoalChange={(weeklyGoal) => saveUser({ weeklyGoal })}
        />

        <div className="dashboard-grid">
          <Card className="map-card">
            <div data-guide="body-map">
              <BodyMap heat={heat} showToggle />
            </div>
            <HeatLegend heat={heat} />
            <StatRow user={user} />
          </Card>

          <div className="dashboard-column">
            <Card data-guide="log-form">
              <h2>Log an exercise</h2>
              <LogForm onLog={log} recents={recents} unit={unit} onUnitChange={setUnit} />
            </Card>

            <SessionPanel
              logs={workoutLogs}
              unit={unit}
              active={Boolean(workout)}
              startedAt={workout?.startedAt}
            />
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
