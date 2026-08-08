// Logging form. The exercise list is driven by the selected muscle group,
// and the fields below it adapt to the movement — a plank asks for seconds
// rather than reps, and nothing bodyweight asks for a load.
import { useEffect, useState } from "react";
import { Button } from "./primitives.jsx";
import { BODY_GROUPS } from "../lib/bodyGroups.js";
import { EXERCISES, findExercise } from "../lib/exercises.js";

const DEFAULT_GROUP = BODY_GROUPS[0].id;

export function LogForm({ onLog }) {
  const [bodyGroup, setBodyGroup] = useState(DEFAULT_GROUP);
  const [exerciseName, setExerciseName] = useState(EXERCISES[DEFAULT_GROUP][0].name);
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("10");
  const [weight, setWeight] = useState("");
  const [error, setError] = useState("");

  const options = EXERCISES[bodyGroup] || [];
  const exercise = findExercise(bodyGroup, exerciseName);
  const timed = Boolean(exercise?.timed);
  const bodyweight = Boolean(exercise?.bodyweight);

  // Switching muscle group invalidates the current exercise, so fall back
  // to the first movement in the new group.
  useEffect(() => {
    setExerciseName(EXERCISES[bodyGroup][0].name);
  }, [bodyGroup]);

  function handleSubmit(event) {
    event.preventDefault();

    if (!Number(sets) || Number(sets) < 1) {
      setError("Add at least one set.");
      return;
    }
    if (!Number(reps) || Number(reps) < 1) {
      setError(timed ? "How long did you hold it?" : "How many reps?");
      return;
    }
    if (weight && Number(weight) < 0) {
      setError("Weight can't be negative.");
      return;
    }

    onLog({
      bodyGroup,
      exerciseName,
      sets,
      reps,
      // Bodyweight movements carry no load; storing 0 would imply one.
      weight: bodyweight ? null : weight,
    });

    setError("");
    setWeight("");
  }

  return (
    // noValidate so every problem surfaces through the same styled message.
    // Left to the browser, `min` would catch a zero with a native tooltip
    // while an empty field fell through to the in-app error.
    <form className="form" onSubmit={handleSubmit} noValidate>
      <label>
        Muscle group
        <select value={bodyGroup} onChange={(e) => setBodyGroup(e.target.value)}>
          {BODY_GROUPS.map((group) => (
            <option key={group.id} value={group.id}>
              {group.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        Exercise
        <select value={exerciseName} onChange={(e) => setExerciseName(e.target.value)}>
          {options.map((option) => (
            <option key={option.name} value={option.name}>
              {option.name}
            </option>
          ))}
        </select>
      </label>

      <div className={`form-row ${bodyweight ? "two" : "three"}`}>
        <label>
          Sets
          <input
            type="number"
            min="1"
            step="1"
            value={sets}
            onChange={(e) => setSets(e.target.value)}
          />
        </label>
        <label>
          {timed ? "Seconds" : "Reps"}
          <input
            type="number"
            min="1"
            step="1"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
          />
        </label>
        {!bodyweight && (
          <label>
            Weight (kg)
            <input
              type="number"
              min="0"
              step="0.5"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="—"
            />
          </label>
        )}
      </div>

      {bodyweight && <p className="field-note">Bodyweight — no load recorded.</p>}
      {error && <p className="form-error">{error}</p>}

      <Button type="submit" block>
        Add exercise
      </Button>
    </form>
  );
}
