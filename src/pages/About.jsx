// Two cards side by side: what the app does on the left, where your data goes
// on the right, mirrored. Plain prose rather than labelled bullet points — a
// grid of bold one-liners said what each part was, but not why it works the
// way it does, and the why is what this page is for. Safe to edit freely;
// nothing else reads from it.
import { motion } from "motion/react";
import { Card, PageHeader } from "../components/primitives.jsx";
import { listItemVariants, listVariants, pageVariants } from "../lib/motionVariants.js";
import { APP_VERSION, DOWNLOAD_URL, publicOrigin, REPO_URL, SITE_URL } from "../lib/site.js";
import { hasOwnStorage, isDesktop, isInstalledWebApp, isIOS } from "../lib/platform.js";

const WHERE = isDesktop ? "this computer" : hasOwnStorage ? "this app" : "this browser";

// The one paragraph that differs most between website, desktop app and phone.
function Elsewhere() {
  if (isDesktop) {
    return (
      <p>
        You're in the desktop app, which keeps its own history apart from the website's.
        Its one network request is a check for new versions when it opens — nothing about
        you goes with it. On iPhone, open <a href={SITE_URL}>the website</a> in Safari and
        Add to Home Screen.
      </p>
    );
  }
  if (isInstalledWebApp) {
    return (
      <p>
        You're using the installed version: it opens with no signal and updates itself
        whenever the website does.
        {hasOwnStorage && " On iPhone it keeps its own history, separate from Safari's."}
      </p>
    );
  }
  return (
    <p>
      It also runs as a <a href={DOWNLOAD_URL}>desktop app</a> for Windows 11 and Fedora, and
      {isIOS ? " right here: " : " on iPhone: "}Safari → Share → Add to Home Screen makes it an
      app that works with no signal. Each keeps its own history; Backup moves it between them.
    </p>
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
            <h2>What it does</h2>
            <div className="about-body">
              <p>
                You make a profile, then log each exercise against one of seven muscle groups.
                Every session deepens that group's colour on the body map, so a glance tells you
                what you've been training — and what you've been quietly skipping.
              </p>
              <p>
                The colour fades if you leave a group alone: a session counts fully the day you
                log it and half as much a week later. A map that only ever filled up would be solid
                colour within a couple of months and stop telling you anything. Progress keeps the
                lifetime counts.
              </p>
              <p>
                Exercises come from a built-in library, so the same lift is always named the same
                way. Every set keeps its own reps and weight; bodyweight moves skip the weight, and
                holds like the plank ask for seconds.
              </p>
              <p>
                Naru, the optional planner, reads your logs and lays out a full-body session — push,
                pull and legs, plus whatever you've left longest — with starting weights from your
                own best sets.
              </p>
            </div>
            <p className="about-meta">
              Built with React, Vite and <a href="https://motion.dev">Motion</a> · body map from{" "}
              <a href="https://github.com/giavinh79/react-body-highlighter">react-body-highlighter</a>
            </p>
          </Card>
        </motion.div>

        <motion.div variants={listItemVariants}>
          <Card className="about-card end">
            <h2>Where your data lives</h2>
            <div className="about-body">
              <p>
                Nowhere but {WHERE}. No account, no login, no server: profiles and workouts are
                written straight to <code>localStorage</code> on the machine you're reading this
                on. Nothing is uploaded, and nobody else can see it.
              </p>
              <p>
                That also means it won't follow you. Another browser or a phone starts empty, and
                clearing site data erases your history for good — so export a backup from Settings
                now and then. It imports anywhere and never overwrites what's already there.
              </p>
              <p>
                Compare is local too. It lists every profile made here, which is handy when a few
                people share one machine — it isn't a social feed, and can't reach anyone else.
              </p>
              <Elsewhere />
            </div>
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
