// Runs synchronously in <head>, before the page paints, so the correct
// theme is already set by the time anything renders — otherwise you'd
// see a flash of light mode before JS could switch to dark.
//
// localStorage can throw outright (storage disabled, some private modes); the
// OS preference is the right fallback there rather than a blank page.
(function () {
  var saved = null;
  try {
    saved = localStorage.getItem("workoutTracker.theme");
  } catch (e) {}
  var theme =
    saved === "light" || saved === "dark"
      ? saved
      : window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
  document.documentElement.setAttribute("data-theme", theme);
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "dark" ? "#050505" : "#ffffff");
})();
