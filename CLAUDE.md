# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev         # start Vite dev server
npm run build       # production build to dist/
npm run preview     # preview a production build locally
npm run desktop     # build, then run the desktop app (Electron) on dist/
npm run dist:linux  # package Fedora .rpm + AppImage into release/ (needs rpmbuild)
npm run dist:win    # package the Windows installer into release/ (on Windows; cross-building needs 32-bit Wine)
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
| `src/pages/` | `Landing`, `Welcome` (profile picker, "Who's training?"), `Onboarding` (one-question-per-step profile setup), `Dashboard`, `Progress`, `Compare`, `Settings`, `About` — routed in `src/components/Layout.jsx`. `/onboarding` redirects to `/welcome` for old links. |
| `src/components/` | Page-level components (`BodyMap`, `HistoryList`, `LogForm`, `ExercisePicker`, `SetBuilder`, `SessionPanel`, `WorkoutBar`, `WorkoutSummary`, `WeeklyGoal`, `HeatLegend`, `Coach`, `Tour`, `ProfileFields`) plus `primitives.jsx` for shared building blocks (`Card`, `Button`, `PageHeader`, `AnimatedList`, `CountUp`, `Segmented`, `Switch`, `Field`). `Dialog.jsx` (dialogs, sheets, `ConfirmDialog`), `Toaster.jsx` (toasts with an optional action, e.g. Undo) and `Burst.jsx` (the PR/goal particle burst) are the shared overlays. |
| `src/lib/time.js` | Weeks, streaks, durations, clocks and relative days — all derived from logs, since finished workouts are not persisted. |
| `src/lib/heat.js` | Recency-decayed training heat per muscle group — the body map’s opacity, plus the session counts behind its tooltips. |
| `src/lib/records.js` | Personal bests and "last time" for a movement, derived from the log. Progress, Naru and the log form all read these — don't add another loop over the log for the same question. |
| `src/lib/profile.js` | Optional body details (bodyweight, height, age): ranges, validation, and the kg/cm ↔ lb/ft-in conversion used by onboarding and settings. |
| `src/lib/coach.js` | Naru: a deterministic full-body session generator over the exercise library and the user's own logs. No model, no network. |
| `desktop/` | The Electron shell: `main.cjs` (window, `app://` protocol, CSP, link handling, the GitHub update check) and `preload.cjs` (exposes only `window.tsyoku = { desktop, checkForUpdate, downloadUpdate }`). |
| `src/hooks/useUpdate.js`, `src/components/UpdatePrompt.jsx` | Desktop only: the "new version is out" toast at launch and the Updates row in Settings, sharing one answer per launch. |
| `src/lib/platform.js` | `isDesktop`, `isIOS`, `isInstalledWebApp`, `isApp`, `hasOwnStorage` — the only place the page branches on website vs. app vs. device. |
| `src/sw.js`, `serviceWorker()` in `vite.config.js`, `src/lib/serviceWorker.js`, `public/manifest.webmanifest` | The installable web app (iPhone Add to Home Screen, Android/desktop Install). `src/sw.js` is a template, not imported by the app; the Vite plugin fills it with the build's file list and writes `/sw.js`. |
| `electron-builder.yml`, `.github/workflows/desktop.yml` | Installer config, and the CI that builds Windows/Linux installers on PRs and publishes a GitHub Release when main gets an unreleased version (or a `v*` tag is pushed). |

`Dashboard` is the mid-workout screen — body map, log form, live session total, end workout. `Progress` is what you read *between* workouts — group breakdown, personal bests, full editable history. Keep that split; having history on the dashboard is what made it cluttered.

**Keep the visual language of `src/styles/global.css`**: Rubik (bundled via `@fontsource-variable/rubik`, never a font CDN — the desktop app is offline), flat cards with a hairline border, a violet accent used sparingly (light lavender `#b197fc` on black in dark mode, deeper `#7048e8` in light mode), centred page headers, the top nav. A revamp toward a sidebar, display fonts, gradient glows, glassy panels and a marketing-style landing page was rejected by the owner as looking generic and AI-made, and reverted; the orange accent was later dropped at the owner's request. New UI should look like it was always part of this stylesheet.

