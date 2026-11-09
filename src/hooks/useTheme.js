// Theme state lives on <html data-theme> (set by public/theme-init.js before
// first paint) and everything else keys off CSS custom properties, so only the
// controls that change it need this hook.
//
// Three preferences, two themes. "system" is stored as the key's absence —
// exactly what theme-init.js already reads as "follow the OS" — so choosing it
// is a removeItem, and every browser that never touched the toggle is already
// on it.
//
// A module-level store rather than per-hook state: the sidebar toggle and the
// settings page can both be mounted, and two copies of useState would let them
// disagree about which theme is on.
import { useSyncExternalStore } from "react";
import { STORAGE_KEYS } from "../lib/storageKeys.js";

const DARK_QUERY = "(prefers-color-scheme: dark)";
// Each theme's --background, repeated for the theme-color meta. Keep in step
// with global.css and public/theme-init.js.
const THEME_COLOR = { dark: "#161a1a", light: "#5c7a7a" };
const listeners = new Set();

function readPreference() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.theme);
    return saved === "light" || saved === "dark" ? saved : "system";
  } catch {
    return "system";
  }
}

function systemTheme() {
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

let state = {
  preference: readPreference(),
  theme: document.documentElement.getAttribute("data-theme") || systemTheme(),
};
syncSystemBars(state.theme);

function emit(next) {
  state = next;
  for (const listener of listeners) listener();
}

// In the Android app, the status bar's icons follow the app's theme rather
// than the phone's, so they stay readable on the nav behind them. DARK means
// light icons for a dark background.
function syncSystemBars(theme) {
  window.Capacitor?.Plugins?.SystemBars?.setStyle?.({ style: theme === "dark" ? "DARK" : "LIGHT" })?.catch?.(() => {});
}

function paint(theme) {
  const root = document.documentElement;
  // Transitions off for the swap (see data-theme-switching in global.css).
  // Reading a computed style forces the new colours to resolve while they're
  // still off; turning them back on a tick later then has nothing to animate.
  root.setAttribute("data-theme-switching", "");
  root.setAttribute("data-theme", theme);
  void window.getComputedStyle(document.body).backgroundColor;
  setTimeout(() => root.removeAttribute("data-theme-switching"), 1);
  // Tints the browser chrome on mobile and the title bar of an installed app.
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? THEME_COLOR.dark : THEME_COLOR.light);
  syncSystemBars(theme);
}

// The switch itself, as a blurred pixel mosaic: the new theme fills in as
// square blocks in a random order, a few at a time, like an old console
// dissolve, while the old page blurs out and the new one sharpens.
// View Transitions snapshot the old page and lay the new one over it; the new
// one is masked by a grid that gains blocks each step. Where the API is
// missing, or motion is reduced, the swap is instant.
const BLOCK = 48; // px per block
const STEPS = 10;
const DURATION = 480; // ms

// One SVG mask per step, each with more blocks filled than the last. Vector,
// so the blocks stay sharp at any size; the first is empty, the last full.
function mosaicFrames() {
  const cols = Math.ceil(window.innerWidth / BLOCK);
  const rows = Math.ceil(window.innerHeight / BLOCK);
  const order = Array.from({ length: cols * rows }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const size = `${cols * BLOCK}px ${rows * BLOCK}px`;
  const svg = (cells) =>
    `url("data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${cols} ${rows}' preserveAspectRatio='none' shape-rendering='crispEdges'>${cells}</svg>`
    )}")`;

  const frames = [{ maskImage: svg(""), maskSize: size }];
  const per = Math.ceil(order.length / STEPS);
  let cells = "";
  for (let step = 0; step < STEPS; step++) {
    for (const i of order.slice(step * per, (step + 1) * per)) {
      cells += `<rect x='${i % cols}' y='${Math.floor(i / cols)}' width='1' height='1'/>`;
    }
    frames.push({ maskImage: svg(cells), maskSize: size });
  }
  return frames;
}

function reveal(theme) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || typeof document.startViewTransition !== "function") {
    paint(theme);
    return;
  }
  const frames = mosaicFrames();
  const transition = document.startViewTransition(() => paint(theme));
  transition.ready
    .then(() => {
      // mask-image can't tween, so each keyframe holds until the next: the
      // blocks land in steps rather than fading.
      const root = document.documentElement;
      const timing = { duration: DURATION, fill: "forwards" };
      // Blur on top of the blocks: the old page goes soft as it's covered,
      // and the new one comes in out of focus and sharpens as it lands.
      // Held on the last frame until the transition tears down, then dropped
      // so nothing lingers on the document.
      const animations = [
        root.animate(frames, { ...timing, easing: "linear", pseudoElement: "::view-transition-new(root)" }),
        root.animate([{ filter: "blur(12px)" }, { filter: "blur(0)" }], {
          ...timing,
          easing: "ease-out",
          pseudoElement: "::view-transition-new(root)",
        }),
        root.animate([{ filter: "blur(0)" }, { filter: "blur(8px)" }], {
          ...timing,
          easing: "ease-in",
          pseudoElement: "::view-transition-old(root)",
        }),
      ];
      transition.finished.finally(() => animations.forEach((animation) => animation.cancel()));
    })
    .catch(() => {});
}

function setPreference(preference) {
  try {
    if (preference === "system") localStorage.removeItem(STORAGE_KEYS.theme);
    else localStorage.setItem(STORAGE_KEYS.theme, preference);
  } catch {
    // Storage blocked: the choice still applies for this visit.
  }
  const theme = preference === "system" ? systemTheme() : preference;
  if (theme !== state.theme) reveal(theme);
  emit({ preference, theme });
}

// Following the OS live, but only while the preference is "system" — a manual
// choice always beats the OS.
window.matchMedia(DARK_QUERY).addEventListener("change", () => {
  if (state.preference !== "system") return;
  const theme = systemTheme();
  reveal(theme);
  emit({ ...state, theme });
});

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useTheme() {
  const current = useSyncExternalStore(subscribe, () => state);
  return {
    theme: current.theme,
    preference: current.preference,
    setPreference,
    toggle: () => setPreference(current.theme === "dark" ? "light" : "dark"),
  };
}
