// Shared animation vocabulary. The house style is scale + translation on
// springs, with opacity only ever a supporting cue — never the thing
// carrying the transition. That's what gives motion here a sense of depth
// and physicality instead of reading as a flat crossfade.

// Snappy but settled — the default for anything the user directly acts on.
export const snappy = { type: "spring", stiffness: 400, damping: 17 };

// Pages cross-fade in the same grid cell (see Layout.jsx), so the outgoing one
// is layered over the incoming one for the length of the overlap. Two rules
// follow from that, and breaking either is what made the switch look broken:
//
// Exit has to reach opacity 0. AnimatePresence unmounts the moment the exit
// animation resolves, so an exit that settles anywhere above zero doesn't
// leave — it hangs there as a ghost of the old page and then blinks out when
// the spring finally comes to rest.
//
// Exit has to be a tween. A spring resolves by settling, and its tail is long
// and amplitude-dependent, which pins the unmount to a moment nobody chose.
// A fixed duration gives the removal a deadline. Enter keeps its spring: it's
// the half the user is looking at, and nothing is waiting on it to finish.
export const pageVariants = {
  initial: { scale: 0.98, y: 14, opacity: 0 },
  animate: {
    scale: 1,
    y: 0,
    opacity: 1,
    zIndex: 1,
    transition: {
      type: "spring",
      stiffness: 420,
      damping: 38,
      mass: 0.7,
      // Transform still carries the motion; opacity only has to clear early
      // enough that the page reads as solid while it settles the last few px.
      opacity: { duration: 0.2, ease: "easeOut" },
    },
  },
  exit: {
    scale: 1.02,
    y: -10,
    opacity: 0,
    zIndex: 0,
    // The dying page is still on top of the live one until it unmounts, so it
    // would otherwise keep swallowing clicks aimed at the new page.
    pointerEvents: "none",
    transition: { duration: 0.16, ease: "easeIn" },
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
