const userId = getUserId();

// No profile picked in the URL, or it doesn't exist in this browser's
// storage — there's nothing to show, so send them through onboarding.
if (!userId || !getUser(userId)) {
  window.location.href = "onboarding.html";
}

const bodyMapEl = document.getElementById("bodyMap");
const summaryListEl = document.getElementById("summaryList");
const historyListEl = document.getElementById("historyList");
const greetingEl = document.getElementById("greeting");
const groupSelectEl = document.getElementById("groupSelect");
const logForm = document.getElementById("logForm");
const logError = document.getElementById("logError");

function populateGroupSelect() {
  groupSelectEl.innerHTML = BODY_GROUPS.map((g) => `<option value="${g.id}">${g.label}</option>`).join("");
}

function renderGreeting() {
  const user = getUser(userId);
  greetingEl.textContent = `${user.name}'s Progress`;
  // Lets the nav bar's Dashboard link find its way back here from any page.
  localStorage.setItem("workoutTracker.lastUserId", userId);
}

function renderSummary() {
  const summary = getSummary(userId, "all");
  bodyMapEl.innerHTML = bodyMapSVG(summary);

  const rows = BODY_GROUPS.map((g) => ({ ...g, count: summary[g.id] || 0 })).sort(
    (a, b) => b.count - a.count
  );
  summaryListEl.innerHTML = rows
    .map((r) => `<li><span>${r.label}</span><span class="count">${r.count}</span></li>`)
    .join("");
}

function renderHistory() {
  const logs = getLogsForUser(userId).slice(0, 20);
  historyListEl.innerHTML = logs.length
    ? logs
        .map(
          (log) => `
            <li>
              <span class="log-name">${log.exerciseName}</span>
              <span class="log-group">${log.bodyGroup}</span>
              <span class="log-time">${relativeTime(log.loggedAt)}</span>
            </li>`
        )
        .join("")
    : `<li class="empty">No exercises logged yet.</li>`;
}

function refresh() {
  renderSummary();
  renderHistory();
}

logForm.addEventListener("submit", (event) => {
  event.preventDefault();
  logError.hidden = true;
  const formData = new FormData(logForm);
  const exerciseName = formData.get("exerciseName");

  if (!exerciseName || !exerciseName.trim()) {
    logError.textContent = "Exercise name is required.";
    logError.hidden = false;
    return;
  }

  addLog(userId, { bodyGroup: formData.get("bodyGroup"), exerciseName });
  logForm.reset();
  refresh();
});

populateGroupSelect();
renderGreeting();
refresh();
