// Choosing a movement, in the order people actually reach for one:
//
//   1. the handful you keep doing — two rows of chips, no typing
//   2. search, when it isn't one of those
//   3. browsing by muscle group, when you don't know what you want — or tap
//      the muscle on the body map
//
// Browsing used to be two dropdowns (group, then exercise), which on a phone
// meant two native pickers in a row to reach a lift. Chips plus a list keep
// every option on screen and one tap away.
//
// The search box is a combobox: arrow keys move through results and Enter
// picks one, and `/` focuses it from anywhere on the dashboard.
import { useEffect, useId, useRef, useState } from "react";
import { motion } from "motion/react";
import { BODY_GROUPS, GROUP_LABELS } from "../lib/bodyGroups.js";
import { EXERCISES, searchExercises } from "../lib/exercises.js";
import { listItemVariants, listVariants } from "../lib/motionVariants.js";

// Two rows' worth at the widths this app runs at.
const RECENT_LIMIT = 8;

function isTyping(target) {
  return target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
}

export function ExercisePicker({ recents = [], value, onChange, group, onGroupChange }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const listId = useId();

  const results = searchExercises(query);
  const chips = recents.slice(0, RECENT_LIMIT);
  const searching = query.trim() !== "";

  useEffect(() => {
    function onKey(event) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || isTyping(event.target)) return;
      if (document.documentElement.classList.contains("modal-open")) return;
      event.preventDefault();
      inputRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => setActive(0), [query]);

  // Picking anything clears the search, so the next selection starts from the
  // chips again rather than from a stale result list.
  function choose(exercise) {
    onChange({ bodyGroup: exercise.bodyGroup, name: exercise.name });
    setQuery("");
  }

  function onSearchKey(event) {
    if (!searching) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (results[active]) choose(results[active]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setQuery("");
    }
  }

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
                className={`chip ${value?.name === exercise.name ? "active" : ""}`.trim()}
                onClick={() => choose(exercise)}
              >
                {exercise.name}
              </motion.button>
            ))}
          </motion.div>
        </div>
      )}

      <div className="picker-section">
        <label className="picker-search" data-tour="search">
          <span className="picker-label">Search all exercises</span>
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={searching}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={searching && results[active] ? `${listId}-${active}` : undefined}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onSearchKey}
            placeholder="Try “bench”, “curl”, “squat”…"
            autoComplete="off"
            spellCheck="false"
          />
        </label>

        {searching && (
          <ul className="picker-results" id={listId} role="listbox" aria-label="Matching exercises">
            {results.length === 0 ? (
              <li className="picker-empty" role="option" aria-disabled="true" aria-selected="false">
                No movement matches “{query.trim()}”.
              </li>
            ) : (
              results.map((exercise, i) => (
                <li
                  key={`${exercise.bodyGroup}-${exercise.name}`}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  className={i === active ? "active" : undefined}
                  onPointerEnter={() => setActive(i)}
                  // mousedown, not click: a click lands after the input blurs.
                  onMouseDown={(event) => {
                    event.preventDefault();
                    choose(exercise);
                  }}
                >
                  <span>{exercise.name}</span>
                  <span className="picker-group">{exercise.groupLabel}</span>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      {!searching && (
        <div className="picker-section">
          <span className="picker-label">Browse by muscle group</span>
          <div className="chip-row" role="group" aria-label="Muscle groups">
            {BODY_GROUPS.map((g) => (
              <button
                key={g.id}
                type="button"
                className={`chip ${group === g.id ? "active" : ""}`.trim()}
                aria-pressed={group === g.id}
                onClick={() => onGroupChange(group === g.id ? null : g.id)}
              >
                {g.label}
              </button>
            ))}
          </div>

          {group && (
            <motion.ul
              key={group}
              className="picker-results"
              aria-label={`${GROUP_LABELS[group]} exercises`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
            >
              {EXERCISES[group].map((exercise) => (
                <li key={exercise.name}>
                  <button type="button" onClick={() => choose({ ...exercise, bodyGroup: group })}>
                    <span>{exercise.name}</span>
                    <span className="picker-group">{GROUP_LABELS[group]}</span>
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </div>
      )}
    </div>
  );
}
