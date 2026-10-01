// Website or desktop app. The same build runs in both; the desktop shell's
// preload script (desktop/preload.cjs) exposes `window.tsyoku`, so its
// presence is the whole test.
//
// Only what would be wrong inside the app changes: it opens on your dashboard
// rather than the landing page, it doesn't offer itself for download, and it
// skips the W3C validator links, which check the public website.
const bridge = typeof window !== "undefined" ? window.tsyoku : undefined;

export const isDesktop = Boolean(bridge?.desktop);

// iPhone and iPad. iPadOS reports itself as a Mac, so a Mac with a
// touchscreen counts too (no real Mac has one).
export const isIOS =
  typeof navigator !== "undefined" &&
  (/iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

// Opened from a home screen or an installed-app icon rather than a browser
// tab. `navigator.standalone` is iOS's older flag for the same thing.
export const isInstalledWebApp =
  typeof window !== "undefined" &&
  (window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true);

// Either way the user opened an app, not a website: no landing page, no
// "download the app".
export const isApp = isDesktop || isInstalledWebApp;

// Where history is kept, relative to the website. The desktop app and an iOS
// Home Screen app each have storage of their own; an app installed from
// Chrome or Edge shares the browser's, so it isn't separate there.
export const hasOwnStorage = isDesktop || (isIOS && isInstalledWebApp);

// Asks the desktop shell whether a newer release is out:
// { current, latest, available } — or { failed: true } when GitHub couldn't be
// reached. Always null on the website, which is updated by deploying it.
export function checkForUpdate() {
  return bridge?.checkForUpdate ? bridge.checkForUpdate() : Promise.resolve(null);
}

// Opens the installer download for the release the last check found.
export function downloadUpdate() {
  bridge?.downloadUpdate?.();
}
