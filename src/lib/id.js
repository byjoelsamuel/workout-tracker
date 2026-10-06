// Ids for profiles, entries, sets and workouts.
//
// crypto.randomUUID only exists in a secure context (https, or localhost), so
// served over plain http on a LAN address — a homelab box, or `vite --host`
// opened from a phone — the app threw on the first save and no profile could
// be created. getRandomValues works everywhere; the fallback builds the same
// RFC 4122 version-4 shape from it, so ids look the same whichever made them.
export function newId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
