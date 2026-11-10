import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  entriesOn,
  fromOffProduct,
  isBarcode,
  lookupBarcode,
  mealForTime,
  nutritionFor,
  proteinTarget,
  searchCommon,
  searchProducts,
  totalNutrition,
} from "../src/lib/food.js";
import { addFood, createUser, deleteFood, deleteUser, exportBackup, getFoodForUser, getRecentFoods, importBackup } from "../src/lib/store.js";
import { barcodeResponse, notFoundResponse, nutellaProduct, searchResponse } from "./fixtures/off.js";

const reply = (body, status = 200) =>
  vi.fn(async () => ({ ok: status >= 200 && status < 300, status, json: async () => body }));

describe("reading Open Food Facts products", () => {
  it("takes the label's per-100 g values and serving", () => {
    expect(fromOffProduct(nutellaProduct)).toEqual({
      id: "off:3017624010701",
      source: "off",
      name: "Nutella",
      brand: "Ferrero",
      barcode: "3017624010701",
      per100: { kcal: 539, protein: 6.3, carbs: 57.5, fat: 30.9 },
      serving: { label: "15 g", grams: 15 },
    });
  });

  it("converts kJ, and works back from a per-serving figure", () => {
    expect(fromOffProduct({ product_name: "A", nutriments: { energy_100g: 418.4 } }).per100.kcal).toBe(100);
    const perServing = fromOffProduct({ product_name: "B", serving_quantity: 50, nutriments: { "energy-kcal_serving": 100 } });
    expect(perServing.per100.kcal).toBe(200);
  });

  it("leaves unknown macros unknown and skips unusable products", () => {
    expect(fromOffProduct({ product_name: "C", nutriments: { "energy-kcal_100g": 50 } }).per100.protein).toBeNull();
    expect(fromOffProduct({ product_name: "  ", nutriments: { "energy-kcal_100g": 50 } })).toBeNull();
    expect(fromOffProduct({ product_name: "D", nutriments: {} })).toBeNull();
    expect(fromOffProduct(null)).toBeNull();
  });
});

describe("talking to the database", () => {
  it("looks a barcode up", async () => {
    const fetchImpl = reply(barcodeResponse);
    const food = await lookupBarcode(" 3017624010701 ", { fetchImpl });
    expect(food.name).toBe("Nutella");
    expect(fetchImpl.mock.calls[0][0]).toMatch(/^https:\/\/world\.openfoodfacts\.org\/api\/v2\/product\/3017624010701\.json\?fields=/);
  });

  it("answers null for unknown or invalid barcodes, and throws when unreachable", async () => {
    expect(await lookupBarcode("0000000000000", { fetchImpl: reply(notFoundResponse) })).toBeNull();
    expect(await lookupBarcode("0000000000000", { fetchImpl: reply({}, 404) })).toBeNull();
    const never = vi.fn();
    expect(await lookupBarcode("12ab", { fetchImpl: never })).toBeNull();
    expect(never).not.toHaveBeenCalled();
    await expect(lookupBarcode("3017624010701", { fetchImpl: reply({}, 503) })).rejects.toThrow("503");
  });

  it("searches and keeps only products that can be logged", async () => {
    const fetchImpl = reply(searchResponse);
    const foods = await searchProducts("hazelnut", { fetchImpl });
    expect(foods.map((f) => f.name)).toEqual(["Nutella", "Hazelnut spread"]);
    expect(foods[1].per100).toMatchObject({ kcal: 526, protein: 5.5 });
    expect(new URL(fetchImpl.mock.calls[0][0]).searchParams.get("search_terms")).toBe("hazelnut");
    expect(await searchProducts("a", { fetchImpl: vi.fn() })).toEqual([]);
  });

  it("tells barcodes from words", () => {
    expect(isBarcode("3017624010701")).toBe(true);
    expect(isBarcode("12345678")).toBe(true);
    expect(isBarcode("1234567")).toBe(false);
    expect(isBarcode("nutella")).toBe(false);
  });
});

