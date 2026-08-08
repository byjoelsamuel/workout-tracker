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

const STEPS = [
  {
    id: "log",
    selector: "[data-guide='log-form']",
    title: "Step 1",
    body: "Choose the muscle group and exercise, then enter your sets, reps and weight.",
    place: "below",
    noteSide: "right",
    tipAt: 0.4,
    bend: 46,
  },
  {
    id: "map",
    selector: "[data-guide='body-map']",
    title: "Step 2",
    body: "That group fills in here — the more you train it, the deeper the orange.",
    place: "above",
    noteSide: "left",
    tipAt: 0.5,
    bend: 46,
  },
];

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// Everything the arrow and its label need, derived together so the curve
// always lands on the note it belongs to — including after clamping.
function geometry(rect, step, vw, vh) {
  const above = step.place === "above";
  const tip = {
    x: rect.left + rect.width * step.tipAt,
    y: above ? rect.top - 10 : rect.bottom + 10,
  };

  const preferred =
    step.noteSide === "left" ? rect.left - NOTE_WIDTH - 30 : rect.right + 30;
  const left = clamp(preferred, EDGE, vw - NOTE_WIDTH - EDGE);

  return {
    above,
    tip,
    tail: { x: left + NOTE_WIDTH / 2, y: above ? tip.y - 24 : tip.y + 24 },
    // Anchored by whichever edge faces the target, so the note never needs
    // measuring to be placed.
    note: above
      ? { left, bottom: vh - (tip.y - 32) }
      : { left, top: tip.y + 32 },
  };
}

// Bows the curve perpendicular to its own direction, so it reads as drawn
// by hand whether the arrow runs sideways or straight down.
function curvePath(tail, tip, bend) {
  const dx = tip.x - tail.x;
  const dy = tip.y - tail.y;
  const length = Math.hypot(dx, dy) || 1;
  const cx = (tail.x + tip.x) / 2 + (-dy / length) * bend;
  const cy = (tail.y + tip.y) / 2 + (dx / length) * bend;
  return `M ${tail.x} ${tail.y} Q ${cx} ${cy} ${tip.x} ${tip.y}`;
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
            {steps.map((step, i) => {
              const { tip, tail, above } = step;
              const headY = above ? tip.y - 11 : tip.y + 11;
              return (
                <g key={step.id}>
                  <motion.path
                    className="guide-arrow"
                    d={curvePath(tail, tip, step.bend)}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ ...drawTransition, delay: 0.2 + i * 0.4 }}
                  />
                  {/* Head appears only once its line has arrived. */}
                  <motion.path
                    className="guide-arrow"
                    d={`M ${tip.x - 7} ${headY} L ${tip.x} ${tip.y} L ${tip.x + 7} ${headY}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: 0.2 + i * 0.4 + 0.6 }}
                  />
                </g>
              );
            })}
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
