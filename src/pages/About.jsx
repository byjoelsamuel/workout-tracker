import { motion } from "motion/react";
import { Card, PageHeader } from "../components/primitives.jsx";
import { pageVariants } from "../lib/motionVariants.js";
import { publicOrigin } from "../lib/site.js";
import { useCoachEnabled } from "../hooks/useStore.js";

export function About() {
  const [coachEnabled, setCoachEnabled] = useCoachEnabled();
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
          A map that only ever filled up would be solid orange within a couple of
          months and would stop telling you anything. The progress page keeps the
          lifetime counts, alongside how long it's been since each group last came up.
        </p>
        <p>
          Exercises come from a built-in library rather than free text, so the same
          movement is always named the same way. Each entry records sets and reps
          alongside the weight you used. Movements that carry no external load, like
          push-ups and pull-ups, skip the weight field, and holds like the plank ask
          for seconds instead of repetitions.
        </p>

        <h2>Where your data lives</h2>
        <p>
          Nowhere but this browser. No account, no login, no server — which is worth
          understanding in three parts.
        </p>
        {/* A description list rather than a run of prose. This answers three
            separate questions — where the data sits, what that costs you, and what
            the compare page actually shows — and buried in one paragraph the second
            and third went unread. <dl> is the honest element for term/description
            pairs, which also keeps the validator badges below green. */}
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
            <dt>It won't follow you</dt>
            <dd>
              Open the app on another browser or a phone and you'll start from empty.
              Clearing this browser's site data erases your history for good, so treat
              it as a local notebook rather than an account.
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

        <h2>How it's built</h2>
        <p>
          A React single-page app built with Vite, routed by React Router, and
          animated with <a href="https://motion.dev">Motion</a>. The body map is
          hand-drawn SVG whose fill animates as your totals change. There's no
          backend to run, so the whole thing deploys as static files.
        </p>
        <p>
          Source: <code>github.com/byjoelsamuel/workout-tracker</code>
        </p>

        <h2>Licence</h2>
        <p>
          Tsyoku-naru is released under the{" "}
          <a href="https://github.com/byjoelsamuel/workout-tracker/blob/main/LICENSE">
            MIT Licence
          </a>
          . You're free to use, modify and redistribute it, including commercially,
          provided the copyright notice and licence text travel with it. It comes
          with no warranty.
        </p>
        <p>
          It builds on four open-source projects, each MIT licensed:{" "}
          <a href="https://react.dev">React</a>,{" "}
          <a href="https://vite.dev">Vite</a>,{" "}
          <a href="https://reactrouter.com">React Router</a>, and{" "}
          <a href="https://motion.dev">Motion</a>.
        </p>

        <h2>Naru</h2>
        <p>
          The planner in the corner of the dashboard and progress pages. It reads
          your logs and lays out a full-body session — one push, one pull, one leg
          movement, plus accessories aimed at whatever you have left longest, with
          starting weights taken from your own best sets. It runs entirely in this
          browser: no account, no API key, no network call.
        </p>
        {/* Hiding Naru is done from inside its own panel, which leaves nowhere
            to bring it back from. This is that somewhere. */}
        <p className="setting-row">
          <span>
            Naru is currently <strong>{coachEnabled ? "on" : "off"}</strong>
          </span>
          <button
            type="button"
            className="row-action"
            onClick={() => setCoachEnabled(!coachEnabled)}
          >
            {coachEnabled ? "Turn off" : "Turn on"}
          </button>
        </p>

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
      </Card>
    </motion.main>
  );
}
