// Offline support for the website, and above all for the installed app on a
// phone: it has to open in a gym basement with no signal.
//
// Not imported by the app. The service-worker plugin in vite.config.js reads
// this file at build time, fills in VERSION and PRECACHE from what the build
// actually emitted, and writes it out as /sw.js. VERSION is a hash of those
// files' contents, so any change to them, public/ included, is a new worker
// and a fresh cache.
const VERSION = "__VERSION__";
const PRECACHE = "__PRECACHE__";

const CACHE = `tsyoku-naru-${VERSION}`;
// Past this, a slow connection is treated as none and the cached app opens.
const NETWORK_TIMEOUT_MS = 3500;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("tsyoku-naru-") && key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

// Pages come from the network when it answers in time, so an online visit
// always gets the latest deploy; otherwise from the cached shell, whose
// scripts and styles were cached alongside it and so always match it. The
// fresh page is never written over the cached one for that reason: it may
// point at a newer build's files than this worker holds.
async function page(request) {
  const network = fetch(request);
  const timeout = new Promise((resolve) => setTimeout(resolve, NETWORK_TIMEOUT_MS));
  try {
    const response = await Promise.race([network, timeout]);
    if (response) return response;
  } catch {
    // Offline. Fall through to the cache.
  }
  return (await caches.match("/index.html")) ?? network;
}

// Everything else is cache-first. Built files carry a content hash in their
// name, so a cached copy is never stale; anything not precached (a font
// subset a name happened to need) is kept once fetched.
async function asset(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok && new URL(request.url).pathname.startsWith("/assets/")) {
    const copy = response.clone();
    caches.open(CACHE).then((cache) => cache.put(request, copy));
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  // Only this site's own GETs. Anything else goes straight to the network.
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(request.mode === "navigate" ? page(request) : asset(request));
});
