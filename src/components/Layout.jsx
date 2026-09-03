import { AnimatePresence } from "motion/react";
import { Navigate, Route, Routes, useLocation, useSearchParams } from "react-router-dom";
import { Coach } from "./Coach.jsx";
import { Nav } from "./Nav.jsx";
import { Landing } from "../pages/Landing.jsx";
import { Onboarding } from "../pages/Onboarding.jsx";
import { Dashboard } from "../pages/Dashboard.jsx";
import { Progress } from "../pages/Progress.jsx";
import { Compare } from "../pages/Compare.jsx";
import { About } from "../pages/About.jsx";
import { useCoachEnabled } from "../hooks/useStore.js";

// Naru needs a profile to plan from, so it only appears where one is selected.
// Compare is excluded even though it has profiles — that page is about other
// people, and a planner for "you" there answers a question nobody asked. About
// is prose. Landing and onboarding have no profile at all yet.
const COACH_ROUTES = new Set(["/dashboard", "/progress"]);

export function Layout() {
  const location = useLocation();
  const userId = useSearchParams()[0].get("user");
  const [coachEnabled, setCoachEnabled] = useCoachEnabled();

  const showCoach = coachEnabled && Boolean(userId) && COACH_ROUTES.has(location.pathname);

  return (
    <>
      <Nav />
      {/* Both pages animate at once so the transition reads like a workspace
          switch rather than a queue. They have to overlap to do that, and
          AnimatePresence's popLayout can't arrange it here — it styles motion
          children directly, and its child is <Routes>. So .route-stack drops
          both into the same grid cell instead. Without it the outgoing page
          keeps its space in normal flow and shoves the incoming one down the
          page mid-transition.

          The key includes search, not only pathname — switching profiles
          (?user=A -> ?user=B) leaves the pathname untouched, so without it
          Dashboard would stay mounted and keep showing the old profile. */}
      <div className="route-stack">
        <AnimatePresence initial={false}>
          <Routes location={location} key={location.pathname + location.search}>
            <Route path="/" element={<Landing />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </div>

      {/* Outside .route-stack deliberately: mounted here it survives moving
          between the dashboard and progress, so an open plan isn't thrown away
          by navigating. Inside, it would remount on every route change. */}
      {showCoach && (
        <Coach userId={userId} onDismiss={() => setCoachEnabled(false)} />
      )}
    </>
  );
}
