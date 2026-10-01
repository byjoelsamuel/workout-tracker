// The week's goal meter — the dashboard's answer to "am I on track?".
//
// Workouts are derived, not stored: ending a session deletes it (see
// endWorkout), so this counts distinct sessions inside the current Monday-to-
// Sunday week. lib/time.js carries the reasoning for a calendar week rather
// than the rolling seven days the compare page uses.
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { NumberStepper } from "./NumberStepper.jsx";
import { Burst } from "./Burst.jsx";
import { Button, Card, CountUp } from "./primitives.jsx";
import { MAX_WEEKLY_GOAL, MIN_WEEKLY_GOAL } from "../lib/store.js";
import { drawTransition } from "../lib/motionVariants.js";
import { weeklyProgress } from "../lib/time.js";

// pathLength rather than a dash offset, and a tween rather than a spring: a
// spring overshoots, and a ring that swings past a closed circle before
// settling reads as broken rather than lively.
function GoalRing({ progress }) {
  const reduced = useReducedMotion();
  return (
    <svg className="goal-ring" viewBox="0 0 80 80" aria-hidden="true">
      <circle className="goal-ring-track" cx="40" cy="40" r="34" />
      <motion.circle
        className="goal-ring-arc"
        cx="40"
        cy="40"
        r="34"
        initial={{ pathLength: reduced ? progress : 0 }}
        animate={{ pathLength: progress }}
        transition={reduced ? { duration: 0 } : drawTransition}
      />
    </svg>
  );
}

export function WeeklyGoal({ logs, goal, onGoalChange, onMet }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(goal));
  const [celebrate, setCelebrate] = useState(0);
  const { done, progress, met, streak } = useMemo(() => weeklyProgress(logs, goal), [logs, goal]);

  // Celebrate crossing the line, not being over it: only when this mount saw
  // the count go from short of the goal to on it. Opening the dashboard on a
  // week that's already done shouldn't throw confetti every time.
  const wasMet = useRef(met);
  useEffect(() => {
    if (met && !wasMet.current) {
      setCelebrate((n) => n + 1);
      onMet?.(done);
    }
    wasMet.current = met;
  }, [met, done, onMet]);

  function save() {
    const parsed = Math.round(Number(draft));
    const next = Number.isFinite(parsed) ? Math.min(MAX_WEEKLY_GOAL, Math.max(MIN_WEEKLY_GOAL, parsed)) : goal;
    // Raising or lowering the target isn't an achievement, so the ref follows
    // the new reading silently.
    wasMet.current = done >= next;
    onGoalChange(next);
    setDraft(String(next));
    setEditing(false);
  }

  function startEditing() {
    setDraft(String(goal));
    setEditing(true);
  }

  const remaining = goal - done;
  const copy =
    logs.length === 0
      ? "Log your first exercise and the week starts here."
      : met
        ? `Goal hit — ${done} ${done === 1 ? "workout" : "workouts"} this week.`
        : `${remaining} more ${remaining === 1 ? "workout" : "workouts"} to hit your goal.`;

  return (
    <Card className={`weekly-goal${met ? " met" : ""}`} data-tour="goal">
      <div className="weekly-goal-meter">
        <GoalRing progress={progress} />
        <Burst trigger={celebrate} />
        <span className="weekly-goal-count">
          <CountUp value={done} format={(n) => String(Math.round(n))} />
          <span className="weekly-goal-of">of {goal}</span>
        </span>
      </div>

      <div className="weekly-goal-body">
        <div className="weekly-goal-head">
          <h2>This week</h2>
          <button type="button" className="row-action" onClick={editing ? save : startEditing}>
            {editing ? "Save" : "Edit goal"}
          </button>
        </div>
        <p className="weekly-goal-copy">{copy}</p>
        {/* A streak of one is just "this week" and reads as filler. */}
        {streak > 1 && (
          <p className="weekly-goal-streak">
            <span aria-hidden="true">▲</span> {streak} weeks in a row
          </p>
        )}
      </div>

      {/* A plain conditional rather than AnimatePresence: this is a 40px
          control appearing, not a reveal, and it keeps the exit-must-be-a-tween
          hazard out of a card that has no other reason to meet it. The form
          is so Enter in the stepper saves, the same as pressing Save. */}
      {editing && (
        <form
          className="weekly-goal-edit"
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
        >
          <NumberStepper
            value={draft}
            onChange={setDraft}
            min={MIN_WEEKLY_GOAL}
            max={MAX_WEEKLY_GOAL}
            step={1}
            label="Workouts per week"
          />
          <Button size="small" variant="secondary" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </form>
      )}
    </Card>
  );
}
