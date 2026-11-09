# Changelog

All notable changes to Tsyoku-naru. Newest first. Releases are cut by bumping
`version` in `package.json` and merging to `main`; anything under **Unreleased**
is on a branch and has not shipped.

## Unreleased — plainer copy, lighter type · branch `claude/festive-hamilton-2ku295`

No version bump, and nothing about how data is stored has changed.

### Changed
- **Plain copy everywhere.** Rewrote the leftover chatty sentences as short
  labels: the end-workout dialog, the Food tab ("Coming soon."), onboarding,
  the profile list, the home page, About, the workout summary, form errors and
  import messages.
- **Lighter type.** Every pixel-font label is one weight step lighter, and
  plain bold text drops from 700 to 600.
- **No small text left.** Field labels, summary labels, toast details, the rest
  timer and the About footers are all 1rem or larger.

- **Home page headline** is now "Show up. Get stronger." with no description
  under it.
- **README links to the Netlify site** (tsyoku-naru.netlify.app) instead of
  Vercel.

### Removed
- Naru's unused `explainPlan` sentence builder.

## Unreleased — Windows 98 redesign · branch `claude/festive-hamilton-2ku295`

No version bump, and nothing about how data is stored has changed.

### Changed
- **Windows 98 look.** Grey beveled windows, square corners, a navy title bar
  and a muted slate desktop instead of the bright XP blue. Pixel font
  (Pixelify Sans) for labels and buttons.
- **Taskbar nav.** Four big buttons (Dashboard, History, Food, About), plus
  Settings and a Light/Dark button.
- **Big plain labels, no small text.** Window titles are plain words. Removed
  the description lines under settings, the tips under the log form, the
  per-set volume preview, Naru's explanation lines, toast body text and the
  long tour copy. What's left is body size or larger.

## Unreleased — window chrome on the browse screens · branch `redesign/phase-2-windows`

Built on the top-bar branch. No version bump, and nothing about how data is
stored has changed.

### Changed
- **XP windows everywhere.** The windows from History now cover the whole app:
  the home page (`welcome.exe`), the dashboard (`weekly goal.ini`,
  `log an exercise.exe`, `this session.sav`, `body map.bmp`), the food tab, the
  profile picker, new profile setup, every Settings section and both About
  panels. The delete section keeps its reddish frame.
- **Pop-ups are windows too** — the workout summary, the end-workout and delete
  confirmations and Naru's planner. Their title bar's × is a real close button.
- **Windows XP's own type.** Tahoma for text and Trebuchet MS for titles. They
  are Windows and Mac system fonts and can't be bundled, so on Android, Linux
  and iPhone (Tahoma) the app falls back to Rubik, which looks like it did before.
- **Window names no longer all end in `.log`.** Each gets an extension that
  fits it: `.bmp` for the body maps, `.mdb` for the full history, `.lnk` for the
  other profiles, `.tmp` for the unfinished food tab, `.chm` for help, and so on.
- The pages in the top bar stay on one line on narrow phones whichever font is
  in use.
- README screenshots retaken (they show the Rubik fallback).

## Unreleased — a new top bar · branch `redesign/phase-2-nav`

Built on the window-chrome branch. No version bump, and nothing about how data is
stored has changed.

### Changed
- **The top bar is no longer a logo-left, links-right row.** It is two lines:
  the name (with 強くなる beside it) and a small tray on the right — settings and
  the theme switch — over the pages written as one line,
  `SYS:// DASHBOARD ◈ HISTORY ◈ FOOD ◈ ABOUT ▮`, the way the header on the
  owner's site reads. The page you're on is highlighted like a selected item in
  Windows XP, and the cursor blinks (it stays still if you've asked your device
  for reduced motion).
- Settings and the theme switch are drawn glyphs (▣ and ◐) instead of icons.
- On phones the `SYS://` label is dropped so all four pages still fit on one line
  at a comfortable tap size.

## Unreleased — redesign, phase 2 (look), step 2: window chrome on History · branch `redesign/phase-2-chrome`

First trial of the Windows XP look, on the History screen only. Built on the
History branch. No version bump, and nothing about how data is stored has changed.

### Added
- **History is now a stack of little XP windows**: a blue title bar with
  minimise / maximise / close squares, a cream body and a white inset box for
  the content. Each one is named like a file — `last 7 days.log`,
  `muscle groups.dat`, `personal bests.sav`, `full history.log`. The three
  squares are decoration; nothing closes or resizes. They are all blue, since
  XP's red-orange close button would bring orange back.
- The dark theme gets the same windows in navy.

## Unreleased — History replaces Progress and Compare · branch `redesign/history-page`

