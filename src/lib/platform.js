// Website, desktop app or Android app. The same build runs in all three. The
// desktop shell's preload script (desktop/preload.cjs) exposes `window.tsyoku`,
// and Capacitor's WebView injects `window.Capacitor`, so their presence is the
// whole test.
//
// Only what would be wrong inside an app changes: it opens on your dashboard
// rather than the landing page, it doesn't offer itself for download, and it
// skips the W3C validator links, which check the public website.
import { APP_VERSION, REPO_URL } from "./site.js";

const bridge = typeof window !== "undefined" ? window.tsyoku : undefined;
const capacitor = typeof window !== "undefined" ? window.Capacitor : undefined;

export const isDesktop = Boolean(bridge?.desktop);

export const isAndroidApp = Boolean(capacitor?.isNativePlatform?.() && capacitor.getPlatform?.() === "android");

// A downloaded app (desktop or Android) rather than the website: these check
// GitHub for new releases themselves, since nothing deploys to them.
export const isNativeApp = isDesktop || isAndroidApp;

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
export const isApp = isNativeApp || isInstalledWebApp;

// Where history is kept, relative to the website. The desktop app, the Android
// app and an iOS Home Screen app each have storage of their own; an app
// installed from Chrome or Edge shares the browser's, so it isn't separate there.
export const hasOwnStorage = isNativeApp || (isIOS && isInstalledWebApp);

// "this app" or "this browser", for copy about where profiles and history are.
export const STORAGE_HOME = hasOwnStorage ? "this app" : "this browser";

// ---- Updates ----
//
// The desktop shell asks GitHub itself (desktop/main.cjs). The Android app asks
// from the page: GitHub's API allows it, and the answer is only ever used to
// open a github.com download link.
const LATEST_RELEASE = "https://api.github.com/repos/byjoelsamuel/workout-tracker/releases/latest";
const APK_NAME = "Tsyoku-naru.apk";
let androidDownloadUrl = null;

// Plain x.y.z. GitHub's "latest" already skips drafts and pre-releases.
export function isNewer(candidate, current) {
  const a = candidate.split(".").map(Number);
  const b = current.split(".").map(Number);
  for (let i = 0; i < 3; i += 1) if (a[i] !== b[i]) return a[i] > b[i];
  return false;
}

async function checkAndroid() {
  const current = APP_VERSION;
  try {
    const response = await fetch(LATEST_RELEASE, { headers: { Accept: "application/vnd.github+json" } });
    if (!response.ok) throw new Error(`GitHub answered ${response.status}`);
    const release = await response.json();
    const latest = String(release.tag_name ?? "").replace(/^v/, "");
    if (!/^\d+\.\d+\.\d+$/.test(latest)) throw new Error(`Unexpected tag ${release.tag_name}`);
    const asset = (release.assets ?? []).find((a) => a.name === APK_NAME);
    const url = asset?.browser_download_url ?? `${REPO_URL}/releases/latest`;
    androidDownloadUrl = url.startsWith("https://github.com/") ? url : null;
    return { current, latest, available: isNewer(latest, current) };
  } catch (error) {
    return { current, latest: null, available: false, failed: true, reason: String(error?.message ?? error) };
  }
}

// Is a newer release out? { current, latest, available }, or { failed: true }
// when GitHub couldn't be reached. Always null on the website, which is
// updated by deploying it.
export function checkForUpdate() {
  if (bridge?.checkForUpdate) return bridge.checkForUpdate();
  if (isAndroidApp) return checkAndroid();
  return Promise.resolve(null);
}

// Opens the download for the release the last check found. In the Android
// app, a link to another site opens in the system browser.
export function downloadUpdate() {
  if (bridge?.downloadUpdate) bridge.downloadUpdate();
  else if (isAndroidApp && androidDownloadUrl) window.open(androidDownloadUrl, "_blank");
}

// ---- Files ----

// Android's WebView ignores downloads, so a backup is written to the app's
// cache and handed to the share sheet (Drive, Files, email). Loaded only here,
// so the website never downloads the plugins. Resolves false if cancelled.
export async function shareFileAndroid(name, text) {
  const [{ Filesystem, Directory, Encoding }, { Share }] = await Promise.all([
    import("@capacitor/filesystem"),
    import("@capacitor/share"),
  ]);
  const { uri } = await Filesystem.writeFile({ path: name, data: text, directory: Directory.Cache, encoding: Encoding.UTF8 });
  try {
    await Share.share({ title: name, files: [uri], dialogTitle: "Save backup" });
    return true;
  } catch (error) {
    if (/cancel/i.test(String(error?.message ?? error))) return false;
    throw error;
  }
}

// ---- Back button ----

// Android's back button, the way Android apps behave: close an open dialog or
// the walkthrough first (the same as Escape, which both handle), else go back
// a page, else send the app to the background. Without a handler, back on the
// first screen did nothing at all.
export async function setUpAndroidBackButton() {
  if (!isAndroidApp) return;
  const { App } = await import("@capacitor/app");
  App.addListener("backButton", ({ canGoBack }) => {
    // Dialogs mark the page modal-open; the walkthrough is its own overlay.
    const overlay = document.documentElement.classList.contains("modal-open") || document.querySelector(".tour");
    if (overlay) {
      const target = document.activeElement ?? document.body;
      target.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    } else if (canGoBack) {
      window.history.back();
    } else {
      App.minimizeApp();
    }
  });
}
