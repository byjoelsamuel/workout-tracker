// One screen, no scrolling: how the app works on the left, what happens to
// your data on the right, mirrored. It used to be eight headed sections of
// prose; the same answers fit in a sentence or two each.
import { motion } from "motion/react";
import { Card, PageHeader } from "../components/primitives.jsx";
import { listItemVariants, listVariants, pageVariants } from "../lib/motionVariants.js";
import { APP_VERSION, DOWNLOAD_URL, publicOrigin, REPO_URL, SITE_URL } from "../lib/site.js";
import { hasOwnStorage, isDesktop, isInstalledWebApp, isIOS } from "../lib/platform.js";

const WHERE = isDesktop ? "on this computer" : hasOwnStorage ? "in this app" : "in this browser";

const HOW = [
  ["Log", "Pick a movement and record each set's reps and weight. Anything you've done before starts from last time."],
  ["Body map", "Muscle groups light up as you train them and fade over a few weeks, so it shows what you've worked lately — and what you've skipped."],
  ["Progress", "Lifetime sessions per muscle group, personal bests, and every entry, editable."],
  ["Naru", "An optional planner: a full-body session built from your own logs and best lifts, worked out on your device."],
];

// The one line that differs most between website, desktop app and phone.
function elsewhere() {
  if (isDesktop) {
    return (
      <>
        A prompt appears here when a new version is out. On iPhone, open{" "}
        <a href={SITE_URL}>the website</a> in Safari and Add to Home Screen.
      </>
    );
  }
  if (isInstalledWebApp) return "This is the installed version: it works offline and updates with the website.";
  const desktop = (
    <>
      <a href={DOWNLOAD_URL}>desktop app</a> for Windows 11 and Fedora
    </>
  );
  return isIOS ? (
    <>Safari → Share → Add to Home Screen makes it an app that works offline. There's a {desktop} too.</>
  ) : (
    <>There's a {desktop}, and on iPhone, Safari → Share → Add to Home Screen.</>
  );
}

const DATA = [
  [
    "Private",
    `Everything stays ${WHERE}: no account, no server. Compare only lists profiles made here.${
      isDesktop ? " The app's one network request is a check for new versions." : ""
    }`,
  ],
  [
    "Yours to move",
    "Settings → Backup exports a file that imports into any copy of the app — and it's the only way back if this data is ever cleared.",
  ],
  ["Everywhere", elsewhere()],
  ["Free", "No ads, no tracking, no sign-up. MIT-licensed, with the code on GitHub."],
];

function Points({ items }) {
  return (
    <dl className="about-points">
      {items.map(([term, text]) => (
        <div key={term}>
          <dt>{term}</dt>
          <dd>{text}</dd>
        </div>
      ))}
    </dl>
  );
}

export function About() {
  // Built from wherever the page is served, never a hard-coded host: the
  // validators fetch the live site, and these links once pointed at an old
  // one for months after a move.
  const site = encodeURIComponent(`${publicOrigin()}/`);

  return (
    <motion.main className="page about" variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <PageHeader eyebrow="About" title="Tsyoku-naru" subhead="強くなる — tsuyoku naru — “to become stronger.”" />

      <motion.div className="about-grid" variants={listVariants} initial="hidden" animate="show">
        <motion.div variants={listItemVariants}>
          <Card className="about-card">
            <h2>How it works</h2>
            <Points items={HOW} />
            <p className="about-meta">
              Built with React, Vite and <a href="https://motion.dev">Motion</a> · body map from{" "}
              <a href="https://github.com/giavinh79/react-body-highlighter">react-body-highlighter</a>
            </p>
          </Card>
        </motion.div>

        <motion.div variants={listItemVariants}>
          <Card className="about-card end">
            <h2>Your data</h2>
            <Points items={DATA} />
            <p className="about-meta">
              Version {APP_VERSION} · <a href={`${REPO_URL}/blob/main/LICENSE`}>MIT licence</a> ·{" "}
              <a href={REPO_URL}>Source</a>
              {/* The validators fetch the public website, so there's nothing for
                  them to check from inside the desktop app. */}
              {!isDesktop && (
                <>
                  {" "}
                  · Validate <a href={`https://validator.w3.org/nu/?doc=${site}`}>HTML</a> ·{" "}
                  <a href={`https://jigsaw.w3.org/css-validator/validator?uri=${site}`}>CSS</a>
                </>
              )}
            </p>
          </Card>
        </motion.div>
      </motion.div>
    </motion.main>
  );
}
