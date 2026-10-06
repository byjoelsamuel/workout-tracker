// A number field with − / + on either side.
//
// onChange gets a second argument, "step" or "type", for callers that save
// a button press at once but let typing settle first (the rest timer).
//
// The input stays directly editable on purpose. Steppers are for adjustment —
// nudging 80 to 82.5 — not for entry: reaching 100 kg from empty in 2.5 kg
// increments would be forty taps. Typing handles the big jump, the buttons
// handle the tweak.
import { motion } from "motion/react";
import { snappy } from "../lib/motionVariants.js";

const press = { whileHover: { scale: 1.08 }, whileTap: { scale: 0.88 }, transition: snappy };

export function NumberStepper({ value, onChange, onBlur, step = 1, min = 0, max = Infinity, label, placeholder }) {
  // An empty field steps from the minimum rather than from NaN, so pressing +
  // on a blank weight gives you the first increment instead of nothing.
  function nudge(direction) {
    const current = value === "" || value == null ? min : Number(value);
    if (!Number.isFinite(current)) return;
    const next = Math.min(max, Math.max(min, Math.round((current + direction * step) * 100) / 100));
    onChange(String(next), "step");
  }

  return (
    <div className="stepper">
      <motion.button
        type="button"
        className="stepper-button"
        aria-label={`Decrease ${label}`}
        onClick={() => nudge(-1)}
        {...press}
      >
        −
      </motion.button>
      <input
        type="number"
        inputMode="decimal"
        min={min}
        max={Number.isFinite(max) ? max : undefined}
        step={step}
        aria-label={label}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value, "type")}
        // Selecting on focus means typing replaces the number rather than
        // appending to it — "10" then "8" was becoming "108".
        onFocus={(event) => event.target.select()}
        onBlur={onBlur}
      />
      <motion.button
        type="button"
        className="stepper-button"
        aria-label={`Increase ${label}`}
        onClick={() => nudge(1)}
        {...press}
      >
        +
      </motion.button>
    </div>
  );
}
