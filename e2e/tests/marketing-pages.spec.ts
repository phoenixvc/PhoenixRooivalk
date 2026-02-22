import { test, expect } from "@playwright/test";

test.describe("Marketing site — page accessibility", () => {
  test("homepage loads and has correct title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Phoenix|Rooivalk|SkySnare|AeroNet/i);
  });

  test("homepage contains navigation links", async ({ page }) => {
    await page.goto("/");
    const nav = page.locator("nav");
    await expect(nav).toBeVisible();
  });

  test("homepage renders hero section", async ({ page }) => {
    await page.goto("/");
    // The main heading or hero should be visible
    const heading = page.locator("h1").first();
    await expect(heading).toBeVisible();
  });

  test("about page loads", async ({ page }) => {
    await page.goto("/about");
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("capabilities page loads", async ({ page }) => {
    await page.goto("/capabilities");
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("products page loads", async ({ page }) => {
    await page.goto("/products");
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("preorder page loads with form", async ({ page }) => {
    await page.goto("/preorder");
    const form = page.locator("form").first();
    await expect(form).toBeVisible();
  });

  test("ROI calculator page loads", async ({ page }) => {
    await page.goto("/roi-calculator");
    await expect(page.locator("h1").first()).toBeVisible();
  });
});

test.describe("Marketing site — responsive layout", () => {
  test("mobile navigation has menu button", async ({ page, isMobile }) => {
    test.skip(!isMobile, "Mobile-only test");
    await page.goto("/");
    // Mobile layouts typically have a hamburger menu
    const menuButton = page.getByRole("button", { name: /menu|nav/i });
    await expect(menuButton).toBeVisible();
  });
});
