// One row per set, so a warmup ramp can be recorded as what it was rather than
// averaged into a single dishonest line.
//
// Rows are held as strings, not numbers: an <input type="number"> reports ""
// mid-edit, and coercing that to 0 on every keystroke fights the user as they
// clear a field to retype it. Conversion happens once, on submit.
import { motion } from "motion/react";
import { NumberStepper } from "./NumberStepper.jsx";
import { UNITS, fromKg, setVolume, toKg } from "../lib/units.js";
import { listItemVariants, listVariants } from "../lib/motionVariants.js";

// Plate maths, not round numbers: 2.5 kg is the smallest pair of plates on a
// bar, and 5 lb is its imperial equivalent. Reps and seconds step by one.
const WEIGHT_STEP = { kg: 2.5, lb: 5 };

export function newSet(previous) {
  // A new set copies the one above it, because the overwhelmingly common case
  // is doing the same thing again. Starting blank would mean retyping
  // identical numbers three or four times a movement.
  return {
    id: crypto.randomUUID(),
    reps: previous?.reps ?? "10",
    weight: previous?.weight ?? "",
  };
}

export function SetBuilder({ sets, onChange, timed, bodyweight, unit, onUnitChange }) {
  function update(id, field, next) {
    onChange(sets.map((set) => (set.id === id ? { ...set, [field]: next } : set)));
  }

  function addSet() {
    onChange([...sets, newSet(sets[sets.length - 1])]);
  }

  function removeSet(id) {
    onChange(sets.filter((set) => set.id !== id));
  }

  // Switching units mid-entry converts what's already typed. Leaving the
  // numbers alone would silently reinterpret 100 lb as 100 kg.
  function handleUnitChange(next) {
    if (next === unit) return;
    onChange(
      sets.map((set) =>
        set.weight
          ? { ...set, weight: String(Math.round(fromKg(toKg(set.weight, unit), next) * 10) / 10) }
          : set
      )
    );
    onUnitChange(next);
  }

  return (
    <div className={`set-builder ${bodyweight ? "no-weight" : ""}`.trim()}>
      {/* Each field carries its own inline label, so this row only has to hold
          the unit toggle rather than repeat column headings. */}
      <div className="set-head">
        <span className="set-head-title">{sets.length} {sets.length === 1 ? "set" : "sets"}</span>
        {!bodyweight && (
          <span className="unit-toggle" role="group" aria-label="Weight unit">
            {UNITS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`unit-option ${unit === option.id ? "active" : ""}`}
                aria-pressed={unit === option.id}
                onClick={() => handleUnitChange(option.id)}
              >
                {option.label}
              </button>
            ))}
          </span>
        )}
      </div>

      <motion.ul className="set-list" variants={listVariants} initial="hidden" animate="show">
        {sets.map((set, i) => {
          // Preview in the entered unit, so the number shown matches the number
          // typed rather than the kilograms it will be stored as.
          const volume = !timed && set.weight ? setVolume({ reps: Number(set.reps), weight: Number(set.weight) }) : 0;
          return (
            <motion.li key={set.id} variants={listItemVariants} className="set-row">
              <span className="set-col-n">{i + 1}</span>
              <span className="set-cell set-col-reps">
                <span className="set-inline-label">{timed ? "Secs" : "Reps"}</span>
                <NumberStepper
                  value={set.reps}
                  onChange={(next) => update(set.id, "reps", next)}
                  step={1}
                  min={1}
                  label={`${timed ? "seconds" : "reps"} for set ${i + 1}`}
                />
              </span>
              {!bodyweight && (
                <span className="set-cell set-col-weight">
                  <span className="set-inline-label">{unit}</span>
                  <NumberStepper
                    value={set.weight}
                    onChange={(next) => update(set.id, "weight", next)}
                    step={WEIGHT_STEP[unit] ?? 2.5}
                    min={0}
                    label={`weight for set ${i + 1}`}
                    placeholder="—"
                  />
                  {volume > 0 && (
                    <span className="set-volume">{Math.round(volume).toLocaleString()} {unit}</span>
                  )}
                </span>
              )}
              <button
                type="button"
                className="set-remove"
                // The last row stays: an entry with no sets isn't a workout,
                // and removing it would leave nothing to type into.
                disabled={sets.length === 1}
                aria-label={`Remove set ${i + 1}`}
                onClick={() => removeSet(set.id)}
              >
                ×
              </button>
            </motion.li>
          );
        })}
      </motion.ul>

      <button type="button" className="set-add" onClick={addSet}>
        + Add set
      </button>

      {bodyweight && <p className="field-note">Bodyweight — no load recorded.</p>}
    </div>
  );
}