- **Text on an accent fill uses `--on-accent`**, never a literal `#fff`: the dark theme's lavender is too light for white type, so `--on-accent` is near-black there.
- **Size in rem, not px** (1–3px hairlines, focus rings and pill radii excepted). `html`'s font-size steps up at 1200/1600/2200px wide and scales the whole interface from that one value; a px length won't follow it. Media queries stay in px.
- **The theme flips with transitions off** (`data-theme-switching` on `<html>`, set by `paint()` in `useTheme.js`). Otherwise every element with a colour transition fades on its own clock and the page passes through a muddy half-and-half state — on the website, where the View Transitions reveal is missing or partial, that was all anyone saw.
- **`html` reserves the scrollbar gutter.** Pages cross-fade in one grid cell, and on Windows a classic scrollbar appearing mid-transition (short page → long page) shoved the whole layout 8px sideways. The desktop window is short enough that nearly every page scrolls, which is why it only showed on the website.

### Domain rules that aren't obvious from the code

- **Storage keys are a fixed wire format.** The live site has real user data under the strings in `storageKeys.js` — renaming one orphans existing users' history.
- **An entry holds one row per set:** `sets: [{ id, reps, weight }]`. Weight is null for bodyweight work. Older rows stored a count plus the single reps/weight every set shared (`{sets: 4, reps: 8, weight: 80}`), which could only ever describe identical sets.
- **Logs are normalised on read, never migrated in place.** `normalizeLog` in `store.js` expands the legacy shape and backfills `timed`/`bodyweight`/`workoutId` as rows load; storage keeps whatever shape it had until a write touches that row, and editing promotes just that row. Anything reading logs must go through `getLogsForUser`, never `localStorage` directly, or it will meet both shapes. When you add a field, backfill it there.
- **Body groups are the source of truth.** `src/lib/bodyGroups.js` defines the seven muscle groups (`shoulders`, `chest`, `back`, `arms`, `abs`, `legs`, `calves`); the body map's SVG regions and the exercise picker both derive from this list.
- **Exercises belong to exactly one group** — the muscle doing most of the work (deadlift → `back`, dip → `chest`) — so the body map doesn't double-count a session. Two independent flags in `src/lib/exercises.js`: `bodyweight` (hides the weight field) and `timed` (seconds, not reps). They are not a two-value enum — a weighted plank is timed *and* loaded. Timed work is excluded from rep and volume totals, since seconds convert to neither. `findExercise` returns `null` for anything not in the library, since pre-library logs hold free text and must still render.
- **Body map SVG is vendored, not installed.** `src/lib/bodySvg.js` copies polygon coordinates from `react-body-highlighter` (MIT, see `THIRD-PARTY.md`) because this app needs continuous `fillOpacity` animation and CSS-driven theming, not the library's discrete color steps. It draws in two layers: a neutral base so untrained muscles stay legible, and an accent heat layer on top. Structure (head, neck, knees) is deliberately quieter than muscle.
- **Kilograms are the only storage unit**, always — including rows logged before unit conversion existed. Pounds exist only at the UI edges; `src/lib/units.js`'s `toKg`/`fromKg` convert in/out so switching display units never rewrites history.
- **A workout session is `{ id, startedAt }`**; logs reference it via `workoutId`, not the reverse. `addLog` calls `ensureActiveWorkout`, so there is no Start button. Ending a workout deletes the session record and cannot be undone — which is why the dashboard confirms first — and a browser closing mid-session just resumes it next load.
- **Finished workouts are not stored.** `endWorkout` deletes the session record and hands its contents straight to the summary, so anything counting *workouts* (rather than entries) has to derive them from the logs. `src/lib/time.js` does that by grouping on `workoutId`, falling back to the local calendar day for pre-session rows that have none — a day of legacy rows counts as one workout, which is the honest floor.
- **Profiles are normalised on read too**, exactly like logs: `normalizeUser` in `store.js` backfills `weeklyGoal`, and `updateUser` rewrites one row and leaves the rest in whatever shape they had. Same rule as `normalizeLog` — when you add a profile field, backfill it there rather than migrating storage.
- **The weekly goal is a calendar week (Mon–Sun)**, not the rolling seven days `getSummary("week")` and the compare page use. A rolling window makes a meter that read 3 of 3 last night read 2 of 3 this morning with nothing having happened; that is fine for a leaderboard and wrong for a target. The streak counts consecutive weeks *trained*, deliberately not weeks that met the goal — the goal is editable, so tying the streak to it would rewrite the user’s past the moment they raised it.
- **The body map decays; it does not accumulate.** `src/lib/heat.js` weights each session by `0.5 ** (daysAgo / 7)` and sums per group, so the figure shows what you have worked *lately*. A lifetime count could only ever rise — five sessions pinned a group at full accent forever, and after a couple of months every muscle was saturated and the map said nothing at all. Score per **session**, never per log row, or a workout holding four chest movements counts four times as loud as one holding a single movement. The Progress page keeps the undecayed lifetime counts; that is the question it exists to answer.
- **Naru plans full-body sessions, not a PPL split.** `src/lib/coach.js` picks one compound per movement pattern (push/pull/legs), then accessories aimed at whatever `recencyHeat` says is stalest, then core. A split only pays off above four sessions a week, and the weekly goal defaults to three. It is **deterministic** — seeded from the date, so reopening the panel mid-workout returns the same list instead of reshuffling under you; `nonce` is what "New plan" bumps. Movements already in the log rank first, so a real working weight can be offered (your best set minus 10%); repeating last session is allowed for compounds and refused for accessories. It opens as a sheet from "Plan with Naru" in the dashboard's log card — the old floating corner button covered the body map and personal bests on phones. Each movement's "Log" hands it to the log form (the dashboard owns the selected exercise for that reason), and the plan is frozen while the sheet is open so ticking movements off can't reshuffle it.
- **Active profile lives in the URL** as `?user=<id>` (see `Dashboard.jsx`), not route params or context. `Layout.jsx` keys routes on `location.search` so switching `?user=A` → `?user=B` remounts `Dashboard` even though the pathname doesn't change. Nav links have to carry `?user=` forward or they bounce to onboarding.
- **Theme is set before first paint** by the unbundled `public/theme-init.js` (blocking `<script>` in `index.html`), writing `data-theme` on `<html>`. Everything else reads CSS custom properties, so only the toggle button needs `useTheme`.
- **Onboarding guide requires both** `hasSeenGuide.<userId>` being unset *and* zero logs — existing users upgraded without that flag ever being set, so the flag alone would re-trigger the tutorial for people with months of history. Settings → "Show the walkthrough" replays it by navigating to the dashboard with router state `{ tour: true }`; that never clears the flag.
- **Anything counting "sessions" counts workouts, not rows.** `getSummary` (and so the compare page) groups by `sessionKey` like `time.js` and `heat.js` do; it used to add one per log row, so three movements in one evening read as "3 sessions". Naru's session count and "last session" use `sessionKey` too — never `loggedAt.slice(0, 10)`, which is a UTC date.
- **Backup import merges, never replaces.** `importBackup` skips any row whose id already exists and drops logs whose profile isn't present, so re-importing a file — or importing an old one — can't roll anything back. Export writes rows raw, exactly as stored; normalising on the way out would be a migration by another name.
- **Undoing a log can close the session.** `undo` in `useExerciseLog` deletes the row, then `discardWorkoutIfEmpty` drops the active workout only if it now holds no rows — otherwise undoing the first entry left a workout "in progress" with nothing in it.
- **Profile edits write only the fields that changed** (`changedPatch` in `Settings.jsx`). A height entered in feet doesn't round-trip exactly (180 cm → 180.3), so saving every field would drift an untouched height each time someone renamed themselves.
- **Theme preference "system" is the absence of the theme key** — exactly what `theme-init.js` already reads as "follow the OS" — so no stored value changed meaning when the option was added.

