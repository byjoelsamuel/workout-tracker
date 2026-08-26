// Anatomical heat map. Each muscle group is drawn at an opacity handed down
// from lib/heat.js: how recently, and how often, it has been worked.
//
// This component does no arithmetic on training data. It is given a value per
// group and draws it — which is what lets the dashboard show decayed recency
// and the compare page show a flat weekly count through the same map.
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
import { GROUP_LABELS } from "../lib/bodyGroups.js";
import { relativeDay } from "../lib/time.js";
import { fillTransition } from "../lib/motionVariants.js";

// Reads the way you would say it out loud. The session count stays undecayed
// here on purpose — fading a muscle is a statement about freshness, and it
// should never look like the app forgot work you actually did.
function describe(group, sessions, lastTrained) {
  const name = GROUP_LABELS[group] ?? group;
  if (!sessions) return `${name} — not trained yet`;
  const plural = sessions === 1 ? "session" : "sessions";
  if (!lastTrained) return `${name} — ${sessions} ${plural}`;
  return `${name} — ${sessions} ${plural}, last ${relativeDay(lastTrained)}`;
}

const VIEWS = [
  { id: "anterior", label: "Front", data: ANTERIOR },
  { id: "posterior", label: "Back", data: POSTERIOR },
];

export function BodyMap({ heat = {}, showToggle = false, className = "" }) {
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
              const { value = 0, sessions = 0, lastTrained = null } = heat[group] || {};
              return points.map((polygon, i) => (
                <motion.polygon
                  key={`${muscle}-${i}`}
                  className="region"
                  data-group={group}
                  points={polygon}
                  initial={{ fillOpacity: 0 }}
                  animate={{ fillOpacity: value }}
                  transition={fillTransition}
                >
                  <title>
                    {describe(group, sessions, lastTrained)}
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
