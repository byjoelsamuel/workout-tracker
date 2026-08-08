// Front-view heat map. Each muscle group's region deepens toward full
// orange as sessions accumulate for it.
//
// The silhouette is stylized — rounded rectangles, not anatomy. "Back" is
// approximated as two strips flanking the torso since there's only a front
// view to place it on.
import { motion } from "motion/react";
import { fillTransition } from "../lib/motionVariants.js";

// Five sessions saturates a group. Below that the ramp starts faint but
// still visible, so an untouched body reads as an outline rather than blank.
const MAX_INTENSITY = 5;

function intensity(count) {
  return 0.08 + (Math.min(count, MAX_INTENSITY) / MAX_INTENSITY) * 0.82;
}

// x, y, w, h, rx — one entry per drawn shape, several groups appearing twice
// because they're bilateral.
const REGIONS = [
  ["shoulders", 40, 60, 34, 24, 12],
  ["shoulders", 126, 60, 34, 24, 12],
  ["back", 32, 86, 16, 92, 7],
  ["back", 152, 86, 16, 92, 7],
  ["chest", 68, 82, 64, 54, 14],
  ["abs", 76, 138, 48, 58, 10],
  ["arms", 8, 84, 22, 118, 11],
  ["arms", 170, 84, 22, 118, 11],
  ["legs", 68, 198, 28, 92, 12],
  ["legs", 104, 198, 28, 92, 12],
  ["calves", 70, 292, 24, 76, 10],
  ["calves", 106, 292, 24, 76, 10],
];

export function BodyMap({ summary = {}, className = "" }) {
  return (
    <svg
      viewBox="0 0 200 392"
      xmlns="http://www.w3.org/2000/svg"
      className={`body-map ${className}`.trim()}
      role="img"
      aria-label="Body map showing which muscle groups have been trained"
    >
      <circle className="neutral" cx="100" cy="28" r="22" />
      <rect className="neutral" x="92" y="48" width="16" height="12" />

      {REGIONS.map(([group, x, y, width, height, rx], i) => {
        const count = summary[group] || 0;
        return (
          <motion.rect
            key={`${group}-${i}`}
            className="region"
            data-group={group}
            x={x}
            y={y}
            width={width}
            height={height}
            rx={rx}
            initial={{ fillOpacity: 0.08 }}
            animate={{ fillOpacity: intensity(count) }}
            transition={fillTransition}
          >
            <title>{`${group}: ${count} ${count === 1 ? "session" : "sessions"}`}</title>
          </motion.rect>
        );
      })}

      <rect className="neutral" x="64" y="368" width="30" height="16" rx="6" />
      <rect className="neutral" x="106" y="368" width="30" height="16" rx="6" />
    </svg>
  );
}