### Desktop app

- **It is the website's build, unchanged.** `desktop/main.cjs` serves `dist/` over a registered `app://tsyoku-naru` scheme, with the same index.html fallback as `vercel.json`. Don't fork UI for the app; branch on `isDesktop` only where something would be *wrong* there (the landing page, the download prompt, the W3C validator links).
- **`app://tsyoku-naru` is a wire format**, like the storage keys: localStorage is keyed by origin, so changing the scheme or host orphans every installed user's history. Same for `productName` ("Tsyoku-naru"), which names the data folder. The rpm's package name (`tsyoku-naru`, via `extraMetadata` in `electron-builder.yml`) is separate and safe to change.
- **The app's data is separate from the website's.** Settings → Backup is how history moves between them; the copy in About and Settings says so — keep it accurate.
- **The main process can't import `src/lib/site.js`**, so it must not hard-code the website's host either; links to it go through the page.
- External links open in the system browser and nothing can navigate the window off `app://` (`web-contents-created` in `main.cjs`). The CSP is set in the protocol handler.
- `node_modules` is excluded from the package — Vite has already bundled everything the page needs. If the main process ever needs a runtime dependency, that exclusion has to change.
- Installer file names carry no version, so `releases/latest/download/<name>` links stay stable.
- **Updates are announced, not installed.** At launch the main process asks `api.github.com/.../releases/latest`; if it's newer than `app.getVersion()`, the page shows a toast whose Download opens the matching installer (`.exe`, AppImage when `$APPIMAGE` is set, else `.rpm`). Installing in place would need `electron-updater` at runtime, which the `node_modules` exclusion rules out. The download URL only ever comes from GitHub's answer — the page can't pass one — and both IPC handlers refuse senders off `app://tsyoku-naru`. About tells the user this is the app's one network request; keep that true.
- **Releasing is "bump `package.json`'s version, merge to main".** The workflow's `plan` job publishes `v<version>` from a push to main only when that tag doesn't exist yet, creating the tag through the release API. A hand-pushed `v*` tag also publishes, and must equal `v` + `package.json`'s version — the workflow refuses a mismatch. Sessions here can push only their own branch, not tags, which is why the main-push route exists.

