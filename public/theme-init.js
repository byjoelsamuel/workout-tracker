// Runs synchronously in <head>, before the page paints, so the correct
// theme is already set by the time anything renders — otherwise you'd
// see a flash of light mode before JS could switch to dark.
(function () {
  var saved = localStorage.getItem("workoutTracker.theme");
  var theme = saved || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", theme);
})();
