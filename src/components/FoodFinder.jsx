// Finding a food to log: scan a barcode (Android app), pick a recent one,
// search, or add one by hand.
//
// Common foods match as you type, from the list in lib/food.js. Packaged
// products come from Open Food Facts, which limits searches to a few a
// minute, so that search runs when you press Search rather than per keystroke.
// Typing a barcode number and pressing Search looks that product up directly.
import { useEffect, useRef, useState } from "react";
import { Button } from "./primitives.jsx";
import { isBarcode, lookupBarcode, searchCommon, searchProducts } from "../lib/food.js";
import { canScan, scanBarcode, ScannerNotReady } from "../lib/scanner.js";

function FoodList({ title, foods, onPick }) {
  if (!foods.length) return null;
  return (
    <div className="food-results">
      <p className="picker-label">{title}</p>
      <ul className="picker-results food-list">
        {foods.map((food) => (
          <li key={food.id}>
            <button type="button" onClick={() => onPick(food)}>
              <span className="food-result-name">{food.name}</span>
              <span className="food-result-detail">
                {/* Something added by hand was stored as its own portion, not per 100 g. */}
                {[food.brand, food.source === "manual" ? `${food.per100.kcal} kcal` : `${food.per100.kcal} kcal / 100 g`]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FoodFinder({ recents, onPick, onManual }) {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  // idle | loading | done | error | missing (barcode not in the database)
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const request = useRef(null);

  useEffect(() => () => request.current?.abort(), []);

  const trimmed = query.trim();
  const common = trimmed.length >= 2 && !isBarcode(trimmed) ? searchCommon(trimmed).slice(0, 6) : [];

  function onChange(event) {
    setQuery(event.target.value);
    setProducts([]);
    setStatus("idle");
  }

  async function run(task) {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setStatus("loading");
    try {
      await task(controller.signal);
    } catch (error) {
      if (error.name === "AbortError") return;
      setStatus("error");
      setMessage("Can't reach the food database.");
    }
  }

  function findBarcode(code) {
    return run(async (signal) => {
      const food = await lookupBarcode(code, { signal });
      if (food) {
        setStatus("done");
        onPick(food);
      } else {
        setStatus("missing");
        setMessage(`No match for ${code}.`);
      }
    });
  }

  function search(event) {
    event.preventDefault();
    if (trimmed.length < 2) return;
    if (isBarcode(trimmed)) {
      findBarcode(trimmed);
      return;
    }
    run(async (signal) => {
      const found = await searchProducts(trimmed, { signal });
      setProducts(found);
      setStatus("done");
      setMessage(found.length ? "" : "No products found.");
    });
  }

  async function scan() {
    try {
      const code = await scanBarcode();
      if (!code) return;
      setQuery(code);
      findBarcode(code);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof ScannerNotReady ? "Scanner is installing. Try again in a moment." : "Scanner didn't start.");
    }
  }

  return (
    <div className="food-finder">
      {canScan && (
        <Button className="go" block onClick={scan}>
          Scan barcode
        </Button>
      )}

      <form className="form food-search" onSubmit={search} role="search">
        <label className="picker-search">
          <span className="picker-label">Search</span>
          <input
            type="text"
            inputMode="search"
            value={query}
            onChange={onChange}
            placeholder="Food or barcode"
            autoComplete="off"
            spellCheck="false"
            enterKeyHint="search"
          />
        </label>
        <Button type="submit" disabled={trimmed.length < 2 || status === "loading"}>
          {status === "loading" ? "Searching…" : "Search"}
        </Button>
      </form>

      {(status === "error" || status === "missing" || (status === "done" && message)) && (
        <p className="empty" role="status">
          {message}
        </p>
      )}

      {!trimmed && <FoodList title="Recent" foods={recents} onPick={onPick} />}
      <FoodList title="Common foods" foods={common} onPick={onPick} />
      <FoodList title="Open Food Facts" foods={products} onPick={onPick} />

      <Button variant="secondary" block onClick={() => onManual(trimmed && !isBarcode(trimmed) ? trimmed : "")}>
        Add by hand
      </Button>
    </div>
  );
}
