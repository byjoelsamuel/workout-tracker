// One nav for the whole app — previously this markup was copy-pasted into
// all five HTML files.
//
// On phones the links drop to a second row under the brand. Kept on one row,
// the brand ran into "Dashboard" and "About" slid underneath the icons.
import { motion } from "motion/react";
import { Link, NavLink } from "react-router-dom";
import { useTheme } from "../hooks/useTheme.js";
import { getLastUserId, getUser } from "../lib/store.js";
import { snappy } from "../lib/motionVariants.js";

const iconPress = { whileHover: { scale: 1.08 }, whileTap: { scale: 0.9 }, transition: snappy };

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <motion.button
      className="icon-button"
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      {...iconPress}
    >
      <svg className="icon icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
      <svg className="icon icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
      </svg>
    </motion.button>
  );
}

export function Nav() {
  // Read on each render rather than cached: Nav re-renders on every route
  // change, so this stays current after sign-in or a profile is deleted.
  const lastUserId = getLastUserId();
  const signedIn = Boolean(lastUserId && getUser(lastUserId));
  const withUser = (path) => (signedIn ? `${path}?user=${lastUserId}` : path);
  const active = ({ isActive }) => (isActive ? "active" : "");

  return (
    <nav className="nav" aria-label="Main">
      <Link to="/" className="nav-brand">
        Tsyoku<span>-naru</span>
      </Link>

      <div className="nav-links">
        <NavLink to={withUser("/dashboard")} className={active}>
          Dashboard
        </NavLink>
        <NavLink to={withUser("/progress")} className={active}>
          Progress
        </NavLink>
        <NavLink to={withUser("/compare")} className={active}>
          Compare
        </NavLink>
        <NavLink to="/about" className={active}>
          About
        </NavLink>
      </div>

      <div className="nav-icons">
        {/* Where the "?" button used to be. Replaying the walkthrough now
            lives in Settings, alongside everything else you set once. */}
        {signedIn && (
          <motion.span className="icon-motion" {...iconPress}>
            <NavLink
              to={withUser("/settings")}
              className={({ isActive }) => `icon-button ${isActive ? "active" : ""}`.trim()}
              aria-label="Settings"
            >
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
                <circle cx="16" cy="7" r="2" />
                <circle cx="10" cy="17" r="2" />
              </svg>
            </NavLink>
          </motion.span>
        )}
        <ThemeToggle />
      </div>
    </nav>
  );
}
