// One row per set, so a warmup ramp can be recorded as what it was rather than
// averaged into a single dishonest line.
//
// Rows are held as strings, not numbers: an <input type="number"> reports ""
// mid-edit, and coercing that to 0 on every keystroke fights the user as they
// clear a field to retype it. Conversion happens once, on submit.
import { motion } from "motion/react";
import { UNITS, fromKg, setVolume, toKg } from "../lib/units.js";
import { listItemVariants, listVariants } from "../lib/motionVariants.js";

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
      <div className="set-head">
        <span className="set-col-n">Set</span>
        <span>{timed ? "Seconds" : "Reps"}</span>
        {!bodyweight && (
          <span className="set-col-weight">
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
          </span>
        )}
        <span className="set-col-remove" aria-hidden="true" />
      </div>

      <motion.ul className="set-list" variants={listVariants} initial="hidden" animate="show">
        {sets.map((set, i) => {
          // Preview in the entered unit, so the number shown matches the number
          // typed rather than the kilograms it will be stored as.
          const volume = !timed && set.weight ? setVolume({ reps: Number(set.reps), weight: Number(set.weight) }) : 0;
          return (
            <motion.li key={set.id} variants={listItemVariants} className="set-row">
              <span className="set-col-n">{i + 1}</span>
              <input
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                aria-label={`${timed ? "Seconds" : "Reps"} for set ${i + 1}`}
                value={set.reps}
                onChange={(event) => update(set.id, "reps", event.target.value)}
              />
              {!bodyweight && (
                <span className="set-col-weight">
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    inputMode="decimal"
                    aria-label={`Weight for set ${i + 1}`}
                    value={set.weight}
                    placeholder="—"
                    onChange={(event) => update(set.id, "weight", event.target.value)}
                  />
                  {volume > 0 && <span className="set-volume">{Math.round(volume).toLocaleString()}</span>}
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
