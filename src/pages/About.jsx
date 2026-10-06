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
  ["Log", "Pick an exercise and enter the reps and weight for each set. If you've done it before, your last session is filled in for you."],
  ["Body map", "Muscles light up when you train them and fade over the next few weeks. A dim muscle is one you haven't worked in a while."],
  ["Progress", "Sessions per muscle group, your personal bests and your full history. You can edit or delete any entry."],
  ["Naru", "Optional. It builds a full-body workout from your history and suggests starting weights based on your best sets."],
];

// The one point that differs between website, desktop app and phone.
function otherDevices() {
  if (isDesktop) {
    return (
      <>
        You'll get a prompt here when a new version is out. On iPhone, open{" "}
        <a href={SITE_URL}>the website</a> in Safari and tap Share, then Add to Home Screen.
      </>
    );
  }
  if (isInstalledWebApp) return "This is the installed version. It works offline and updates along with the website.";
  const desktop = <a href={DOWNLOAD_URL}>desktop app</a>;
  return isIOS ? (
    <>Tap Share, then Add to Home Screen, to use it as an app that works offline. There's also a {desktop} for Windows 11 and Fedora.</>
  ) : (
    <>There's a {desktop} for Windows 11 and Fedora. On iPhone, open this site in Safari and tap Share, then Add to Home Screen.</>
  );
}

const DATA = [
  [
    "Private",
    `Everything is saved ${WHERE}. There's no account and no server, and Compare only shows profiles saved here.${
      isDesktop ? " The only thing the app sends online is a check for new versions." : ""
    }`,
  ],
  [
    "Backup",
    "Settings → Backup saves a file you can import into any copy of the app. Keep one, because clearing this data deletes your history.",
  ],
  ["Other devices", otherDevices()],
  ["Free", "No ads or tracking. The code is open source under the MIT licence."],
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
