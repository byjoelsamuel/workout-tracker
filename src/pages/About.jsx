import { motion } from "motion/react";
import { Card, PageHeader } from "../components/primitives.jsx";
import { pageVariants } from "../lib/motionVariants.js";
import { APP_VERSION, DOWNLOAD_URL, publicOrigin, REPO_URL, SITE_URL } from "../lib/site.js";
import { isDesktop } from "../lib/platform.js";

export function About() {
  // Built from wherever the page is actually served rather than a hard-coded
  // host, so a move between hosts can't leave these pointing at the old one —
  // which is exactly what happened to the three Netlify URLs that used to be
  // written out here by hand.
  const site = `${publicOrigin()}/`;
  const encoded = encodeURIComponent(site);

  return (
    <motion.main
      className="page"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <PageHeader
        eyebrow="About"
        title="Tsyoku-naru"
        subhead="強くなる — tsuyoku naru — “to become stronger.”"
      />

      {/* Plain prose — safe to edit freely, nothing else reads from it. */}
      <Card className="prose">
        <h2>What it does</h2>
        <p>
          You create a profile, then log each exercise against one of seven muscle
          groups: shoulders, chest, back, arms, abs, legs, and calves. Every logged
          session deepens that group's colour on the body map, so a glance tells you
          what you've been training and what you've been quietly skipping.
        </p>
        <p>
          That colour fades again if you leave a group alone — a session counts fully
          the day you log it and half as much a week later, so the dashboard shows
          what you've worked <em>lately</em> rather than everything you've ever done.
          The progress page keeps the lifetime counts, alongside how long it's been
          since each group last came up.
        </p>
        <p>
          Exercises come from a built-in library rather than free text, so the same
          movement is always named the same way. Each set records its own reps and
          weight, and a movement you've done before starts from what you did last
          time. Movements that carry no external load skip the weight field, and holds
          like the plank ask for seconds instead of repetitions.
        </p>

        <h2>Where your data lives</h2>
        <p>
          Nowhere but this {isDesktop ? "computer" : "browser"}. No account, no login,
          no server — which is worth understanding in three parts.
        </p>
        {/* A description list rather than a run of prose. This answers three
            separate questions — where the data sits, what that costs you, and what
            the compare page actually shows — and buried in one paragraph the second
            and third went unread. */}
        <dl className="facts">
          <div>
            <dt>It stays on this device</dt>
            <dd>
              Profiles and workout logs are written straight to <code>localStorage</code>{" "}
              on the machine you're reading this on. Nothing is uploaded, nothing is
              shared, and no one else can see it.
            </dd>
          </div>
          <div>
            <dt>It won't follow you — unless you take it</dt>
            <dd>
              Open the app on another browser or a phone and you'll start from empty.
              Clearing this browser's site data erases your history for good, so export
              a backup from <strong>Settings</strong> now and then — it imports anywhere.
            </dd>
          </div>
          <div>
            <dt>Compare is local too</dt>
            <dd>
              It lists every profile made in <em>this</em> browser — useful when a few
              people share one machine. It isn't a social feed and can't reach anyone
              else's training.
            </dd>
          </div>
        </dl>

        <h2>Naru</h2>
        <p>
          The planner behind “Plan with Naru” on the dashboard. It reads your logs and
          lays out a full-body session — one push, one pull, one leg movement, plus
          accessories aimed at whatever you have left longest, with starting weights
          taken from your own best sets. It runs entirely{" "}
          {isDesktop ? "on this computer" : "in this browser"}: no account, no API key,
          no network call. You can turn it off in Settings.
        </p>

        <h2>How it's built</h2>
        <p>
          A React single-page app built with Vite, routed by React Router, and
          animated with <a href="https://motion.dev">Motion</a>. The body map is
          hand-drawn SVG whose fill animates as your totals change. There's no
          backend to run, so the whole thing deploys as static files.
        </p>
        <p>
          Version {APP_VERSION} · Source: <a href={REPO_URL}>github.com/byjoelsamuel/workout-tracker</a>
        </p>

        <h2>Desktop app</h2>
        {isDesktop ? (
          <>
            <p>
              You're using the desktop app — the same app as the website, wrapped in{" "}
              <a href="https://www.electronjs.org">Electron</a> so it runs in its own
              window with no connection needed. Its history is separate from the
              website's; use the backup in Settings to move between them. The website
              is at <a href={SITE_URL}>{SITE_URL.replace(/^https?:\/\//, "")}</a>.
            </p>
            <p>
              When it opens, the app asks GitHub whether a newer version is out. That
              is its only network request, and nothing about you or your workouts goes
              with it. If there is one you'll get a prompt to download it; install it
              over this one and your history carries on where it was.
            </p>
          </>
        ) : (
          <p>
            The same app runs as a desktop app on Windows 11 and Fedora, in its own
            window and with no connection needed.{" "}
            <a href={DOWNLOAD_URL}>Download it from GitHub</a>. Its history is kept
            separately from this browser's — export a backup in Settings here and
            import it there.
          </p>
        )}

        <h2>Licence</h2>
        <p>
          Tsyoku-naru is released under the{" "}
          <a href={`${REPO_URL}/blob/main/LICENSE`}>MIT Licence</a>. You're free to use,
          modify and redistribute it, including commercially, provided the copyright
          notice and licence text travel with it. It comes with no warranty.
        </p>
        <p>
          It builds on four open-source projects, each MIT licensed:{" "}
          <a href="https://react.dev">React</a>,{" "}
          <a href="https://vite.dev">Vite</a>,{" "}
          <a href="https://reactrouter.com">React Router</a>, and{" "}
          <a href="https://motion.dev">Motion</a>. The body map's outline comes from{" "}
          <a href="https://github.com/giavinh79/react-body-highlighter">react-body-highlighter</a>{" "}
          (MIT). The desktop app is built with{" "}
          <a href="https://www.electronjs.org">Electron</a> (MIT).
        </p>

        {/* The validators fetch the public website from their own servers, so
            these belong to the website only — inside the desktop app there's no
            URL of this page for them to check. */}
        {!isDesktop && (
          <>
            <h2>Standards</h2>
            <p>
              The markup and stylesheet are written to W3C standards. These links run the
              live site through the official validators — they check{" "}
              <code>{publicOrigin().replace(/^https?:\/\//, "")}</code> on demand rather
              than displaying a stored result, so what you see is current.
            </p>
            <p className="badge-row">
              <a className="badge" href={`https://validator.w3.org/nu/?doc=${encoded}`}>
                Validate HTML
              </a>
              <a
                className="badge"
                href={`https://jigsaw.w3.org/css-validator/validator?uri=${encoded}`}
              >
                Validate CSS
              </a>
            </p>
          </>
        )}
      </Card>
    </motion.main>
  );
}
