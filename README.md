# 🏋️ Tsyoku-naru — Workout Tracker

![GitHub last commit](https://img.shields.io/github/last-commit/byjoelsamuel/workout-tracker)
![GitHub license](https://img.shields.io/github/license/byjoelsamuel/workout-tracker)
![Latest release](https://img.shields.io/github/v/release/byjoelsamuel/workout-tracker)

**強くなる** (*tsuyoku naru*) — "to become stronger."

Log every set, and an anatomical body map shows which muscles you've trained
lately — and which you've been skipping. Free, private, no account: everything
stays on your device.

**[Open the app →](https://workout-tracker-alpha-two-23.vercel.app/)** ·
[Download for desktop](https://github.com/byjoelsamuel/workout-tracker/releases/latest) ·
[What's new](CHANGELOG.md)

![The dashboard: a body map with chest and legs lit up beside the exercise logger](docs/screenshots/dashboard-desktop.png)

## What you can do

- **Log by the set.** Pick from a 157-movement library and give each set its own
  reps and weight. A movement you've done before starts from last time.
- **Log two exercises at once.** Open a second panel and switch between them with
  a tap — handy for supersets, or for doing things in whatever order the gym
  allows.
- **See what you've been skipping.** The body map (front and back) fades over a
  few weeks, so it shows what you've worked *lately*, not everything you've ever
  done. Tap a muscle to find exercises for it.
- **Stay on track.** A weekly goal with a streak, a rest timer that starts
  itself, undo after every log, and a call-out when you beat a personal best.
- **Get a plan.** **Naru**, an optional planner, builds a full-body session from
  your own logs — entirely on your device.
- **Make it yours.** kg or lb, dark or light theme, keyboard-friendly, and it
  respects reduced-motion settings.

<p align="center">
  <img src="docs/screenshots/logger-mobile.png" alt="The exercise logger on a phone: one exercise folded to a single line, the other open with its sets" width="300">
</p>

## Get it

| Where | How |
|---|---|
| **Web** | [workout-tracker-alpha-two-23.vercel.app](https://workout-tracker-alpha-two-23.vercel.app/) — also mirrored at [tsyoku-naru.netlify.app](https://tsyoku-naru.netlify.app/). Both deploy from `main`. |
| **iPhone / iPad** | Open the website in Safari → **Share → Add to Home Screen**. Works offline. |
| **Android** | Open the website in Chrome → menu → **Install app**. |
| **Windows 11** | [`Tsyoku-naru-Setup-x64.exe`](https://github.com/byjoelsamuel/workout-tracker/releases/latest/download/Tsyoku-naru-Setup-x64.exe). Not code-signed, so choose **More info → Run anyway** if SmartScreen asks. |
| **Fedora** | `sudo dnf install https://github.com/byjoelsamuel/workout-tracker/releases/latest/download/Tsyoku-naru-x86_64.rpm` |
| **Other Linux** | [`Tsyoku-naru-x86_64.AppImage`](https://github.com/byjoelsamuel/workout-tracker/releases/latest/download/Tsyoku-naru-x86_64.AppImage) — `chmod +x` and run (needs `fuse-libs`). |

## Your data stays with you

There's no account and no server. Workouts are saved in your browser (or the
desktop app), and nothing leaves your device.

- **Each install keeps its own history** — the website, the desktop app and an
  iPhone Home Screen app don't share data. Move it with **Settings → Backup**
  (export on one, import on the other; importing never overwrites anything).
- **Updates:** the website and phone app update themselves. The desktop app
  (1.2.0 and later) tells you when a new version is out, with a Download button;
  install it over the top and your history stays. **Settings → Help → Updates**
  checks on demand and says why if it can't.

## Redesign in progress

Tsyoku-naru is getting more personality, in three steps — layout first, then the
look, then food — so each one can be judged before the next begins.

| Phase | What | Status |
|---|---|---|
| **1 · Layout** | Two-exercise logger, a Food tab, a spot for the mascot | Done |
| **2 · Look** | XP blue palette, Windows XP window chrome and type, a hand-drawn mascot, sticker-style rewards | In progress — colours, window chrome and type done |
| **3 · Food log** | Log meals next to workouts | Planned |

Details of every change are in the [changelog](CHANGELOG.md).

## For developers

```bash
npm install
npm run dev         # http://localhost:5173
npm run build       # production build into dist/
npm run desktop     # build, then open the Electron app
npm run dist:linux  # Fedora .rpm + AppImage into release/
```

React 19 + Vite + React Router + Motion; data in `localStorage`; desktop via
Electron; offline via a generated service worker. The modules in `src/lib/`
explain, in their comments, the rules that keep old data meaning the same thing —
the storage keys in particular are a fixed format, so don't rename them.

**Releasing:** bump `version` in `package.json` and merge to `main`. GitHub
Actions builds the Windows installer and Linux packages and publishes the
`v<version>` release. Merges that don't change the version only redeploy the
website.

## Credits & license

Body map geometry from [react-body-highlighter](https://github.com/giavinh79/react-body-highlighter)
(MIT); fallback typeface [Rubik](https://github.com/googlefonts/rubik) (OFL; the interface uses Tahoma and Trebuchet MS where they are installed). See
[`THIRD-PARTY.md`](THIRD-PARTY.md). Released under the MIT License — see
[`LICENSE`](LICENSE).

Built by [Joel Samuel](https://github.com/byjoelsamuel)
