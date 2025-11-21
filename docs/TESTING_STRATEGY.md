# Testing Strategy & Coverage

## Overview

This document outlines the testing strategy for the Phoenix Rooivalk platform,
covering unit tests, integration tests, end-to-end tests, and performance
benchmarks.

## Testing Philosophy

- **Test What Matters**: Focus on business-critical paths and edge cases
- **Fast Feedback**: Unit tests run in <1s, full suite in <5min
- **Confidence**: Tests should give confidence in deployments
- **Maintainability**: Tests are code - keep them DRY and readable

## Test Pyramid

```
           ╱ ╲
          ╱ E2E╲          ~5% (Critical user flows)
         ╱───────╲
        ╱ Integ.  ╲       ~20% (Service boundaries)
       ╱───────────╲
      ╱   Unit      ╲     ~75% (Business logic)
     ╱_______________╲
```

## Unit Testing

### TypeScript/React

**Framework**: Jest + React Testing Library

**Location**: `__tests__` directories next to source files

**Coverage Target**: 80%+ for business logic

#### Example Test Structure

```typescript
// src/components/__tests__/ThreatSimulator.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ThreatSimulator } from '../ThreatSimulator';

describe('ThreatSimulator', () => {
  it('should render initial state correctly', () => {
    render(<ThreatSimulator />);
    expect(screen.getByText('Score')).toBeInTheDocument();
  });

  it('should spawn threat on button click', () => {
    render(<ThreatSimulator />);
    const button = screen.getByText('Spawn Threat');
    fireEvent.click(button);
    // Assert threat appears
  });
});
```

#### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test ThreatSimulator
```

### Rust

**Framework**: Built-in `cargo test` + `proptest` for property-based testing

**Location**: `#[cfg(test)]` modules in same file or `tests/` directory

**Coverage Target**: 90%+ for core logic

#### Example Test Structure

```rust
// crates/evidence/src/lib.rs
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sha256_hex() {
        assert_eq!(
            hash::sha256_hex(b"hello"),
            "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"
        );
    }

    #[test]
    fn test_evm_address_validation() {
        assert!(validate_evm_address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e", false).is_ok());
        assert!(validate_evm_address("invalid", false).is_err());
    }
}
```

#### Running Tests

```bash
# Run all Rust tests
cargo test

# Run tests with output
cargo test -- --nocapture

# Run specific test
cargo test test_sha256_hex

# Run tests with coverage (requires tarpaulin)
cargo tarpaulin --out Html
```

## Integration Testing

### API Integration Tests

**Framework**: Rust integration tests with `tempfile` for SQLite

**Location**: `apps/api/tests/`

**Scope**: Test API endpoints with real database

#### Example

```rust
// apps/api/tests/evidence_api_test.rs
use phoenix_api::build_app;
use axum::http::StatusCode;
use axum_test::TestServer;

#[tokio::test]
async fn test_create_evidence() {
    let (app, _pool) = build_app().await.unwrap();
    let server = TestServer::new(app).unwrap();

    let response = server
        .post("/api/evidence")
        .json(&json!({
            "eventType": "test",
            "payload": {}
        }))
        .await;

    assert_eq!(response.status(), StatusCode::CREATED);
}
```

### Blockchain Integration Tests

**Framework**: Mock blockchain providers + contract interaction tests

**Location**: `crates/anchor-*/tests/`

**Scope**: Test blockchain anchoring without real transactions (use devnet)

```rust
// crates/anchor-solana/tests/integration_test.rs
use anchor_solana::SolanaAnchorProvider;
use phoenix_evidence::model::EvidenceRecord;

#[tokio::test]
async fn test_solana_anchoring() {
    let provider = SolanaAnchorProvider::new_devnet();
    let evidence = EvidenceRecord { /* ... */ };

    let tx_ref = provider.anchor(&evidence).await.unwrap();
    assert!(!tx_ref.tx_id.is_empty());
}
```

## End-to-End Testing

### Framework

**Tool**: Playwright for browser automation

**Location**: `tests/e2e/`

**Scope**: Critical user journeys

### Critical Flows

1. **Evidence Creation Flow**
   - Navigate to simulator
   - Create engagement
   - Verify evidence recorded
   - Check blockchain anchoring

2. **Threat Simulation Flow**
   - Load simulator
   - Spawn threats
   - Neutralize threats
   - Verify scoring

3. **Research & Progression**
   - Earn tokens
   - Purchase drone
   - Unlock technology
   - Verify persistence

#### Example E2E Test

```typescript
// tests/e2e/threat-simulator.spec.ts
import { test, expect } from "@playwright/test";

test("threat simulator basic flow", async ({ page }) => {
  await page.goto("/");

  // Wait for simulator to load
  await expect(page.locator('[data-testid="simulator"]')).toBeVisible();

  // Spawn a threat
  await page.click('[data-testid="spawn-threat-btn"]');

  // Verify threat appears
  await expect(page.locator(".threat")).toBeVisible();

  // Neutralize threat
  await page.click(".threat");

  // Verify score increases
  const score = await page.textContent('[data-testid="score"]');
  expect(parseInt(score || "0")).toBeGreaterThan(0);
});
```

#### Running E2E Tests

