// The path a new user takes: set up a profile, log a set, end the workout,
// find it in History. Plus the theme switch, which runs on every page.
import { expect, test } from "@playwright/test";

// Uncaught errors in the page fail the test even if every step passed.
const pageErrors = new WeakMap();

test.beforeEach(async ({ page }) => {
  const errors = [];
  pageErrors.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
});

test.afterEach(async ({ page }) => {
  expect(pageErrors.get(page), "no uncaught errors in the page").toEqual([]);
});

async function createProfile(page, name = "Joel") {
  await page.goto("/");
  await page.getByRole("link", { name: "Get started" }).click();
  await page.getByLabel("Name").fill(name);
  await page.getByRole("button", { name: "Continue" }).click();
  // Weekly goal, unit and body stats keep their defaults.
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Skip this step" }).click();
  await page.getByRole("button", { name: "Start training" }).click();
  // A new profile gets the walkthrough first.
  await page.getByRole("button", { name: "Skip tour" }).click();
  await expect(page.getByRole("heading", { name: `${name}'s workout` })).toBeVisible();
}

test("log a set, end the workout, see it in History", async ({ page }) => {
  await createProfile(page);

  await page.getByPlaceholder("Exercise name").fill("bench press");
  await page.getByRole("option", { name: /^Bench Press \(Barbell\)/ }).click();
  const reps = page.getByRole("spinbutton", { name: /reps/i }).first();
  await reps.fill("5");
  await page.getByRole("spinbutton", { name: /kg/i }).first().fill("80");
  await page.getByRole("button", { name: "Add 1 set" }).click();
  await expect(page.getByLabel("Notifications").getByText("Logged Bench Press (Barbell)")).toBeVisible();

  await page.getByRole("button", { name: "End workout" }).first().click();
  await page.getByRole("dialog").getByRole("button", { name: "End workout" }).click();
  const summary = page.getByRole("dialog");
  await expect(summary.getByText("Most worked:")).toBeVisible();
  await expect(summary.getByText("400 kg").first()).toBeVisible();
  await summary.getByRole("button", { name: "Done" }).click();

  await page.getByRole("link", { name: "History" }).click();
  await expect(page.getByText("Bench Press (Barbell)").first()).toBeVisible();
});

test("theme switch lands on the other theme", async ({ page }) => {
  await createProfile(page);
  const theme = () => page.evaluate(() => document.documentElement.dataset.theme);
  const before = await theme();
  await page.getByRole("button", { name: before === "dark" ? "Light" : "Dark" }).click();
  await expect.poll(theme).not.toBe(before);
  // The pick is remembered across a reload.
  const after = await theme();
  await page.reload();
  expect(await theme()).toBe(after);
});
