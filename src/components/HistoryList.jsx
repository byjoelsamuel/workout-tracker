import { AnimatedList, AnimatedListItem } from "./primitives.jsx";
import { formatWeight } from "../lib/units.js";

function relativeTime(isoString) {
  const diffMin = Math.round((Date.now() - new Date(isoString).getTime()) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.round(diffHr / 24)}d ago`;
}

// "3 × 10 · 60 kg", or "3 × 45s" for holds. Returns null for logs saved
// before sets/reps existed, so those rows just show the exercise name
// instead of inventing numbers for them.
function describeSets(log, unit) {
  if (!log.sets || !log.reps) return null;
  const volume = `${log.sets} × ${log.reps}${log.timed ? "s" : ""}`;
  return log.weight ? `${volume} · ${formatWeight(log.weight, unit)}` : volume;
}

export function HistoryList({ logs, unit = "kg" }) {
  if (logs.length === 0) {
    return <p className="empty">Nothing logged yet — add your first exercise above.</p>;
  }

  return (
    <AnimatedList>
      {logs.map((log) => {
        const detail = describeSets(log, unit);
        return (
          <AnimatedListItem key={log.id}>
            <span className="log-main">
              <span className="log-name">{log.exerciseName}</span>
              {detail && <span className="log-detail">{detail}</span>}
            </span>
            <span className="log-time">{relativeTime(log.loggedAt)}</span>
          </AnimatedListItem>
        );
      })}
    </AnimatedList>
  );
}
