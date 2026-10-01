import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const { version } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));

// Writes /sw.js from src/sw.js, filled in with every file this build emitted
// plus everything in public/ to precache, and a hash of their contents as its
// version. Hand-rolled rather than a PWA plugin: it's one list and one hash,
// and the worker it produces stays short enough to read.
function serviceWorker() {
  return {
    name: "tsyoku-service-worker",
    apply: "build",
    // After Vite's own plugins, so index.html is already in the bundle.
    enforce: "post",
    generateBundle(_options, bundle) {
      const files = new Map();
      for (const [name, file] of Object.entries(bundle)) {
        files.set(`/${name}`, file.type === "chunk" ? file.code : file.source);
      }
      const publicDir = new URL("./public/", import.meta.url);
      for (const entry of readdirSync(publicDir, { withFileTypes: true })) {
        if (entry.isFile()) files.set(`/${entry.name}`, readFileSync(new URL(entry.name, publicDir)));
      }
      const urls = [...files.keys()].sort();
      const hash = createHash("sha256");
      for (const url of urls) hash.update(url).update(files.get(url));
      const source = readFileSync(new URL("./src/sw.js", import.meta.url), "utf8")
        .replace('"__VERSION__"', JSON.stringify(hash.digest("hex").slice(0, 12)))
        .replace('"__PRECACHE__"', JSON.stringify(urls));
      this.emitFile({ type: "asset", fileName: "sw.js", source });
    },
  };
}

export default defineConfig({
  plugins: [react(), serviceWorker()],
  // Shown in Settings and About. The desktop shell reports its own version at
  // runtime too, but they come from the same package.json.
  define: { __APP_VERSION__: JSON.stringify(version) },
});
