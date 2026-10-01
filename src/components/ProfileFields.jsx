// Bodyweight, height and age — the optional half of a profile — in whichever
// unit is being shown. Used by onboarding and settings, so both ask the same
// way and validate through lib/profile.js.
import { Field } from "./primitives.jsx";

export function BodyFields({ draft, onField, unit, errors = {}, autoFocus = false }) {
  const number = (field) => ({
    type: "number",
    inputMode: "decimal",
    value: draft[field],
    onChange: (event) => onField(field, event.target.value),
  });

  return (
    <div className="body-fields">
      <Field label="Bodyweight" error={errors.bodyweight}>
        {(props) => (
          <div className="input-affix">
            <input {...props} {...number("bodyweight")} step="0.1" data-autofocus={autoFocus ? "" : undefined} placeholder={unit === "kg" ? "75" : "165"} />
            <span className="affix">{unit}</span>
          </div>
        )}
      </Field>

      <Field label="Height" error={errors.height}>
        {(props) =>
          unit === "kg" ? (
            <div className="input-affix">
              <input {...props} {...number("heightCm")} placeholder="178" />
              <span className="affix">cm</span>
            </div>
          ) : (
            <div className="split-inputs">
              <div className="input-affix">
                <input {...props} {...number("heightFt")} inputMode="numeric" placeholder="5" />
                <span className="affix">ft</span>
              </div>
              <div className="input-affix">
                <input
                  {...number("heightIn")}
                  inputMode="numeric"
                  aria-label="Height, inches"
                  aria-invalid={props["aria-invalid"]}
                  placeholder="10"
                />
                <span className="affix">in</span>
              </div>
            </div>
          )
        }
      </Field>

      <Field label="Age" error={errors.age}>
        {(props) => <input {...props} {...number("age")} inputMode="numeric" placeholder="20" />}
      </Field>
    </div>
  );
}
