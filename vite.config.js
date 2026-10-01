import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const { version } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));

export default defineConfig({
  plugins: [react()],
  // Shown in Settings and About. The desktop shell reports its own version at
  // runtime too, but they come from the same package.json.
  define: { __APP_VERSION__: JSON.stringify(version) },
});
