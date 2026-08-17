// Choosing a movement, in the order people actually reach for one:
//
//   1. the handful you keep doing — two rows of chips, no typing
//   2. search, when it isn't one of those
//   3. browsing by muscle group, when you don't know what you want
//
// The group dropdown used to be the only route, which meant every session
// started by scrolling a flat list of up to 30 entries to reach the same lift
// as last time.
import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { BODY_GROUPS } from "../lib/bodyGroups.js";
import { EXERCISES, searchExercises } from "../lib/exercises.js";
import { listItemVariants, listVariants } from "../lib/motionVariants.js";

// Two rows' worth at the widths this app runs at.
const RECENT_LIMIT = 8;

export function ExercisePicker({ recents = [], value, onChange }) {
  const [query, setQuery] = useState("");
  const [browsing, setBrowsing] = useState(false);
  const [group, setGroup] = useState(value?.bodyGroup ?? BODY_GROUPS[0].id);
  const inputRef = useRef(null);

  const results = searchExercises(query);
  const chips = recents.slice(0, RECENT_LIMIT);

  // Picking anything clears the search, so the next selection starts from the
  // chips again rather than from a stale result list.
  function choose(exercise) {
    onChange({ bodyGroup: exercise.bodyGroup, name: exercise.name });
    setQuery("");
  }

  useEffect(() => {
    if (browsing) setGroup(value?.bodyGroup ?? BODY_GROUPS[0].id);
  }, [browsing, value?.bodyGroup]);

  return (
    <div className="picker">
      {chips.length > 0 && (
        <div className="picker-section">
          <span className="picker-label">Recent</span>
          <motion.div className="chip-row" variants={listVariants} initial="hidden" animate="show">
            {chips.map((exercise) => (
              <motion.button
                key={exercise.name}
                type="button"
                variants={listItemVariants}
                className={`chip ${value?.name === exercise.name ? "active" : ""}`}
                onClick={() => choose(exercise)}
              >
                {exercise.name}
              </motion.button>
            ))}
          </motion.div>
        </div>
      )}

      <div className="picker-section">
        <label className="picker-search">
          <span className="picker-label">Search all exercises</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try “bench”, “curl”, “squat”…"
            autoComplete="off"
          />
        </label>

        {query.trim() && (
          <ul className="picker-results">
            {results.length === 0 ? (
              <li className="picker-empty">No movement matches “{query.trim()}”.</li>
            ) : (
              results.map((exercise) => (
                <li key={`${exercise.bodyGroup}-${exercise.name}`}>
                  <button type="button" onClick={() => choose(exercise)}>
                    <span>{exercise.name}</span>
                    <span className="picker-group">{exercise.groupLabel}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      <button
        type="button"
        className="picker-browse-toggle"
        aria-expanded={browsing}
        onClick={() => setBrowsing((open) => !open)}
      >
        {browsing ? "Hide muscle groups" : "Browse by muscle group"}
      </button>

      {browsing && (
        <div className="form-row two">
          <label>
            Muscle group
            <select value={group} onChange={(event) => setGroup(event.target.value)}>
              {BODY_GROUPS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Exercise
            <select
              value={value?.bodyGroup === group ? value.name : ""}
              onChange={(event) =>
                onChange({ bodyGroup: group, name: event.target.value })
              }
            >
              <option value="" disabled>
                Choose…
              </option>
              {EXERCISES[group].map((exercise) => (
                <option key={exercise.name} value={exercise.name}>
                  {exercise.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
    </div>
  );
}
