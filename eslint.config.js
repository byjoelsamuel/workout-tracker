// Lint config (ESLint flat config). Recommended rules plus the React hooks
// rules, with the right globals for each part of the repo: the app runs in a
// browser, the desktop shell and build scripts in Node.
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  { ignores: ["dist/", "release/", "android/", "node_modules/", "test-results/", "playwright-report/"] },
  js.configs.recommended,
  {
    files: ["src/**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      // __APP_VERSION__ is replaced at build time (vite.config.js `define`).
      globals: { ...globals.browser, __APP_VERSION__: "readonly" },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      // JSX use isn't tracked without the full React plugin, so capitalised
      // names (components, motion.*) are allowed through.
      "no-unused-vars": ["error", { varsIgnorePattern: "^[A-Z_]|^motion$", argsIgnorePattern: "^_", ignoreRestSiblings: true }],
    },
  },
  {
    files: ["src/sw.js"],
    languageOptions: { globals: globals.serviceworker },
  },
  {
    files: ["desktop/**/*.cjs", "*.config.js", "scripts/**/*.{js,cjs,mjs}"],
    languageOptions: { globals: globals.node, sourceType: "commonjs" },
  },
  {
    files: ["*.config.js", "scripts/**/*.mjs"],
    languageOptions: { sourceType: "module" },
  },
  {
    files: ["public/**/*.js"],
    languageOptions: { globals: globals.browser, sourceType: "script" },
  },
  {
    files: ["tests/**/*.{js,jsx}", "e2e/**/*.js"],
    languageOptions: { globals: { ...globals.node, ...globals.browser }, sourceType: "module" },
  },
];
