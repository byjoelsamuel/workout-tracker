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
  // Per-profile, so a second profile still gets its own first-run guide.
  hasSeenGuide: (userId) => `workoutTracker.hasSeenGuide.${userId}`,
};
