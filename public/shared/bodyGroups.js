// Single source of truth for the muscle groups the app tracks.
// Loaded two ways: as a plain <script> in the browser (defines a global)
// and via require() from server.js (Node). The `typeof module` guard is
// what makes both work from the same file without a bundler.
const BODY_GROUPS = [
  { id: "shoulders", label: "Shoulders" },
  { id: "chest", label: "Chest" },
  { id: "back", label: "Back" },
  { id: "arms", label: "Arms" },
  { id: "abs", label: "Abs" },
  { id: "legs", label: "Legs" },
  { id: "calves", label: "Calves" },
];

if (typeof module !== "undefined" && module.exports) {
  module.exports = { BODY_GROUPS };
}
