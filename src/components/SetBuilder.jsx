// One row per set, so a warmup ramp can be recorded as what it was rather than
// averaged into a single dishonest line.
//
// Rows are held as strings, not numbers: an <input type="number"> reports ""
// mid-edit, and coercing that to 0 on every keystroke fights the user as they
// clear a field to retype it. Conversion happens once, on submit.
import { AnimatePresence, motion } from "motion/react";
import { NumberStepper } from "./NumberStepper.jsx";
import { Segmented } from "./primitives.jsx";
import { PLATE_STEP, UNITS, fromKg, setVolume, toKg } from "../lib/units.js";

export function newSet(previous, { timed = false } = {}) {
  // A new set copies the one above it, because the overwhelmingly common case
  // is doing the same thing again. Starting blank would mean retyping
  // identical numbers three or four times a movement.
  return {
    id: crypto.randomUUID(),
    reps: previous?.reps ?? (timed ? "30" : "10"),
    weight: previous?.weight ?? "",
  };
}

export function SetBuilder({ sets, onChange, timed, bodyweight, unit, onUnitChange }) {
  function update(id, field, next) {
    onChange(sets.map((set) => (set.id === id ? { ...set, [field]: next } : set)));
  }

  function addSet() {
    onChange([...sets, newSet(sets[sets.length - 1], { timed })]);
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
        <span className="set-head-title">
          {sets.length} {sets.length === 1 ? "set" : "sets"}
        </span>
        {!bodyweight && (
          <Segmented
            size="small"
            label="Weight unit"
            options={UNITS}
            value={unit}
            onChange={handleUnitChange}
          />
        )}
      </div>

      <ul className="set-list">
        <AnimatePresence initial={false}>
          {sets.map((set, i) => {
            // Preview in the entered unit, so the number shown matches the
            // number typed rather than the kilograms it will be stored as.
            const volume =
              !timed && set.weight ? setVolume({ reps: Number(set.reps), weight: Number(set.weight) }) : 0;
            return (
              <motion.li
                key={set.id}
                className="set-row"
                layout="position"
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                // Inside AnimatePresence, so a tween (see motionVariants.js).
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.14, ease: "easeIn" } }}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              >
                <span className="set-col-n" aria-hidden="true">
                  {i + 1}
                </span>
                <span className="set-cell set-col-reps">
                  <span className="set-inline-label">{timed ? "Secs" : "Reps"}</span>
                  <NumberStepper
                    value={set.reps}
                    onChange={(next) => update(set.id, "reps", next)}
                    step={timed ? 5 : 1}
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
                      step={PLATE_STEP[unit] ?? 2.5}
                      min={0}
                      label={`weight for set ${i + 1}, in ${unit}`}
                      placeholder="—"
                    />
                    {volume > 0 && (
                      <span className="set-volume">
                        {Math.round(volume).toLocaleString()} {unit}
                      </span>
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
        </AnimatePresence>
      </ul>

      <button type="button" className="set-add" onClick={addSet}>
        + Add set
      </button>

      {bodyweight && <p className="field-note">Bodyweight — no load recorded.</p>}
    </div>
  );
}
