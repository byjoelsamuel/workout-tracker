// Naru: a workout planner in the corner, not a chatbot.
//
// It used to open onto a greeting and ask two questions before showing you
// anything — which is a lot of ceremony for a screen you are looking at
// mid-workout with a barbell waiting. Opening straight onto today's plan says
// the same thing in one step, and the explanation line underneath does the job
// the conversation was pretending to do.
//
// Deliberately quiet on animation: it opens and closes, and that is all. This
// sits over the log form, so anything moving here competes with the thing you
// actually came to the page to do.
import { useMemo, useState } from "react";
import { Button } from "./primitives.jsx";
import { useExerciseLog, useUnit } from "../hooks/useStore.js";
import { explainPlan, planWorkout } from "../lib/coach.js";
import { formatWeight } from "../lib/units.js";

export function Coach({ userId, onDismiss }) {
  // Read here rather than in Layout so nothing is scanned on the routes that
  // never show a planner. The plan deliberately does not follow live logging:
  // it is a list you are working through, and one that reshuffled under you as
  // you logged each set would be unusable.
  const { logs } = useExerciseLog(userId);
  const [unit] = useUnit();
  const [open, setOpen] = useState(false);
  // Bumping this reseeds the generator. Kept in state rather than regenerating
  // on every render so the plan holds still while you work through it.
  const [nonce, setNonce] = useState(0);
  const plan = useMemo(() => planWorkout(logs, { nonce }), [logs, nonce]);

  return (
    <>
      <button
        className="coach-launcher"
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? "Close Naru" : "Open Naru, your workout planner"}
      >
        {open ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          /* A dumbbell: short outer plates, tall inner plates, bar between.
              The icon before this drew two verticals joined by a crossbar,
             then a stem with a dot over it — an H and an i. It read as "Hi". */
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8.5 8v8M4.5 10v4M15.5 8v8M19.5 10v4M8.5 12h7" />
          </svg>
        )}
      </button>

      {open && (
        <div className="coach-panel" role="dialog" aria-label="Naru workout planner">
          {/* Name on its own line, then one secondary row carrying the
              subtitle and the numbers. Side by side, the numbers aligned with
              "Naru" and left the subtitle with empty space beside it. */}
          <div className="coach-header">
            <strong>Naru</strong>
            <div className="coach-subhead">
              <span>Today · full body</span>
              <span className="coach-meta">
                ~{plan.minutes} min · {plan.totalSets} sets
              </span>
            </div>
          </div>

          <div className="coach-body">
            <p className="coach-why">{explainPlan(plan)}</p>

            <ol className="coach-plan">
              {plan.exercises.map((ex) => (
                <li key={ex.name}>
                  <span className="coach-pattern">{ex.patternLabel}</span>
                  <span className="coach-move">
                    <span className="coach-name">{ex.name}</span>
                    <span className="coach-scheme">
                      {ex.sets} × {ex.detail}
                      {/* Stored in kg; shown in whatever the user is reading in. */}
                      {ex.load && <> · {formatWeight(ex.load.kg, unit)}</>}
                    </span>
                  </span>
                </li>
              ))}
            </ol>

            <p className="coach-note">A starting point — log what you actually do.</p>
          </div>

          <div className="coach-actions">
            <Button size="small" variant="secondary" onClick={() => setNonce((n) => n + 1)}>
              New plan
            </Button>
            <button type="button" className="coach-hide" onClick={onDismiss}>
              Hide Naru
            </button>
          </div>
        </div>
      )}
    </>
  );
}
