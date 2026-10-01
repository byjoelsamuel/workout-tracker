// Creating a profile, one question at a time.
//
// The old version was a single form: a name, then three number boxes with
// "—" placeholders, under a "Step 1" eyebrow with no step 2. It asked for
// height and age before saying why, and skipped the two answers that actually
// change the app — how often you mean to train (the weekly goal) and which
// unit you lift in.
//
// One question per screen keeps each answer small enough to give without
// thinking, and lets each come with the sentence explaining what it's for. It
// keeps the old page's look: a centred heading and one card underneath.
// Enter always moves forward; Back never loses an answer.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Burst } from "../components/Burst.jsx";
import { BodyFields } from "../components/ProfileFields.jsx";
import { Button, Card, Field, PageHeader } from "../components/primitives.jsx";
import { createUser, getUnit, listUsers, setLastUserId, setUnit, DEFAULT_WEEKLY_GOAL } from "../lib/store.js";
import { pageVariants, stepVariants } from "../lib/motionVariants.js";
import { fromProfileDraft, validateProfile } from "../lib/profile.js";

const STEPS = ["name", "goal", "unit", "body", "ready"];
const QUESTION_COUNT = STEPS.length - 1;
const NAME_MAX = 30;

const GOALS = [
  { n: 1, why: "One session a week is a real start — and the streak counts it." },
  { n: 2, why: "Two full-body sessions hits every muscle twice a week." },
  { n: 3, why: "Three full-body sessions is plenty for most people. It's the default for a reason." },
  { n: 4, why: "Four sessions leaves room to push one movement each time." },
  { n: 5, why: "Five a week — make sure the rest days still happen." },
  { n: 6, why: "Six sessions. Naru will keep spreading the load around." },
  { n: 7, why: "Seven a week. Ambitious — you can lower it any time." },
];

const UNIT_OPTIONS = [
  { id: "kg", title: "Kilograms", example: "100 kg on the bar" },
  { id: "lb", title: "Pounds", example: "225 lb on the bar" },
];

const QUESTIONS = {
  name: (hasProfiles) => ({
    title: hasProfiles ? "Who's joining?" : "Tell us about you",
    subhead: hasProfiles ? "Start with their name." : "First, what should we call you?",
  }),
  goal: () => ({
    title: "How often will you train?",
    subhead: "Your weekly goal, counted Monday to Sunday. You can change it any time.",
  }),
  unit: () => ({
    title: "Kilograms or pounds?",
    subhead: "How weights are shown. Switching later never changes your history.",
  }),
  body: () => ({
    title: "A few details",
    subhead: "Optional — they only show on your profile. Skip any you'd rather not share.",
  }),
  ready: (_, name) => ({
    title: `You're all set, ${name}.`,
    subhead: "Here's what we've got. Change any of it later in Settings.",
  }),
};

// A radio group drawn as boxes. Arrow keys move the choice like native radios;
// the checked box is the group's only tab stop.
function ChoiceGroup({ label, options, value, onChange, className, render }) {
  const refs = useRef([]);
  function onKeyDown(event, index) {
    // Enter on a focused box means "this one, carry on" — the same as Enter in
    // a text field on the other steps. A type="button" would otherwise swallow
    // it as a click on the option that's already chosen.
    if (event.key === "Enter") {
      event.preventDefault();
      onChange(options[index].id);
      event.currentTarget.closest("form")?.requestSubmit();
      return;
    }
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const next = (index + step + options.length) % options.length;
    onChange(options[next].id);
    refs.current[next]?.focus();
  }
  return (
    <div className={className} role="radiogroup" aria-label={label}>
      {options.map((option, index) => {
        const checked = option.id === value;
        return (
          <motion.button
            key={option.id}
            ref={(el) => (refs.current[index] = el)}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            data-autofocus={checked ? "" : undefined}
            className={`choice ${checked ? "checked" : ""}`.trim()}
            onClick={() => onChange(option.id)}
            onKeyDown={(event) => onKeyDown(event, index)}
            whileTap={{ scale: 0.95 }}
          >
            {render(option)}
          </motion.button>
        );
      })}
    </div>
  );
}

