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
const THEME_COLOR = { dark: "#050505", light: "#ffffff" };
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

function emit(next) {
  state = next;
  for (const listener of listeners) listener();
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
}

// The switch itself, revealed as a circle growing out of whatever was pressed.
// View Transitions snapshot the old page and animate the new one in over it;
// where the API is missing, or motion is reduced, the swap is instant.
function reveal(theme, origin) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!origin || reduced || typeof document.startViewTransition !== "function") {
    paint(theme);
    return;
  }
  const { x, y } = origin;
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
  const transition = document.startViewTransition(() => paint(theme));
  transition.ready
    .then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 560, easing: "cubic-bezier(0.22, 1, 0.36, 1)", pseudoElement: "::view-transition-new(root)" }
      );
    })
    .catch(() => {});
}

function originOf(event) {
  const el = event?.currentTarget;
  if (!el?.getBoundingClientRect) return null;
  const rect = el.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function setPreference(preference, event) {
  try {
    if (preference === "system") localStorage.removeItem(STORAGE_KEYS.theme);
    else localStorage.setItem(STORAGE_KEYS.theme, preference);
  } catch {
    // Storage blocked: the choice still applies for this visit.
  }
  const theme = preference === "system" ? systemTheme() : preference;
  if (theme !== state.theme) reveal(theme, originOf(event));
  emit({ preference, theme });
}

// Following the OS live, but only while the preference is "system" — a manual
// choice always beats the OS.
window.matchMedia(DARK_QUERY).addEventListener("change", () => {
  if (state.preference !== "system") return;
  const theme = systemTheme();
  paint(theme);
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
    toggle: (event) => setPreference(current.theme === "dark" ? "light" : "dark", event),
  };
}
