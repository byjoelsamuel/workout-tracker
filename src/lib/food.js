// Food: finding something to log, and the arithmetic once it's found.
//
// Two sources. Packaged food comes from Open Food Facts, a free, open database
// of products by barcode, so a scan or a search returns the label's own
// numbers. It's thin on things without a label (an apple, rice, a chicken
// breast), so a short list of common whole foods ships with the app and is
// searched first. Its values are approximate, per 100 g, rounded from
// standard nutrition tables.
//
// Everything is per 100 g, the unit labels use. A logged entry stores the
// grams eaten plus the totals worked out at the time, so a later change to the
// database can't rewrite what you ate last week.

export const OFF_ORIGIN = "https://world.openfoodfacts.org";

// Only what the app reads, so responses stay small.
const OFF_FIELDS = [
  "code",
  "product_name",
  "product_name_en",
  "generic_name",
  "brands",
  "nutriments",
  "serving_size",
  "serving_quantity",
].join(",");

const KJ_PER_KCAL = 4.184;

export const MEALS = [
  { id: "breakfast", label: "Breakfast" },
  { id: "lunch", label: "Lunch" },
  { id: "dinner", label: "Dinner" },
  { id: "snack", label: "Snack" },
];

// The meal you're most likely logging, from the time of day.
export function mealForTime(date = new Date()) {
  const hour = new Date(date).getHours();
  if (hour >= 4 && hour < 11) return "breakfast";
  if (hour >= 11 && hour < 16) return "lunch";
  if (hour >= 16 && hour < 22) return "dinner";
  return "snack";
}

// ---- Common foods ----

// [name, kcal, protein, carbs, fat] per 100 g, then a typical portion.
const COMMON = [
  ["Apple", 52, 0.3, 14, 0.2, "1 medium", 182],
  ["Banana", 89, 1.1, 23, 0.3, "1 medium", 118],
  ["Orange", 47, 0.9, 12, 0.1, "1 medium", 131],
  ["Strawberries", 32, 0.7, 7.7, 0.3, "1 cup", 150],
  ["Blueberries", 57, 0.7, 14, 0.3, "1 cup", 148],
  ["Grapes", 69, 0.7, 18, 0.2, "1 cup", 150],
  ["Avocado", 160, 2, 9, 15, "1 fruit", 150],
  ["Egg, boiled", 155, 13, 1.1, 11, "1 large", 50],
  ["Egg, fried", 196, 14, 0.8, 15, "1 large", 46],
  ["Egg white", 52, 11, 0.7, 0.2, "1 large", 33],
  ["Chicken breast, cooked", 165, 31, 0, 3.6, "1 breast", 120],
  ["Chicken thigh, cooked", 209, 26, 0, 10.9, "1 thigh", 100],
  ["Beef mince, cooked", 250, 26, 0, 15, "1 portion", 100],
  ["Steak, sirloin, cooked", 206, 29, 0, 9, "1 steak", 200],
  ["Salmon, cooked", 206, 22, 0, 12, "1 fillet", 150],
  ["Tuna, canned in water", 116, 26, 0, 0.8, "1 can", 120],
  ["Shrimp, cooked", 99, 24, 0.2, 0.3, "1 portion", 100],
  ["Tofu, firm", 144, 17, 2.8, 8.7, "1 portion", 100],
  ["Rice, white, cooked", 130, 2.7, 28, 0.3, "1 cup", 158],
  ["Rice, brown, cooked", 123, 2.7, 25.6, 1, "1 cup", 195],
  ["Pasta, cooked", 158, 5.8, 31, 0.9, "1 cup", 140],
  ["Oats, dry", 389, 17, 66, 7, "1/2 cup", 40],
  ["Bread, white", 265, 9, 49, 3.2, "1 slice", 30],
  ["Bread, wholemeal", 247, 13, 41, 3.4, "1 slice", 32],
  ["Bagel, plain", 250, 10, 49, 1.5, "1 bagel", 105],
  ["Tortilla, flour", 312, 8.3, 52, 8, "1 tortilla", 45],
  ["Potato, baked", 93, 2.5, 21, 0.1, "1 medium", 170],
  ["Sweet potato, baked", 90, 2, 21, 0.2, "1 medium", 150],
  ["Broccoli, cooked", 35, 2.4, 7, 0.4, "1 cup", 90],
  ["Spinach, raw", 23, 2.9, 3.6, 0.4, "1 cup", 30],
  ["Carrot, raw", 41, 0.9, 10, 0.2, "1 medium", 60],
  ["Black beans, cooked", 132, 8.9, 24, 0.5, "1 cup", 172],
  ["Lentils, cooked", 116, 9, 20, 0.4, "1 cup", 198],
  ["Chickpeas, cooked", 164, 8.9, 27, 2.6, "1 cup", 164],
  ["Milk, whole", 61, 3.2, 4.8, 3.3, "1 cup", 244],
  ["Milk, skim", 34, 3.4, 5, 0.1, "1 cup", 245],
  ["Greek yogurt, plain, nonfat", 59, 10, 3.6, 0.4, "1 pot", 170],
  ["Cottage cheese, low fat", 84, 11, 4.3, 2.3, "1/2 cup", 113],
  ["Cheddar cheese", 403, 25, 1.3, 33, "1 slice", 28],
  ["Whey protein powder", 400, 80, 8, 6, "1 scoop", 30],
  ["Peanut butter", 588, 25, 20, 50, "2 tbsp", 32],
  ["Almonds", 579, 21, 22, 50, "1 handful", 28],
  ["Olive oil", 884, 0, 0, 100, "1 tbsp", 14],
  ["Butter", 717, 0.9, 0.1, 81, "1 tbsp", 14],
  ["Honey", 304, 0.3, 82, 0, "1 tbsp", 21],
  ["Orange juice", 45, 0.7, 10.4, 0.2, "1 glass", 248],
  ["Cola", 42, 0, 10.6, 0, "1 can", 330],
  ["Pizza, cheese", 266, 11, 33, 10, "1 slice", 107],
];

