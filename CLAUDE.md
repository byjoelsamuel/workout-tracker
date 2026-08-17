# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # start Vite dev server
npm run build     # production build to dist/
npm run preview   # preview a production build locally
```

No lint or test setup exists in this repo — don't invent `npm run lint` / `npm test`. Changes are verified by driving the real app in a browser, and by seeding `localStorage` with legacy-shaped rows to confirm old data still renders and still totals the same. Do that for anything touching `store.js` or `units.js`: silently changing what a past session meant is the worst failure mode this app has.

## Architecture

Client-side React SPA (Vite + `react-router-dom`), **no backend**. All state lives in browser `localStorage`. No state management library — `useState` plus a plain I/O module is enough at this size.

### Where things live

| Path | Purpose |
|---|---|
| `src/lib/store.js` | Only module that touches `localStorage`. Plain functions (not hooks) — users, logs, workout sessions, unit preference all persist through here. |
| `src/lib/storageKeys.js` | Every localStorage key, in one place. |
| `src/hooks/useStore.js` | Reactive wrappers around `store.js` — adds just enough local state to re-render after a write. Read alongside `store.js`, not instead of it. |
| `src/pages/` | `Landing`, `Onboarding`, `Dashboard`, `Progress`, `Compare`, `About` — routed in `src/components/Layout.jsx`. |
| `src/components/` | Page-level components (`BodyMap`, `HistoryList`, `LogForm`, `ExercisePicker`, `SetBuilder`, `SessionPanel`, `WorkoutSummary`, `OnboardingGuide`) plus `primitives.jsx` for shared building blocks (`Card`, `Button`, `PageHeader`, `AnimatedList`, `StatRow`). |

`Dashboard` is the mid-workout screen — body map, log form, live session total, end workout. `Progress` is what you read *between* workouts — group breakdown, personal bests, full editable history. Keep that split; having history on the dashboard is what made it cluttered.

### Domain rules that aren't obvious from the code

- **Storage keys are a fixed wire format.** The live site has real user data under the strings in `storageKeys.js` — renaming one orphans existing users' history.
- **An entry holds one row per set:** `sets: [{ id, reps, weight }]`. Weight is null for bodyweight work. Older rows stored a count plus the single reps/weight every set shared (`{sets: 4, reps: 8, weight: 80}`), which could only ever describe identical sets.
- **Logs are normalised on read, never migrated in place.** `normalizeLog` in `store.js` expands the legacy shape and backfills `timed`/`bodyweight`/`workoutId` as rows load; storage keeps whatever shape it had until a write touches that row, and editing promotes just that row. Anything reading logs must go through `getLogsForUser`, never `localStorage` directly, or it will meet both shapes. When you add a field, backfill it there.
- **Body groups are the source of truth.** `src/lib/bodyGroups.js` defines the seven muscle groups (`shoulders`, `chest`, `back`, `arms`, `abs`, `legs`, `calves`); the body map's SVG regions and the exercise picker both derive from this list.
- **Exercises belong to exactly one group** — the muscle doing most of the work (deadlift → `back`, dip → `chest`) — so the body map doesn't double-count a session. Two independent flags in `src/lib/exercises.js`: `bodyweight` (hides the weight field) and `timed` (seconds, not reps). They are not a two-value enum — a weighted plank is timed *and* loaded. Timed work is excluded from rep and volume totals, since seconds convert to neither. `findExercise` returns `null` for anything not in the library, since pre-library logs hold free text and must still render.
- **Body map SVG is vendored, not installed.** `src/lib/bodySvg.js` copies polygon coordinates from `react-body-highlighter` (MIT, see `THIRD-PARTY.md`) because this app needs continuous `fillOpacity` animation and CSS-driven theming, not the library's discrete color steps. It draws in two layers: a neutral base so untrained muscles stay legible, and an accent heat layer on top. Structure (head, neck, knees) is deliberately quieter than muscle.
- **Kilograms are the only storage unit**, always — including rows logged before unit conversion existed. Pounds exist only at the UI edges; `src/lib/units.js`'s `toKg`/`fromKg` convert in/out so switching display units never rewrites history.
- **A workout session is `{ id, startedAt }`**; logs reference it via `workoutId`, not the reverse. `addLog` calls `ensureActiveWorkout`, so there is no Start button. Ending a workout deletes the session record and cannot be undone — which is why the dashboard confirms first — and a browser closing mid-session just resumes it next load.
- **Active profile lives in the URL** as `?user=<id>` (see `Dashboard.jsx`), not route params or context. `Layout.jsx` keys routes on `location.search` so switching `?user=A` → `?user=B` remounts `Dashboard` even though the pathname doesn't change. Nav links have to carry `?user=` forward or they bounce to onboarding.
- **Theme is set before first paint** by the unbundled `public/theme-init.js` (blocking `<script>` in `index.html`), writing `data-theme` on `<html>`. Everything else reads CSS custom properties, so only the toggle button needs `useTheme`.
- **Onboarding guide requires both** `hasSeenGuide.<userId>` being unset *and* zero logs — existing users upgraded without that flag ever being set, so the flag alone would re-trigger the tutorial for people with months of history.

### Animation

`src/lib/motionVariants.js` holds the shared vocabulary: transform-led springs, with opacity only ever a supporting cue.

One rule that has caused the same bug twice (page transitions, then the history editor): **anything inside `AnimatePresence` must exit on a tween, not a spring.** AnimatePresence unmounts when the exit animation *resolves*, and a spring resolves by settling — so a spring exit leaves the element in the DOM long after it looks gone, and an exit that settles above `opacity: 0` never leaves at all.

The guide arrows in `OnboardingGuide.jsx` derive their arrowhead angle from the same Bézier control point that draws the curve; don't hard-code a head direction, it only lines up when the arrow happens to arrive vertically.

### Other notes

- `src/lib/` and `src/hooks/` have inline comments explaining *why*, not what — read them before changing behavior there. Match that density rather than narrating the code.
- CSS grids that hold user-supplied text use `minmax(0, 1fr)`, not `1fr` — a bare `fr` floors at `min-content`, so a long movement name widens the column past the viewport on narrow screens.
- Deployed to Netlify (`netlify.toml`); the `/* -> /index.html` SPA redirect is required for deep links like `/dashboard?user=…` to survive a hard refresh.
