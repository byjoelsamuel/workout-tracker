// Logging an exercise: pick the movement, then fill in its sets.
//
// The form adapts to the movement rather than the other way round — a plank
// asks for seconds, nothing bodyweight asks for a load — using the flags each
// entry carries in lib/exercises.js.
//
// The selection lives in the dashboard, not here, because three things can make
// it: this picker, a tap on the body map, and Naru's "Log" buttons.
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "./primitives.jsx";
import { ExercisePicker } from "./ExercisePicker.jsx";
import { SetBuilder, newSet } from "./SetBuilder.jsx";
import { findExercise } from "../lib/exercises.js";
import { GROUP_LABELS } from "../lib/bodyGroups.js";
import { bestByMovement, lastTimeFor } from "../lib/records.js";
import { relativeDay } from "../lib/time.js";
import { describeReps, formatWeight, fromKg, toKg, topWeight } from "../lib/units.js";

// What you did last time, as editable rows in the unit on screen — the same
// conversion the history editor uses. Fresh ids, because these are new sets
// that happen to start from old numbers, not the old sets themselves.
function setsFrom(log, unit) {
  return log.sets.map((set) => ({
    id: crypto.randomUUID(),
    reps: set.reps == null ? "" : String(set.reps),
    weight: set.weight == null ? "" : String(Math.round(fromKg(set.weight, unit) * 10) / 10),
  }));
}

export function LogForm({ selected, onSelect, onLog, recents, logs, unit, onUnitChange, group, onGroupChange }) {
  const exercise = selected ? findExercise(selected.bodyGroup, selected.name) : null;
  const timed = Boolean(exercise?.timed);
  const bodyweight = Boolean(exercise?.bodyweight);
  const last = useMemo(() => lastTimeFor(logs, selected?.name), [logs, selected?.name]);
  const best = useMemo(() => (selected ? bestByMovement(logs).get(selected.name) : null), [logs, selected]);
  const [sets, setSets] = useState(() => [newSet()]);
  const [error, setError] = useState("");

  // A new movement starts from its own last session when there is one — the
  // way Strong and Hevy show "previous" — and from a single blank set when
  // there isn't. Never from the previous movement's numbers: carrying them
  // over would quietly attribute a bench press load to a set of curls.
  //
  // Keyed on the name only, so logging (which changes `last`) doesn't reset
  // what's on screen; the submit handler sets the next rows itself.
  useEffect(() => {
    if (!selected) return;
    setSets(last ? setsFrom(last, unit) : [newSet(undefined, { timed })]);
    setError("");
  }, [selected?.bodyGroup, selected?.name]);

  function handleSubmit(event) {
    event.preventDefault();

    if (sets.some((set) => !Number(set.reps) || Number(set.reps) < 1)) {
      setError(timed ? "Every set needs a hold time of at least a second." : "Every set needs at least one rep.");
      return;
    }
    if (sets.some((set) => set.weight !== "" && Number(set.weight) < 0)) {
      setError("Weight can't be negative.");
      return;
    }

    onLog({
      bodyGroup: selected.bodyGroup,
      exerciseName: selected.name,
      timed,
      bodyweight,
      sets: sets.map((set) => ({
        reps: Number(set.reps),
        // Bodyweight movements carry no load; storing 0 would imply one, and
        // so would a typed 0 — it used to surface as a "0 kg" personal best.
        // Everything else is normalised to kg on the way into storage.
        weight: bodyweight || !Number(set.weight) ? null : toKg(set.weight, unit),
      })),
    });

    // Keep the movement selected, with the rows just logged still in place —
    // logging set by set, between sets, means doing the same thing again in
    // two minutes. "Change" is one tap when you move on.
    setSets(sets.map((set) => ({ ...set, id: crypto.randomUUID() })));
    setError("");
  }

  return (
    <div className="log-form">
      <AnimatePresence mode="wait" initial={false}>
        {!selected ? (
          <motion.div
            key="picker"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6, transition: { duration: 0.12, ease: "easeIn" } }}
          >
            <ExercisePicker
              recents={recents}
              value={selected}
              onChange={onSelect}
              group={group}
              onGroupChange={onGroupChange}
            />
          </motion.div>
        ) : (
          // Only the entry is a form. The picker sits outside it, so Enter in
          // an empty search box can't submit a log. noValidate so every
          // problem surfaces through the same styled message.
          <motion.form
            key={`entry-${selected.name}`}
            className="form log-entry"
            onSubmit={handleSubmit}
            noValidate
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6, transition: { duration: 0.12, ease: "easeIn" } }}
          >
            <div className="selected-exercise">
              <span className="selected-text">
                <span className="picker-label">
                  Logging · {GROUP_LABELS[selected.bodyGroup] ?? selected.bodyGroup}
                </span>
                <strong>{selected.name}</strong>
              </span>
              <button type="button" className="row-action" onClick={() => onSelect(null)}>
                Change
              </button>
            </div>

            {/* Pre-filled from here: the sets below start as last time's. */}
            {(last || best) && (
              <p className="field-note history-hint">
                {last && (
                  <>
                    Last time ({relativeDay(last.loggedAt)}): {describeReps(last)}
                    {topWeight(last) != null && ` · ${formatWeight(topWeight(last), unit)}`}
                  </>
                )}
                {last && best && " · "}
                {best && <>Best {formatWeight(best.weight, unit)}</>}
              </p>
            )}

            <SetBuilder
              sets={sets}
              onChange={setSets}
              timed={timed}
              bodyweight={bodyweight}
              unit={unit}
              onUnitChange={onUnitChange}
            />

            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" block>
              Add {sets.length} {sets.length === 1 ? "set" : "sets"}
            </Button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
