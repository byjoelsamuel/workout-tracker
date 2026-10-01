// "Who's training?" — the sign-in screen.
//
// There's no password because there's no account: profiles live in this
// browser's storage and nothing leaves it. A password would be theatre — it
// would sit in the same localStorage it claims to protect, readable by anyone
// with the device. What a shared machine actually needs is a quick, clear way
// to be the right person, which is what a list of profiles is.
//
// Replaces the old onboarding page's "Already have a profile?" card, which was
// a <select> and a second button: two steps to do one thing.
import { motion } from "motion/react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button, Card, PageHeader } from "../components/primitives.jsx";
import { useProfiles } from "../hooks/useStore.js";
import { setLastUserId } from "../lib/store.js";
import { listItemVariants, listVariants, pageVariants } from "../lib/motionVariants.js";
import { relativeDay } from "../lib/time.js";

export function Welcome() {
  const navigate = useNavigate();
  const profiles = useProfiles();

  // Nobody here yet: the list would be empty, so go straight to making one.
  if (profiles.length === 0) return <Navigate to="/welcome/new" replace />;

  function signIn(id) {
    setLastUserId(id);
    navigate(`/dashboard?user=${id}`);
  }

  return (
    <motion.main className="page" variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <PageHeader
        eyebrow="Welcome back"
        title="Who's training?"
        subhead="Pick your profile to pick up where you left off."
      />

      <div className="card-stack">
        <Card>
          <h2>Profiles on this browser</h2>
          <motion.ul className="profile-list" variants={listVariants} initial="hidden" animate="show">
            {profiles.map((profile) => (
              <motion.li key={profile.id} variants={listItemVariants}>
                <button type="button" className="profile-row" onClick={() => signIn(profile.id)}>
                  <span className="log-main">
                    <span className="log-name">{profile.name}</span>
                    <span className="log-detail">
                      {profile.lastTrained ? `Trained ${relativeDay(profile.lastTrained)}` : "No workouts yet"}
                      {profile.entries > 0 && ` · ${profile.entries} ${profile.entries === 1 ? "entry" : "entries"}`}
                    </span>
                  </span>
                  <span className="profile-go" aria-hidden="true">
                    →
                  </span>
                </button>
              </motion.li>
            ))}
          </motion.ul>
          <Button to="/welcome/new" variant="secondary" block>
            Create a new profile
          </Button>
        </Card>
      </div>
    </motion.main>
  );
}
