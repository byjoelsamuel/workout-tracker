// One nav for the whole app — previously this markup was copy-pasted into
// all five HTML files.
//
// Two rows, on purpose. The top one is the brand and a system tray (clock,
// settings, theme); the second is the pages written as a single directory
// line — `SYS:// dashboard ◈ history ◈ food ◈ about ▮` — with the current page
// highlighted the way XP highlights a selected item. It borrows the header of
// the owner's own site rather than the usual logo-left, links-right row, and it
// stays text on the page background (no blue title bar) so the logging screen
// stays calm.
import { useEffect, useState } from "react";
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
      className="tray-button"
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      {...iconPress}
    >
      {/* A half-filled circle rather than a sun and moon icon set. Drawn in CSS
          because the ◐ glyph falls back to a different font on every device and
          comes out a different size each time. */}
      <span className="glyph-half" aria-hidden="true" />
    </motion.button>
  );
}

// The system-tray clock. Re-read twice a minute rather than every second: it
// only shows minutes, and a one-second timer would re-render the nav for
// nothing. aria-hidden because a clock that announces itself is noise.
function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="tray-clock" aria-hidden="true">
      {now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
    </span>
  );
}

export function Nav() {
  // Read on each render rather than cached: Nav re-renders on every route
  // change, so this stays current after sign-in or a profile is deleted.
  const lastUserId = getLastUserId();
  const signedIn = Boolean(lastUserId && getUser(lastUserId));
  const withUser = (path) => (signedIn ? `${path}?user=${lastUserId}` : path);
  const active = ({ isActive }) => (isActive ? "active" : "");
  const Sep = () => (
    <span className="nav-sep" aria-hidden="true">
      ◈
    </span>
  );

  return (
    <nav className="nav" aria-label="Main">
      <div className="nav-top">
        <Link to="/" className="nav-brand">
          <span className="nav-name">
            Tsyoku<span>-naru</span>
          </span>
          <small aria-hidden="true">強くなる</small>
        </Link>

        <div className="nav-tray">
          <Clock />
          {/* Where the "?" button used to be. Replaying the walkthrough now
              lives in Settings, alongside everything else you set once. */}
          {signedIn && (
            <motion.span className="icon-motion" {...iconPress}>
              <NavLink
                to={withUser("/settings")}
                className={({ isActive }) => `tray-button ${isActive ? "active" : ""}`.trim()}
                aria-label="Settings"
              >
                <span className="glyph-box" aria-hidden="true" />
              </NavLink>
            </motion.span>
          )}
          <ThemeToggle />
        </div>
      </div>

      <div className="nav-links">
        <span className="nav-prompt" aria-hidden="true">
          SYS://
        </span>
        <NavLink to={withUser("/dashboard")} className={active}>
          Dashboard
        </NavLink>
        <Sep />
        <NavLink to={withUser("/history")} className={active}>
          History
        </NavLink>
        <Sep />
        <NavLink to={withUser("/food")} className={active}>
          Food
        </NavLink>
        <Sep />
        <NavLink to="/about" className={active}>
          About
        </NavLink>
        <span className="nav-cursor" aria-hidden="true">
          ▮
        </span>
      </div>
    </nav>
  );
}
