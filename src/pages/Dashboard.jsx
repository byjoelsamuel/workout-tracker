import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Navigate, useSearchParams } from "react-router-dom";
import { BodyMap } from "../components/BodyMap.jsx";
import { OnboardingGuide } from "../components/OnboardingGuide.jsx";
import {
  AnimatedList,
  AnimatedListItem,
  Button,
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

function relativeTime(isoString) {
  const diffMin = Math.round((Date.now() - new Date(isoString).getTime()) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.round(diffHr / 24)}d ago`;
}

export function Dashboard() {
  const userId = useSearchParams()[0].get("user");
  const user = useUser(userId);
  const { logs, summary, log } = useExerciseLog(userId);
  const guide = useOnboardingGuide(userId, logs.length);

  const [bodyGroup, setBodyGroup] = useState(BODY_GROUPS[0].id);
  const [exerciseName, setExerciseName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) setLastUserId(user.id);
  }, [user]);

  // Lets the nav's help button reopen the walkthrough on demand.
  useEffect(() => onGuideReplay(guide.replay), [guide.replay]);

  // No profile, or one that doesn't exist in this browser — there's nothing
  // to show, so send them somewhere they can pick or make one.
  if (!user) return <Navigate to="/onboarding" replace />;

  function handleSubmit(event) {
    event.preventDefault();
    if (!exerciseName.trim()) {
      setError("Give the exercise a name.");
      return;
    }
    log({ bodyGroup, exerciseName });
    setExerciseName("");
    setError("");
  }

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

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <Card data-guide="log-form">
              <h2>Log an exercise</h2>
              <form className="form" onSubmit={handleSubmit}>
                <label>
                  Muscle group
                  <select value={bodyGroup} onChange={(e) => setBodyGroup(e.target.value)}>
                    {BODY_GROUPS.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Exercise
                  <input
                    type="text"
                    value={exerciseName}
                    onChange={(e) => setExerciseName(e.target.value)}
                    placeholder="e.g. Bench press"
                    autoComplete="off"
                  />
                </label>
                {error && <p className="form-error">{error}</p>}
                <Button type="submit" block>
                  Add exercise
                </Button>
              </form>
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
              {logs.length === 0 ? (
                <p className="empty">Nothing logged yet — add your first exercise above.</p>
              ) : (
                <AnimatedList>
                  {logs.slice(0, 8).map((entry) => (
                    <AnimatedListItem key={entry.id}>
                      <span className="log-name">{entry.exerciseName}</span>
                      <span className="log-group">{entry.bodyGroup}</span>
                      <span className="log-time">{relativeTime(entry.loggedAt)}</span>
                    </AnimatedListItem>
                  ))}
                </AnimatedList>
              )}
            </Card>
          </div>
        </div>
      </motion.main>

      {guide.visible && <OnboardingGuide onDismiss={guide.dismiss} />}
    </>
  );
}
