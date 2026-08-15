// Anatomical heat map. Each muscle group's regions deepen toward full accent
// as sessions accumulate for it.
//
// The silhouette is a real anatomical outline (see bodySvg.js for provenance),
// drawn front and back. Because there's a genuine posterior view now, back and
// hamstrings are shown where they actually are rather than approximated onto
// the front of the body.
import { useState } from "react";
import { motion } from "motion/react";
import { ANTERIOR, BODY_VIEWBOX, POSTERIOR } from "../lib/bodySvg.js";
import { BODY_GROUPS } from "../lib/bodyGroups.js";
import { fillTransition } from "../lib/motionVariants.js";

// Five sessions saturates a group. Below that the ramp starts faint but
// still visible, so an untouched body reads as an outline rather than blank.
const MAX_INTENSITY = 5;
const BASE_OPACITY = 0.08;

function intensity(count) {
  return BASE_OPACITY + (Math.min(count, MAX_INTENSITY) / MAX_INTENSITY) * 0.82;
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

      <svg
        viewBox={BODY_VIEWBOX}
        xmlns="http://www.w3.org/2000/svg"
        className="body-map"
        role="img"
        aria-label={`${view === "anterior" ? "Front" : "Back"} body map showing which muscle groups have been trained`}
      >
        {regions.map(({ muscle, group, points }) =>
          points.map((polygon, i) => {
            // Head, neck and knees carry no group — they're drawn so the
            // silhouette reads as a body, but nothing logs against them.
            if (!group) {
              return (
                <polygon key={`${muscle}-${i}`} className="neutral" points={polygon} />
              );
            }

            const count = summary[group] || 0;
            return (
              <motion.polygon
                key={`${muscle}-${i}`}
                className="region"
                data-group={group}
                points={polygon}
                initial={{ fillOpacity: BASE_OPACITY }}
                animate={{ fillOpacity: intensity(count) }}
                transition={fillTransition}
              >
                <title>
                  {`${GROUP_LABELS[group] ?? group}: ${count} ${count === 1 ? "session" : "sessions"}`}
                </title>
              </motion.polygon>
            );
          })
        )}
      </svg>
    </div>
  );
}
