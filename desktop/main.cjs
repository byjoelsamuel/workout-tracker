// The desktop app: the same Vite build as the website, in its own window.
//
// It serves dist/ over a private `app://tsyoku-naru` scheme rather than
// loading files with file://. Two reasons, both about data:
//
//   - localStorage is keyed by origin. Every file:// page shares one opaque
//     origin, which is fragile; a registered standard scheme gives the app a
//     real, stable origin of its own, so storage survives updates.
//   - React Router needs real paths. file:// would make the pathname the
//     install directory; here /dashboard is just /dashboard, with a fallback
//     to index.html exactly like vercel.json and netlify.toml do on the web.
//
// That origin is a wire format, like the keys in storageKeys.js: change the
// scheme or host and every installed user's history is orphaned.
const { app, BrowserWindow, ipcMain, Menu, nativeTheme, net, protocol, session, shell } = require("electron");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const SCHEME = "app";
const HOST = "tsyoku-naru";
const ORIGIN = `${SCHEME}://${HOST}`;
const DIST = path.join(__dirname, "..", "dist");

// Same backgrounds as global.css, so the window never flashes white before
// the page's own theme script runs.
const BACKGROUND = { dark: "#050505", light: "#ffffff" };

// Everything the app needs and nothing else: its own scripts and styles, no
// remote code, no frames, no plugins. Motion and React set styles through the
// CSSOM, which CSP doesn't restrict, so 'unsafe-inline' is only for the few
// style attributes in the built HTML.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join("; ");

protocol.registerSchemesAsPrivileged([
  { scheme: SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);

// A second launch focuses the window that's already open rather than starting
// another copy writing to the same storage.
// app.quit() is asynchronous, so the second copy has to stop here as well:
// carrying on would register its handlers and briefly open a window of its own.
if (!app.requestSingleInstanceLock()) {
  app.quit();
  return;
}

function resolveRequest(url) {
  const { pathname } = new URL(url);
  const file = path.normalize(path.join(DIST, decodeURIComponent(pathname)));
  // Never serve anything outside dist/, whatever the path says.
  if (file !== DIST && !file.startsWith(DIST + path.sep)) return null;
  return file;
}

async function serve(request) {
  const file = resolveRequest(request.url);
  if (!file) return new Response("Not found", { status: 404 });

  let response = await net.fetch(pathToFileURL(file).toString()).catch(() => null);
  // A route like /dashboard has no file behind it. Anything without an
  // extension falls back to the app shell; a missing asset stays a 404 so a
  // broken build fails loudly instead of loading HTML as JavaScript.
  if ((!response || !response.ok) && !path.extname(file)) {
    response = await net.fetch(pathToFileURL(path.join(DIST, "index.html")).toString());
  }
  if (!response || !response.ok) return new Response("Not found", { status: 404 });

  const headers = new Headers(response.headers);
  headers.set("Content-Security-Policy", CSP);
  return new Response(response.body, { status: 200, headers });
}

function openExternally(url) {
  if (/^https?:\/\//.test(url)) shell.openExternal(url);
}

// ---- Updates ----
//
// The app tells you when a newer release is out; it doesn't install it
// itself. Installing in place would take electron-updater, a runtime
// dependency this package deliberately ships without (`files` in
// electron-builder.yml leaves node_modules out), and on Fedora an rpm goes
// through dnf and your password regardless. So it asks GitHub for the latest
// release when the page wants to know, and Download opens the same kind of
// installer you're running. Installing over the top keeps your history: it
// lives in the app's data folder, which no installer touches.
const LATEST_RELEASE = "https://api.github.com/repos/byjoelsamuel/workout-tracker/releases/latest";

function installerName() {
  if (process.platform === "win32") return "Tsyoku-naru-Setup-x64.exe";
  // Set by the AppImage runtime; anything else on Linux came from the rpm.
  return process.env.APPIMAGE ? "Tsyoku-naru-x86_64.AppImage" : "Tsyoku-naru-x86_64.rpm";
}

// Plain x.y.z. GitHub's "latest" already skips drafts and pre-releases.
function isNewer(candidate, current) {
  const a = candidate.split(".").map(Number);
  const b = current.split(".").map(Number);
  for (let i = 0; i < 3; i += 1) if (a[i] !== b[i]) return a[i] > b[i];
  return false;
}

// Where Download goes. Only ever filled from GitHub's answer, so the page can
// trigger a download but has no way to choose what gets opened.
let downloadUrl = null;

async function checkForUpdate() {
  const current = app.getVersion();
  try {
    const response = await net.fetch(LATEST_RELEASE, { headers: { Accept: "application/vnd.github+json" } });
    if (!response.ok) throw new Error(`GitHub answered ${response.status}`);
    const release = await response.json();
    const latest = String(release.tag_name ?? "").replace(/^v/, "");
    if (!/^\d+\.\d+\.\d+$/.test(latest)) throw new Error(`Unexpected tag ${release.tag_name}`);
    const asset = (release.assets ?? []).find((a) => a.name === installerName());
    const url = asset?.browser_download_url ?? release.html_url;
    downloadUrl = typeof url === "string" && url.startsWith("https://github.com/") ? url : null;
    return { current, latest, available: isNewer(latest, current) };
  } catch (error) {
    // Offline, or GitHub rate-limited us: say so rather than "up to date",
    // and say why, since "it doesn't work" is all anyone can report otherwise.
    return { current, latest: null, available: false, failed: true, reason: String(error?.message ?? error) };
  }
}

// Only the app's own page may ask.
function fromApp(event) {
  return Boolean(event.senderFrame?.url.startsWith(`${ORIGIN}/`));
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 380,
    minHeight: 560,
    show: false,
    title: "Tsyoku-naru",
    backgroundColor: nativeTheme.shouldUseDarkColors ? BACKGROUND.dark : BACKGROUND.light,
    autoHideMenuBar: true,
    // Windows takes its icon from the .exe; Linux window managers need it here.
    icon: process.platform === "linux" ? path.join(__dirname, "icon.png") : undefined,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      spellcheck: false,
    },
  });

  win.once("ready-to-show", () => win.show());
  win.loadURL(`${ORIGIN}/`);
  return win;
}

