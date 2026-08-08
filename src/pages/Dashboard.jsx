import { useEffect } from "react";
import { motion } from "motion/react";
import { Navigate, useSearchParams } from "react-router-dom";
import { BodyMap } from "../components/BodyMap.jsx";
import { HistoryList } from "../components/HistoryList.jsx";
import { LogForm } from "../components/LogForm.jsx";
import { OnboardingGuide } from "../components/OnboardingGuide.jsx";
import {
  AnimatedList,
  AnimatedListItem,
  Card,
  PageHeader,
  StatRow,
} from "../components/primitives.jsx";
import { useExerciseLog, useUser } from "../hooks/useStore.js";
import { useOnboardingGuide } from "../hooks/useOnboardingGuide.js";
import { BODY_GROUPS } from "../lib/bodyGroups.js";
import { onGuideReplay } from "../lib/guideBus.js";
import { pageVariants } from "../lib/motionVariants.js";
import { setLastUserId } from "../lib/store.js";

export function Dashboard() {
  const userId = useSearchParams()[0].get("user");
  const user = useUser(userId);
  const { logs, summary, log } = useExerciseLog(userId);
  const guide = useOnboardingGuide(userId, logs.length);

  useEffect(() => {
    if (user) setLastUserId(user.id);
  }, [user]);

  // Lets the nav's help button reopen the walkthrough on demand.
  useEffect(() => onGuideReplay(guide.replay), [guide.replay]);

  // No profile, or one that doesn't exist in this browser — there's nothing
  // to show, so send them somewhere they can pick or make one.
  if (!user) return <Navigate to="/onboarding" replace />;

  const ranked = BODY_GROUPS.map((group) => ({
    ...group,
    count: summary[group.id] || 0,
  })).sort((a, b) => b.count - a.count);

  return (
    <>
      <motion.main
        className="page"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <PageHeader
          eyebrow={`${logs.length} ${logs.length === 1 ? "session" : "sessions"} logged`}
          title={`${user.name}'s progress`}
        />

        <div className="dashboard-grid">
          <Card className="map-card">
            <div data-guide="body-map">
              <BodyMap summary={summary} />
            </div>
            <div className="map-legend">
              <span>Less</span>
              <span className="legend-ramp" />
              <span>More</span>
            </div>
            <StatRow user={user} />
          </Card>

          <div className="dashboard-column">
            <Card data-guide="log-form">
              <h2>Log an exercise</h2>
              <LogForm onLog={log} />
            </Card>

            <Card>
              <h2>Breakdown</h2>
              <AnimatedList>
                {ranked.map((group) => (
                  <AnimatedListItem key={group.id}>
                    <span>{group.label}</span>
                    <span className={`count ${group.count === 0 ? "zero" : ""}`}>
                      {group.count}
                    </span>
                  </AnimatedListItem>
                ))}
              </AnimatedList>
            </Card>

            <Card>
              <h2>Recent activity</h2>
              <HistoryList logs={logs.slice(0, 8)} />
            </Card>
          </div>
        </div>
      </motion.main>

      {guide.visible && <OnboardingGuide onDismiss={guide.dismiss} />}
    </>
  );
}
