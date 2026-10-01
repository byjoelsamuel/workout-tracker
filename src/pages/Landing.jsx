import { Fragment } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "../components/primitives.jsx";
import { pageVariants } from "../lib/motionVariants.js";
import { getLastUserId, getUser } from "../lib/store.js";
import { DOWNLOAD_URL } from "../lib/site.js";

const LINES = [
  [{ text: "Train" }, { text: "hard." }],
  [{ text: "Watch" }, { text: "yourself" }, { text: "get", accent: true }, { text: "stronger.", accent: true }],
];

// Each word rises out of its own mask, one after another, so the headline
// reads as being set rather than faded in. The space sits outside each mask:
// trailing whitespace inside an inline-block is trimmed, which ran the words
// together.
function Headline() {
  const reduced = useReducedMotion();
  let i = 0;
  return (
    <h1>
      {LINES.map((words, li) => (
        <Fragment key={li}>
          {li > 0 && <br />}
          {words.map((word) => {
            const delay = 0.05 + i++ * 0.07;
            const Tag = word.accent ? "em" : "span";
            return (
              <Fragment key={word.text}>
                <span className="word-mask">
                  <motion.span
                    className="word"
                    initial={reduced ? false : { y: "110%" }}
                    animate={{ y: 0 }}
                    transition={{ type: "spring", stiffness: 240, damping: 24, delay }}
                  >
                    <Tag>{word.text}</Tag>
                  </motion.span>
                </span>{" "}
              </Fragment>
            );
          })}
        </Fragment>
      ))}
    </h1>
  );
}

export function Landing() {
  const lastUserId = getLastUserId();
  const returning = Boolean(lastUserId && getUser(lastUserId));

  return (
    <motion.main
      className="intro"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <Headline />
      <p className="subhead">
        Log every session, and see exactly which muscles you've been working — and
        which ones you've been avoiding.
      </p>
      <Button to={returning ? `/dashboard?user=${lastUserId}` : "/welcome"} size="large">
        {returning ? "Back to your dashboard" : "Get started"}
      </Button>
      <p className="intro-meaning">強くなる — tsuyoku naru — "to become stronger"</p>
      <p className="intro-download">
        Also on Windows 11 and Fedora — <a href={DOWNLOAD_URL}>download the app</a>
      </p>
    </motion.main>
  );
}
