// The food log: what you ate on a day, and adding to it.
//
// Lookups go to Open Food Facts (lib/food.js) when you scan or search; what
// you log is stored on the device with everything else.
import { useState } from "react";
import { motion } from "motion/react";
import { Navigate, useSearchParams } from "react-router-dom";
import { FoodFinder } from "../components/FoodFinder.jsx";
import { FoodPortion } from "../components/FoodPortion.jsx";
import { useToast } from "../components/Toaster.jsx";
import { PageHeader, AppWindow } from "../components/primitives.jsx";
import { useFoodLog, useUser } from "../hooks/useStore.js";
import { entriesOn, MEALS, proteinTarget, sameDay, totalNutrition } from "../lib/food.js";
import { pageVariants } from "../lib/motionVariants.js";

const DAY_MS = 24 * 60 * 60 * 1000;

function dayTitle(day) {
  const now = new Date();
  if (sameDay(day, now)) return "Today";
  if (sameDay(day, now.getTime() - DAY_MS)) return "Yesterday";
  return day.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function DayLog({ entries, user, onRemove }) {
  const total = totalNutrition(entries);
  const target = proteinTarget(user.bodyweight);

  return (
    <>
      <p className="food-kcal food-day-total num">{total.kcal.toLocaleString()} kcal</p>
      <p className="food-macros">
        <span>
          Protein {total.protein}
          {target ? ` / ${target}` : ""} g
        </span>
        <span>Carbs {total.carbs} g</span>
        <span>Fat {total.fat} g</span>
      </p>

      {entries.length === 0 && <p className="empty">Nothing logged.</p>}

      {MEALS.map((meal) => {
        const rows = entries.filter((entry) => entry.meal === meal.id);
        if (!rows.length) return null;
        return (
          <section key={meal.id} className="food-meal">
            <h3 className="history-group-head">
              {meal.label}
              <span>{totalNutrition(rows).kcal} kcal</span>
            </h3>
            <ul className="data-list">
              {rows.map((entry) => (
                <li key={entry.id}>
                  <span className="log-main">
                    <span className="log-name">{entry.name}</span>
                    <span className="log-detail">
                      {[entry.source === "manual" ? null : `${entry.grams} g`, entry.brand].filter(Boolean).join(" · ") || "Added by hand"}
                    </span>
                  </span>
                  <span className="count">{entry.kcal} kcal</span>
                  <button type="button" className="row-action" onClick={() => onRemove(entry)} aria-label={`Remove ${entry.name}`}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}

export function Food() {
  const userId = useSearchParams()[0].get("user");
  const [user] = useUser(userId);
  const { entries, recents, add, remove } = useFoodLog(userId);
  const toast = useToast();
  const [day, setDay] = useState(() => new Date());
  // The food being portioned, or null while searching.
  const [picked, setPicked] = useState(null);

  if (!user) return <Navigate to="/welcome" replace />;

  const today = sameDay(day, new Date());
  const shown = entriesOn(entries, day);

  function addEntry({ food, grams, meal }) {
    // Logging while looking at an earlier day files it under that day.
    const at = new Date(day);
    if (!today) at.setHours(12, 0, 0, 0);
    const entry = add({ food, grams, meal, loggedAt: today ? new Date().toISOString() : at.toISOString() });
    setPicked(null);
    toast.show({
      key: "food",
      tone: "success",
      title: `Added ${entry.name}`,
      body: `${entry.kcal} kcal`,
      action: { label: "Undo", onClick: () => remove(entry.id) },
    });
  }

  function removeEntry(entry) {
    remove(entry.id);
    toast.show({ key: "food", title: `Removed ${entry.name}` });
  }

  return (
    <motion.main className="page" variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <PageHeader title="Food" />
      <div className="food-grid">
        <AppWindow title={dayTitle(day)} className="food-day">
          <div className="food-day-nav">
            <button type="button" className="row-action" onClick={() => setDay(new Date(day.getTime() - DAY_MS))}>
              ‹ Earlier
            </button>
            <button type="button" className="row-action" disabled={today} onClick={() => setDay(new Date(Math.min(Date.now(), day.getTime() + DAY_MS)))}>
              Later ›
            </button>
          </div>
          <DayLog entries={shown} user={user} onRemove={removeEntry} />
        </AppWindow>

        <AppWindow title="Add food" className="food-add">
          {picked ? (
            <FoodPortion key={picked.id} food={picked} onAdd={addEntry} onBack={() => setPicked(null)} />
          ) : (
            <FoodFinder
              recents={recents}
              onPick={setPicked}
              onManual={(name) => setPicked({ id: `manual:${Date.now()}`, source: "manual", name, per100: null })}
            />
          )}
        </AppWindow>
      </div>
    </motion.main>
  );
}
