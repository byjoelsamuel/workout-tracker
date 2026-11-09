import { defineConfig } from "vitest/config";

// Unit tests for src/lib. jsdom supplies localStorage for the store tests.
// The browser test in e2e/ runs under Playwright instead (playwright.config.js).
export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify("test") },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.js"],
  },
});
