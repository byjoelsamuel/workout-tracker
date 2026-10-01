// The scale under the body map.
//
// It has to explain something non-obvious: a muscle you hammered last month is
// dim, and without a word of explanation that reads like lost data rather than
// a deliberate statement about freshness. So rather than an abstract
// less-to-more ramp, the legend shows the actual thing — one session, drawn at
// the tone it takes on as it ages — and names the muscle that has gone longest
// without work, which is the one piece of advice this map can give.
//
// Kept out of BodyMap on purpose. The compare page renders several small maps
// where a legend is noise.
import { GROUP_LABELS } from "../lib/bodyGroups.js";
import { DECAY_SAMPLES } from "../lib/heat.js";
import { relativeDay } from "../lib/time.js";

const WEEK_LABELS = ["now", "1w", "2w", "3w+"];

// The group that has been left longest, among those ever trained. Groups that
// have never been touched are excluded — "you have never trained calves" is a
// different message from "your calves are going stale", and the body map
// already says the first one by leaving them dark.
function stalest(heat) {
  let worst = null;
  for (const [group, entry] of Object.entries(heat)) {
    if (!entry?.lastTrained) continue;
    if (!worst || entry.lastTrained < worst.lastTrained) {
      worst = { group, lastTrained: entry.lastTrained, value: entry.value };
    }
  }
  return worst;
}

export function HeatLegend({ heat = {}, onPickGroup }) {
  const cold = stalest(heat);
  // Below roughly a third the muscle is visibly faded; above it, nothing is
  // stale enough to be worth nagging about.
  const worthFlagging = cold && cold.value < 0.34;
  const label = cold ? GROUP_LABELS[cold.group] ?? cold.group : null;

  return (
    <div className="map-legend">
      <div className="legend-row">
        <span className="legend-caption">One session, as it fades</span>
        <div
          className="legend-scale"
          role="img"
          aria-label="A session counts fully on the day you log it and halves every week after."
        >
          {DECAY_SAMPLES.map(({ weeks, value }) => (
            <span key={weeks} className="legend-step">
              <span className="legend-swatch" style={{ "--heat": value }} />
              <span className="legend-tick">{WEEK_LABELS[weeks]}</span>
            </span>
          ))}
        </div>
      </div>

      {worthFlagging && (
        <p className="legend-stale">
          <span>
            Longest untouched: <strong>{label}</strong>, {relativeDay(cold.lastTrained)}
          </span>
          {onPickGroup && (
            <button type="button" className="row-action" onClick={() => onPickGroup(cold.group)}>
              Train {label.toLowerCase()}
            </button>
          )}
        </p>
      )}
    </div>
  );
}
