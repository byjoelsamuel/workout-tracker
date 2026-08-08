// The help button sits in the nav, but the guide it replays belongs to the
// dashboard. Rather than lifting guide state into Layout (and threading it
// back down through Routes) or standing up a context for one boolean, the
// nav just announces the request and the dashboard listens if it's mounted.
const listeners = new Set();

export function onGuideReplay(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function requestGuideReplay() {
  for (const listener of listeners) listener();
}
