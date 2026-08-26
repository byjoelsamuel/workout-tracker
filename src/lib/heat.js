// The one definition of how a session count becomes ink on the body map.
//
// This lived inside BodyMap.jsx until the legend beneath the map had to draw
// the same numbers. A legend derived from different values than the thing it
// explains is worse than no legend at all — the old one was a continuous
// gradient standing in for a stepped, floored, clamped scale, and it
// misrepresented every part of it.

// Five sessions saturates a group. A single session still has to be obvious at
// a glance, so the ramp starts well up rather than at a hairline tint.
export const MAX_INTENSITY = 5;
const FLOOR = 0.28;

export function intensity(count) {
  if (!count) return 0;
  return FLOOR + (Math.min(count, MAX_INTENSITY) / MAX_INTENSITY) * (1 - FLOOR);
}

// 0 through 5+ — every value the scale can actually take, which is what the
// legend draws one swatch per.
export const HEAT_STEPS = Array.from({ length: MAX_INTENSITY + 1 }, (_, i) => i);
