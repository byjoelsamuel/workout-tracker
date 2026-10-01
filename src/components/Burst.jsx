// A small particle burst for the moments worth marking: a new personal best, a
// weekly goal hit, a workout finished. Sits absolutely inside a positioned
// parent and fires each time `trigger` changes.
//
// Deterministic per trigger rather than Math.random on render, so a re-render
// mid-flight can't re-roll every particle's direction and make the burst jump.
// Nothing at all under reduced motion — this is pure decoration.
import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

const COLORS = ["var(--accent)", "#ffb347", "#ffd9a8", "var(--accent-hover)"];

// Triggers can be a counter or an id string; either becomes a numeric seed.
function toSeed(trigger) {
  if (typeof trigger === "number") return trigger;
  let h = 7;
  for (const ch of String(trigger)) h = (h * 31 + ch.charCodeAt(0)) % 233280;
  return h;
}

function particles(trigger, count) {
  let t = (toSeed(trigger) * 9301 + 49297) % 233280;
  const rand = () => {
    t = (t * 9301 + 49297) % 233280;
    return t / 233280;
  };
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + rand() * 0.5;
    const distance = 46 + rand() * 54;
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance - 10,
      size: 5 + rand() * 5,
      rotate: rand() * 360,
      round: rand() > 0.5,
      color: COLORS[i % COLORS.length],
      delay: rand() * 0.06,
    };
  });
}

export function Burst({ trigger, count = 18, className = "" }) {
  const reduced = useReducedMotion();
  const [live, setLive] = useState(null);

  useEffect(() => {
    if (!trigger || reduced) return;
    setLive(trigger);
    const id = setTimeout(() => setLive(null), 1100);
    return () => clearTimeout(id);
  }, [trigger, reduced]);

  const bits = useMemo(() => (live ? particles(live, count) : []), [live, count]);
  if (!live) return null;

  return (
    <span className={`burst ${className}`.trim()} aria-hidden="true">
      {bits.map((p, i) => (
        <motion.span
          key={`${live}-${i}`}
          className="burst-bit"
          style={{
            width: p.size,
            height: p.round ? p.size : p.size * 0.45,
            borderRadius: p.round ? "50%" : 2,
            background: p.color,
          }}
          initial={{ x: 0, y: 0, scale: 0.4, opacity: 1, rotate: 0 }}
          animate={{ x: p.x, y: [0, p.y, p.y + 26], scale: [0.4, 1, 0.8], opacity: [1, 1, 0], rotate: p.rotate }}
          transition={{ duration: 0.95, delay: p.delay, ease: [0.2, 0.7, 0.3, 1] }}
        />
      ))}
    </span>
  );
}
