// Website or desktop app. The same build runs in both; the desktop shell's
// preload script (desktop/preload.cjs) exposes `window.tsyoku`, so its
// presence is the whole test.
//
// Only what would be wrong inside the app changes: it opens on your dashboard
// rather than the landing page, it doesn't offer itself for download, and it
// skips the W3C validator links, which check the public website.
const bridge = typeof window !== "undefined" ? window.tsyoku : undefined;

export const isDesktop = Boolean(bridge?.desktop);
