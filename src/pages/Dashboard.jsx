// The mid-workout screen. Deliberately only three things: what you've trained,
// what you're logging, and where the session stands. The breakdown, personal
// bests and full history live on /progress — they're what you read between
// workouts, not between sets.
//
// On a phone the log form comes before the body map (see .dashboard-grid in
// global.css). It used to sit under a full-height map, about a thousand pixels
// down — the one control you came to use was the one you had to scroll to.
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { BodyMap, GROUP_VIEW } from "../components/BodyMap.jsx";
import { Burst } from "../components/Burst.jsx";
import { Coach } from "../components/Coach.jsx";
import { ConfirmDialog } from "../components/Dialog.jsx";
import { HeatLegend } from "../components/HeatLegend.jsx";
import { LogForm } from "../components/LogForm.jsx";
import { SessionPanel } from "../components/SessionPanel.jsx";
import { Tour } from "../components/Tour.jsx";
import { WeeklyGoal } from "../components/WeeklyGoal.jsx";
import { WorkoutBar } from "../components/WorkoutBar.jsx";
import { WorkoutSummary } from "../components/WorkoutSummary.jsx";
import { useToast } from "../components/Toaster.jsx";
import { Card, PageHeader } from "../components/primitives.jsx";
import { useCoachEnabled, useExerciseLog, useRestSeconds, useUnit, useUser } from "../hooks/useStore.js";
import { useOnboardingGuide } from "../hooks/useOnboardingGuide.js";
import { pageVariants } from "../lib/motionVariants.js";
import { setLastUserId } from "../lib/store.js";
import { recencyHeat } from "../lib/heat.js";
import { beatsBest } from "../lib/records.js";
import { formatDuration, relativeDay } from "../lib/time.js";
import { describeReps, formatWeight, topWeight } from "../lib/units.js";

function tourSteps(name, withNaru) {
  return [
    {
      target: null,
      title: `Welcome, ${name}.`,
      body: "Here's how the dashboard works — about twenty seconds. Use the arrow keys, or skip any time.",
    },
    {
      target: "[data-tour='log']",
      title: "Log what you lift",
      body: "Search for a movement or pick a muscle group, then record each set with its own reps and weight. Your workout starts with the first one you log.",
    },
    {
      target: "[data-tour='map']",
      title: "Watch muscles light up",
      body: "Trained muscles light up, then fade over a few weeks if you leave them — so a dim muscle is one you've been skipping. Tap one to find exercises for it.",
    },
    {
      target: "[data-tour='goal']",
      title: "Your weekly goal",
      body: "Workouts this week, Monday to Sunday. The streak counts the weeks you've trained in a row.",
    },
    withNaru && {
      target: "[data-tour='plan']",
      title: "Not sure what to do?",
      body: "Naru builds a full-body session from your own history, with starting weights from your best sets. Tap Log on any movement to start it.",
    },
    {
      target: "[data-tour='search']",
      title: "Try it now",
      body: "Type a movement — “bench”, “squat”, “curl” — to log your first set.",
      doneLabel: "Start training",
    },
  ].filter(Boolean);
}

let restId = 0;

