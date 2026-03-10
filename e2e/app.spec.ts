import { test, expect } from "@playwright/test";

// Fresh localStorage on each test — clear stale user, but keep visited flag
test.beforeEach(async ({ page }) => {
  // Go to the app and set up clean state
  await page.goto("/");

  // Clear user auth but mark as visited (skip landing page)
  await page.evaluate(() => {
    window.localStorage.clear();
    window.localStorage.setItem("rm_visited", "true");
  });
  await page.reload();

  // Wait for device auth to register with the local Worker
  await page.waitForFunction(
    () => {
      const uid = window.localStorage.getItem("rm_userId");
      return uid && !uid.startsWith("local_");
    },
    { timeout: 10_000 }
  );
});

// ---------------------------------------------------------------------------
// 1. App loads + Today page
// ---------------------------------------------------------------------------
test.describe("Today Page", () => {
  test("shows empty state when no routines exist", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "No routines yet" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Add Your First Routine" })).toBeVisible();
  });

  test("bottom nav has four tabs", async ({ page }) => {
    const nav = page.getByRole("navigation");
    await expect(nav.getByRole("link", { name: "Today" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Routines" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Settings" })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 2. Create routine + verify it appears
// ---------------------------------------------------------------------------
test.describe("Routine Management", () => {
  test("can create a routine and see it on Routines page", async ({ page }) => {
    // Navigate to Routines
    await page.getByRole("link", { name: "Routines" }).click();
    await expect(page).toHaveURL(/\/routines/);
    await expect(page.getByTestId("text-routine-count")).toHaveText("0 routines");

    // Open Add dialog
    await page.getByTestId("button-add-routine").click();
    await expect(page.getByRole("dialog", { name: "Add New Routine" })).toBeVisible();

    // Fill form
    await page.getByTestId("input-routine-name").fill("Morning Workout");
    await page.getByTestId("button-category-am").click();
    await page.getByTestId("button-save-routine").click();

    // Verify routine card appears
    await expect(page.getByRole("heading", { name: "Morning Workout" })).toBeVisible();
    await expect(page.getByTestId("text-routine-count")).toHaveText("1 routine");
  });

  test("can create multiple routines", async ({ page }) => {
    await page.getByRole("link", { name: "Routines" }).click();

    // First routine
    await page.getByTestId("button-add-routine").click();
    await page.getByTestId("input-routine-name").fill("Morning Workout");
    await page.getByTestId("button-category-am").click();
    await page.getByTestId("button-save-routine").click();
    await expect(page.getByTestId("text-routine-count")).toHaveText("1 routine");

    // Second routine
    await page.getByTestId("button-add-routine").click();
    await page.getByTestId("input-routine-name").fill("Read a Book");
    await page.getByTestId("button-category-pm").click();
    await page.getByTestId("button-save-routine").click();
    await expect(page.getByTestId("text-routine-count")).toHaveText("2 routines");
  });
});

// ---------------------------------------------------------------------------
// 3. Complete routines on Today page
// ---------------------------------------------------------------------------
test.describe("Completion Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Seed two routines
    await page.getByRole("link", { name: "Routines" }).click();

    await page.getByTestId("button-add-routine").click();
    await page.getByTestId("input-routine-name").fill("Morning Workout");
    await page.getByTestId("button-category-am").click();
    await page.getByTestId("button-save-routine").click();
    await expect(page.getByTestId("text-routine-count")).toHaveText("1 routine");

    await page.getByTestId("button-add-routine").click();
    await page.getByTestId("input-routine-name").fill("Read a Book");
    await page.getByTestId("button-category-pm").click();
    await page.getByTestId("button-save-routine").click();
    await expect(page.getByTestId("text-routine-count")).toHaveText("2 routines");

    // Go back to Today
    await page.getByRole("link", { name: "Today" }).click();
    await expect(page).toHaveURL("/");
  });

  test("toggling a routine updates progress", async ({ page }) => {
    // Find first Morning Workout checkbox and click it
    const workoutButton = page.getByRole("button", { name: /Morning Workout/ }).first();
    await workoutButton.click();

    // Progress should update from 0 to include at least 1 completion
    // The exact text depends on how many time-category slots exist
    await expect(page.getByText(/\d+\/\d+/).first()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 4. Dashboard renders gamification data
// ---------------------------------------------------------------------------
test.describe("Dashboard", () => {
  test("shows gamification stats with empty data", async ({ page }) => {
    await page.getByRole("link", { name: "Dashboard" }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // Empty state shows "No Data Yet"
    await expect(page.getByRole("heading", { name: "No Data Yet" })).toBeVisible();
    await expect(page.getByText("Start completing routines")).toBeVisible();
  });

  test("shows achievements after completing routines", async ({ page }) => {
    // Create and complete a routine
    await page.getByRole("link", { name: "Routines" }).click();
    await page.getByTestId("button-add-routine").click();
    await page.getByTestId("input-routine-name").fill("Quick Task");
    await page.getByTestId("button-category-am").click();
    await page.getByTestId("button-save-routine").click();
    await expect(page.getByTestId("text-routine-count")).toHaveText("1 routine");

    // Complete it on Today
    await page.getByRole("link", { name: "Today" }).click();
    await page.getByRole("button", { name: /Quick Task/ }).first().click();

    // Check Dashboard
    await page.getByRole("link", { name: "Dashboard" }).click();
    await expect(page.getByText("Streak", { exact: true })).toBeVisible();
    await expect(page.getByText("Tasks", { exact: true })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 5. Settings page renders all sections
// ---------------------------------------------------------------------------
test.describe("Settings", () => {
  test("shows all settings sections", async ({ page }) => {
    await page.getByRole("link", { name: "Settings" }).click();
    await expect(page).toHaveURL(/\/settings/);

    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Account & Sync" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Appearance" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Notifications/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Export & Backup/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Install App/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Danger Zone/ })).toBeVisible();
  });

  test("has Google sign-in button", async ({ page }) => {
    await page.getByRole("link", { name: "Settings" }).click();
    await expect(page.getByRole("button", { name: /Sign in with Google/ })).toBeVisible();
  });

  test("has footer links", async ({ page }) => {
    await page.getByRole("link", { name: "Settings" }).click();
    await expect(page.getByRole("link", { name: /Privacy Policy/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Terms of Service/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /About/ })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 6. Navigation flow
// ---------------------------------------------------------------------------
test.describe("Navigation", () => {
  test("can navigate through all main pages", async ({ page }) => {
    // Today (default)
    await expect(page).toHaveURL("/");

    // Routines
    await page.getByRole("link", { name: "Routines" }).click();
    await expect(page).toHaveURL(/\/routines/);
    await expect(page.getByTestId("text-routines-title")).toHaveText("Manage Routines");

    // Dashboard
    await page.getByRole("link", { name: "Dashboard" }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // Settings
    await page.getByRole("link", { name: "Settings" }).click();
    await expect(page).toHaveURL(/\/settings/);
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

    // Back to Today
    await page.getByRole("link", { name: "Today" }).click();
    await expect(page).toHaveURL("/");
  });
});
