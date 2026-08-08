// Single source of truth for the muscle groups the app tracks. Feeds both
// the body map's SVG regions and the log form's dropdown, so the two can
// never drift apart.
export const BODY_GROUPS = [
  { id: "shoulders", label: "Shoulders" },
  { id: "chest", label: "Chest" },
  { id: "back", label: "Back" },
  { id: "arms", label: "Arms" },
  { id: "abs", label: "Abs" },
  { id: "legs", label: "Legs" },
  { id: "calves", label: "Calves" },
];
