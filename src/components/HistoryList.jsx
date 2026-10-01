// Logged entries, newest first, grouped by the workout they belong to. Rows
// expand to show their individual sets and, where the caller allows it, to
// correct or delete them.
//
// Grouped because a flat list of forty rows answered "what did I do?" one
// movement at a time; a workout is the unit people remember ("Tuesday's leg
// day"). Grouping uses sessionKey, so pre-session rows fall into one group per
// calendar day, the same way the weekly goal counts them.
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AnimatedList, AnimatedListItem, Button } from "./primitives.jsx";
import { SetBuilder } from "./SetBuilder.jsx";
import { relativeDay, sessionKey } from "../lib/time.js";
import { describeReps, formatVolume, formatWeight, fromKg, logVolume, toKg, topWeight, totalVolume } from "../lib/units.js";

// "3 × 10 · 60 kg", or "10, 8, 8, 6 · up to 85 kg" when the sets differ.
// Returns null for rows saved before sets existed, so those show the exercise
// name rather than invented numbers.
function summarise(log, unit) {
  const reps = describeReps(log);
  if (!reps) return null;
  const top = topWeight(log);
  if (top == null) return reps;
  const uniform = log.sets.every((set) => set.weight === log.sets[0].weight);
  return `${reps} · ${uniform ? "" : "up to "}${formatWeight(top, unit)}`;
}

// Stored weights are kilograms; the editor works in whatever unit is on screen.
function toEditable(log, unit) {
  return log.sets.map((set) => ({
    id: set.id,
    reps: set.reps == null ? "" : String(set.reps),
    weight: set.weight == null ? "" : String(Math.round(fromKg(set.weight, unit) * 10) / 10),
  }));
}

const dayFormat = new Intl.DateTimeFormat(undefined, { weekday: "short", day: "numeric", month: "short" });
const timeFormat = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });

function Row({ log, unit, onUnitChange, onEdit, onDelete, editing, onOpen, onClose }) {
  const [confirming, setConfirming] = useState(false);
  const [draft, setDraft] = useState([]);
  const detail = summarise(log, unit);
  const volume = logVolume(log);
  const editable = Boolean(onEdit && onDelete);

  function startEditing() {
    setDraft(toEditable(log, unit));
    setConfirming(false);
    onOpen();
  }

  function save() {
    onEdit(log.id, {
      sets: draft.map((set) => ({
        id: set.id,
        reps: Number(set.reps) || null,
        weight: log.bodyweight || !Number(set.weight) ? null : toKg(set.weight, unit),
      })),
    });
    onClose();
  }

  return (
    <AnimatedListItem className={`history-row ${editing ? "editing" : ""}`}>
      <div className="history-main">
        <span className="log-main">
          <span className="log-name">{log.exerciseName}</span>
          {detail && <span className="log-detail">{detail}</span>}
        </span>
        <span className="history-meta">
          {volume > 0 && <span className="count">{formatVolume(volume, unit)}</span>}
          <span className="log-time">{timeFormat.format(new Date(log.loggedAt))}</span>
          {editable && !editing && (
            <button
              type="button"
              className="row-action"
              aria-label={`Edit ${log.exerciseName}`}
              onClick={startEditing}
            >
              Edit
            </button>
          )}
        </span>
      </div>

      <AnimatePresence initial={false}>
        {editing && (
          <motion.div
            className="history-editor"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            // A tween, not a spring: AnimatePresence unmounts when the exit
            // resolves, and a spring's tail is long enough that a closing
            // editor stays in the DOM well after it looks gone — which means
            // two rows appear to be open at once.
            transition={{ duration: 0.18, ease: "easeInOut" }}
          >
            {/* Rows saved before sets existed open empty. Adding sets to one
                records numbers the user supplies — never invented ones. */}
            {log.sets.length === 0 && (
              <p className="field-note">Saved before sets were recorded. Add the sets you remember, or leave it as it is.</p>
            )}
            <SetBuilder
              sets={draft}
              onChange={setDraft}
              timed={log.timed}
              bodyweight={log.bodyweight}
              unit={unit}
              onUnitChange={onUnitChange}
            />

            <div className="history-editor-actions">
              <Button size="small" onClick={save}>
                Save
              </Button>
              <Button
                size="small"
                variant="secondary"
                onClick={() => {
                  onClose();
                  setConfirming(false);
                }}
              >
                Cancel
              </Button>
              {/* Deleting is the one irreversible action here, so it asks
                  once rather than firing on the first click. */}
              {confirming ? (
                <button type="button" className="row-danger" onClick={() => onDelete(log.id)}>
                  Delete for good?
                </button>
              ) : (
                <button type="button" className="row-danger" onClick={() => setConfirming(true)}>
                  Delete
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatedListItem>
  );
}

function groupBySession(logs) {
  const groups = new Map();
  for (const log of logs) {
    const key = sessionKey(log);
    if (!groups.has(key)) groups.set(key, { key, at: log.loggedAt, logs: [] });
    groups.get(key).logs.push(log);
  }
  return [...groups.values()];
}

export function HistoryList({ logs, unit = "kg", onUnitChange, onEdit, onDelete, empty }) {
  // Which row is open, held here rather than per row so opening one closes the
  // other. Two rows in edit mode means two unsaved drafts and no way to tell
  // which set of numbers is about to be written.
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState("");

  const shown = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return groupBySession(q ? logs.filter((log) => log.exerciseName.toLowerCase().includes(q)) : logs);
  }, [logs, filter]);

  if (logs.length === 0) {
    return <p className="empty">{empty ?? "Nothing logged yet — add your first exercise above."}</p>;
  }

  return (
    <div className="history">
      <input
        type="search"
        className="history-filter"
        aria-label="Filter history by exercise"
        placeholder="Filter by exercise…"
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
      />

      {shown.length === 0 && <p className="empty">No entries match “{filter.trim()}”.</p>}

      {shown.map((group) => {
        const volume = totalVolume(group.logs);
        return (
          <section className="history-group" key={group.key} aria-label={dayFormat.format(new Date(group.at))}>
            <header className="history-group-head">
              <strong>{dayFormat.format(new Date(group.at))}</strong>
              <span>
                {relativeDay(group.at)} · {group.logs.length} {group.logs.length === 1 ? "exercise" : "exercises"}
                {volume > 0 && ` · ${formatVolume(volume, unit)}`}
              </span>
            </header>
            <AnimatedList>
              {group.logs.map((log) => (
                <Row
                  key={log.id}
                  log={log}
                  unit={unit}
                  onUnitChange={onUnitChange}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  editing={editingId === log.id}
                  onOpen={() => setEditingId(log.id)}
                  onClose={() => setEditingId(null)}
                />
              ))}
            </AnimatedList>
          </section>
        );
      })}
    </div>
  );
}
