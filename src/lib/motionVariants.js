// Shared animation vocabulary. The house style is scale + translation on
// springs, with opacity only ever a supporting cue — never the thing
// carrying the transition. That's what gives motion here a sense of depth
// and physicality instead of reading as a flat crossfade.

// Snappy but settled — the default for anything the user directly acts on.
export const snappy = { type: "spring", stiffness: 400, damping: 17 };

export const pageVariants = {
  initial: { scale: 0.96, y: 24, opacity: 0.4 },
  animate: {
    scale: 1,
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 30, mass: 0.9 },
  },
  exit: {
    scale: 1.03,
    y: -16,
    opacity: 0.4,
    transition: { type: "spring", stiffness: 300, damping: 34 },
  },
};

// Parent/child pair for lists and grids: children rise into place slightly
// staggered rather than all appearing at once.
export const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

export const listItemVariants = {
  hidden: { y: 12, scale: 0.95, opacity: 0.4 },
  show: {
    y: 0,
    scale: 1,
    opacity: 1,
    transition: { type: "spring", stiffness: 260, damping: 24 },
  },
};

// Slower and softer than `snappy` — this is ambient feedback (a muscle
// group filling in), not a response to a click.
export const fillTransition = { type: "spring", stiffness: 120, damping: 20 };

// The one deliberate non-spring in the app: springs overshoot on
// pathLength, which makes a drawn arrow look like it's jittering rather
// than being drawn.
export const drawTransition = { duration: 0.7, ease: "easeInOut" };