// Accelerators still work with the bar hidden (Alt shows it on Windows and
// Linux). Zoom matters most here: it's how someone who needs larger text gets
// it in a desktop app, where there's no browser chrome to do it from.
function buildMenu() {
  const template = [
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Help",
      // The website's address lives in src/lib/site.js, which this process
      // can't import; Settings links to it from inside the app instead.
      submenu: [
        { label: "Source code", click: () => shell.openExternal("https://github.com/byjoelsamuel/workout-tracker") },
        { type: "separator" },
        { role: "about" },
      ],
    },
  ];
  if (process.platform === "darwin") template.unshift({ role: "appMenu" });
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// Links to anywhere but the app itself open in the system browser, and no page
// can open a second Electron window or navigate this one away from the app.
app.on("web-contents-created", (_event, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    openExternally(url);
    return { action: "deny" };
  });
  contents.on("will-navigate", (event, url) => {
    if (!url.startsWith(`${ORIGIN}/`)) {
      event.preventDefault();
      openExternally(url);
    }
  });
});

app.on("second-instance", () => {
  const [win] = BrowserWindow.getAllWindows();
  if (!win) return;
  if (win.isMinimized()) win.restore();
  win.focus();
});

app.whenReady().then(() => {
  if (process.platform === "win32") app.setAppUserModelId("com.byjoelsamuel.tsyokunaru");
  app.setAboutPanelOptions({
    applicationName: "Tsyoku-naru",
    applicationVersion: app.getVersion(),
    copyright: "MIT licence · 強くなる — “to become stronger”",
  });

  protocol.handle(SCHEME, serve);
  ipcMain.handle("update:check", (event) => (fromApp(event) ? checkForUpdate() : null));
  ipcMain.handle("update:download", (event) => {
    if (fromApp(event) && downloadUrl) shell.openExternal(downloadUrl);
  });
  // The app asks for no permissions (camera, notifications, location…), so
  // any request is something it didn't mean to make.
  session.defaultSession.setPermissionRequestHandler((_wc, _permission, callback) => callback(false));

  buildMenu();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