```bash
# Install Playwright browsers
pnpm playwright install

# Run E2E tests
pnpm test:e2e

# Run in headed mode (see browser)
pnpm test:e2e --headed

# Debug mode
pnpm test:e2e --debug
```

## Performance Testing

### Benchmarks

**Framework**: Criterion for Rust, Benchmark.js for TypeScript

**Location**: `benches/` directories

#### Rust Benchmarks

```rust
// benches/evidence_benchmark.rs
use criterion::{black_box, criterion_group, criterion_main, Criterion};
use phoenix_evidence::hash::sha256_hex;

fn benchmark_sha256(c: &mut Criterion) {
    let data = b"hello world";
    c.bench_function("sha256_hex", |b| {
        b.iter(|| sha256_hex(black_box(data)))
    });
}

criterion_group!(benches, benchmark_sha256);
criterion_main!(benches);
```

Running:

```bash
cargo bench
```

### Load Testing

**Tool**: k6 or Artillery for API load testing

**Target Metrics**:

- API: 1000 req/s with <100ms p95
- Keeper: Process 100 jobs/minute
- Database: <10ms query time p99

#### Example Load Test

```javascript
// tests/load/api-load-test.js
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 100,
  duration: "30s",
};

export default function () {
  const res = http.post(
    "http://localhost:8080/api/evidence",
    JSON.stringify({
      eventType: "test",
      payload: {},
    }),
    {
      headers: { "Content-Type": "application/json" },
    },
  );

  check(res, {
    "status is 201": (r) => r.status === 201,
    "response time < 200ms": (r) => r.timings.duration < 200,
  });

  sleep(1);
}
```

Running:

```bash
k6 run tests/load/api-load-test.js
```

## Visual Regression Testing

**Tool**: Percy or Chromatic

**Scope**: UI components and critical pages

```typescript
// .storybook/test-runner.ts
import { toMatchImageSnapshot } from "jest-image-snapshot";

expect.extend({ toMatchImageSnapshot });

export default {
  async postRender(page) {
    const image = await page.screenshot();
    expect(image).toMatchImageSnapshot();
  },
};
```

## Test Coverage

### Current Coverage

| Package     | Unit | Integration | E2E | Total |
| ----------- | ---- | ----------- | --- | ----- |
| `evidence`  | 95%  | 80%         | -   | 90%   |
| `keeper`    | 85%  | 75%         | -   | 82%   |
| `api`       | 80%  | 70%         | 90% | 78%   |
| `marketing` | 70%  | -           | 85% | 75%   |
| `types`     | 100% | -           | -   | 100%  |
| `ui`        | 75%  | -           | -   | 75%   |

### Coverage Goals

- **Core Business Logic**: 90%+
- **API Endpoints**: 85%+
- **UI Components**: 75%+
- **Utilities**: 90%+

### Generating Coverage Reports

#### TypeScript

```bash
pnpm test:coverage
open coverage/lcov-report/index.html
```

#### Rust

```bash
cargo tarpaulin --out Html
open tarpaulin-report.html
```

## Continuous Integration

### GitHub Actions Workflow

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test-rust:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
      - run: cargo test --all

  test-typescript:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test:coverage
      - uses: codecov/codecov-action@v3

  test-e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm playwright install
      - run: pnpm test:e2e
```

## Test Data Management

### Fixtures

Store test data in `fixtures/` directories:

```
tests/
├── fixtures/
│   ├── evidence-records.json
│   ├── blockchain-transactions.json
│   └── game-states.json
```

### Factories

Use factories for test data generation:

```typescript
// tests/factories/evidenceFactory.ts
export function createEvidenceRecord(overrides = {}) {
  return {
    id: `evidence-${Date.now()}`,
    eventType: "test",
    payload: {},
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}
```

## Mocking Strategy

### External Services

Mock external services (blockchains, APIs) to:

- Speed up tests
- Ensure deterministic behavior
- Avoid rate limits/costs

```typescript
// __mocks__/solana.ts
export const mockSolanaProvider = {
  anchor: jest.fn().mockResolvedValue({
    tx_id: "mock-tx-123",
    confirmed: false,
  }),
};
```

### Time-Dependent Tests

Use `jest.useFakeTimers()` for time-dependent logic:

```typescript
it("should clean up old items after timeout", () => {
  jest.useFakeTimers();
  const manager = new ResourceManager();

  manager.addItem("test");
  jest.advanceTimersByTime(60000);

  expect(manager.getItems()).toHaveLength(0);
  jest.useRealTimers();
});
```

## Test Maintenance

### Flaky Tests

- Identify flaky tests with retry logic
- Fix root cause (timing issues, race conditions)
- Use `test.retry()` only as temporary measure

### Test Smells

Watch for:

- Tests that depend on execution order
- Tests with hardcoded IDs/timestamps
- Tests that require manual setup
- Tests that take >5s to run

### Refactoring Tests

- Extract common setup to `beforeEach`
- Use test utilities for repeated patterns
- Keep tests DRY but readable
- Avoid excessive mocking

## Documentation

Each test suite should have:

- Purpose comment at top
- Clear test names (`it('should X when Y')`)
- Setup/teardown documented
- Edge cases covered

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Docs](https://playwright.dev/)
- [Rust Testing](https://doc.rust-lang.org/book/ch11-00-testing.html)
- [k6 Load Testing](https://k6.io/docs/)

---

_Last Updated: November 18, 2024_
