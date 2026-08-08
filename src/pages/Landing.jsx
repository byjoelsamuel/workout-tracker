import { motion } from "motion/react";
import { Button } from "../components/primitives.jsx";
import { pageVariants } from "../lib/motionVariants.js";
import { getLastUserId } from "../lib/store.js";

export function Landing() {
  const lastUserId = getLastUserId();

  return (
    <motion.main
      className="intro"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <h1>
        Train hard.
        <br />
        Watch yourself <em>get stronger.</em>
      </h1>
      <p className="subhead">
        Log every session, and see exactly which muscles you've been working — and
        which ones you've been avoiding.
      </p>
      <Button to={lastUserId ? `/dashboard?user=${lastUserId}` : "/onboarding"} size="large">
        {lastUserId ? "Back to your dashboard" : "Get started"}
      </Button>
      <p className="intro-meaning">強くなる — tsuyoku naru — "to become stronger"</p>
    </motion.main>
  );
}
