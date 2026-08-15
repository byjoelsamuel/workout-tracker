// Every localStorage key the app touches, in one place.
//
// These strings are load-bearing: the live site already has real user data
// saved under them. Changing one silently orphans everyone's history, so
// treat them as a fixed wire format rather than an implementation detail.
export const STORAGE_KEYS = {
  users: "workoutTracker.users",
  logs: "workoutTracker.logs",
  lastUserId: "workoutTracker.lastUserId",
  theme: "workoutTracker.theme",
  // Display unit for weights. Deliberately global rather than per-profile:
  // it describes the scale in the room, not the person standing on it.
  unit: "workoutTracker.unit",
  // Per-profile, so a second profile still gets its own first-run guide.
  hasSeenGuide: (userId) => `workoutTracker.hasSeenGuide.${userId}`,
  // The workout currently in progress, if any. Per-profile so two people
  // sharing a browser can't end up logging into each other's session.
  activeWorkout: (userId) => `workoutTracker.activeWorkout.${userId}`,
};
