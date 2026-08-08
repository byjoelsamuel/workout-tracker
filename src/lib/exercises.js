// Curated exercise library, grouped by the muscle group each movement is
// logged against. Naming follows the "Movement (Equipment)" convention
// common to training apps, so variants of the same lift stay adjacent in
// the dropdown.
//
// Two flags keep logs honest rather than letting the form record nonsense:
//   bodyweight — no external load, so the weight field is hidden
//   timed      — measured in seconds held, not repetitions
//
// A movement appears under exactly one group: the one it's primarily
// training. Compound lifts are filed under the muscle doing most of the
// work (deadlift under back, dip under chest), so the body map doesn't
// double-count a single session.
export const EXERCISES = {
  shoulders: [
    { name: "Overhead Press (Barbell)" },
    { name: "Shoulder Press (Dumbbell)" },
    { name: "Arnold Press (Dumbbell)" },
    { name: "Shoulder Press (Machine)" },
    { name: "Lateral Raise (Dumbbell)" },
    { name: "Lateral Raise (Cable)" },
    { name: "Front Raise (Dumbbell)" },
    { name: "Rear Delt Fly (Dumbbell)" },
    { name: "Face Pull (Cable)" },
    { name: "Upright Row (Barbell)" },
  ],
  chest: [
    { name: "Bench Press (Barbell)" },
    { name: "Bench Press (Dumbbell)" },
    { name: "Incline Bench Press (Barbell)" },
    { name: "Incline Bench Press (Dumbbell)" },
    { name: "Decline Bench Press (Barbell)" },
    { name: "Chest Press (Machine)" },
    { name: "Chest Fly (Dumbbell)" },
    { name: "Cable Crossover" },
    { name: "Pec Deck (Machine)" },
    { name: "Push-Up", bodyweight: true },
    { name: "Dip", bodyweight: true },
  ],
  back: [
    { name: "Deadlift (Barbell)" },
    { name: "Pull-Up", bodyweight: true },
    { name: "Chin-Up", bodyweight: true },
    { name: "Lat Pulldown (Cable)" },
    { name: "Bent Over Row (Barbell)" },
    { name: "Seated Row (Cable)" },
    { name: "Single Arm Row (Dumbbell)" },
    { name: "T-Bar Row" },
    { name: "Straight Arm Pulldown (Cable)" },
    { name: "Shrug (Dumbbell)" },
    { name: "Back Extension", bodyweight: true },
  ],
  arms: [
    { name: "Bicep Curl (Barbell)" },
    { name: "Bicep Curl (Dumbbell)" },
    { name: "Hammer Curl (Dumbbell)" },
    { name: "Preacher Curl (Machine)" },
    { name: "Concentration Curl (Dumbbell)" },
    { name: "Cable Curl" },
    { name: "Triceps Pushdown (Cable)" },
    { name: "Overhead Triceps Extension (Dumbbell)" },
    { name: "Skullcrusher (Barbell)" },
    { name: "Close Grip Bench Press (Barbell)" },
    { name: "Triceps Kickback (Dumbbell)" },
  ],
  abs: [
    { name: "Crunch", bodyweight: true },
    { name: "Sit-Up", bodyweight: true },
    { name: "Hanging Leg Raise", bodyweight: true },
    { name: "Cable Crunch" },
    { name: "Russian Twist" },
    { name: "Ab Wheel Rollout", bodyweight: true },
    { name: "Plank", bodyweight: true, timed: true },
    { name: "Side Plank", bodyweight: true, timed: true },
    { name: "Hollow Body Hold", bodyweight: true, timed: true },
    { name: "Mountain Climber", bodyweight: true, timed: true },
  ],
  legs: [
    { name: "Back Squat (Barbell)" },
    { name: "Front Squat (Barbell)" },
    { name: "Goblet Squat (Dumbbell)" },
    { name: "Leg Press (Machine)" },
    { name: "Romanian Deadlift (Barbell)" },
    { name: "Bulgarian Split Squat (Dumbbell)" },
    { name: "Walking Lunge (Dumbbell)" },
    { name: "Leg Extension (Machine)" },
    { name: "Lying Leg Curl (Machine)" },
    { name: "Hip Thrust (Barbell)" },
    { name: "Step-Up (Dumbbell)" },
  ],
  calves: [
    { name: "Standing Calf Raise (Machine)" },
    { name: "Seated Calf Raise (Machine)" },
    { name: "Calf Press (Leg Press)" },
    { name: "Single Leg Calf Raise (Dumbbell)" },
    { name: "Calf Raise", bodyweight: true },
  ],
};

// Looks a movement up by name. Returns null for anything not in the
// library — logs written before this existed hold free text, and their
// rows still have to render.
export function findExercise(bodyGroup, name) {
  return (EXERCISES[bodyGroup] || []).find((e) => e.name === name) || null;
}
