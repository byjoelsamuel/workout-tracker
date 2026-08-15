// First-run walkthrough: curved arrows drawn onto a dimmed overlay,
// pointing at the two things a new profile needs to understand — where you
// log a session, and where that session shows up.
//
// Notes sit above or below their target rather than beside it. The content
// column is 1000px wide, so on a 1280px screen the side margins are only
// 140px — too narrow to hold a note without it running off the edge. There
// is always vertical room.
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Button } from "./primitives.jsx";
import { drawTransition, snappy } from "../lib/motionVariants.js";

const ARROW_MIN_WIDTH = 860;
const NOTE_WIDTH = 210;
const EDGE = 14;
const HEAD_LENGTH = 12;
const HEAD_SPREAD = 0.42; // radians off the shaft, per barb
// Notes are two or three lines at a fixed width, so this only has to be a
// safe ceiling — it exists to keep a note from running off the top on a
// short viewport, not to position it precisely.
const NOTE_MAX_HEIGHT = 120;

const STEPS = [
  {
    id: "log",
    selector: "[data-guide='log-form']",
    title: "Step 1",
    body: "Choose the muscle group and exercise, then enter your sets, reps and weight.",
    place: "below",
    noteSide: "right",
    tipAt: 0.4,
  },
  {
    id: "map",
    selector: "[data-guide='body-map']",
    title: "Step 2",
    body: "That group fills in here — the more you train it, the deeper the orange.",
    place: "above",
    noteSide: "left",
    tipAt: 0.5,
  },
];

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// Everything the arrow and its label need, derived together so the curve
// always lands on the note it belongs to — including after clamping.
function geometry(rect, step, vw, vh) {
  const above = step.place === "above";
  // Close enough to sit on the target's edge. At the old 10px the tip landed
  // in the gutter between two cards and read as pointing at the wrong one.
  const tip = {
    x: rect.left + rect.width * step.tipAt,
    y: above ? rect.top - 5 : rect.bottom + 5,
  };

  const preferred =
    step.noteSide === "left" ? rect.left - NOTE_WIDTH - 30 : rect.right + 30;
  const left = clamp(preferred, EDGE, vw - NOTE_WIDTH - EDGE);

  // The edge of the note that faces the target, kept far enough inside the
  // viewport that a short window can't push the note off the top or bottom.
  const facing = above
    ? Math.max(tip.y - 32, EDGE + NOTE_MAX_HEIGHT)
    : Math.min(tip.y + 32, vh - EDGE - NOTE_MAX_HEIGHT);

  const tail = { x: left + NOTE_WIDTH / 2, y: above ? facing + 8 : facing - 8 };
  const { d, angle } = curve(tail, tip, bendFor(tail, tip));

  return {
    tip,
    path: d,
    head: arrowHead(tip, angle),
    // Anchored by whichever edge faces the target, so the note never needs
    // measuring to be placed.
    note: above ? { left, bottom: vh - facing } : { left, top: facing },
  };
}

// Bows the curve perpendicular to its own direction, so it reads as drawn
// by hand whether the arrow runs sideways or straight down.
//
// Returns the heading at the tip alongside the path. A quadratic's direction
// where it lands is `tip - control`, and taking it from the same control
// point that drew the curve is what stops the head and the line disagreeing:
// the head used to be a fixed vertical chevron, which only lined up if the
// arrow happened to arrive straight up or down. These arrows arrive almost
// horizontally, so it sat across the line like a stray tick.
function curve(tail, tip, bend) {
  const dx = tip.x - tail.x;
  const dy = tip.y - tail.y;
  const length = Math.hypot(dx, dy) || 1;
  const control = {
    x: (tail.x + tip.x) / 2 + (-dy / length) * bend,
    y: (tail.y + tip.y) / 2 + (dx / length) * bend,
  };
  return {
    d: `M ${tail.x} ${tail.y} Q ${control.x} ${control.y} ${tip.x} ${tip.y}`,
    angle: Math.atan2(tip.y - control.y, tip.x - control.x),
  };
}

// Two barbs swept back from the tip along the curve's heading.
function arrowHead(tip, angle) {
  const barb = (offset) => {
    const a = angle + offset;
    return `${tip.x - HEAD_LENGTH * Math.cos(a)} ${tip.y - HEAD_LENGTH * Math.sin(a)}`;
  };
  return `M ${barb(HEAD_SPREAD)} L ${tip.x} ${tip.y} L ${barb(-HEAD_SPREAD)}`;
}

// A long sweep wants a gentle bow; a short hop with the same fixed bend
// would loop back on itself.
function bendFor(tail, tip) {
  return clamp(Math.hypot(tip.x - tail.x, tip.y - tail.y) * 0.13, 16, 52);
}

export function OnboardingGuide({ onDismiss }) {
  const [steps, setSteps] = useState([]);
  const [wide, setWide] = useState(() => window.innerWidth >= ARROW_MIN_WIDTH);

  useEffect(() => {
    function update() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      setWide(vw >= ARROW_MIN_WIDTH);
      setSteps(
        STEPS.map((step) => {
          const el = document.querySelector(step.selector);
          if (!el) return null;
          return { ...step, ...geometry(el.getBoundingClientRect(), step, vw, vh) };
        }).filter(Boolean)
      );
    }

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update);
    };
  }, []);

  useEffect(() => {
    function onKey(event) {
      if (event.key === "Escape") onDismiss();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDismiss]);

  const showArrows = wide && steps.length === STEPS.length;

  return (
    <motion.div
      className="guide-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      onClick={onDismiss}
    >
      {showArrows ? (
        <>
          <svg className="guide-svg">
            {steps.map((step, i) => (
              <g key={step.id}>
                <motion.path
                  className="guide-arrow"
                  d={step.path}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ ...drawTransition, delay: 0.2 + i * 0.4 }}
                />
                {/* Head appears only once its line has arrived. */}
                <motion.path
                  className="guide-arrow"
                  d={step.head}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: 0.2 + i * 0.4 + 0.6 }}
                />
              </g>
            ))}
          </svg>

          {steps.map((step, i) => (
            <motion.div
              key={step.id}
              className="guide-note"
              style={{ ...step.note, width: NOTE_WIDTH }}
              initial={{ y: 14, scale: 0.94, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              transition={{ ...snappy, delay: 0.15 + i * 0.4 }}
            >
              <strong>{step.title}</strong>
              {step.body}
            </motion.div>
          ))}
        </>
      ) : (
        <motion.div
          className="guide-card"
          initial={{ y: 18, scale: 0.94, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          transition={snappy}
        >
          <h2>How this works</h2>
          {STEPS.map((step) => (
            <p key={step.id}>
              <strong>{step.title}</strong>
              {step.body}
            </p>
          ))}
        </motion.div>
      )}

      <motion.div
        className="guide-dismiss"
        initial={{ y: 16, scale: 0.94, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        transition={{ ...snappy, delay: showArrows ? 1.2 : 0.2 }}
      >
        <Button onClick={onDismiss} size="small">
          Got it
        </Button>
      </motion.div>
    </motion.div>
  );
}
