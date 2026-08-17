// Logging an exercise: pick the movement, then fill in its sets.
//
// The form adapts to the movement rather than the other way round — a plank
// asks for seconds, nothing bodyweight asks for a load — using the flags each
// entry carries in lib/exercises.js.
import { useEffect, useState } from "react";
import { Button } from "./primitives.jsx";
import { ExercisePicker } from "./ExercisePicker.jsx";
import { SetBuilder, newSet } from "./SetBuilder.jsx";
import { findExercise } from "../lib/exercises.js";
import { toKg } from "../lib/units.js";

export function LogForm({ onLog, recents, unit, onUnitChange }) {
  const [selected, setSelected] = useState(null);
  const [sets, setSets] = useState(() => [newSet()]);
  const [error, setError] = useState("");

  const exercise = selected ? findExercise(selected.bodyGroup, selected.name) : null;
  const timed = Boolean(exercise?.timed);
  const bodyweight = Boolean(exercise?.bodyweight);

  // A fresh movement starts from a single blank set. Carrying the previous
  // movement's weights over would quietly attribute a bench press load to a
  // set of curls.
  useEffect(() => {
    if (selected) {
      setSets([newSet()]);
      setError("");
    }
  }, [selected?.bodyGroup, selected?.name]);

  function handleSubmit(event) {
    event.preventDefault();

    if (!selected) {
      setError("Pick an exercise first.");
      return;
    }
    if (sets.some((set) => !Number(set.reps) || Number(set.reps) < 1)) {
      setError(timed ? "Every set needs a hold time." : "Every set needs at least one rep.");
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
        // Bodyweight movements carry no load; storing 0 would imply one.
        // Everything else is normalised to kg on the way into storage.
        weight: bodyweight || !set.weight ? null : toKg(set.weight, unit),
      })),
    });

    // Keep the movement selected — logging two entries of the same lift back to
    // back is common, and re-picking it every time is the friction this form
    // exists to remove.
    setSets([newSet()]);
    setError("");
  }

  return (
    // noValidate so every problem surfaces through the same styled message.
    // Left to the browser, `min` would catch a zero with a native tooltip
    // while an empty field fell through to the in-app error.
    <form className="form" onSubmit={handleSubmit} noValidate>
      <ExercisePicker recents={recents} value={selected} onChange={setSelected} />

      {selected && (
        <>
          <div className="selected-exercise">
            <span className="picker-label">Logging</span>
            <strong>{selected.name}</strong>
          </div>

          <SetBuilder
            sets={sets}
            onChange={setSets}
            timed={timed}
            bodyweight={bodyweight}
            unit={unit}
            onUnitChange={onUnitChange}
          />
        </>
      )}

      {error && <p className="form-error">{error}</p>}

      <Button type="submit" block disabled={!selected}>
        {selected ? `Add ${sets.length} ${sets.length === 1 ? "set" : "sets"}` : "Pick an exercise"}
      </Button>
    </form>
  );
}
