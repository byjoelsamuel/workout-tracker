// Shared animation vocabulary. The house style is scale + translation on
// springs, with opacity only ever a supporting cue — never the thing
// carrying the transition. That's what gives motion here a sense of depth
// and physicality instead of reading as a flat crossfade.

// Snappy but settled — the default for anything the user directly acts on.
// Damped to just short of critical: it was at about 0.4 of critical, so every
// hover and press wobbled two or three times before it came to rest.
export const snappy = { type: "spring", stiffness: 420, damping: 30, mass: 0.8 };

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
//
// No scale on either side. Scaling a whole page re-rasterises all of its text
// every frame, which on a big monitor showed up as shimmering type and dropped
// frames; a short rise reads as the same motion for a fraction of the work.
export const pageVariants = {
  initial: { y: 12, opacity: 0 },
  animate: {
    y: 0,
    opacity: 1,
    zIndex: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 34,
      mass: 0.8,
      // Transform still carries the motion; opacity only has to clear early
      // enough that the page reads as solid while it settles the last few px.
      opacity: { duration: 0.22, ease: "easeOut" },
    },
  },
  exit: {
    y: -8,
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
  hidden: { y: 12, scale: 0.98, opacity: 0.4 },
  show: {
    y: 0,
    scale: 1,
    opacity: 1,
    transition: { type: "spring", stiffness: 260, damping: 28 },
  },
};

// Slower and softer than `snappy` — this is ambient feedback (a muscle
// group filling in), not a response to a click.
export const fillTransition = { type: "spring", stiffness: 120, damping: 20 };

// A tween rather than a spring: springs overshoot on pathLength, which makes a
// drawn ring look like it's jittering rather than being drawn.
export const drawTransition = { duration: 0.7, ease: "easeInOut" };

// Everything below mounts inside AnimatePresence, so every exit is a tween —
// see the note on pageVariants. Enters keep their springs.
const exitTween = (duration = 0.16) => ({ duration, ease: "easeIn" });

// Onboarding steps slide in the direction you are travelling: forward pushes
// the old question out to the left, Back brings it in from the left. `custom`
// carries the direction (1 or -1) so the exiting step, which has already lost
// its props, still knows which way to go.
export const stepVariants = {
  enter: (direction) => ({ x: direction * 56, opacity: 0, scale: 0.98 }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 380, damping: 34, opacity: { duration: 0.18 } },
  },
  exit: (direction) => ({ x: direction * -56, opacity: 0, scale: 0.98, transition: exitTween(0.14) }),
};

// Centred dialogs rise slightly as they scale in; sheets slide from their edge.
export const dialogVariants = {
  hidden: { opacity: 0, scale: 0.94, y: 18 },
  show: { opacity: 1, scale: 1, y: 0, transition: { ...snappy, opacity: { duration: 0.15 } } },
  exit: { opacity: 0, scale: 0.97, y: 8, transition: exitTween(0.14) },
};

export const sheetVariants = {
  hidden: (edge) => (edge === "bottom" ? { y: "100%" } : { x: "100%" }),
  show: { x: 0, y: 0, transition: { type: "spring", stiffness: 340, damping: 36 } },
  exit: (edge) => ({ ...(edge === "bottom" ? { y: "100%" } : { x: "100%" }), transition: exitTween(0.2) }),
};

export const backdropVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.18 } },
  exit: { opacity: 0, transition: exitTween(0.16) },
};

// Toasts drop in from the top edge, clear of the workout bar and the log
// button, which are both at the bottom of the screen mid-workout.
export const toastVariants = {
  hidden: { opacity: 0, y: -24, scale: 0.92 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 460, damping: 34 } },
  exit: { opacity: 0, y: -12, scale: 0.96, transition: exitTween(0.15) },
};
