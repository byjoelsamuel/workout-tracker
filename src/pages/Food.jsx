// Placeholder for the food log, which is phase 3 of the redesign.
//
// It exists now so the tab is in the nav from the start: adding a destination
// later would mean redoing the navigation after the look has been settled. Until
// the feature lands this says so plainly, rather than offering a form that
// doesn't save anything.
import { motion } from "motion/react";
import { Mascot } from "../components/Mascot.jsx";
import { PageHeader, XpWindow } from "../components/primitives.jsx";
import { pageVariants } from "../lib/motionVariants.js";

export function Food() {
  return (
    <motion.main className="page" variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <PageHeader eyebrow="Coming soon" title="Food log" />
      <XpWindow title="food" ext="tmp" className="food-placeholder">
        <Mascot size="lg" />
        <p className="empty">
          Nothing to log here yet. Meals and macros arrive after the new look is settled — your workouts come first.
        </p>
      </XpWindow>
    </motion.main>
  );
}
