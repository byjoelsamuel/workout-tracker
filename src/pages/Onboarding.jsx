import { useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Button, Card, PageHeader } from "../components/primitives.jsx";
import { useUsers } from "../hooks/useStore.js";
import { createUser, setLastUserId } from "../lib/store.js";
import { pageVariants } from "../lib/motionVariants.js";

export function Onboarding() {
  const navigate = useNavigate();
  const users = useUsers();
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(users[0]?.id ?? "");

  function goToDashboard(userId) {
    setLastUserId(userId);
    navigate(`/dashboard?user=${userId}`);
  }

  function handleCreate(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    const name = form.get("name");

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    const user = createUser({
      name,
      bodyweight: form.get("bodyweight"),
      height: form.get("height"),
      age: form.get("age"),
    });
    goToDashboard(user.id);
  }

  return (
    <motion.main
      className="page"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <PageHeader
        eyebrow="Step 1"
        title="Tell us about you"
        subhead="Only your name is required — the rest just shows up on your dashboard."
      />

      <div className="card-stack">
        <Card>
          <h2>Create a profile</h2>
          <form className="form" onSubmit={handleCreate}>
            <label>
              Name
              <input type="text" name="name" placeholder="e.g. Joel" autoComplete="off" />
            </label>

            <div className="form-row">
              <label>
                Weight (kg)
                <input type="number" name="bodyweight" min="0" step="0.1" placeholder="—" />
              </label>
              <label>
                Height (cm)
                <input type="number" name="height" min="0" step="0.1" placeholder="—" />
              </label>
              <label>
                Age
                <input type="number" name="age" min="0" step="1" placeholder="—" />
              </label>
            </div>

            {error && <p className="form-error">{error}</p>}
            <Button type="submit" block>
              Continue
            </Button>
          </form>
        </Card>

        {/* Only worth showing once there's something to come back to. */}
        {users.length > 0 && (
          <Card>
            <h2>Already have a profile?</h2>
            <p className="subhead small">Pick up where you left off.</p>
            <form
              className="form"
              onSubmit={(event) => {
                event.preventDefault();
                if (selectedId) goToDashboard(selectedId);
              }}
            >
              <label>
                Profile
                <select
                  name="userId"
                  value={selectedId}
                  onChange={(event) => setSelectedId(event.target.value)}
                >
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </label>
              <Button type="submit" variant="secondary" block>
                Go to dashboard
              </Button>
            </form>
          </Card>
        )}
      </div>
    </motion.main>
  );
}