export function Dashboard() {
  const userId = useSearchParams()[0].get("user");
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const [user, saveUser] = useUser(userId);
  const { logs, recents, log, undo, workout, workoutLogs, finish } = useExerciseLog(userId);
  const guide = useOnboardingGuide(userId, logs.length, Boolean(location.state?.tour));
  const [unit, setUnit] = useUnit();
  const [restSeconds] = useRestSeconds();
  const [coachEnabled] = useCoachEnabled();

  const [selected, setSelected] = useState(null);
  const [browseGroup, setBrowseGroup] = useState(null);
  const [mapView, setMapView] = useState("anterior");
  const [pulse, setPulse] = useState(null);
  const [rest, setRest] = useState(null);
  const [naruOpen, setNaruOpen] = useState(false);
  const [confirmingEnd, setConfirmingEnd] = useState(false);
  // The workout that just ended, held only long enough to summarise it.
  const [finished, setFinished] = useState(null);
  const [recordBurst, setRecordBurst] = useState(0);

  useEffect(() => {
    if (user) setLastUserId(user.id);
  }, [user]);

  // Router state is one-shot: clear it so a reload or Back doesn't replay the
  // tour that was asked for once. Mount-only — the tour has already read it.
  const hasState = Boolean(location.state);
  useEffect(() => {
    if (hasState) navigate(location.pathname + location.search, { replace: true, state: null });
  }, [hasState, navigate, location.pathname, location.search]);

  // Recency-weighted, so the figure shows what you have been working lately
  // rather than everything you have ever done. Sits with the other hooks, above
  // the early return below — a useMemo that only runs when a profile exists
  // changes the hook count between renders.
  const heat = useMemo(() => recencyHeat(logs), [logs]);

  const browse = useCallback((group) => {
    setBrowseGroup(group);
    setSelected(null);
    if (group && GROUP_VIEW[group]) setMapView(GROUP_VIEW[group]);
  }, []);

  const onGoalMet = useCallback(
    (done) => toast.show({ tone: "record", title: "Weekly goal hit!", body: `${done} workouts this week. Nice work.` }),
    [toast]
  );

  // No profile, or one that doesn't exist in this browser — there's nothing
  // to show, so send them somewhere they can pick or make one.
  if (!user) return <Navigate to="/welcome" replace />;

  function handleLog(entry) {
    // Checked before writing, against history that doesn't yet include it.
    const record = beatsBest(logs, entry);
    const created = log(entry);

    setPulse({ group: entry.bodyGroup, key: created.id });
    restId += 1;
    setRest({ id: restId, endsAt: Date.now() + restSeconds * 1000, total: restSeconds * 1000 });

    // One toast per log, replacing the last — and a new best is the same
    // toast in a louder colour rather than a second one stacked on top.
    const reps = describeReps(created);
    toast.show({
      key: "log",
      tone: record ? "record" : "success",
      title: record ? `New best: ${entry.exerciseName}` : `Logged ${entry.exerciseName}`,
      body: record ? `${formatWeight(topWeight(created), unit)} · ${reps}` : reps ?? undefined,
      action: {
        label: "Undo",
        onClick: () => {
          undo(created.id);
          setRest(null);
        },
      },
    });
    if (record) setRecordBurst((n) => n + 1);
  }

  function endWorkout() {
    toast.clear();
    setConfirmingEnd(false);
    setRest(null);
    setSelected(null);
    setFinished(finish());
  }

  function adjustRest(delta) {
    setRest((r) => {
      if (!r) return r;
      const endsAt = Math.max(Date.now() + 5000, r.endsAt + delta * 1000);
      return { ...r, endsAt, total: Math.max(r.total, endsAt - Date.now()) };
    });
  }

  function pickFromPlan(exercise) {
    setNaruOpen(false);
    setSelected(exercise);
    setBrowseGroup(null);
    // On a phone the form can be off-screen behind the sheet; bring it back.
    requestAnimationFrame(() =>
      document.querySelector("[data-tour='log']")?.scrollIntoView({ block: "start", behavior: "smooth" })
    );
  }

  // What you actually want to know opening this screen is whether you're
  // already training and, if not, how long it's been. `logs` is newest-first.
  // No duration here: this only renders when something changes, so "· 3m"
  // stayed "3m" for the rest of the session. The pinned bar has the live clock.
  const eyebrow = workout
    ? "Workout in progress"
    : logs.length > 0
      ? `Last trained ${relativeDay(logs[0].loggedAt)}`
      : "Ready when you are";

  return (
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
        onMet={onGoalMet}
      />

      <div className="dashboard-grid">
        <Card className="map-card" data-tour="map">
          <BodyMap
            heat={heat}
            showToggle
            view={mapView}
            onViewChange={setMapView}
            onSelectGroup={(group) => {
              browse(group);
              document.querySelector("[data-tour='log']")?.scrollIntoView({ block: "start", behavior: "smooth" });
            }}
            selectedGroup={selected?.bodyGroup ?? browseGroup}
            pulse={pulse}
          />
          <HeatLegend heat={heat} onPickGroup={browse} />
        </Card>

        <div className="dashboard-column">
          <Card className="log-card" data-tour="log">
            <Burst trigger={recordBurst} count={20} />
            <div className="card-title-row">
              <h2>Log an exercise</h2>
              {/* Where Naru opens from now. The corner button it replaces sat
                  over the body map and personal bests on a phone. */}
              {coachEnabled && (
                <button type="button" className="row-action" onClick={() => setNaruOpen(true)} data-tour="plan">
                  Plan with Naru
                </button>
              )}
            </div>
            <LogForm
              selected={selected}
              onSelect={(exercise) => {
                setSelected(exercise);
                if (exercise) setBrowseGroup(null);
              }}
              onLog={handleLog}
              recents={recents}
              logs={logs}
              unit={unit}
              onUnitChange={setUnit}
              group={browseGroup}
              onGroupChange={browse}
            />
          </Card>

          <SessionPanel logs={workoutLogs} unit={unit} active={Boolean(workout)} />
        </div>
      </div>

      {/* A workout opens on the first entry of the session, so there's only
          something to end once the user has actually started training. */}
      {workout && (
        <WorkoutBar
          startedAt={workout.startedAt}
          logs={workoutLogs}
          rest={rest}
          onRestAdjust={adjustRest}
          onRestSkip={() => setRest(null)}
          onEnd={() => setConfirmingEnd(true)}
        />
      )}

      {/* Ending is irreversible — the session record is deleted and can't be
          reopened — so it asks once, with the consequence spelled out. */}
      <ConfirmDialog
        open={confirmingEnd}
        title="End this workout?"
        body={
          workout
            ? `${workoutLogs.length} ${workoutLogs.length === 1 ? "exercise" : "exercises"} over ${formatDuration(
                workout.startedAt
              )}. Once it's ended it can't be reopened — your sets stay in your history.`
            : ""
        }
        confirmLabel="End & see summary"
        cancelLabel="Keep going"
        onConfirm={endWorkout}
        onCancel={() => setConfirmingEnd(false)}
      />

      <WorkoutSummary workout={finished} allLogs={logs} unit={unit} onClose={() => setFinished(null)} />

      {coachEnabled && (
        <Coach
          open={naruOpen}
          onClose={() => setNaruOpen(false)}
          userId={user.id}
          logs={logs}
          workoutLogs={workoutLogs}
          unit={unit}
          onPick={pickFromPlan}
        />
      )}

      {guide.visible && (
        <Tour
          steps={tourSteps(user.name, coachEnabled)}
          onClose={guide.dismiss}
          onFinish={() => document.querySelector("[data-tour='search'] input")?.focus()}
        />
      )}
    </motion.main>
  );
}
