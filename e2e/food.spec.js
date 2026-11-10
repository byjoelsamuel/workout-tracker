// The food log, with Open Food Facts answered from the unit-test fixtures:
// CI shouldn't depend on (or add load to) the real database.
import { expect, test } from "@playwright/test";
import { barcodeResponse, searchResponse } from "../tests/fixtures/off.js";

test.beforeEach(async ({ page }) => {
  await page.route("https://world.openfoodfacts.org/**", (route) => {
    const url = route.request().url();
    const body = url.includes("/api/v2/product/3017624010701")
      ? barcodeResponse
      : url.includes("/cgi/search.pl")
        ? searchResponse
        : { status: 0 };
    return route.fulfill({ json: body, headers: { "access-control-allow-origin": "*" } });
  });
  await page.addInitScript(() => {
    if (localStorage.getItem("seeded")) return;
    const user = { id: "u1", name: "Joel", bodyweight: 78, weeklyGoal: 3, createdAt: new Date().toISOString() };
    localStorage.setItem("workoutTracker.users", JSON.stringify([user]));
    localStorage.setItem("workoutTracker.lastUserId", "u1");
    localStorage.setItem("workoutTracker.hasSeenGuide.u1", "1");
    localStorage.setItem("seeded", "1");
  });
});

test("log a common food, a searched product and one by hand", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/food?user=u1");
  const total = page.locator(".food-day-total");
  await expect(total).toHaveText("0 kcal");

  // Common foods match as you type.
  const search = page.getByPlaceholder("Food or barcode");
  await search.fill("banana");
  await page.getByRole("button", { name: /^Banana/ }).click();
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(total).toHaveText("105 kcal");

  // A product from the database, by name and by barcode.
  await search.fill("hazelnut");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.getByRole("button", { name: /^Nutella/ }).click();
  await page.getByRole("spinbutton", { name: /grams/i }).fill("30");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(total).toHaveText("267 kcal");

  await search.fill("3017624010701");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.locator(".food-portion .selected-text")).toHaveText("Nutella");
  await page.getByRole("button", { name: "Back" }).click();

  await page.getByRole("button", { name: "Add by hand" }).click();
  await page.getByLabel("Name").fill("Protein bar");
  await page.getByLabel("Calories").fill("210");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(total).toHaveText("477 kcal");

  // Kept across a reload, and removable.
  await page.reload();
  await expect(total).toHaveText("477 kcal");
  await page.getByRole("button", { name: "Remove Protein bar" }).click();
  await expect(total).toHaveText("267 kcal");
  expect(errors).toEqual([]);
});

test("says so when the database can't be reached", async ({ page }) => {
  await page.route("https://world.openfoodfacts.org/**", (route) => route.abort());
  await page.goto("/food?user=u1");
  await page.getByPlaceholder("Food or barcode").fill("hazelnut");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Can't reach the food database." })).toBeVisible();
});
