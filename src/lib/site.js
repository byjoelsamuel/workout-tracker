// Where this app is deployed, written down once.
//
// Only the W3C validator links on the About page need an absolute URL, and they
// need it for a specific reason: the validators fetch the page from their own
// servers, so a relative path tells them nothing and a localhost address is
// something they cannot reach.
//
// Callers use publicOrigin() rather than the constant, so the links follow the
// site to a new host on their own — the previous host was hard-coded in three
// places and every one of them was still pointing at Netlify after the move.

// The deployed origin. Change this one line when the custom domain goes live.
export const SITE_URL = "https://workout-tracker-alpha-two-23.vercel.app";

export const REPO_URL = "https://github.com/byjoelsamuel/workout-tracker";

// The desktop app's installers are attached to GitHub Releases by
// .github/workflows/desktop.yml.
export const DOWNLOAD_URL = `${REPO_URL}/releases/latest`;

// From package.json at build time (vite.config.js), for Settings and About.
export const APP_VERSION = __APP_VERSION__;

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1", "[::1]", ""]);

// The real origin wherever that is reachable from outside, and the deployed URL
// when it isn't — a dev server on localhost, or a file:// open with no host at
// all. Guarded for `window` being undefined so the module stays safe to import
// from anywhere, even though this app only ever runs in a browser.
export function publicOrigin() {
  if (typeof window === "undefined") return SITE_URL;
  const { protocol, hostname, origin } = window.location;
  if (!protocol.startsWith("http") || LOCAL_HOSTNAMES.has(hostname)) return SITE_URL;
  return origin;
}