describe("common foods", () => {
  it("matches every word in any order", () => {
    expect(searchCommon("chicken cooked").map((f) => f.name)).toEqual(["Chicken breast, cooked", "Chicken thigh, cooked"]);
    expect(searchCommon("RICE").length).toBe(2);
    expect(searchCommon("   ")).toEqual([]);
  });

  it("all have sensible numbers", () => {
    for (const food of [...searchCommon("e"), ...searchCommon("a")]) {
      const { kcal, protein, carbs, fat } = food.per100;
      // Energy roughly agrees with the macros (4/4/9 kcal per gram). Fibre
      // counts as carbs but gives less energy, so vegetables come in a few
      // kcal under: allow 10 kcal or 15%, whichever is more.
      const fromMacros = protein * 4 + carbs * 4 + fat * 9;
      expect(Math.abs(fromMacros - kcal)).toBeLessThanOrEqual(Math.max(10, kcal * 0.15));
      expect(food.serving.grams).toBeGreaterThan(0);
    }
  });
});

describe("portions and totals", () => {
  it("scales per-100 g values to the amount eaten", () => {
    expect(nutritionFor({ kcal: 539, protein: 6.3, carbs: 57.5, fat: 30.9 }, 15)).toEqual({ kcal: 81, protein: 0.9, carbs: 8.6, fat: 4.6 });
    expect(nutritionFor({ kcal: 100, protein: null, carbs: 10, fat: 1 }, "")).toEqual({ kcal: 0, protein: null, carbs: 0, fat: 0 });
  });

  it("adds a day up, counting unknown macros as nothing", () => {
    expect(totalNutrition([{ kcal: 81, protein: 0.9, carbs: 8.6, fat: 4.6 }, { kcal: 200, protein: null, carbs: 20, fat: 1.1 }])).toEqual({
      kcal: 281,
      protein: 0.9,
      carbs: 28.6,
      fat: 5.7,
    });
  });

  it("picks the meal from the time and the day from the calendar", () => {
    expect(mealForTime(new Date(2026, 10, 10, 8))).toBe("breakfast");
    expect(mealForTime(new Date(2026, 10, 10, 13))).toBe("lunch");
    expect(mealForTime(new Date(2026, 10, 10, 19))).toBe("dinner");
    expect(mealForTime(new Date(2026, 10, 10, 23))).toBe("snack");
    const rows = [{ loggedAt: new Date(2026, 10, 10, 23, 30).toISOString() }, { loggedAt: new Date(2026, 10, 11, 0, 30).toISOString() }];
    expect(entriesOn(rows, new Date(2026, 10, 10, 12))).toHaveLength(1);
  });

  it("sets a protein target from bodyweight", () => {
    expect(proteinTarget(78)).toBe(125);
    expect(proteinTarget(null)).toBeNull();
  });
});

describe("the food log in storage", () => {
  beforeEach(() => localStorage.clear());
  const nutella = fromOffProduct(nutellaProduct);

  it("stores what was eaten with its totals, and deletes it", () => {
    const user = createUser({ name: "Joel" });
    const entry = addFood(user.id, { food: nutella, grams: 30, meal: "breakfast" });
    expect(entry).toMatchObject({ name: "Nutella", grams: 30, kcal: 162, protein: 1.9, meal: "breakfast", barcode: "3017624010701" });
    expect(getFoodForUser(user.id)).toHaveLength(1);
    expect(getRecentFoods(user.id)[0]).toMatchObject({ name: "Nutella", serving: { grams: 30 } });
    expect(deleteFood(user.id, entry.id)).toBe(true);
    expect(getFoodForUser(user.id)).toEqual([]);
  });

  it("goes with the profile when it's deleted", () => {
    const a = createUser({ name: "A" });
    const b = createUser({ name: "B" });
    addFood(a.id, { food: nutella, grams: 15, meal: "snack" });
    addFood(b.id, { food: nutella, grams: 15, meal: "snack" });
    deleteUser(a.id);
    expect(getFoodForUser(a.id)).toEqual([]);
    expect(getFoodForUser(b.id)).toHaveLength(1);
  });

  it("is in backups, and older backups without it still import", () => {
    const user = createUser({ name: "Joel" });
    addFood(user.id, { food: nutella, grams: 15, meal: "snack" });
    const backup = JSON.parse(JSON.stringify(exportBackup()));
    localStorage.clear();
    expect(importBackup(backup)).toEqual({ users: 1, logs: 0, food: 1, skipped: 0 });
    expect(importBackup(backup).food).toBe(0);
    localStorage.clear();
    const older = { ...backup };
    delete older.food;
    expect(importBackup(older)).toEqual({ users: 1, logs: 0, food: 0, skipped: 0 });
  });
});
