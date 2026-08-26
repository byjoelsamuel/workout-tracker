// The scale under the body map.
//
// It replaced a decorative gradient swatch that carried no data at all. The
// map's heat is stepped — 0, 1, 2 … 5+ sessions — and starts at a 0.28 floor,
// so a continuous ramp misrepresented it at both ends: it implied a
// half-session tint that cannot exist, and faded to nothing at zero when an
// untrained muscle is actually solid grey. "Less" and "More" never said what
// was being measured either.
//
// Kept out of BodyMap on purpose. The compare page renders five small maps
// where a legend is noise, and the onboarding guide's second arrow points at
// [data-guide="body-map"] — folding the legend inside that element would land
// the arrowhead on the legend instead of the figure.
import { HEAT_STEPS, MAX_INTENSITY, intensity } from "../lib/heat.js";

export function HeatLegend({ summary = {} }) {
  const counts = Object.values(summary);
  const peak = counts.length ? Math.max(0, ...counts) : 0;
  // The map clamps at MAX_INTENSITY, so nine chest sessions and five look
  // identical on the body. The tick is where the real number gets said.
  const marked = Math.min(peak, MAX_INTENSITY);

  return (
    <div className="map-legend">
      <div
        className="legend-scale"
        role="img"
        aria-label={
          `Heat scale: no sessions through ${MAX_INTENSITY} or more sessions per muscle group.` +
          (peak > 0 ? ` Your most trained group has ${peak}.` : "")
        }
      >
        {/* The swatches are drawn the same two ways the map is: base tone
            underneath, accent over the top at exactly intensity(n). The first
            one is therefore literally what an untrained group looks like. */}
        {HEAT_STEPS.map((n) => (
          <span
            key={n}
            className={`legend-swatch${peak > 0 && n === marked ? " peak" : ""}`}
            style={{ "--heat": intensity(n) }}
          />
        ))}
      </div>
      <div className="legend-ticks">
        <span>0</span>
        {peak > 0 && <span className="legend-peak">your best {peak}</span>}
        <span>{MAX_INTENSITY}+</span>
      </div>
    </div>
  );
}
