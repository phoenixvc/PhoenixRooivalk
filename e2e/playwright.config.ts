import { defineConfig, devices } from "@playwright/test";

/**
 * E2E test configuration for PhoenixRooivalk.
 * See ADR-0063 for strategy details.
 *
 * Usage:
 *   npx playwright test              # Run all tests
 *   npx playwright test --ui         # Interactive UI mode
 *   npx playwright test --project=chromium  # Single browser
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: process.env.CI
    ? [["html", { open: "never" }], ["junit", { outputFile: "results.xml" }]]
    : "html",

  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "mobile-safari",
      use: { ...devices["iPhone 12"] },
    },
  ],

  /* Start the marketing dev server before running tests locally */
  webServer: process.env.CI
    ? undefined
    : {
        command: "pnpm --filter marketing dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        cwd: "..",
      },
});
