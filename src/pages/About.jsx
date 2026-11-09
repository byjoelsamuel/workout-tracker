// One screen, no scrolling: how the app works on the left, what happens to
// your data on the right, mirrored. It used to be eight headed sections of
// prose; the same answers fit in a sentence or two each.
import { motion } from "motion/react";
import { PageHeader, AppWindow } from "../components/primitives.jsx";
import { listItemVariants, listVariants, pageVariants } from "../lib/motionVariants.js";
import { APP_VERSION, DOWNLOAD_URL, publicOrigin, REPO_URL, SITE_URL } from "../lib/site.js";
import { hasOwnStorage, isDesktop, isInstalledWebApp, isIOS } from "../lib/platform.js";

const WHERE = isDesktop ? "on this computer" : hasOwnStorage ? "in this app" : "in this browser";

const HOW = [
  ["Log", "Pick an exercise, add your sets."],
  ["Body map", "Trained muscles light up, then fade."],
  ["History", "Past workouts, bests and edits."],
  ["Naru", "Makes a workout plan for you."],
];

// The one point that differs between website, desktop app and phone.
function otherDevices() {
  if (isDesktop) {
    return (
      <>
        iPhone: open <a href={SITE_URL}>the website</a> in Safari, Share, Add to Home Screen.
      </>
    );
  }
  if (isInstalledWebApp) return "Installed. Works offline.";
  const desktop = <a href={DOWNLOAD_URL}>desktop app</a>;
  return isIOS ? (
    <>Share, Add to Home Screen. Or get the {desktop}.</>
  ) : (
    <>Get the {desktop} for Windows and Fedora.</>
  );
}

const DATA = [
  [
    "Private",
    `Saved ${WHERE}. No account.`,
  ],
  [
    "Backup",
    "Export a file in Settings.",
  ],
  ["Other devices", otherDevices()],
  ["Free", "No ads. Open source."],
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
      <PageHeader title="About" />

      <motion.div className="about-grid" variants={listVariants} initial="hidden" animate="show">
        <motion.div variants={listItemVariants}>
          <AppWindow title="How it works" className="about-card">
            <Points items={HOW} />
            <p className="about-meta">
              Built with React, Vite and <a href="https://motion.dev">Motion</a> · body map from{" "}
              <a href="https://github.com/giavinh79/react-body-highlighter">react-body-highlighter</a>
            </p>
          </AppWindow>
        </motion.div>

        <motion.div variants={listItemVariants}>
          <AppWindow title="Your data" className="about-card end">
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
          </AppWindow>
        </motion.div>
      </motion.div>
    </motion.main>
  );
}
