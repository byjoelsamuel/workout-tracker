const userSelect = document.getElementById("userSelect");
const profileForm = document.getElementById("profileForm");
const returningForm = document.getElementById("returningForm");
const profileError = document.getElementById("profileError");

// Populates the "returning user" dropdown from every profile that
// currently exists in the database.
async function loadExistingUsers() {
  const users = await fetchJSON("/api/users");
  userSelect.innerHTML = users.length
    ? users.map((u) => `<option value="${u.id}">${u.name}</option>`).join("")
    : `<option value="">No profiles yet</option>`;
}

// Creating a profile is the "information seeker" flow: collect the
// basics, POST them, then redirect straight to that profile's dashboard.
profileForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  profileError.hidden = true;
  const formData = new FormData(profileForm);

  try {
    const user = await fetchJSON("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        bodyweight: formData.get("bodyweight") || null,
        height: formData.get("height") || null,
        age: formData.get("age") || null,
      }),
    });
    localStorage.setItem("lastUserId", user.id);
    window.location.href = `dashboard.html?user=${user.id}`;
  } catch (err) {
    profileError.textContent = err.message;
    profileError.hidden = false;
  }
});

// Picking an existing profile skips creation entirely — no POST needed,
// just navigate with the chosen id in the query string.
returningForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const id = userSelect.value;
  if (!id) return;
  localStorage.setItem("lastUserId", id);
  window.location.href = `dashboard.html?user=${id}`;
});

loadExistingUsers();
