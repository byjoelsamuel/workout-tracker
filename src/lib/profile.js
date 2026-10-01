// The optional body details on a profile: how they're entered, checked and
// stored. Shared by onboarding and settings, so the two forms can't disagree
// about what's a valid height.
//
// Stored like weights are: one unit, always — kilograms and centimetres — with
// pounds and feet existing only at the edges. Switching units later converts
// what's shown and never rewrites the profile.
import { fromKg, toKg } from "./units.js";

const CM_PER_INCH = 2.54;

// Generous ranges — these exist to catch a typo (780 for 78), not to police
// anyone's body.
const LIMITS = {
  kg: [25, 350],
  lb: [55, 770],
  cm: [100, 250],
  ft: [3, 8],
  in: [0, 11.9],
  age: [10, 110],
};

function inRange(value, [min, max]) {
  const n = Number(value);
  return value !== "" && Number.isFinite(n) && n >= min && n <= max;
}

const round1 = (n) => Math.round(n * 10) / 10;

// Strings for the form, in the unit being shown.
export function toProfileDraft(user, unit) {
  const draft = {
    name: user?.name ?? "",
    bodyweight: user?.bodyweight == null ? "" : String(round1(fromKg(user.bodyweight, unit))),
    heightCm: user?.height == null ? "" : String(user.height),
    heightFt: "",
    heightIn: "",
    age: user?.age == null ? "" : String(user.age),
  };
  if (user?.height != null) {
    const inches = user.height / CM_PER_INCH;
    let ft = Math.floor(inches / 12);
    let inch = Math.round(inches - ft * 12);
    if (inch === 12) {
      ft += 1;
      inch = 0;
    }
    draft.heightFt = String(ft);
    draft.heightIn = String(inch);
  }
  return draft;
}

// Field → message, empty when the draft is fine. Every field but the name is
// optional, so blank always passes.
export function validateProfile(draft, unit, { requireName = true } = {}) {
  const errors = {};
  if (requireName && !draft.name.trim()) errors.name = "Add a name so you can find this profile later.";
  const weight = LIMITS[unit];
  if (draft.bodyweight !== "" && !inRange(draft.bodyweight, weight)) {
    errors.bodyweight = `Enter a weight between ${weight[0]} and ${weight[1]} ${unit}.`;
  }
  if (unit === "kg") {
    if (draft.heightCm !== "" && !inRange(draft.heightCm, LIMITS.cm)) errors.height = "Enter a height between 100 and 250 cm.";
  } else if (draft.heightFt !== "" || draft.heightIn !== "") {
    if (!inRange(draft.heightFt, LIMITS.ft) || (draft.heightIn !== "" && !inRange(draft.heightIn, LIMITS.in))) {
      errors.height = "Enter feet (3–8) and inches (0–11).";
    }
  }
  if (draft.age !== "" && !inRange(draft.age, LIMITS.age)) errors.age = "Enter an age between 10 and 110.";
  return errors;
}

// The draft as a profile patch in storage units. Blank fields become null —
// "not given", which is different from zero.
export function fromProfileDraft(draft, unit) {
  let height = null;
  if (unit === "kg" && draft.heightCm !== "") height = round1(Number(draft.heightCm));
  if (unit === "lb" && draft.heightFt !== "") {
    height = round1((Number(draft.heightFt) * 12 + Number(draft.heightIn || 0)) * CM_PER_INCH);
  }
  return {
    name: draft.name.trim(),
    bodyweight: draft.bodyweight === "" ? null : round1(toKg(draft.bodyweight, unit)),
    height,
    age: draft.age === "" ? null : Math.round(Number(draft.age)),
  };
}