Structure only, built on the phase 2 branch. No version bump, and nothing about
how data is stored has changed.

### Changed
- **Progress is now History**, and the Compare tab is gone. History opens with
  your last 7 days (sessions and the body map), then sessions per muscle group,
  personal bests and the full list you can edit.
- **Other profiles on the same device** show up on History as a short "Everyone's
  week" list, but only when there are any. Tap a name to open their history. The
  per-profile body maps from Compare are not carried over.
- Old `/progress` and `/compare` links still work: they land on History, on the
  same profile.

## Unreleased — redesign, phase 2 (look), step 1: colours · branch `redesign/phase-2-look`

Colour only. Type, window chrome and the shape of the stickers come next. No
version bump, and nothing about how data is stored has changed. This branch is
built on the phase 1 branch, so the two land together unless phase 1 merges first.

### Changed
- **Blue replaces violet as the app's colour** — Windows XP's own Luna blue
  (`#0054e3`) on the light theme and the brighter end of its title bar
  (`#3593ff`) on the dark one. The body map, goal ring, links and toggles follow.
- **The dark theme is navy, not black** (`#060b1c` page, `#0f1a38` cards) — the
  colour of the Persona memory-card panel on the owner's site. **The light
  theme** is a pale-sky page (`#e8eff9`) under white cards.
- **Two more colours, one job each.** Green is the "log a set" button and
  nothing else, like XP's Start button — an outline at rest that fills solid
  when you press it, so it stays the main action without being the loudest
  thing on screen. Yellow is the sticker: a filled label
  with dark ink, shown only when something happens — a new personal best gets a
  yellow ring on its toast and a yellow "New best" line in the workout summary.
  No orange anywhere.
- Record confetti uses blue, yellow and green instead of hard-coded violets.
- The app icon (web, iPhone, maskable, desktop) is recoloured to the same blue
  gradient with white bars; the shapes are unchanged.
- The browser, installed-app and desktop-window background colours now match
  the page, so there is no flash of the old colour while it loads.
- README screenshots retaken.

## Unreleased — redesign, phase 1 (layout) · branch `redesign/phase-1-layout`

Layout and structure only. The new look (colours, type, window chrome, stickers)
is phase 2, and the food log itself is phase 3. No version bump, and nothing
about how data is stored has changed.

### Added
- **Two exercise panels on the dashboard.** Pick a movement and an "add another
  exercise" line appears under it; tap it to open a second panel. One panel is
  open at a time and the other folds to a single tappable line
  (`◇ name · tap to switch`). Each keeps its own sets while folded, so you can
  alternate between two movements (a superset) or log either in any order. A
  session with one exercise looks exactly as it did before.
- **Food tab** (`/food`): a placeholder page, so the destination is in the
  navigation from the start. The log itself comes in phase 3.
- **Mascot slot** beside the dashboard title and on the Food page, filled with
  the owner's cat drawing as a stand-in (cropped, with the ruled-paper
  background made transparent; the untouched original is in
  `design/mascot-original.png`). Black on the light theme, flipped to white on
  the dark one. Replace `public/mascot.png` with the final art.
- README screenshots in `docs/screenshots/`.

### Changed
- Tapping a muscle on the body map, or **Log** in a Naru plan, now fills the
  free panel instead of closing the exercise you're in the middle of. With both
  panels full it replaces the open one, as **Change** does.
- Ending a workout clears both panels.
- The navigation gains **Food** — five links, still one row on phones.
- README restructured for first-time visitors; this changelog moved here from
  the README, entries unchanged.

## 1.3.1 — 6 Oct 2026 · bug fixes from a full code review
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

## 1.3.0 — 1 Oct 2026 · iPhone app, one-screen About, update diagnostics
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

## 1.2.0 — 1 Oct 2026 · purple theme, Rubik, bigger UI, smoother motion, update prompt
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

## 1.1.0 — 1 Oct 2026 · guided sign-in, settings, backup, desktop app
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

## Late Aug – Sep 2026 — weekly goal, decaying body map, Vercel, full-body Naru
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

## Mid Aug 2026 — anatomical body map, sessions, per-set logging, Naru
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

## Early Aug 2026 — first versions
- First static HTML/CSS site with onboarding, dashboard and compare pages.
- Briefly ran on an Express + SQLite backend, then went fully client-side with
  `localStorage` — no server, nothing leaves your device.
- Dark/light theme toggle, About page, and the Tsyoku-naru name.
- **Rewritten as a React single-page app** (Vite, React Router, Motion) with
  animated page transitions and a first-run guide.
- **Exercise library** grouped by muscle, with sets, reps and weight; bodyweight
  moves hide the weight field and holds like the plank ask for seconds.
