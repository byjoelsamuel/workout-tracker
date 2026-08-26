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

// id → label, derived once. Three components used to build this map for
// themselves, which meant three chances for a group to render as its raw id.
export const GROUP_LABELS = Object.fromEntries(BODY_GROUPS.map((g) => [g.id, g.label]));
