// The mid-workout screen. Deliberately only three things: what you've trained,
// what you're logging, and where the session stands. The breakdown, personal
// bests and full history live on /history — they're what you read between
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
import { Mascot } from "../components/Mascot.jsx";
import { SessionPanel } from "../components/SessionPanel.jsx";
import { Tour } from "../components/Tour.jsx";
import { WeeklyGoal } from "../components/WeeklyGoal.jsx";
import { WorkoutBar } from "../components/WorkoutBar.jsx";
import { WorkoutSummary } from "../components/WorkoutSummary.jsx";
import { useToast } from "../components/Toaster.jsx";
import { PageHeader, AppWindow } from "../components/primitives.jsx";
import { useCoachEnabled, useExerciseLog, useRestSeconds, useUnit, useUser } from "../hooks/useStore.js";
import { useOnboardingGuide } from "../hooks/useOnboardingGuide.js";
import { pageVariants } from "../lib/motionVariants.js";
import { setLastUserId } from "../lib/store.js";
import { recencyHeat } from "../lib/heat.js";
import { beatsBest } from "../lib/records.js";
import { formatDuration } from "../lib/time.js";
import { describeReps, formatWeight, topWeight } from "../lib/units.js";

function tourSteps(name, withNaru) {
  return [
    {
      target: null,
      title: `Welcome, ${name}.`,
      body: "A quick tour.",
    },
    {
      target: "[data-tour='log']",
      title: "Log what you lift",
      body: "Pick an exercise, add your sets.",
    },
    {
      target: "[data-tour='map']",
      title: "Watch muscles light up",
      body: "Trained muscles light up. Tap one to train it.",
    },
    {
      target: "[data-tour='goal']",
      title: "Your weekly goal",
      body: "Workouts this week.",
    },
    withNaru && {
      target: "[data-tour='plan']",
      title: "Not sure what to do?",
      body: "Naru makes you a plan.",
    },
    {
      target: "[data-tour='search']",
      title: "Try it now",
      body: "Search for an exercise.",
      doneLabel: "Start training",
    },
  ].filter(Boolean);
}

let restId = 0;

// The logger holds two exercise panels, stacked, with one open at a time — the
// other folds down to a single line you tap to switch back. That fits a
// superset (alternate between two movements) and logging two things
// independently, and it keeps only one set of big rows on screen.
//
// `panels` is one object rather than two states because every change touches
// both halves: picking something moves the open panel as well as filling it.
const EMPTY_PANELS = { slots: [null, null], active: 0 };

// Where a newly chosen movement should land: the open panel if it's empty,
// otherwise the free one, so picking a second exercise never wipes the first.
// With both panels full it replaces the open one, the same as "Change".
function freeSlot({ slots, active }) {
  if (!slots[active]) return active;
  return !slots[1 - active] ? 1 - active : active;
}

// Pure transitions, so they can run inside a state updater.
function place(panels, exercise) {
  const target = freeSlot(panels);
  const slots = panels.slots.slice();
  slots[target] = exercise;
  return { slots, active: target };
}

function setSlot(panels, index, exercise) {
  const slots = panels.slots.slice();
  slots[index] = exercise;
  return { slots, active: index };
}

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

  const [panels, setPanels] = useState(EMPTY_PANELS);
  // The open panel's movement. The map highlight, the tour and the group
  // browser all ask "what is being logged right now", which is this.
  const selected = panels.slots[panels.active];
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

  // Browsing a muscle opens a picker, which needs an empty panel to appear in —
  // so with one exercise already open, this uses the free panel instead of
  // closing the one you're in the middle of. Leaving browse mode (no group)
  // only clears the open panel, as it always did.
  const browse = useCallback((group) => {
    setBrowseGroup(group);
    setPanels((p) => (group ? place(p, null) : setSlot(p, p.active, null)));
    if (group && GROUP_VIEW[group]) setMapView(GROUP_VIEW[group]);
  }, []);

  const onGoalMet = useCallback(
    () => toast.show({ tone: "record", title: "Weekly goal hit!" }),
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
      icon: "thumbs-up",
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
    setPanels(EMPTY_PANELS);
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
    setPanels((p) => place(p, exercise));
    setBrowseGroup(null);
    // On a phone the form can be off-screen behind the sheet; bring it back.
    requestAnimationFrame(() =>
      document.querySelector("[data-tour='log']")?.scrollIntoView({ block: "start", behavior: "smooth" })
    );
  }

  return (
    <motion.main
      className="page"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* The mascot's slot: beside the title, small, so it's there on the
          screen you open most without taking space from the logger. */}
      <div className="page-header-row">
        <PageHeader title={`${user.name}'s workout`} />
        <Mascot size="sm" />
      </div>

      <WeeklyGoal
        logs={logs}
        goal={user.weeklyGoal}
        onGoalChange={(weeklyGoal) => saveUser({ weeklyGoal })}
        onMet={onGoalMet}
      />

      <div className="dashboard-grid">
        <AppWindow title="Body map" className="map-card" data-tour="map">
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
        </AppWindow>

        <div className="dashboard-column">
          <AppWindow title="Log exercise" className="log-card" data-tour="log">
            <Burst trigger={recordBurst} count={20} />
            {/* Where Naru opens from now. The corner button it replaces sat
                over the body map and personal bests on a phone. The heading
                that used to share this row is the window's title bar now. */}
            {coachEnabled && (
              <div className="card-title-row">
                <button type="button" className="row-action" onClick={() => setNaruOpen(true)} data-tour="plan">
                  Plan with Naru
                </button>
              </div>
            )}
            {/* Both panels stay mounted so the open one's sets survive a
                switch; the closed one just renders as a single line. */}
            {panels.slots.map((slot, i) => (
              <LogForm
                key={i}
                selected={slot}
                collapsed={i !== panels.active}
                hasPartner={Boolean(panels.slots[1 - i])}
                onActivate={() => setPanels((p) => ({ ...p, active: i }))}
                onSelect={(exercise) => {
                  setPanels((p) => setSlot(p, i, exercise));
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
            ))}
          </AppWindow>

          <SessionPanel logs={workoutLogs} unit={unit} active={Boolean(workout)} />
        </div>
      </div>

      {/* A workout opens on the first entry of the session, so there's only
          something to end once the user has actually started training. */}
      {workout && (
        <WorkoutBar
          startedAt={workout.startedAt}
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
            ? `${workoutLogs.length} ${workoutLogs.length === 1 ? "exercise" : "exercises"} · ${formatDuration(
                workout.startedAt
              )}`
            : ""
        }
        confirmLabel="End workout"
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
