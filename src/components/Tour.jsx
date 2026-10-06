// The first-run walkthrough: a spotlight that travels from one part of the
// screen to the next, with a card explaining each.
//
// It replaces the curved-arrow overlay, which had three problems it couldn't
// grow out of: it only worked above 860px (phones got a static card of text),
// its arrows pointed at whatever happened to sit at a fixed fraction of a
// target's box (the body map arrow landed on the Front/Back toggle), and it
// showed everything at once, so there was no order to read it in.
//
// The cut-out is one element with an enormous box-shadow — the shadow dims
// the page, the element's own box is the hole. Moving and resizing that one
// element on a spring is what makes the light glide between targets instead of
// blinking from one to the next.
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "motion/react";
import { useMediaQuery } from "../hooks/useMediaQuery.js";
import { Button } from "./primitives.jsx";

const PAD = 10;
const GAP = 14;
const EDGE = 16;
// In rem, like the stylesheet, so the card grows with the rest of the interface
// on a big screen instead of squeezing larger text into a fixed 340px.
const CARD_WIDTH_REM = 21.25;
const cardWidth = () => CARD_WIDTH_REM * parseFloat(getComputedStyle(document.documentElement).fontSize);

function measure(selector) {
  if (!selector) return null;
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (!r.width && !r.height) return null;
  return { left: r.left, top: r.top, width: r.width, height: r.height };
}

// Below the target when it fits, above when it doesn't, and pinned to the
// bottom edge when the target is taller than the space either side of it.
function placeCard(rect, cardHeight, vw, vh) {
  const width = cardWidth();
  if (!rect) return { x: (vw - width) / 2, y: (vh - cardHeight) / 2 };
  const x = Math.min(Math.max(rect.left, EDGE), vw - width - EDGE);
  const below = rect.top + rect.height + PAD + GAP;
  const above = rect.top - PAD - GAP - cardHeight;
  if (below + cardHeight <= vh - EDGE) return { x, y: below };
  if (above >= EDGE) return { x, y: above };
  return { x, y: vh - cardHeight - EDGE };
}

export function Tour({ steps, onClose, onFinish }) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState(null);
  const [cardHeight, setCardHeight] = useState(200);
  const [viewport, setViewport] = useState({ vw: window.innerWidth, vh: window.innerHeight });
  const cardRef = useRef(null);
  const nextRef = useRef(null);
  const titleId = useId();
  const reduced = useReducedMotion();
  // Docked to the bottom on phones, where there's no room beside anything.
  const docked = useMediaQuery("(max-width: 600px)");

  const step = steps[index];
  const last = index === steps.length - 1;

  // Bring the target into view, then track it. Scroll and resize both move it,
  // and a smooth scroll moves it for a few hundred ms after the call returns,
  // so measuring once would leave the light where the target used to be.
  useEffect(() => {
    const el = step.target ? document.querySelector(step.target) : null;
    if (step.target && !el) {
      // A step whose target isn't on screen (Naru turned off, say) is
      // skipped rather than spotlighting nothing.
      setIndex((i) => (i < steps.length - 1 ? i + 1 : i));
      return;
    }
    el?.scrollIntoView({ block: docked ? "start" : "center", behavior: reduced ? "auto" : "smooth" });

    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setRect(measure(step.target));
        setViewport({ vw: window.innerWidth, vh: window.innerHeight });
      });
    };
    update();
    const settle = setTimeout(update, 450);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(settle);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [step.target, steps.length, docked, reduced]);

  useLayoutEffect(() => {
    if (cardRef.current) setCardHeight(cardRef.current.offsetHeight);
  }, [index, docked]);

  useEffect(() => {
    nextRef.current?.focus({ preventScroll: true });
  }, [index]);

  const finish = useCallback(() => {
    onClose();
    onFinish?.();
  }, [onClose, onFinish]);

  const next = useCallback(() => (last ? finish() : setIndex((i) => i + 1)), [last, finish]);
  const back = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  useEffect(() => {
    function onKey(event) {
      if (event.key === "Escape") onClose();
      else if (event.key === "ArrowRight") next();
      else if (event.key === "ArrowLeft") back();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, back, onClose]);

  const { vw, vh } = viewport;
  // No target: the hole closes to a point in the middle, which reads as the
  // light going out while the card speaks to the whole screen.
  const hole = rect
    ? { x: rect.left - PAD, y: rect.top - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 }
    : { x: vw / 2, y: vh / 2, width: 0, height: 0 };
  const card = docked ? null : placeCard(rect, cardHeight, vw, vh);
  const spring = reduced ? { duration: 0 } : { type: "spring", stiffness: 210, damping: 28 };

  return createPortal(
    <div className="tour" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      {/* Swallows clicks so the page can't be used half-way through a step. */}
      <div className="tour-shield" />
      <motion.div className="tour-spot" initial={false} animate={hole} transition={spring} aria-hidden="true" />

      <motion.div
        ref={cardRef}
        className={`tour-card ${docked ? "docked" : ""}`}
        style={docked ? undefined : { width: cardWidth() }}
        initial={docked ? { y: 40, opacity: 0 } : { ...card, opacity: 0, scale: 0.94 }}
        animate={docked ? { y: 0, opacity: 1 } : { ...card, opacity: 1, scale: 1 }}
        transition={spring}
      >
        {/* Keyed by step so each one enters fresh. No AnimatePresence, so no
            exit to wait on — the card itself never unmounts between steps. */}
        <motion.div
          key={index}
          className="tour-content"
          aria-live="polite"
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          <p className="tour-count">
            {index + 1} of {steps.length}
          </p>
          <h2 id={titleId}>{step.title}</h2>
          <p className="tour-body">{step.body}</p>
        </motion.div>

        <div className="tour-dots" aria-hidden="true">
          {steps.map((s, i) => (
            <motion.span
              key={s.title}
              className="tour-dot"
              animate={{ width: i === index ? 20 : 6, opacity: i <= index ? 1 : 0.35 }}
              transition={spring}
            />
          ))}
        </div>

        <div className="tour-actions">
          <button type="button" className="row-action tour-skip" onClick={onClose}>
            {last ? "Close" : "Skip tour"}
          </button>
          <div className="tour-nav">
            {index > 0 && (
              <Button variant="secondary" size="small" onClick={back}>
                Back
              </Button>
            )}
            <Button size="small" onClick={next} ref={nextRef}>
              {last ? step.doneLabel ?? "Got it" : "Next"}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
