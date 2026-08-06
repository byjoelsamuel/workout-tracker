const userId = getUserId();

// No profile picked in the URL — there's nothing to show, so send them
// through onboarding to pick or create one.
if (!userId) {
  window.location.href = "onboarding.html";
}

const bodyMapEl = document.getElementById("bodyMap");
const summaryListEl = document.getElementById("summaryList");
const historyListEl = document.getElementById("historyList");
const greetingEl = document.getElementById("greeting");
const groupSelectEl = document.getElementById("groupSelect");
const logForm = document.getElementById("logForm");
const logError = document.getElementById("logError");

// Cached once on load; both the log-exercise dropdown and the text
// breakdown next to the body map need the full label list.
let bodyGroups = [];

async function loadBodyGroups() {
  bodyGroups = await fetchJSON("/api/body-groups");
  groupSelectEl.innerHTML = bodyGroups
    .map((g) => `<option value="${g.id}">${g.label}</option>`)
    .join("");
}

async function loadUser() {
  const user = await fetchJSON(`/api/users/${userId}`);
  greetingEl.textContent = `${user.name}'s Progress`;
  // Lets the nav bar's Dashboard link find its way back here from any page.
  localStorage.setItem("lastUserId", userId);
}

async function loadSummary() {
  const summary = await fetchJSON(`/api/users/${userId}/summary`);
  bodyMapEl.innerHTML = bodyMapSVG(summary);

  const rows = bodyGroups
    .map((g) => ({ ...g, count: summary[g.id] || 0 }))
    .sort((a, b) => b.count - a.count);
  summaryListEl.innerHTML = rows
    .map((r) => `<li><span>${r.label}</span><span class="count">${r.count}</span></li>`)
    .join("");
}

async function loadHistory() {
  const logs = await fetchJSON(`/api/users/${userId}/exercises`);
  historyListEl.innerHTML = logs.length
    ? logs
        .map(
          (log) => `
            <li>
              <span class="log-name">${log.exercise_name}</span>
              <span class="log-group">${log.body_group}</span>
              <span class="log-time">${relativeTime(log.logged_at)}</span>
            </li>`
        )
        .join("")
    : `<li class="empty">No exercises logged yet.</li>`;
}

async function refresh() {
  await Promise.all([loadSummary(), loadHistory()]);
}

logForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  logError.hidden = true;
  const formData = new FormData(logForm);

  try {
    await fetchJSON(`/api/users/${userId}/exercises`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bodyGroup: formData.get("bodyGroup"),
        exerciseName: formData.get("exerciseName"),
      }),
    });
    logForm.reset();
    await refresh();
  } catch (err) {
    logError.textContent = err.message;
    logError.hidden = false;
  }
});

(async function init() {
  await Promise.all([loadBodyGroups(), loadUser()]);
  await refresh();
})();
