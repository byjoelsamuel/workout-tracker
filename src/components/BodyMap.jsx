// Anatomical heat map. Each muscle group's regions deepen toward full accent
// as sessions accumulate for it.
//
// The silhouette is a real anatomical outline (see bodySvg.js for provenance),
// drawn front and back. Because there's a genuine posterior view now, back and
// hamstrings are shown where they actually are rather than approximated onto
// the front of the body.
//
// Every muscle is drawn twice: once into a base layer in a neutral tone, then
// again into a heat layer that fades accent in over the top. Tinting a single
// layer by opacity alone meant an untrained body was near-invisible accent on
// white, while the head and knees — drawn in flat grey — came out darker than
// the muscles and pulled the eye to the parts that mean nothing. Splitting the
// layers lets the muscles stay legible at zero sessions and keeps structure
// quieter than anatomy in both themes.
import { useState } from "react";
import { motion } from "motion/react";
import { ANTERIOR, BODY_VIEWBOX, POSTERIOR } from "../lib/bodySvg.js";
import { BODY_GROUPS } from "../lib/bodyGroups.js";
import { fillTransition } from "../lib/motionVariants.js";

// Five sessions saturates a group. A single session still has to be obvious
// at a glance, so the ramp starts well up rather than at a hairline tint.
const MAX_INTENSITY = 5;
const FLOOR = 0.28;

function intensity(count) {
  if (!count) return 0;
  return FLOOR + (Math.min(count, MAX_INTENSITY) / MAX_INTENSITY) * (1 - FLOOR);
}

const VIEWS = [
  { id: "anterior", label: "Front", data: ANTERIOR },
  { id: "posterior", label: "Back", data: POSTERIOR },
];

const GROUP_LABELS = Object.fromEntries(BODY_GROUPS.map((g) => [g.id, g.label]));

export function BodyMap({ summary = {}, showToggle = false, className = "" }) {
  const [view, setView] = useState("anterior");
  const regions = VIEWS.find((v) => v.id === view).data;

  return (
    <div className={`body-map-wrap ${className}`.trim()}>
      {showToggle && (
        <div className="view-toggle" role="group" aria-label="Body view">
          {VIEWS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`view-toggle-option ${view === option.id ? "active" : ""}`}
              aria-pressed={view === option.id}
              onClick={() => setView(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {/* The plate is a div rather than a rect inside the SVG so it can fill
          whatever height the card gives it. As an SVG rect it was locked to
          the figure's 1:2 aspect ratio and left the card bottom-heavy. */}
      <div className="body-map-plate">
        <svg
          viewBox={BODY_VIEWBOX}
          xmlns="http://www.w3.org/2000/svg"
          className="body-map"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={`${view === "anterior" ? "Front" : "Back"} body map showing which muscle groups have been trained`}
        >
          <g className="body-base">
            {regions.map(({ muscle, group, points }) =>
              points.map((polygon, i) => (
                <polygon
                  key={`${muscle}-${i}`}
                  className={group ? "muscle" : "structural"}
                  points={polygon}
                />
              ))
            )}
          </g>

          <g className="body-heat">
            {regions.map(({ muscle, group, points }) => {
              // Head, neck and knees carry no group — they're drawn in the
              // base layer so the silhouette reads as a body, but nothing
              // logs against them, so they never take heat.
              if (!group) return null;
              const count = summary[group] || 0;
              return points.map((polygon, i) => (
                <motion.polygon
                  key={`${muscle}-${i}`}
                  className="region"
                  data-group={group}
                  points={polygon}
                  initial={{ fillOpacity: 0 }}
                  animate={{ fillOpacity: intensity(count) }}
                  transition={fillTransition}
                >
                  <title>
                    {`${GROUP_LABELS[group] ?? group}: ${count} ${count === 1 ? "session" : "sessions"}`}
                  </title>
                </motion.polygon>
              ));
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}
