// Naru: an optional dashboard widget, not a homepage banner — it only
// mounts once a profile is loaded, stays closed until clicked, and never
// opens itself. See src/lib/coach.js for how a day gets picked.
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "./primitives.jsx";
import { DAY_LABELS, buildWorkout, chooseDay, explainChoice, schemeFor } from "../lib/coach.js";
import { snappy } from "../lib/motionVariants.js";

const greeting = (name) => `Hey ${name}! Want to pick today's focus yourself, or want me to choose for you?`;

export function CoachChat({ user, logs, summary }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(() => [{ from: "bot", text: greeting(user.name) }]);
  const [phase, setPhase] = useState("ask-mode");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  function say(from, text) {
    setMessages((m) => [...m, { from, text }]);
  }

  function presentDay(dayKey, noteFor) {
    const workout = buildWorkout(dayKey);
    say("bot", noteFor(workout.label));
    setMessages((m) => [...m, { from: "bot", workout }]);
    setPhase("result");
  }

  function pickForMyself() {
    say("user", "I'll pick.");
    say("bot", "Which one — Push, Pull, or Legs?");
    setPhase("ask-day");
  }

  function letAiChoose() {
    say("user", "Choose for me.");
    const choice = chooseDay(logs, summary);
    presentDay(choice.dayKey, (label) => explainChoice(choice, label));
  }

  function chooseOwnDay(dayKey) {
    say("user", DAY_LABELS[dayKey]);
    presentDay(dayKey, (label) => `Let's do ${label}.`);
  }

  function askAgain() {
    say("bot", greeting(user.name));
    setPhase("ask-mode");
  }

  return (
    <>
      <motion.button
        className="coach-launcher"
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close Naru" : "Ask Naru for a workout"}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        transition={snappy}
      >
        {open ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="coach-panel"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97, transition: { duration: 0.15 } }}
            transition={snappy}
          >
            <div className="coach-header">
              <span>Naru</span>
              <span className="coach-subtitle">your training coach</span>
            </div>

            <div className="coach-messages" ref={scrollRef}>
              {messages.map((msg, i) =>
                msg.workout ? (
                  <WorkoutCard key={i} workout={msg.workout} />
                ) : (
                  <div key={i} className={`coach-msg ${msg.from}`}>
                    {msg.text}
                  </div>
                )
              )}
            </div>

            <div className="coach-actions">
              {phase === "ask-mode" && (
                <>
                  <Button size="small" variant="secondary" onClick={pickForMyself}>
                    I'll pick
                  </Button>
                  <Button size="small" onClick={letAiChoose}>
                    Choose for me
                  </Button>
                </>
              )}
              {phase === "ask-day" && (
                <>
                  <Button size="small" onClick={() => chooseOwnDay("push")}>
                    Push
                  </Button>
                  <Button size="small" onClick={() => chooseOwnDay("pull")}>
                    Pull
                  </Button>
                  <Button size="small" onClick={() => chooseOwnDay("legs")}>
                    Legs
                  </Button>
                </>
              )}
              {phase === "result" && (
                <Button size="small" variant="secondary" onClick={askAgain}>
                  Ask again
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function WorkoutCard({ workout }) {
  return (
    <div className="coach-msg bot coach-workout">
      <strong>{workout.label}</strong>
      <ul>
        {workout.exercises.map((ex, i) => (
          <li key={i}>
            <span>{ex.name}</span>
            <span className="coach-scheme">{schemeFor(ex)}</span>
          </li>
        ))}
      </ul>
      <p className="coach-note">Log these below as you go.</p>
    </div>
  );
}
