# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # start Vite dev server
npm run build     # production build to dist/
npm run preview   # preview a production build locally
```

No lint or test setup exists in this repo — don't invent `npm run lint` / `npm test`.

## Architecture

Client-side React SPA (Vite + `react-router-dom`), **no backend**. All state lives in browser `localStorage`. No state management library — `useState` plus a plain I/O module is enough at this size.

### Where things live

| Path | Purpose |
|---|---|
| `src/lib/store.js` | Only module that touches `localStorage`. Plain functions (not hooks) — users, logs, workout sessions, unit preference all persist through here. |
| `src/lib/storageKeys.js` | Every localStorage key, in one place. |
| `src/hooks/useStore.js` | Reactive wrappers around `store.js` — adds just enough local state to re-render after a write. Read alongside `store.js`, not instead of it. |
| `src/pages/` | `Landing`, `Onboarding`, `Dashboard`, `Compare`, `About` — routed in `src/components/Layout.jsx`. |
| `src/components/` | Page-level components (`BodyMap`, `HistoryList`, `LogForm`, `WorkoutSummary`, `OnboardingGuide`) plus `primitives.jsx` for shared building blocks (`Card`, `Button`, `PageHeader`, `AnimatedList`, `StatRow`). |

### Domain rules that aren't obvious from the code

- **Storage keys are a fixed wire format.** The live site has real user data under the strings in `storageKeys.js` — renaming one orphans existing users' history.
- **Body groups are the source of truth.** `src/lib/bodyGroups.js` defines the seven muscle groups (`shoulders`, `chest`, `back`, `arms`, `abs`, `legs`, `calves`); the body map's SVG regions and the log form's dropdown both derive from this list.
- **Exercises belong to exactly one group** — the muscle doing most of the work (deadlift → `back`, dip → `chest`) — so the body map doesn't double-count a session. Two independent flags in `src/lib/exercises.js`: `bodyweight` (hides the weight field) and `timed` (seconds, not reps). `findExercise` returns `null` for anything not in the library, since pre-library logs hold free text and must still render.
- **Body map SVG is vendored, not installed.** `src/lib/bodySvg.js` copies polygon coordinates from `react-body-highlighter` (MIT, see `THIRD-PARTY.md`) because this app needs continuous `fillOpacity` animation and CSS-driven theming, not the library's discrete color steps.
- **Kilograms are the only storage unit**, always — including rows logged before unit conversion existed. Pounds exist only at the UI edges; `src/lib/units.js`'s `toKg`/`fromKg` convert in/out so switching display units never rewrites history.
- **A workout session is `{ id, startedAt }`**; logs reference it via `workoutId`, not the reverse. Ending a workout deletes the session record — a browser closing mid-session just resumes it next load.
- **Active profile lives in the URL** as `?user=<id>` (see `Dashboard.jsx`), not route params or context. `Layout.jsx` keys routes on `location.search` so switching `?user=A` → `?user=B` remounts `Dashboard` even though the pathname doesn't change.
- **Theme is set before first paint** by the unbundled `public/theme-init.js` (blocking `<script>` in `index.html`), writing `data-theme` on `<html>`. Everything else reads CSS custom properties, so only the toggle button needs `useTheme`.
- **Onboarding guide requires both** `hasSeenGuide.<userId>` being unset *and* zero logs — existing users upgraded without that flag ever being set, so the flag alone would re-trigger the tutorial for people with months of history.

### Other notes

- `src/lib/` and `src/hooks/` have inline comments explaining *why*, not what — read them before changing behavior there.
- Deployed to Netlify (`netlify.toml`); the `/* -> /index.html` SPA redirect is required for deep links like `/dashboard?user=…` to survive a hard refresh.