### Installed web app (iPhone, Android)

- **The service worker is generated.** The `serviceWorker()` plugin precaches every file the build emitted plus every top-level file in `public/` (not subfolders), and versions the worker by a hash of their contents, so any change at all is a new worker with a fresh cache. Don't hand-maintain a file list.
- **Pages are network-first (3.5s timeout), files are cache-first.** An online launch always gets the latest deploy; offline or on a dead connection it opens the cached shell. A freshly fetched page is never written over the cached `index.html`, because it may reference a newer build's files than the worker holds.
- **Never registered in dev or in the desktop app.** Electron's `app://` scheme can't host a worker (even `getRegistrations()` throws there), and the app already serves from disk.
- **An iOS Home Screen app has its own storage, separate from Safari's**, so a user who installs it starts empty and moves history in with Backup. `hasOwnStorage` drives the copy that says so. Android/desktop installs share the browser's storage, so that copy must not claim otherwise there. On iOS, Export goes through the share sheet (Save to Files) rather than a download.
- **An installed app skips the landing page** (`isApp` in `Layout.jsx`), like the desktop app.
- **Touch screens get 16px inputs at least** (the `(pointer: coarse)` block in `global.css`). iOS zooms the page into any smaller field on focus and stays zoomed, so a new text input needs adding to that block.
- **Anything pinned to a screen edge adds `env(safe-area-inset-*)`.** `viewport-fit=cover` gives the page the area under the notch and home indicator. The status bar style is `default`: `black-translucent` would draw white status text over the page, which vanishes on the light theme.

### Animation

`src/lib/motionVariants.js` holds the shared vocabulary: transform-led springs, with opacity only ever a supporting cue.

One rule that has caused the same bug twice (page transitions, then the history editor): **anything inside `AnimatePresence` must exit on a tween, not a spring.** AnimatePresence unmounts when the exit animation *resolves*, and a spring resolves by settling — so a spring exit leaves the element in the DOM long after it looks gone, and an exit that settles above `opacity: 0` never leaves at all.

Dialogs, sheets, toasts and the walkthrough render through a portal into `<body>`. Pages animate with transforms, and a transformed ancestor turns `position: fixed` into "fixed to that ancestor" — which is why the end-workout bar inside `<main>` is `sticky`, not `fixed`.

The walkthrough's spotlight (`Tour.jsx`) is one element whose huge box-shadow dims the page; it springs between targets, so keep it a single element rather than a mask per step.

Onboarding steps use `AnimatePresence mode="wait"`, so focus for a new step is set from a ref callback on the step's element — an effect keyed on the step runs while the outgoing step is still the one in the DOM.

### Other notes

- `src/lib/` and `src/hooks/` have inline comments explaining *why*, not what — read them before changing behavior there. Match that density rather than narrating the code.
- CSS grids that hold user-supplied text use `minmax(0, 1fr)`, not `1fr` — a bare `fr` floors at `min-content`, so a long movement name widens the column past the viewport on narrow screens.
- Deployed to Vercel (`vercel.json`), which auto-deploys `main` from GitHub. The catch-all rewrite to `/index.html` is **required**, not boilerplate: no file exists on disk at `/about` or `/dashboard`, so without it every route except `/` 404s on a deep link or hard refresh — which is exactly what the first Vercel deploy did before `vercel.json` existed. Vercel matches real files before applying rewrites, so `/assets/*` and `/theme-init.js` are unaffected. `netlify.toml` is kept as a fallback and carries the same rule in Netlify's syntax; if you change one, change both.
- **Nothing may hard-code the deployed host.** `src/lib/site.js` owns it — `publicOrigin()` derives it from `window.location` and falls back to `SITE_URL` only on localhost, where the W3C validators can't reach. The About page's validator links used to write the host out by hand in three places, and all three still pointed at Netlify after the move.
