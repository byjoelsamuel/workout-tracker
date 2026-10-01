// Naru: a workout planner, opened from the "Log an exercise" card.
//
// It used to be a floating button pinned to the corner of the screen. On a
// phone that button sat on top of the body map and the personal bests, and on
// desktop its panel opened over the log form — the one thing on the page you
// came to use. A sheet from the edge covers the page only while you're
// reading it, and you open it from right where you'd use what it says.
//
// Each planned movement has a Log button that hands it to the log form, and
// ticks itself off once it's in the session. The plan is a checklist you work
// through, not a list to copy out by hand.
//
// The plan deliberately doesn't follow live logging — one that reshuffled as
// you ticked things off would be unusable. It's re-derived from the logs when
// the sheet opens, from the same date seed, so it comes back identical.
import { useMemo, useState } from "react";
import { Dialog } from "./Dialog.jsx";
import { Button } from "./primitives.jsx";
import { explainPlan, planWorkout } from "../lib/coach.js";
import { formatWeight, roundToPlate } from "../lib/units.js";

// "New plan" survives closing the sheet and moving between pages, but not a
// reload — it's a nudge for today, not a preference. Per profile, so two people
// sharing a browser don't reroll each other's plan.
const nonces = new Map();

export function Coach({ open, onClose, userId, logs, workoutLogs, unit, onPick }) {
  const [nonce, setNonce] = useState(() => nonces.get(userId) ?? 0);
  // Frozen while the sheet is open: computed from the logs as they were when
  // it opened (see the note above), so ticking a movement off can't reshuffle.
  // `logs` is left out of the deps on purpose; `open` stands in for it.
  const plan = useMemo(() => planWorkout(logs, { nonce }), [open, nonce]);
  const done = new Set(workoutLogs.map((log) => log.exerciseName));

  function reroll() {
    const next = nonce + 1;
    nonces.set(userId, next);
    setNonce(next);
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      variant="sheet"
      title="Naru"
      description={`Today · full body · ~${plan.minutes} min · ${plan.totalSets} sets`}
      className="coach-sheet"
    >
      <div className="coach-body">
        <p className="coach-why">{explainPlan(plan)}</p>

        <ol className="coach-plan">
          {plan.exercises.map((ex) => {
            const ticked = done.has(ex.name);
            return (
              <li key={ex.name} className={ticked ? "done" : undefined}>
                <span className="coach-pattern">{ex.patternLabel}</span>
                <span className="coach-move">
                  <span className="coach-name">{ex.name}</span>
                  <span className="coach-scheme">
                    {ex.sets} × {ex.detail}
                    {/* Stored in kg; snapped to a loadable weight in the unit on screen. */}
                    {ex.load && <> · {formatWeight(roundToPlate(ex.load.kg, unit), unit)}</>}
                  </span>
                </span>
                {ticked ? (
                  <span className="coach-done">✓ Done</span>
                ) : (
                  <button
                    type="button"
                    className="row-action"
                    onClick={() => onPick({ bodyGroup: ex.bodyGroup, name: ex.name })}
                    aria-label={`Log ${ex.name}`}
                  >
                    Log
                  </button>
                )}
              </li>
            );
          })}
        </ol>

        <p className="coach-note">A starting point — log what you actually do. You can turn Naru off in Settings.</p>
      </div>

      <div className="coach-actions">
        <Button size="small" variant="secondary" onClick={reroll}>
          New plan
        </Button>
      </div>
    </Dialog>
  );
}
