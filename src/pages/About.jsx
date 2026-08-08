import { motion } from "motion/react";
import { Card, PageHeader } from "../components/primitives.jsx";
import { pageVariants } from "../lib/motionVariants.js";

export function About() {
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
          what you've been training and what you've been quietly skipping. The
          dashboard shows your all-time totals; the compare page narrows to the last
          seven days.
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
          Nowhere but this browser. There is no account, no login, and no server
          storing anything — profiles and workout logs are written straight to
          <code>localStorage</code> on the device you're reading this on. Nothing is
          uploaded and nothing is shared.
        </p>
        <p>
          Two consequences worth knowing. Your history won't follow you to another
          browser or device, and clearing site data erases it for good. And the
          compare page shows every profile created <em>here</em> — handy if a few
          people share one machine, but it isn't a social feed and won't show anyone
          else's training.
        </p>

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

        <h2>Standards</h2>
        <p>
          The markup and stylesheet are written to W3C standards. These links run the
          live site through the official validators — they check{" "}
          <code>tsyoku-naru.netlify.app</code> on demand rather than displaying a
          stored result, so what you see is current.
        </p>
        <p className="badge-row">
          <a
            className="badge"
            href="https://validator.w3.org/nu/?doc=https%3A%2F%2Ftsyoku-naru.netlify.app%2F"
          >
            Validate HTML
          </a>
          <a
            className="badge"
            href="https://jigsaw.w3.org/css-validator/validator?uri=https%3A%2F%2Ftsyoku-naru.netlify.app%2F"
          >
            Validate CSS
          </a>
        </p>
      </Card>
    </motion.main>
  );
}
