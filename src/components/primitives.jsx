// Small layout/interaction primitives every page composes from. Keeping
// them together in one file avoids a scatter of five-line modules.
import { useEffect, useId, useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { Link } from "react-router-dom";
import { listItemVariants, listVariants, snappy } from "../lib/motionVariants.js";

export function PageHeader({ eyebrow, title, subhead }) {
  return (
    <header className="page-header">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1>{title}</h1>
      {subhead && <p className="subhead">{subhead}</p>}
    </header>
  );
}

export function Card({ className = "", children, as: Tag = "div", ...rest }) {
  return (
    <Tag className={`card ${className}`.trim()} {...rest}>
      {children}
    </Tag>
  );
}

const press = { whileHover: { scale: 1.025, y: -1 }, whileTap: { scale: 0.96 }, transition: snappy };
const still = {};

// `to` renders a router Link, otherwise a real <button> — so the same look
// works for navigation and for form submits without faking either one.
// Defaults to type="button": a bare <button> inside a form submits it, which
// is how a "Cancel" ends up saving.
export function Button({ to, href, variant, size, block, icon, className = "", children, type = "button", ...rest }) {
  const reduced = useReducedMotion();
  const motionProps = reduced || rest.disabled ? still : press;
  const classes = [
    "button",
    variant,
    size === "large" && "large",
    size === "small" && "small",
    block && "block",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const content = (
    <>
      {icon}
      {children}
    </>
  );

  if (to || href) {
    return (
      <motion.span className={`button-motion ${block ? "block" : ""}`.trim()} {...motionProps}>
        {to ? (
          <Link to={to} className={classes} {...rest}>
            {content}
          </Link>
        ) : (
          <a href={href} className={classes} {...rest}>
            {content}
          </a>
        )}
      </motion.span>
    );
  }

  return (
    <motion.button type={type} className={classes} {...motionProps} {...rest}>
      {content}
    </motion.button>
  );
}

// Staggered list — children rise into place one after another.
export function AnimatedList({ className = "data-list", children, ...rest }) {
  return (
    <motion.ul className={className} variants={listVariants} initial="hidden" animate="show" {...rest}>
      {children}
    </motion.ul>
  );
}

export function AnimatedListItem({ children, ...rest }) {
  return (
    <motion.li variants={listItemVariants} {...rest}>
      {children}
    </motion.li>
  );
}

// Counts from where it was to where it now is, rather than snapping.
//
// `format` runs inside the transform on every intermediate frame, and owns the
// rounding — which is what lets the session panel convert to the display unit
// and round once, in that order, rather than rounding kilograms and then
// converting a number that has already lost its fraction.
//
// `from` lets a number count up from zero on first paint (the summary's hero
// figure); left out, it starts where it is so a re-render never replays.
export function CountUp({ value, from, format = (n) => Math.round(n).toLocaleString() }) {
  const reduced = useReducedMotion();
  const target = useMotionValue(from ?? value);
  const eased = useSpring(target, { stiffness: 90, damping: 22, mass: 0.6 });
  const shown = useTransform(reduced ? target : eased, (n) => format(Math.max(n, 0)));

  useEffect(() => {
    target.set(value);
  }, [value, target]);

  return <motion.span className="num">{shown}</motion.span>;
}

// Single choice from a short list. A radio group rather than a row of
// aria-pressed toggles: one of them is always the answer, and screen readers
// announce "1 of 2" only for radios. Arrow keys move the choice, the way a
// native radio group does, with one tab stop for the whole control.
//
// The highlight is one element that travels between options via layoutId,
// namespaced per instance so two controls on a page don't trade thumbs.
export function Segmented({ options, value, onChange, label, size, className = "" }) {
  const id = useId();
  const reduced = useReducedMotion();
  const refs = useRef([]);

  function onKeyDown(event, index) {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const next = (index + step + options.length) % options.length;
    onChange(options[next].id);
    refs.current[next]?.focus();
  }

  return (
    <div
      className={`segmented ${size === "small" ? "small" : ""} ${className}`.trim()}
      role="radiogroup"
      aria-label={label}
    >
      {options.map((option, index) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            ref={(el) => (refs.current[index] = el)}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(option.id)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            {active && (
              <motion.span
                className="segmented-thumb"
                layoutId={`${id}-thumb`}
                transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function Switch({ checked, onChange, label, ...rest }) {
  const reduced = useReducedMotion();
  return (
    <button
      type="button"
      role="switch"
      className="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      {...rest}
    >
      <motion.span
        className="switch-thumb"
        layout
        transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 600, damping: 40 }}
      />
    </button>
  );
}

// Label, control, hint and error wired together, so every input gets the same
// aria-describedby/aria-invalid plumbing instead of each form remembering it.
// `children` is a render function handed the props the control must spread.
export function Field({ label, hint, error, children, className = "" }) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={`field ${className}`.trim()}>
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      {children({ id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined })}
      {error ? (
        <motion.p
          className="form-error"
          id={errorId}
          role="alert"
          initial={{ x: -6 }}
          animate={{ x: [6, -4, 2, 0] }}
          transition={{ duration: 0.32 }}
        >
          {error}
        </motion.p>
      ) : (
        hint && (
          <p className="field-note" id={hintId}>
            {hint}
          </p>
        )
      )}
    </div>
  );
}
