import { AnimatePresence } from "motion/react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Nav } from "./Nav.jsx";
import { Landing } from "../pages/Landing.jsx";
import { Onboarding } from "../pages/Onboarding.jsx";
import { Dashboard } from "../pages/Dashboard.jsx";
import { Compare } from "../pages/Compare.jsx";
import { About } from "../pages/About.jsx";

export function Layout() {
  const location = useLocation();

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
            <Route path="/compare" element={<Compare />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </div>
    </>
  );
}
