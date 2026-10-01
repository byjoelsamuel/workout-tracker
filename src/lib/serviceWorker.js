// Website only. The installed app on a phone has to open with no signal (a
// gym basement), which takes a service worker — src/sw.js, built to /sw.js by
// vite.config.js. The desktop app already serves its files from disk, and its
// app:// scheme can't host a worker anyway.
import { isDesktop, isInstalledWebApp } from "./platform.js";

export function registerServiceWorker() {
  if (!import.meta.env.PROD || isDesktop || !("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // No offline copy this visit; the site still works online as before.
    });
    // An installed app's history shouldn't be the first thing a browser
    // clears under storage pressure. Only asked when installed: Firefox shows
    // a permission prompt for it, which a passing visitor shouldn't get.
    if (isInstalledWebApp) navigator.storage?.persist?.().catch(() => {});
  });
}