const slug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const COMMON_FOODS = COMMON.map(([name, kcal, protein, carbs, fat, label, grams]) => ({
  id: `common:${slug(name)}`,
  source: "common",
  name,
  brand: null,
  barcode: null,
  per100: { kcal, protein, carbs, fat },
  serving: { label, grams },
}));

// Every word of the query has to appear somewhere in the name, so "chicken
// cooked" finds "Chicken breast, cooked".
export function searchCommon(query) {
  const words = query.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  if (!words.length) return [];
  return COMMON_FOODS.filter((food) => {
    const name = food.name.toLowerCase();
    return words.every((word) => name.includes(word));
  });
}

// ---- Open Food Facts ----

const num = (value) => {
  const n = typeof value === "string" ? Number(value.replace(",", ".")) : Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

// A product from the API as a food the app can log, or null when it has no
// name or no energy value at all (common in user-contributed entries).
export function fromOffProduct(product) {
  if (!product || typeof product !== "object") return null;
  const name = [product.product_name, product.product_name_en, product.generic_name]
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .find(Boolean);
  if (!name) return null;

  const n = product.nutriments ?? {};
  const servingGrams = num(product.serving_quantity);
  const serving = servingGrams
    ? { label: typeof product.serving_size === "string" && product.serving_size.trim() ? product.serving_size.trim() : `${servingGrams} g`, grams: servingGrams }
    : null;

  // Energy per 100 g: kcal if given, else converted from kJ, else worked back
  // from a per-serving figure.
  let kcal = num(n["energy-kcal_100g"]);
  if (kcal == null && num(n.energy_100g) != null) kcal = num(n.energy_100g) / KJ_PER_KCAL;
  const perServing = num(n["energy-kcal_serving"]);
  if (kcal == null && perServing != null && serving) kcal = (perServing / serving.grams) * 100;
  if (kcal == null) return null;

  const brand = typeof product.brands === "string" ? product.brands.split(",")[0].trim() || null : null;
  const barcode = typeof product.code === "string" && product.code ? product.code : null;
  return {
    id: barcode ? `off:${barcode}` : `off:${slug(name)}`,
    source: "off",
    name,
    brand,
    barcode,
    per100: {
      kcal: Math.round(kcal),
      protein: num(n.proteins_100g),
      carbs: num(n.carbohydrates_100g),
      fat: num(n.fat_100g),
    },
    serving,
  };
}

// EAN-8, UPC-A, EAN-13 and GTIN-14 are all digits, 8 to 14 of them.
export function isBarcode(text) {
  return /^\d{8,14}$/.test(String(text).trim());
}

// The product with this barcode, or null if the database doesn't have it (or
// has it without enough to log). Throws when the database can't be reached.
export async function lookupBarcode(code, { fetchImpl = globalThis.fetch, signal } = {}) {
  const barcode = String(code).trim();
  if (!isBarcode(barcode)) return null;
  const url = `${OFF_ORIGIN}/api/v2/product/${barcode}.json?fields=${OFF_FIELDS}`;
  const response = await fetchImpl(url, { signal, headers: { Accept: "application/json" } });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Food database answered ${response.status}`);
  const data = await response.json();
  if (data.status !== 1 && data.status !== "success") return null;
  return fromOffProduct({ code: barcode, ...data.product });
}

// Products matching a name. The database limits searches to a few a minute,
// so this runs when a search is submitted rather than on every keystroke.
export async function searchProducts(query, { fetchImpl = globalThis.fetch, signal, limit = 20 } = {}) {
  const q = query.trim();
  if (q.length < 2) return [];
  const params = new URLSearchParams({
    search_terms: q,
    search_simple: "1",
    action: "process",
    json: "1",
    page_size: String(limit),
    fields: OFF_FIELDS,
  });
  const response = await fetchImpl(`${OFF_ORIGIN}/cgi/search.pl?${params}`, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`Food database answered ${response.status}`);
  const data = await response.json();
  const seen = new Set();
  const foods = [];
  for (const product of data.products ?? []) {
    const food = fromOffProduct(product);
    if (food && !seen.has(food.id)) {
      seen.add(food.id);
      foods.push(food);
    }
  }
  return foods;
}

// ---- Portions and totals ----

const round1 = (n) => Math.round(n * 10) / 10;

// What `grams` of a food comes to. Macros the source didn't give stay null
// ("unknown"), never 0.
export function nutritionFor(per100, grams) {
  const g = Number(grams);
  const scale = Number.isFinite(g) && g > 0 ? g / 100 : 0;
  const part = (value) => (value == null ? null : round1(value * scale));
  return {
    kcal: Math.round((per100.kcal ?? 0) * scale),
    protein: part(per100.protein),
    carbs: part(per100.carbs),
    fat: part(per100.fat),
  };
}

// Sum of logged entries. Unknown macros count as nothing.
export function totalNutrition(entries) {
  const total = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  for (const entry of entries) {
    total.kcal += entry.kcal ?? 0;
    total.protein += entry.protein ?? 0;
    total.carbs += entry.carbs ?? 0;
    total.fat += entry.fat ?? 0;
  }
  return {
    kcal: Math.round(total.kcal),
    protein: round1(total.protein),
    carbs: round1(total.carbs),
    fat: round1(total.fat),
  };
}

// Local calendar day, matching how workouts are dated.
export function sameDay(a, b) {
  const x = new Date(a);
  const y = new Date(b);
  return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate();
}

export function entriesOn(entries, day) {
  return entries.filter((entry) => sameDay(entry.loggedAt, day));
}

// A daily protein target from bodyweight: 1.6 g per kg, the low end of what's
// generally recommended for people who lift. Null without a bodyweight.
export function proteinTarget(bodyweightKg) {
  const kg = Number(bodyweightKg);
  return Number.isFinite(kg) && kg > 0 ? Math.round(kg * 1.6) : null;
}
