// First-run walkthrough: curved arrows drawn onto a dimmed overlay,
// pointing at the two things a new profile needs to understand — where you
// log a session, and where that session shows up.
//
// Positions come from the live DOM rather than constants, so the arrows
// stay attached to their targets at any window size. Below ~900px there
// are no side margins left to draw into, so it falls back to a plain
// centered card instead of cramming arrows over the content.
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Button } from "./primitives.jsx";
import { drawTransition, snappy } from "../lib/motionVariants.js";

const ARROW_MIN_WIDTH = 900;

const STEPS = [
  {
    id: "log",
    selector: "[data-guide='log-form']",
    title: "Step 1",
    body: "Pick the muscle group you trained, name the exercise, and add it.",
    // Which side of the target the note and arrow sit on.
    side: "right",
  },
  {
    id: "map",
    selector: "[data-guide='body-map']",
    title: "Step 2",
    body: "That group fills in here — the more you train it, the deeper the orange.",
    side: "left",
  },
];

const NOTE_WIDTH = 210;
const NOTE_GAP = 18;

// Where the arrow lands on the target, and where its tail starts out by the
// note. Kept in one place so the path, the head, and the label can't drift.
function geometry(rect, side) {
  const pointsRight = side === "left"; // arrow travels rightward into the target
  const tip = {
    x: pointsRight ? rect.left - 10 : rect.right + 10,
    y: rect.top + Math.min(rect.height / 2, 80),
  };
  const away = pointsRight ? -1 : 1;
  return {
    pointsRight,
    tip,
    tail: { x: tip.x + away * 170, y: tip.y - 62 },
    note: {
      left: pointsRight ? tip.x - NOTE_WIDTH - NOTE_GAP : tip.x + NOTE_GAP,
      top: tip.y - 120,
    },
  };
}

export function OnboardingGuide({ onDismiss }) {
  const [targets, setTargets] = useState([]);
  const [wide, setWide] = useState(() => window.innerWidth >= ARROW_MIN_WIDTH);

  useEffect(() => {
    function read() {
      return STEPS.map((step) => {
        const el = document.querySelector(step.selector);
        return el ? { ...step, rect: el.getBoundingClientRect() } : null;
      }).filter(Boolean);
    }

    function update() {
      setWide(window.innerWidth >= ARROW_MIN_WIDTH);
      setTargets(read());
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

  const showArrows = wide && targets.length === STEPS.length;

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
            {targets.map((target, i) => {
              const { tip, tail, pointsRight } = geometry(target.rect, target.side);
              // Bow the curve away from the label so it reads as drawn by
              // hand rather than as a straight connector.
              const bend = pointsRight ? 60 : -60;
              const midX = (tail.x + tip.x) / 2;
              const midY = (tail.y + tip.y) / 2;
              const headBase = pointsRight ? tip.x - 11 : tip.x + 11;

              return (
                <g key={target.id}>
                  <motion.path
                    className="guide-arrow"
                    d={`M ${tail.x} ${tail.y} Q ${midX + bend} ${midY} ${tip.x} ${tip.y}`}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ ...drawTransition, delay: 0.2 + i * 0.4 }}
                  />
                  {/* Head appears only once its line has arrived. */}
                  <motion.path
                    className="guide-arrow"
                    d={`M ${headBase} ${tip.y - 7} L ${tip.x} ${tip.y} L ${headBase} ${tip.y + 7}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: 0.2 + i * 0.4 + 0.6 }}
                  />
                </g>
              );
            })}
          </svg>

          {targets.map((target, i) => {
            const { note } = geometry(target.rect, target.side);
            return (
              <motion.div
                key={target.id}
                className="guide-note"
                style={{ left: note.left, top: note.top, width: NOTE_WIDTH }}
                initial={{ y: 14, scale: 0.94, opacity: 0 }}
                animate={{ y: 0, scale: 1, opacity: 1 }}
                transition={{ ...snappy, delay: 0.15 + i * 0.4 }}
              >
                <strong>{target.title}</strong>
                {target.body}
              </motion.div>
            );
          })}
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
