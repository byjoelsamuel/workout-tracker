const userSelect = document.getElementById("userSelect");
const profileForm = document.getElementById("profileForm");
const returningForm = document.getElementById("returningForm");
const profileError = document.getElementById("profileError");

// Populates the "returning user" dropdown from every profile that
// currently exists in this browser's localStorage.
function loadExistingUsers() {
  const users = listUsers();
  userSelect.innerHTML = users.length
    ? users.map((u) => `<option value="${u.id}">${u.name}</option>`).join("")
    : `<option value="">No profiles yet</option>`;
}

// Creating a profile is the "information seeker" flow: collect the
// basics, save them, then go straight to that profile's dashboard.
profileForm.addEventListener("submit", (event) => {
  event.preventDefault();
  profileError.hidden = true;
  const formData = new FormData(profileForm);
  const name = formData.get("name");

  if (!name || !name.trim()) {
    profileError.textContent = "Name is required.";
    profileError.hidden = false;
    return;
  }

  const user = createUser({
    name,
    bodyweight: formData.get("bodyweight"),
    height: formData.get("height"),
    age: formData.get("age"),
  });
  localStorage.setItem("workoutTracker.lastUserId", user.id);
  window.location.href = `dashboard.html?user=${user.id}`;
});

// Picking an existing profile skips creation entirely — just navigate
// with the chosen id in the query string.
returningForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const id = userSelect.value;
  if (!id) return;
  localStorage.setItem("workoutTracker.lastUserId", id);
  window.location.href = `dashboard.html?user=${id}`;
});

loadExistingUsers();
