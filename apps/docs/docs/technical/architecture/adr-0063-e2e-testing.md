---
id: adr-0063-e2e-testing
title: "ADR 0063: End-to-End Testing Strategy"
sidebar_label: "ADR 0063: E2E Testing"
difficulty: intermediate
estimated_reading_time: 8
points: 35
tags:
  - technical
  - architecture
  - testing
  - e2e
  - playwright
  - automation
prerequisites:
  - architecture-decision-records
  - adr-0060-testing-strategy
---

# ADR 0063: End-to-End Testing Strategy

**Date**: 2025-12-12 **Status**: Proposed

---

## Executive Summary

1. **Problem**: UI workflows and cross-system integrations require automated testing to prevent regressions and ensure user experience
2. **Decision**: Implement Playwright-based E2E testing with visual regression detection and cross-browser coverage
3. **Trade-off**: Test execution time vs. comprehensive coverage

---

## Context

### E2E Testing Scope

| Application | Critical Flows |
|-------------|----------------|
| Operator Dashboard | Login, track view, engagement workflow |
| Admin Portal | User management, config changes |
| Documentation | Search, navigation, downloads |
| API | Authentication, CRUD operations |

### Requirements

| Requirement | Specification |
|-------------|---------------|
| Browser coverage | Chrome, Firefox, Safari, Edge |
| Mobile testing | iOS Safari, Android Chrome |
| Visual regression | Detect unintended UI changes |
| Parallelization | <10 min total test time |
| CI integration | Run on every PR |

---

## Decision

Implement **Playwright** for E2E testing:

### Test Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    E2E Testing Architecture                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  TEST SUITE                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          ││
│  │  │   Page       │  │   API        │  │   Visual     │          ││
│  │  │   Tests      │  │   Tests      │  │   Tests      │          ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘          ││
│  └─────────────────────────────────────────────────────────────────┘│
│                              │                                       │
│                              ▼                                       │
│  PLAYWRIGHT                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          ││
│  │  │   Browser    │  │   Test       │  │   Reporter   │          ││
│  │  │   Context    │  │   Runner     │  │   (HTML)     │          ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘          ││
│  └─────────────────────────────────────────────────────────────────┘│
│                              │                                       │
│              ┌───────────────┼───────────────┐                       │
│              ▼               ▼               ▼                       │
│        ┌─────────┐     ┌─────────┐     ┌─────────┐                 │
│        │ Chromium│     │ Firefox │     │ WebKit  │                 │
│        └─────────┘     └─────────┘     └─────────┘                 │
│              │               │               │                       │
│              └───────────────┼───────────────┘                       │
│                              ▼                                       │
│                    ┌─────────────────┐                              │
│                    │  Application    │                              │
│                    │  Under Test     │                              │
│                    └─────────────────┘                              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Test Structure

### Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,

  reporter: [
    ['html', { open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // Desktop browsers
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile viewports
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Page Object Model

```typescript
// e2e/pages/dashboard.page.ts
import { Page, Locator, expect } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly trackList: Locator;
  readonly searchInput: Locator;
  readonly alertBanner: Locator;

  constructor(page: Page) {
    this.page = page;
    this.trackList = page.getByTestId('track-list');
    this.searchInput = page.getByPlaceholder('Search tracks...');
    this.alertBanner = page.getByRole('alert');
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async searchTracks(query: string) {
    await this.searchInput.fill(query);
    await this.searchInput.press('Enter');
    await this.page.waitForLoadState('networkidle');
  }

  async getTrackCount(): Promise<number> {
    return this.trackList.locator('[data-testid="track-item"]').count();
  }

  async selectTrack(trackId: string) {
    await this.trackList.locator(`[data-track-id="${trackId}"]`).click();
  }

  async waitForTracksLoaded() {
    await expect(this.trackList).toBeVisible();
    await this.page.waitForLoadState('networkidle');
  }
}
```

---

## Test Examples

### Authentication Flow

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/login.page';
import { DashboardPage } from './pages/dashboard.page';

test.describe('Authentication', () => {
  test('successful login redirects to dashboard', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.login('test@example.com', 'password123');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    const dashboard = new DashboardPage(page);
    await expect(dashboard.trackList).toBeVisible();
  });

  test('invalid credentials shows error', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.login('test@example.com', 'wrongpassword');

    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage).toContainText('Invalid credentials');
  });

  test('logout clears session', async ({ page }) => {
    // Login first
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('test@example.com', 'password123');

    // Logout
    const dashboard = new DashboardPage(page);
    await dashboard.logout();

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);

    // Accessing dashboard should redirect back to login
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
```

### Operator Workflow

```typescript
// e2e/operator-workflow.spec.ts
import { test, expect } from '@playwright/test';
import { DashboardPage } from './pages/dashboard.page';
import { TrackDetailPage } from './pages/track-detail.page';

test.describe('Operator Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as operator
    await page.goto('/login');
    await page.fill('[name="email"]', 'operator@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
  });

  test('view and filter tracks', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.waitForTracksLoaded();

    // Filter by threat status
    await page.click('[data-testid="filter-hostile"]');
    await dashboard.waitForTracksLoaded();

    const tracks = await dashboard.getTrackCount();
    expect(tracks).toBeGreaterThan(0);

    // All visible tracks should be hostile
    const trackStatuses = await page.locator('[data-testid="track-status"]').allTextContents();
    trackStatuses.forEach((status) => {
      expect(status).toBe('Hostile');
    });
  });

  test('view track details', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.waitForTracksLoaded();

    // Click first track
    await dashboard.selectTrack('track-001');

    const detail = new TrackDetailPage(page);
    await expect(detail.trackId).toContainText('track-001');
    await expect(detail.positionInfo).toBeVisible();
    await expect(detail.classificationBadge).toBeVisible();
  });

  test('engagement authorization flow', async ({ page }) => {
    // Navigate to hostile track
    await page.goto('/dashboard/tracks/hostile-001');

    const detail = new TrackDetailPage(page);

    // Request engagement
    await detail.requestEngagement();
    await expect(detail.engagementDialog).toBeVisible();

    // Confirm engagement
    await detail.confirmEngagement();

    // Should show engagement in progress
    await expect(detail.engagementStatus).toContainText('Authorized');
  });
});
```

### Visual Regression

```typescript
// e2e/visual.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Visual Regression', () => {
  test('dashboard matches snapshot', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Hide dynamic elements
    await page.evaluate(() => {
      document.querySelectorAll('[data-testid="timestamp"]').forEach((el) => {
        (el as HTMLElement).style.visibility = 'hidden';
      });
    });

    await expect(page).toHaveScreenshot('dashboard.png', {
      maxDiffPixels: 100,
    });
  });

  test('track detail matches snapshot', async ({ page }) => {
    await page.goto('/dashboard/tracks/track-001');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('track-detail.png', {
      maxDiffPixels: 100,
    });
  });

  test('responsive - mobile view', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('dashboard-mobile.png', {
      maxDiffPixels: 100,
    });
  });
});
```

---

## CI Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest
    container:
      image: mcr.microsoft.com/playwright:v1.40.0-jammy

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run E2E tests
        run: pnpm exec playwright test
        env:
          BASE_URL: ${{ vars.STAGING_URL }}

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30

      - name: Upload screenshots
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: screenshots
          path: test-results/
```

---

## Consequences

### Positive

- **Confidence**: Catch UI regressions before production
- **Documentation**: Tests document expected behavior
- **Cross-browser**: Ensure compatibility
- **Visual**: Catch unintended styling changes

### Negative

- **Slow**: E2E tests take longer than unit tests
- **Flaky**: Network and timing issues cause flakiness
- **Maintenance**: UI changes require test updates

---

## Related ADRs

- [ADR 0060: Testing Strategy](./adr-0060-testing-strategy)
- [ADR 0035: CI/CD Pipeline Strategy](./adr-0035-cicd-pipeline-strategy)

---

_© 2025 Phoenix Rooivalk. Architecture Decision Record._
