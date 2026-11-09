// One nav for the whole app — previously this markup was copy-pasted into
// all five HTML files.
//
// A Windows 98 taskbar: the name on the left with two text buttons beside it
// (Settings, and the theme switch, which says what it switches to), and the
// pages underneath as a row of big raised buttons, the current one pressed in.
// Words rather than glyphs throughout — a ▣ or ◐ has to be learned.
import { Link, NavLink } from "react-router-dom";
import { useTheme } from "../hooks/useTheme.js";
import { getLastUserId, getUser } from "../lib/store.js";

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button className="tray-button" type="button" onClick={toggle}>
      {theme === "dark" ? "Light" : "Dark"}
    </button>
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
      <div className="nav-top">
        <Link to="/" className="nav-brand">
          Tsyoku-naru
        </Link>

        <div className="nav-tray">
          {signedIn && (
            <NavLink to={withUser("/settings")} className={({ isActive }) => `tray-button ${isActive ? "active" : ""}`.trim()}>
              Settings
            </NavLink>
          )}
          <ThemeToggle />
        </div>
      </div>

      <div className="nav-links">
        <NavLink to={withUser("/dashboard")} className={active}>
          Dashboard
        </NavLink>
        <NavLink to={withUser("/history")} className={active}>
          History
        </NavLink>
        <NavLink to={withUser("/food")} className={active}>
          Food
        </NavLink>
        <NavLink to="/about" className={active}>
          About
        </NavLink>
      </div>
    </nav>
  );
}
