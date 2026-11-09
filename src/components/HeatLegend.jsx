// The one piece of advice the body map can give, as a button: train whichever
// muscle has gone longest without work. It used to be a fade scale with a
// caption and a sentence naming the muscle; the button says the same thing.
//
// Kept out of BodyMap on purpose. Other screens draw the map without it.
import { GROUP_LABELS } from "../lib/bodyGroups.js";

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
  if (!onPickGroup || !cold || cold.value >= 0.34) return null;
  const label = GROUP_LABELS[cold.group] ?? cold.group;

  return (
    <div className="map-legend">
      <button type="button" className="row-action" onClick={() => onPickGroup(cold.group)}>
        Train {label.toLowerCase()}
      </button>
    </div>
  );
}
