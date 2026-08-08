import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { BodyMap } from "../components/BodyMap.jsx";
import { Button, Card, PageHeader } from "../components/primitives.jsx";
import { useCompareData } from "../hooks/useStore.js";
import { listItemVariants, listVariants, pageVariants } from "../lib/motionVariants.js";

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
        subhead="Every profile on this browser, side by side."
      />

      {users.length === 0 ? (
        <p className="empty">
          No profiles yet. <Link to="/onboarding">Create one</Link> to get started.
        </p>
      ) : (
        <motion.div
          className="compare-grid"
          variants={listVariants}
          initial="hidden"
          animate="show"
        >
          {users.map((user) => {
            const total = Object.values(user.summary).reduce((sum, n) => sum + n, 0);
            return (
              <motion.div key={user.id} variants={listItemVariants}>
                <Card className="compare-card">
                  <h3>{user.name}</h3>
                  <p className="subhead small">
                    {total} {total === 1 ? "session" : "sessions"}
                  </p>
                  <BodyMap summary={user.summary} />
                  <Button to={`/dashboard?user=${user.id}`} variant="secondary" size="small">
                    View dashboard
                  </Button>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </motion.main>
  );
}
