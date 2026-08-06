// Renders the front-view "heat map" body silhouette as an inline SVG
// string. Both dashboard.js (one big map) and compare.js (a small map per
// user) call bodyMapSVG(counts) and drop the result straight into the DOM.
//
// Geometry note: this is a stylized silhouette built from rounded
// rectangles/ellipses, not an anatomically precise figure. "Back" (lats)
// is approximated as two strips flanking the torso, since only a front
// view is drawn — there's no real back view to show it on.

// Caps the color ramp at 5 logged sessions: 0 sessions reads as a faint
// outline (0.08 opacity), 5+ sessions reads as fully saturated (0.9).
function intensityToOpacity(count) {
  const capped = Math.min(count, 5);
  return 0.08 + (capped / 5) * 0.82;
}

function regionRect(group, counts, x, y, width, height, rx) {
  const count = counts[group] || 0;
  const opacity = intensityToOpacity(count).toFixed(2);
  const sessionLabel = count === 1 ? "session" : "sessions";
  return `<rect class="region" data-group="${group}" x="${x}" y="${y}" width="${width}" height="${height}" rx="${rx}" fill-opacity="${opacity}"><title>${group}: ${count} ${sessionLabel}</title></rect>`;
}

function bodyMapSVG(counts = {}) {
  return `
    <svg viewBox="0 0 200 392" xmlns="http://www.w3.org/2000/svg" class="body-map" role="img" aria-label="Body heat map of logged exercises">
      <circle class="neutral" cx="100" cy="28" r="22" />
      <rect class="neutral" x="92" y="48" width="16" height="12" />
      ${regionRect("shoulders", counts, 40, 60, 34, 24, 12)}
      ${regionRect("shoulders", counts, 126, 60, 34, 24, 12)}
      ${regionRect("back", counts, 32, 86, 16, 92, 7)}
      ${regionRect("back", counts, 152, 86, 16, 92, 7)}
      ${regionRect("chest", counts, 68, 82, 64, 54, 14)}
      ${regionRect("abs", counts, 76, 138, 48, 58, 10)}
      ${regionRect("arms", counts, 8, 84, 22, 118, 11)}
      ${regionRect("arms", counts, 170, 84, 22, 118, 11)}
      ${regionRect("legs", counts, 68, 198, 28, 92, 12)}
      ${regionRect("legs", counts, 104, 198, 28, 92, 12)}
      ${regionRect("calves", counts, 70, 292, 24, 76, 10)}
      ${regionRect("calves", counts, 106, 292, 24, 76, 10)}
      <rect class="neutral" x="64" y="368" width="30" height="16" rx="6" />
      <rect class="neutral" x="106" y="368" width="30" height="16" rx="6" />
    </svg>
  `;
}
