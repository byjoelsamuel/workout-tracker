import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { BodyMap } from "../components/BodyMap.jsx";
import { Button, Card, PageHeader } from "../components/primitives.jsx";
import { useCompareData } from "../hooks/useStore.js";
import { countHeat } from "../lib/heat.js";
import { listItemVariants, listVariants, pageVariants } from "../lib/motionVariants.js";
import { STORAGE_HOME } from "../lib/platform.js";

export function Compare() {
  const users = useCompareData();

  return (
    <motion.main
      className="page"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <PageHeader
        eyebrow="Last 7 days"
        title="Everyone's week"
        subhead={`Every profile in ${STORAGE_HOME}, side by side.`}
      />

      {users.length === 0 ? (
        <p className="empty">
          No profiles yet. <Link to="/welcome">Create one</Link> to get started.
        </p>
      ) : (
        <motion.div
          className="compare-grid"
          variants={listVariants}
          initial="hidden"
          animate="show"
        >
          {users.map((user) => (
            <motion.div key={user.id} variants={listItemVariants}>
              <Card className="compare-card">
                <h3>{user.name}</h3>
                {/* Workouts, not log rows — see getSummary in store.js. This
                    used to add one per entry, so a single evening of three
                    movements read as "3 sessions". */}
                <p className="subhead small">
                  {user.sessions} {user.sessions === 1 ? "session" : "sessions"}
                </p>
                {/* Needs the toggle as much as the dashboard does: back and
                    hamstrings only exist on the posterior view, so without
                    it someone who trained nothing but back reads as an
                    untouched body. */}
                {/* A flat count, not the dashboard’s decay: this is several
                    people measured against each other over one fixed week, so
                    there is no “stale” for decay to express. */}
                <BodyMap heat={countHeat(user.summary)} showToggle />
                <Button to={`/dashboard?user=${user.id}`} variant="secondary" size="small">
                  View dashboard
                </Button>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.main>
  );
}
