// Anatomical heat map. Each muscle group is drawn at an opacity handed down
// from lib/heat.js: how recently, and how often, it has been worked.
//
// This component does no arithmetic on training data. It is given a value per
// group and draws it — which is what lets the dashboard show decayed recency,
// the compare page a flat weekly count, and the landing page a looping demo,
// all through the same map.
//
// Every muscle is drawn twice: once into a base layer in a neutral tone, then
// again into a heat layer that fades accent in over the top. Tinting a single
// layer by opacity alone meant an untrained body was near-invisible accent on
// white, while the head and knees — drawn in flat grey — came out darker than
// the muscles and pulled the eye to the parts that mean nothing.
//
// Optional extras, each off unless asked for:
//   onSelectGroup  muscles become tappable (the dashboard uses this to browse
//                  exercises for a group). Mouse and touch only — the group
//                  chips in the picker are the keyboard route to the same thing.
//   pulse          { group, key } — flashes that group once when key changes,
//                  so logging a set visibly lands somewhere on the body.
//   view           controlled Front/Back, for the landing page's demo.
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ANTERIOR, BODY_VIEWBOX, POSTERIOR } from "../lib/bodySvg.js";
import { GROUP_LABELS } from "../lib/bodyGroups.js";
import { relativeDay } from "../lib/time.js";
import { fillTransition } from "../lib/motionVariants.js";
import { Segmented } from "./primitives.jsx";

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

// The view a group can be seen on, for the three that appear on only one.
// Back exists only on the posterior figure, chest and abs only on the
// anterior, so choosing one from a chip has to turn the body round to it.
export const GROUP_VIEW = { back: "posterior", chest: "anterior", abs: "anterior" };

export function BodyMap({
  heat = {},
  showToggle = false,
  className = "",
  view: controlledView,
  onViewChange,
  onSelectGroup,
  selectedGroup,
  pulse,
}) {
  const [ownView, setOwnView] = useState("anterior");
  const [hovered, setHovered] = useState(null);
  const view = controlledView ?? ownView;
  const setView = onViewChange ?? setOwnView;
  const regions = VIEWS.find((v) => v.id === view).data;
  const interactive = Boolean(onSelectGroup);

  return (
    <div className={`body-map-wrap ${className}`.trim()}>
      {showToggle && (
        <Segmented
          label="Body view"
          options={VIEWS.map(({ id, label }) => ({ id, label }))}
          value={view}
          onChange={setView}
        />
      )}

      {/* The plate is a div rather than a rect inside the SVG so it can fill
          whatever height the card gives it. */}
      <div className="body-map-plate">
        {/* Front ↔ Back turns the figure round rather than swapping it. The
            exit is a tween — AnimatePresence waits on it (see CLAUDE.md). */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.svg
            key={view}
            viewBox={BODY_VIEWBOX}
            xmlns="http://www.w3.org/2000/svg"
            className={`body-map ${interactive ? "interactive" : ""}`.trim()}
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label={`${view === "anterior" ? "Front" : "Back"} body map showing which muscle groups have been trained`}
            initial={{ rotateY: -80, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1, transition: { type: "spring", stiffness: 260, damping: 26 } }}
            exit={{ rotateY: 80, opacity: 0, transition: { duration: 0.14, ease: "easeIn" } }}
            onPointerLeave={() => setHovered(null)}
          >
            <g className="body-base">
              {regions.map(({ muscle, group, points }) =>
                points.map((polygon, i) => (
                  <polygon key={`${muscle}-${i}`} className={group ? "muscle" : "structural"} points={polygon} />
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
                const classes = [
                  "region",
                  interactive && hovered === group && "hovered",
                  selectedGroup === group && "selected",
                ]
                  .filter(Boolean)
                  .join(" ");
                return points.map((polygon, i) => (
                  <motion.polygon
                    key={`${muscle}-${i}`}
                    className={classes}
                    data-group={group}
                    points={polygon}
                    initial={{ fillOpacity: 0 }}
                    animate={{ fillOpacity: value }}
                    transition={fillTransition}
                    onPointerEnter={interactive ? () => setHovered(group) : undefined}
                    onClick={interactive ? () => onSelectGroup(group) : undefined}
                  >
                    <title>{describe(group, sessions, lastTrained)}</title>
                  </motion.polygon>
                ));
              })}
            </g>

            {/* A flash over the group that just took a set. Keyed so each log
                plays it again; it fades to nothing and needs no exit. */}
            {pulse?.group && (
              <g className="body-pulse" key={pulse.key} aria-hidden="true">
                {regions
                  .filter((r) => r.group === pulse.group)
                  .flatMap(({ muscle, points }) =>
                    points.map((polygon, i) => (
                      <motion.polygon
                        key={`${muscle}-${i}`}
                        points={polygon}
                        initial={{ fillOpacity: 0.95 }}
                        animate={{ fillOpacity: 0 }}
                        transition={{ duration: 1.3, ease: "easeOut" }}
                      />
                    ))
                  )}
              </g>
            )}
          </motion.svg>
        </AnimatePresence>
      </div>
    </div>
  );
}