export function Onboarding() {
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const existing = useMemo(() => listUsers(), []);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [errors, setErrors] = useState({});
  const [celebrate, setCelebrate] = useState(0);
  const [form, setForm] = useState(() => ({
    name: "",
    weeklyGoal: DEFAULT_WEEKLY_GOAL,
    unit: getUnit(),
    bodyweight: "",
    heightCm: "",
    heightFt: "",
    heightIn: "",
    age: "",
  }));

  const id = STEPS[step];
  const set = (field) => (value) => setForm((f) => ({ ...f, [field]: value }));
  const name = form.name.trim();
  const duplicate = name && existing.some((u) => u.name.trim().toLowerCase() === name.toLowerCase());
  const question = QUESTIONS[id](existing.length > 0, name);

  // Each step hands focus to its own field (or checked choice), so keyboard
  // users land in the question rather than back at the top of the page.
  //
  // From a ref callback, not an effect on `id`: with mode="wait" the new step
  // mounts only after the old one has finished leaving, so an effect would run
  // while the outgoing step is still the one in the DOM — and focus an element
  // that's about to be removed.
  const focusStep = useCallback((el) => {
    if (!el) return;
    requestAnimationFrame(() => el.querySelector("[data-autofocus]")?.focus({ preventScroll: true }));
  }, []);

  useEffect(() => {
    if (id === "ready") setCelebrate((n) => n + 1);
  }, [id]);

  function validate() {
    let next = {};
    if (id === "name" && !name) next = { name: "Add a name so you can find your profile later." };
    if (id === "body") next = validateProfile(form, form.unit, { requireName: false });
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function go(delta) {
    setDirection(delta);
    setErrors({});
    setStep((s) => Math.min(Math.max(s + delta, 0), STEPS.length - 1));
  }

  function onSubmit(event) {
    event.preventDefault();
    if (id === "ready") return finish();
    if (validate()) go(1);
  }

  // Bodyweight and height are converted to kilograms and centimetres before
  // anything is stored — the profile keeps one unit, the way logs do, so
  // switching units later never rewrites it. See lib/profile.js.
  function finish() {
    setUnit(form.unit);
    const user = createUser({ ...fromProfileDraft(form, form.unit), weeklyGoal: form.weeklyGoal });
    setLastUserId(user.id);
    navigate(`/dashboard?user=${user.id}`);
  }

  function skipBody() {
    setForm((f) => ({ ...f, bodyweight: "", heightCm: "", heightFt: "", heightIn: "", age: "" }));
    go(1);
  }

  const goal = GOALS.find((g) => g.n === form.weeklyGoal) ?? GOALS[2];
  const progress = Math.min(step + 1, QUESTION_COUNT) / QUESTION_COUNT;

  return (
    <motion.main className="page" variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <AnimatePresence mode="wait" custom={direction} initial={false}>
        <motion.div
          key={id}
          ref={focusStep}
          className="onboarding-step"
          custom={direction}
          variants={stepVariants}
          initial="enter"
          animate="center"
          exit="exit"
        >
          <PageHeader
            eyebrow={id === "ready" ? "All set" : `Step ${step + 1} of ${QUESTION_COUNT}`}
            title={question.title}
            subhead={question.subhead}
          />

          <div className="card-stack">
            <Card>
              {id !== "ready" && (
                <div
                  className="progress-track"
                  role="progressbar"
                  aria-label="Profile setup"
                  aria-valuemin={0}
                  aria-valuemax={QUESTION_COUNT}
                  aria-valuenow={step + 1}
                >
                  <motion.span
                    className="progress-fill"
                    initial={{ scaleX: Math.max(0, progress - direction / QUESTION_COUNT) }}
                    animate={{ scaleX: progress }}
                    transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 160, damping: 24 }}
                  />
                </div>
              )}

              <form className="form" onSubmit={onSubmit} noValidate>
                {id === "name" && (
                  <Field
                    label="Name"
                    error={errors.name}
                    hint={
                      duplicate
                        ? `There's already a ${name} here. That's fine — an initial helps tell you apart.`
                        : "This is how your profile shows up. You can change it later."
                    }
                  >
                    {(props) => (
                      <input
                        {...props}
                        data-autofocus
                        value={form.name}
                        maxLength={NAME_MAX}
                        autoComplete="given-name"
                        placeholder="e.g. Joel"
                        onChange={(event) => set("name")(event.target.value)}
                      />
                    )}
                  </Field>
                )}

                {id === "goal" && (
                  <>
                    <ChoiceGroup
                      label="Workouts per week"
                      className="goal-choices"
                      options={GOALS.map((g) => ({ id: g.n, ...g }))}
                      value={form.weeklyGoal}
                      onChange={set("weeklyGoal")}
                      render={(option) => <span className="choice-number">{option.n}</span>}
                    />
                    <motion.p
                      key={goal.n}
                      className="field-note choice-why"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18 }}
                    >
                      <strong>
                        {goal.n} {goal.n === 1 ? "workout" : "workouts"} a week.
                      </strong>{" "}
                      {goal.why}
                    </motion.p>
                  </>
                )}

                {id === "unit" && (
                  <ChoiceGroup
                    label="Weight unit"
                    className="unit-choices"
                    options={UNIT_OPTIONS}
                    value={form.unit}
                    onChange={set("unit")}
                    render={(option) => (
                      <>
                        <span className="choice-number">{option.id}</span>
                        <span className="choice-title">{option.title}</span>
                        <span className="choice-example">{option.example}</span>
                      </>
                    )}
                  />
                )}

                {id === "body" && (
                  <BodyFields
                    draft={form}
                    onField={(field, value) => set(field)(value)}
                    unit={form.unit}
                    errors={errors}
                    autoFocus
                  />
                )}

                {id === "ready" && (
                  <>
                    <div className="ready-badge" aria-hidden="true">
                      <Burst trigger={celebrate} count={20} />
                      <motion.span
                        className="ready-check"
                        initial={reduced ? false : { scale: 0, rotate: -40 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.05 }}
                      >
                        ✓
                      </motion.span>
                    </div>
                    <ul className="data-list">
                      <li>
                        <span>Weekly goal</span>
                        <span className="count">
                          {form.weeklyGoal} {form.weeklyGoal === 1 ? "workout" : "workouts"}
                        </span>
                      </li>
                      <li>
                        <span>Units</span>
                        <span className="count">{form.unit === "kg" ? "Kilograms" : "Pounds"}</span>
                      </li>
                      {form.bodyweight !== "" && (
                        <li>
                          <span>Bodyweight</span>
                          <span className="count">
                            {form.bodyweight} {form.unit}
                          </span>
                        </li>
                      )}
                    </ul>
                  </>
                )}

                <Button type="submit" block data-autofocus={id === "ready" ? "" : undefined}>
                  {id === "ready" ? "Start training" : "Continue"}
                </Button>

                {(step > 0 || id === "body") && (
                  <div className="step-links">
                    {step > 0 ? (
                      <button type="button" className="row-action" onClick={() => go(-1)}>
                        ← Back
                      </button>
                    ) : (
                      <span />
                    )}
                    {id === "body" && (
                      <button type="button" className="row-action" onClick={skipBody}>
                        Skip this step
                      </button>
                    )}
                  </div>
                )}
              </form>
            </Card>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.main>
  );
}
