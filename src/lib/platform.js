// Website or desktop app. The same build runs in both; the desktop shell's
// preload script (desktop/preload.cjs) exposes `window.tsyoku`, so its
// presence is the whole test.
//
// Only what would be wrong inside the app changes: it opens on your dashboard
// rather than the landing page, it doesn't offer itself for download, and it
// skips the W3C validator links, which check the public website.
const bridge = typeof window !== "undefined" ? window.tsyoku : undefined;

export const isDesktop = Boolean(bridge?.desktop);

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
