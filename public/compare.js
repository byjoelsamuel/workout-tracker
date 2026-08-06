const compareGridEl = document.getElementById("compareGrid");

function render() {
  const users = getCompareData();

  if (!users.length) {
    compareGridEl.innerHTML = `<p class="empty">No profiles yet. <a href="onboarding.html">Create one</a> to get started.</p>`;
    return;
  }

  compareGridEl.innerHTML = users
    .map((user) => {
      const total = Object.values(user.summary).reduce((sum, n) => sum + n, 0);
      const sessionLabel = total === 1 ? "session" : "sessions";
      return `
        <article class="card compare-card">
          <h3>${user.name}</h3>
          <p class="subhead small">${total} ${sessionLabel} this week</p>
          <div class="body-map-wrap">${bodyMapSVG(user.summary)}</div>
          <a class="button secondary small" href="dashboard.html?user=${user.id}">View dashboard</a>
        </article>`;
    })
    .join("");
}

render();
