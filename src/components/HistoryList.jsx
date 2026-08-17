// Logged entries, newest first. Rows expand to show their individual sets and,
// where the caller allows it, to correct or delete them — until now a mistyped
// weight was permanent and silently skewed every total it fed.
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AnimatedList, AnimatedListItem, Button } from "./primitives.jsx";
import { SetBuilder } from "./SetBuilder.jsx";
import { describeReps, formatVolume, formatWeight, fromKg, logVolume, toKg, topWeight } from "../lib/units.js";

function relativeTime(isoString) {
  const diffMin = Math.round((Date.now() - new Date(isoString).getTime()) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.round(diffHr / 24)}d ago`;
}

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
        weight: log.bodyweight || !set.weight ? null : toKg(set.weight, unit),
      })),
    });
    onClose();
  }

  return (
    <AnimatedListItem className="history-row">
      <div className="history-main">
        <span className="log-main">
          <span className="log-name">{log.exerciseName}</span>
          {detail && <span className="log-detail">{detail}</span>}
        </span>
        <span className="history-meta">
          {volume > 0 && <span className="count">{formatVolume(volume, unit)}</span>}
          <span className="log-time">{relativeTime(log.loggedAt)}</span>
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
            <SetBuilder
              sets={draft}
              onChange={setDraft}
              timed={log.timed}
              bodyweight={log.bodyweight}
              unit={unit}
              onUnitChange={onUnitChange}
            />

            <div className="history-editor-actions">
              <Button type="button" size="small" onClick={save}>
                Save
              </Button>
              <Button
                type="button"
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

export function HistoryList({ logs, unit = "kg", onUnitChange, onEdit, onDelete, empty }) {
  // Which row is open, held here rather than per row so opening one closes the
  // other. Two rows in edit mode means two unsaved drafts and no way to tell
  // which set of numbers is about to be written.
  const [editingId, setEditingId] = useState(null);

  if (logs.length === 0) {
    return <p className="empty">{empty ?? "Nothing logged yet — add your first exercise above."}</p>;
  }

  return (
    <AnimatedList>
      {logs.map((log) => (
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
  );
}
