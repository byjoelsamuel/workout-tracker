// One nav for the whole app — previously this markup was copy-pasted into
// all five HTML files.
import { motion } from "motion/react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useTheme } from "../hooks/useTheme.js";
import { getLastUserId } from "../lib/store.js";
import { requestGuideReplay } from "../lib/guideBus.js";
import { snappy } from "../lib/motionVariants.js";

const iconPress = { whileHover: { scale: 1.08 }, whileTap: { scale: 0.9 }, transition: snappy };

function ThemeToggle() {
  const { toggle } = useTheme();
  return (
    <motion.button
      className="icon-button"
      type="button"
      onClick={toggle}
      aria-label="Toggle dark mode"
      {...iconPress}
    >
      <svg className="icon icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
      <svg className="icon icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
      </svg>
    </motion.button>
  );
}

export function Nav() {
  // Read on each render rather than cached: Nav re-renders on every route
  // change, so this stays current after onboarding sets a new profile.
  const lastUserId = getLastUserId();
  const withUser = (path) => (lastUserId ? `${path}?user=${lastUserId}` : path);
  const onDashboard = useLocation().pathname === "/dashboard";

  return (
    <nav className="nav">
      <Link to="/" className="nav-brand">
        Tsyoku<span>-naru</span>
      </Link>

      <div className="nav-right">
        <div className="nav-links">
          <NavLink to={withUser("/dashboard")} className={({ isActive }) => (isActive ? "active" : "")}>
            Dashboard
          </NavLink>
          <NavLink to={withUser("/progress")} className={({ isActive }) => (isActive ? "active" : "")}>
            Progress
          </NavLink>
          <NavLink to="/compare" className={({ isActive }) => (isActive ? "active" : "")}>
            Compare
          </NavLink>
          <NavLink to="/about" className={({ isActive }) => (isActive ? "active" : "")}>
            About
          </NavLink>
        </div>

        {/* Only rendered on the dashboard, where there's a guide to replay. */}
        {onDashboard && (
          <motion.button
            className="icon-button"
            type="button"
            onClick={requestGuideReplay}
            aria-label="Show the walkthrough"
            {...iconPress}
          >
            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M9.1 9a3 3 0 1 1 4.2 2.7c-.8.4-1.3 1.2-1.3 2.1v.4" />
              <circle cx="12" cy="17.5" r="0.6" fill="currentColor" />
            </svg>
          </motion.button>
        )}

        <ThemeToggle />
      </div>
    </nav>
  );
}
