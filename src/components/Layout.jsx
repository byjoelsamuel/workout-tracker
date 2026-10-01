import { Component, useEffect } from "react";
import { AnimatePresence, MotionConfig } from "motion/react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Nav } from "./Nav.jsx";
import { ToastProvider } from "./Toaster.jsx";
import { UpdatePrompt } from "./UpdatePrompt.jsx";
import { Landing } from "../pages/Landing.jsx";
import { Welcome } from "../pages/Welcome.jsx";
import { Onboarding } from "../pages/Onboarding.jsx";
import { Dashboard } from "../pages/Dashboard.jsx";
import { Progress } from "../pages/Progress.jsx";
import { Compare } from "../pages/Compare.jsx";
import { Settings } from "../pages/Settings.jsx";
import { About } from "../pages/About.jsx";
import { getLastUserId, getUser } from "../lib/store.js";
import { isApp, isDesktop } from "../lib/platform.js";

// An app — desktop, or installed to a home screen — has no landing page to
// land on: it opens where you left off, or on the profile picker.
function AppHome() {
  const last = getLastUserId();
  return <Navigate to={last && getUser(last) ? `/dashboard?user=${last}` : "/welcome"} replace />;
}

const TITLES = {
  "/welcome": "Who's training?",
  "/welcome/new": "New profile",
  "/dashboard": "Dashboard",
  "/progress": "Progress",
  "/compare": "Compare",
  "/settings": "Settings",
  "/about": "About",
};

// A render error used to leave a white page with no way out — most likely
// cause being a hand-edited localStorage value. This keeps the way out on
// screen, and says the data is still there, which is the first thing anyone
// would worry about.
class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error(error, info.componentStack);
  }

  // Cleared on navigation rather than by keying the boundary on the route: a
  // key would remount AnimatePresence underneath it and cut every page's exit
  // animation off mid-frame.
  componentDidUpdate(prev) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="page">
        <header className="page-header">
          <h1>Something broke on this screen.</h1>
          <p className="subhead">Your workouts are still saved in this browser. Reloading usually sorts it out.</p>
        </header>
        <div className="crash-actions">
          <button type="button" className="button" onClick={() => window.location.reload()}>
            Reload
          </button>
          <a className="button secondary" href="/welcome">
            Back to profiles
          </a>
        </div>
      </main>
    );
  }
}

export function Layout() {
  const location = useLocation();

  useEffect(() => {
    const page = TITLES[location.pathname];
    document.title = page ? `${page} · Tsyoku-naru` : "Tsyoku-naru";
  }, [location.pathname]);

  // A new page starts at its top. Without this, opening Progress from halfway
  // down the dashboard landed halfway down Progress.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    // reducedMotion="user" makes every motion component honour the OS
    // setting rather than each one remembering to ask.
    <MotionConfig reducedMotion="user">
      <ToastProvider>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Nav />
        {isDesktop && <UpdatePrompt />}
        {/* Both pages animate at once so the transition reads like a
            workspace switch rather than a queue. They have to overlap to do
            that, and AnimatePresence's popLayout can't arrange it here — it
            styles motion children directly, and its child is <Routes>. So
            .route-stack drops both into the same grid cell instead.

            The key includes search, not only pathname — switching profiles
            (?user=A -> ?user=B) leaves the pathname untouched, so without it
            Dashboard would stay mounted and keep showing the old profile. */}
        <div className="route-stack" id="main" tabIndex={-1}>
          <ErrorBoundary resetKey={location.pathname}>
            <AnimatePresence initial={false}>
              <Routes location={location} key={location.pathname + location.search}>
                <Route path="/" element={isApp ? <AppHome /> : <Landing />} />
                <Route path="/welcome" element={<Welcome />} />
                <Route path="/welcome/new" element={<Onboarding />} />
                {/* The old sign-up URL, so bookmarks still land somewhere. */}
                <Route path="/onboarding" element={<Navigate to="/welcome" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/progress" element={<Progress />} />
                <Route path="/compare" element={<Compare />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/about" element={<About />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AnimatePresence>
          </ErrorBoundary>
        </div>
      </ToastProvider>
    </MotionConfig>
  );
}
