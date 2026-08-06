// Small helpers shared by every page. Loaded before the page-specific
// script (dashboard.js / compare.js / onboarding.js) on each HTML page.

// The current profile is identified via ?user=<id> in the URL — no
// cookies or sessions, just whichever id the page was loaded with.
function getUserId() {
  return new URLSearchParams(window.location.search).get("user");
}

// Turns an ISO timestamp into "5m ago" / "3h ago" / "2d ago" for the
// recent-activity feed.
function relativeTime(isoString) {
  const diffMin = Math.round((Date.now() - new Date(isoString).getTime()) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.round(diffHr / 24)}d ago`;
}

// Remembers the last profile visited so the nav bar's "Dashboard" link
// can jump straight back to it from any page, without a real login system.
document.addEventListener("DOMContentLoaded", () => {
  const dashboardLink = document.getElementById("navDashboard");
  const lastUserId = localStorage.getItem("workoutTracker.lastUserId");
  if (dashboardLink && lastUserId) {
    dashboardLink.href = `dashboard.html?user=${lastUserId}`;
  }
});
