// How much, and which meal. The numbers update as the amount changes, so
// there's no guessing what "150 g" comes to.
//
// A food added by hand has no per-100 g values to scale, so it asks for the
// portion's calories (and protein, optionally) directly instead.
import { useState } from "react";
import { Button, Field, Segmented } from "./primitives.jsx";
import { NumberStepper } from "./NumberStepper.jsx";
import { MEALS, mealForTime, nutritionFor } from "../lib/food.js";

const fmt = (value) => (value == null ? "?" : value);

function Macros({ nutrition }) {
  return (
    <p className="food-macros">
      <span>Protein {fmt(nutrition.protein)} g</span>
      <span>Carbs {fmt(nutrition.carbs)} g</span>
      <span>Fat {fmt(nutrition.fat)} g</span>
    </p>
  );
}

export function FoodPortion({ food, onAdd, onBack }) {
  const manual = food.source === "manual";
  const [grams, setGrams] = useState(String(food.serving?.grams ?? 100));
  const [meal, setMeal] = useState(mealForTime);
  const [name, setName] = useState(food.name ?? "");
  const [kcal, setKcal] = useState("");
  const [protein, setProtein] = useState("");
  const [error, setError] = useState("");

  const nutrition = manual
    ? { kcal: Number(kcal) || 0, protein: protein === "" ? null : Number(protein), carbs: null, fat: null }
    : nutritionFor(food.per100, grams);

  function submit(event) {
    event.preventDefault();
    if (manual) {
      if (!name.trim()) return setError("Add a name.");
      if (!(Number(kcal) >= 0) || kcal === "") return setError("Add the calories.");
      // Stored as a 100 g "portion" of itself, so the same arithmetic works.
      onAdd({
        food: { ...food, name: name.trim(), per100: { kcal: Number(kcal), protein: nutrition.protein, carbs: null, fat: null } },
        grams: 100,
        meal,
      });
      return;
    }
    if (!(Number(grams) > 0)) return setError("Add an amount.");
    onAdd({ food, grams: Number(grams), meal });
  }

  return (
    <form className="form food-portion" onSubmit={submit} noValidate>
      {manual ? (
        <>
          <Field label="Name">
            {(props) => (
              <input {...props} data-autofocus value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
            )}
          </Field>
          <Field label="Calories">
            {(props) => (
              <input {...props} type="number" inputMode="numeric" min="0" value={kcal} onChange={(e) => setKcal(e.target.value)} />
            )}
          </Field>
          <Field label="Protein (g)">
            {(props) => (
              <input {...props} type="number" inputMode="decimal" min="0" value={protein} onChange={(e) => setProtein(e.target.value)} />
            )}
          </Field>
        </>
      ) : (
        <>
          <div className="selected-exercise">
            <strong className="selected-text">{food.name}</strong>
          </div>
          {food.brand && <p className="history-hint">{food.brand}</p>}

          <p className="picker-label">Amount (g)</p>
          <NumberStepper value={grams} onChange={setGrams} step={10} min={0} max={5000} label="grams" />
          <div className="chip-row">
            {food.serving && (
              <button type="button" className="chip" onClick={() => setGrams(String(food.serving.grams))}>
                {food.serving.label === `${food.serving.grams} g` ? food.serving.label : `${food.serving.label} (${food.serving.grams} g)`}
              </button>
            )}
            <button type="button" className="chip" onClick={() => setGrams("100")}>
              100 g
            </button>
          </div>
        </>
      )}

      <p className="picker-label">Meal</p>
      <Segmented options={MEALS} value={meal} onChange={setMeal} label="Meal" size="small" />

      <div className="food-portion-total">
        <span className="food-kcal num">{nutrition.kcal} kcal</span>
        {!manual && <Macros nutrition={nutrition} />}
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="dialog-actions">
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" className="go">
          Add
        </Button>
      </div>
    </form>
  );
}
