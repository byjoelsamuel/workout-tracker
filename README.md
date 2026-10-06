# 🏋️ Tsyoku-naru — Workout Tracker

![GitHub last commit](https://img.shields.io/github/last-commit/byjoelsamuel/workout-tracker)
![GitHub license](https://img.shields.io/github/license/byjoelsamuel/workout-tracker)
![Latest release](https://img.shields.io/github/v/release/byjoelsamuel/workout-tracker)

Log every set, and watch an anatomical body map show which muscles you've
trained lately — and which you've been skipping. Free, private, no account:
everything stays on your device.

**強くなる** (*tsuyoku naru*) — "to become stronger."

## Get it

| Where | How |
|---|---|
| **Web** | [workout-tracker-alpha-two-23.vercel.app](https://workout-tracker-alpha-two-23.vercel.app/) — also mirrored at [tsyoku-naru.netlify.app](https://tsyoku-naru.netlify.app/). Both deploy from `main`. |
| **Windows 11** | [`Tsyoku-naru-Setup-x64.exe`](https://github.com/byjoelsamuel/workout-tracker/releases/latest/download/Tsyoku-naru-Setup-x64.exe). Not code-signed, so choose **More info → Run anyway** if SmartScreen asks. |
| **Fedora** | `sudo dnf install https://github.com/byjoelsamuel/workout-tracker/releases/latest/download/Tsyoku-naru-x86_64.rpm` |
| **Other Linux** | [`Tsyoku-naru-x86_64.AppImage`](https://github.com/byjoelsamuel/workout-tracker/releases/latest/download/Tsyoku-naru-x86_64.AppImage) — `chmod +x` and run (needs `fuse-libs`). |
| **iPhone / iPad** | Open the website in Safari → **Share → Add to Home Screen**. Works offline. |
| **Android** | Open the website in Chrome → menu → **Install app**. |

**Good to know**

- **Each install keeps its own history** — the website, the desktop app and an
  iPhone Home Screen app don't share data. Move it with **Settings → Backup**
  (export on one, import on the other; importing never overwrites anything).
- **Updates:** the website and phone app update themselves. The desktop app
  (1.2.0 and later) tells you when a new version is out, with a Download button;
  install it over the top and your history stays. **Settings → Help → Updates**
  checks on demand and says why if it can't.

## Features

- **Per-set logging** from a 157-movement library — each set keeps its own reps
  and weight, and a movement you've done before starts from last time
- **Body map** (front and back) that fades over a few weeks, so it shows what
  you've worked *lately*
- **Weekly goal** with a streak, a **rest timer**, **undo**, and a call-out when
  you beat a personal best
- **Progress** — lifetime sessions per muscle group, personal bests, full
  editable history
- **Naru** — an optional planner that builds a full-body session from your own
  logs, entirely on your device
- **kg or lb**, dark or light theme, keyboard-friendly, reduced-motion aware

## Develop

```bash
npm install
npm run dev         # http://localhost:5173
npm run build       # production build into dist/
npm run desktop     # build, then open the Electron app
npm run dist:linux  # Fedora .rpm + AppImage into release/
```

React 19 + Vite + React Router + Motion; data in `localStorage`; desktop via
Electron; offline via a generated service worker. The modules in `src/lib/`
explain, in their comments, the rules that keep old data meaning the same thing.

**Releasing:** bump `version` in `package.json` and merge to `main`. GitHub
Actions builds the Windows installer and Linux packages and publishes the
`v<version>` release. Merges that don't change the version only redeploy the
website.

## Changelog

<details open>
<summary><strong>1.3.1</strong> — 6 Oct 2026 · bug fixes from a full code review</summary>

- **Works over plain HTTP on a local network.** Served from a homelab box or
  `vite --host` and opened by IP, the app crashed on the first save
  (`crypto.randomUUID` only exists on HTTPS/localhost) and no profile could be
  created. IDs now fall back to `crypto.getRandomValues`.
- **The history editor validates before saving.** It used to store whatever it
  was given — a negative weight was saved and subtracted from lifetime volume,
  and a cleared reps box saved a set with no reps. The log form and the editor
  now share one check: whole-number reps, no negative weights, and anything
  over 1,000 reps or 1,000 kg is flagged as a likely typo.
- **The rest timer field accepts typing.** Each keystroke was saved and clamped
  as it landed, so typing 120 ended up as 600. Typing now saves when you leave
  the field; the − / + buttons still save at once.
- **Corrupted storage no longer breaks every page.** An unreadable value now
  reads as empty, with the raw text kept aside under a `.unreadable` key so
  nothing is lost.
- The dashboard header's workout duration froze at whatever it read when the
  page last re-rendered; it now just says the workout is in progress, next to
  the live clock in the pinned bar.
- The walkthrough said muscles "glow orange"; profile lists said "this browser"
  inside the desktop and iPhone apps; the walkthrough card didn't scale with the
  rest of the interface on big screens.
- Desktop: a second launch could briefly open a window of its own before
  handing over to the one already running.
- About page wording rewritten in plain language; the layout is unchanged.

</details>

<details>
<summary><strong>1.3.0</strong> — 1 Oct 2026 · iPhone app, one-screen About, update diagnostics</summary>

- **Installable on iPhone and iPad** from Safari's *Add to Home Screen*, and on
  Android/desktop Chrome via *Install app*: web app manifest, full-bleed icons,
  iOS meta tags.
- **Works offline.** A service worker, generated at build time with the exact
  list of built files, caches the whole app after the first visit. Pages are
  network-first (3.5 s timeout) so an online launch always gets the latest
  deploy; files are cache-first.
- An installed app opens straight to your dashboard instead of the landing page.
  On iPhone in Safari, the landing page shows how to install.
- iPhone fixes: text fields are at least 16 px on touch screens (iOS was zooming
  into every field and staying zoomed); the end-workout bar, bottom sheets and
  walkthrough card clear the home indicator; Export opens the share sheet
  (*Save to Files*).
- **About page** rebuilt as one screen: two mirrored cards — *How it works* and
  *Your data* — instead of eight sections of prose. Fits without scrolling from
  1280×720 up.
- **Desktop updates:** when the check can't reach GitHub, Settings now shows why.
- Cleanup: removed styles for markup that no longer exists and four needless
  exports. README rewritten.

</details>

<details>
<summary><strong>1.2.0</strong> — 1 Oct 2026 · purple theme, Rubik, bigger UI, smoother motion, update prompt</summary>

- **New colours:** light lavender on black (dark mode) and violet on white
  (light mode), replacing orange. Text on accent fills uses a dedicated
  near-black so it stays readable on lavender. New purple app icon.
- **Rubik** replaces the system font stack (which fell back to Arial on Windows),
  bundled so the desktop app has it offline.
- **Scales up on bigger screens:** the stylesheet moved to `rem`, and the root
  size steps up at 1200 / 1600 / 2200 px wide. Phones and laptops unchanged.
- **Fixed the website's glitchy theme switch:** colours faded on different
  clocks, passing through ~15 washed-out grey frames. Everything now flips in
  one frame, under a circular reveal where supported.
- **Fixed page transitions shoving sideways** on Windows when the scrollbar
  appeared mid-animation; dark mode now has a dark scrollbar.
- Springs damped so buttons stop wobbling; page transitions no longer scale.
- **Desktop app announces new versions** at launch with a Download button for the
  right installer; Settings → Help → Updates checks on demand.
- Fixed the set editor's reps box sitting lower than the weight box.

</details>

<details>
<summary><strong>1.1.0</strong> — 1 Oct 2026 · guided sign-in, settings, backup, desktop app</summary>

- **"Who's training?"** profile picker, and a step-by-step setup for new profiles
  (name → weekly goal → kg/lb → optional body details), each answer checked as
  you go.
- **Walkthrough** of the dashboard on first visit — arrow keys, skip, or replay
  from Settings.
- **Logging feedback:** a confirmation with **Undo** after each log, a personal
  best call-out (with a burst), a **rest timer** (±30 s / skip), and sets
  prefilled from last time.
- **Exercise picker** with recent movements, search (press `/`), and browsing by
  muscle group — or tap a muscle on the body map.
- **Settings page:** edit profile, units, rest timer, theme (system / light /
  dark), Naru on/off, replay walkthrough, delete profile.
- **Backup:** export every profile to JSON and import elsewhere; importing only
  adds what's missing.
- **Desktop app for Windows 11 and Fedora** (Electron): `.exe`, `.rpm` and
  AppImage, built and released by GitHub Actions whenever `main` gets a new
  version.
- Bug fixes: the Compare page counted every logged row as a "session" (three
  movements in one evening read as 3); undoing the only entry left an empty
  workout "in progress"; renaming yourself drifted a height entered in feet;
  a render error left a blank page with no way out; dialogs now trap and return
  focus.
- Kept the original layout and visual style after a trial redesign looked too
  generic.

</details>

<details>
<summary><strong>Late Aug – Sep 2026</strong> — weekly goal, decaying body map, Vercel, full-body Naru</summary>

- **Weekly goal** (Monday–Sunday) with a streak of consecutive weeks trained,
  a real heat legend, and an end-workout bar pinned to the bottom of the screen.
- **Body map decays** instead of accumulating: a session counts fully the day
  it's logged and half a week later. Before, every muscle saturated after a
  couple of months and the map said nothing.
- **Moved hosting to Vercel**, with the catch-all rewrite that stops deep links
  404ing on refresh; nothing hard-codes the host any more.
- **Naru rebuilt** as a full-body planner — one push, one pull and one leg
  compound, accessories aimed at your stalest muscles, core — with starting
  weights from your best sets minus ~10 %, opened as a sheet from "Plan with
  Naru".

</details>

<details>
<summary><strong>Mid Aug 2026</strong> — anatomical body map, sessions, per-set logging, Naru</summary>

- **Anatomical body map**, front and back, replacing twelve rounded rectangles
  (geometry from react-body-highlighter, MIT).
- **Workout sessions:** a session opens with your first entry and ends with a
  summary of volume, reps, sets and the hardest-worked group.
- **kg or lb**, stored as kilograms so switching never rewrites history.
- **Set-by-set logging** — a warm-up ramp is recorded as it happened instead of
  averaged into one row — plus editing and deleting past entries, and − / +
  steppers.
- Logging (Dashboard) split from reading back (Progress).
- **Naru** first appears as a Push/Pull/Legs suggestion widget.
- Fixed a page transition that left a ghost of the old page behind.

</details>

<details>
<summary><strong>Early Aug 2026</strong> — first versions</summary>

- First static HTML/CSS site with onboarding, dashboard and compare pages.
- Briefly ran on an Express + SQLite backend, then went fully client-side with
  `localStorage` — no server, nothing leaves your device.
- Dark/light theme toggle, About page, and the Tsyoku-naru name.
- **Rewritten as a React single-page app** (Vite, React Router, Motion) with
  animated page transitions and a first-run guide.
- **Exercise library** grouped by muscle, with sets, reps and weight; bodyweight
  moves hide the weight field and holds like the plank ask for seconds.

</details>

## Credits & license

Body map geometry from [react-body-highlighter](https://github.com/giavinh79/react-body-highlighter)
(MIT); typeface [Rubik](https://github.com/googlefonts/rubik) (OFL). See
[`THIRD-PARTY.md`](THIRD-PARTY.md). Released under the MIT License — see
[`LICENSE`](LICENSE).

Built by [Joel Samuel](https://github.com/byjoelsamuel)
