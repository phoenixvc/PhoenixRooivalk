---
id: adr-0060-testing-strategy
title: "ADR 0060: Testing Strategy"
sidebar_label: "ADR 0060: Testing Strategy"
difficulty: intermediate
estimated_reading_time: 10
points: 40
tags:
  - technical
  - architecture
  - testing
  - quality
  - ci-cd
prerequisites:
  - architecture-decision-records
  - adr-0035-cicd-pipeline-strategy
---

# ADR 0060: Testing Strategy

**Date**: 2025-12-12 **Status**: Proposed

---

## Executive Summary

1. **Problem**: Mission-critical C-UAS system requires rigorous testing across
   unit, integration, and system levels with coverage of edge cases and failure
   modes
2. **Decision**: Implement testing pyramid with property-based testing, mutation
   testing, and mandatory coverage thresholds
3. **Trade-off**: Test development time vs. system reliability

---

## Context

### Testing Challenges

| Challenge             | Description                                  |
| --------------------- | -------------------------------------------- |
| Safety-critical code  | Engagement logic must be exhaustively tested |
| Hardware dependencies | Testing without physical hardware            |
| Real-time constraints | Timing-sensitive operations                  |
| Distributed system    | Multi-node coordination                      |

### Quality Requirements

| Metric                | Target | Rationale                              |
| --------------------- | ------ | -------------------------------------- |
| Code coverage         | >80%   | Industry standard for critical systems |
| Branch coverage       | >70%   | Ensure decision paths tested           |
| Mutation score        | >60%   | Verify test effectiveness              |
| Integration test pass | 100%   | No known failures in main              |

---

## Decision

Implement **comprehensive testing pyramid**:

### Testing Pyramid

```
┌─────────────────────────────────────────────────────────────────────┐
│                       Testing Pyramid                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│                         ┌───────┐                                   │
│                        /  E2E   \          Few, expensive           │
│                       /  Tests   \         (Playwright)             │
│                      /─────────────\                                │
│                     /               \                               │
│                    /   Integration   \     More, moderate cost      │
│                   /     Tests         \    (API, component)         │
│                  /─────────────────────\                            │
│                 /                       \                           │
│                /       Unit Tests        \  Many, cheap             │
│               /         (Vitest,         \  (Pure functions)        │
│              /          cargo test)       \                         │
│             /─────────────────────────────\                         │
│            /                               \                        │
│           /       Property-Based Tests      \  Exhaustive edge      │
│          /         (proptest, fast-check)    \  cases               │
│         /─────────────────────────────────────\                     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Test Categories

### Unit Tests

```rust
// Rust unit tests - src/targeting/lead_calculator.rs
#[cfg(test)]
mod tests {
    use super::*;
    use approx::assert_relative_eq;

    #[test]
    fn test_lead_calculation_stationary_target() {
        let calculator = LeadCalculator::new(EffectorSpecs::default());
        let track = TrackUpdate {
            position: Vector3::new(100.0, 0.0, -50.0),
            velocity: Vector3::zeros(),
            acceleration: Vector3::zeros(),
            ..Default::default()
        };

        let solution = calculator.calculate_lead(
            &track,
            Vector3::zeros(),  // effector at origin
            &EffectorSpecs::default(),
        ).unwrap();

        // For stationary target, aim point should equal position
        assert_relative_eq!(solution.aim_point.x, 100.0, epsilon = 0.1);
        assert_relative_eq!(solution.aim_point.y, 0.0, epsilon = 0.1);
    }

    #[test]
    fn test_lead_calculation_crossing_target() {
        let calculator = LeadCalculator::new(EffectorSpecs::default());
        let track = TrackUpdate {
            position: Vector3::new(100.0, 0.0, -50.0),
            velocity: Vector3::new(0.0, 20.0, 0.0),  // Moving laterally at 20 m/s
            acceleration: Vector3::zeros(),
            ..Default::default()
        };

        let solution = calculator.calculate_lead(
            &track,
            Vector3::zeros(),
            &EffectorSpecs { projectile_velocity: 50.0, ..Default::default() },
        ).unwrap();

        // Aim point should lead the target
        assert!(solution.aim_point.y > 0.0, "Should lead moving target");
    }
}
```

### TypeScript Unit Tests

```typescript
// TypeScript unit tests - src/utils/formatting.test.ts
import { describe, it, expect } from "vitest";
import { formatCoordinate, formatDistance, formatSpeed } from "./formatting";

describe("formatCoordinate", () => {
  it("formats latitude correctly", () => {
    expect(formatCoordinate(-33.9249, "lat")).toBe("33°55'29.64\"S");
  });

  it("formats longitude correctly", () => {
    expect(formatCoordinate(18.4241, "lon")).toBe("18°25'26.76\"E");
  });

  it("handles zero values", () => {
    expect(formatCoordinate(0, "lat")).toBe("0°0'0.00\"N");
  });
});

describe("formatDistance", () => {
  it("uses meters for short distances", () => {
    expect(formatDistance(500)).toBe("500 m");
  });

  it("uses kilometers for long distances", () => {
    expect(formatDistance(2500)).toBe("2.5 km");
  });
});
```

### Property-Based Tests

```rust
// Property-based tests with proptest
use proptest::prelude::*;

proptest! {
    #[test]
    fn test_track_merge_is_commutative(
        a in track_strategy(),
        b in track_strategy()
    ) {
        let mut merged_ab = a.clone();
        merged_ab.merge(&b);

        let mut merged_ba = b.clone();
        merged_ba.merge(&a);

        // Merge should be commutative
        prop_assert_eq!(merged_ab.position, merged_ba.position);
    }

    #[test]
    fn test_lead_calculation_never_panics(
        pos_x in -10000.0f64..10000.0,
        pos_y in -10000.0f64..10000.0,
        pos_z in -1000.0f64..0.0,
        vel_x in -100.0f64..100.0,
        vel_y in -100.0f64..100.0,
        vel_z in -50.0f64..50.0,
    ) {
        let calculator = LeadCalculator::new(EffectorSpecs::default());
        let track = TrackUpdate {
            position: Vector3::new(pos_x, pos_y, pos_z),
            velocity: Vector3::new(vel_x, vel_y, vel_z),
            ..Default::default()
        };

        // Should never panic, may return error for impossible solutions
        let _ = calculator.calculate_lead(&track, Vector3::zeros(), &EffectorSpecs::default());
    }
}

fn track_strategy() -> impl Strategy<Value = Track> {
    (
        any::<f64>().prop_map(|x| x % 10000.0),  // position
        any::<f64>().prop_map(|x| x % 100.0),    // velocity
        0.0f32..1.0,                              // confidence
    ).prop_map(|(pos, vel, conf)| Track {
        position: Vector3::new(pos, pos, -50.0),
        velocity: Vector3::new(vel, vel, 0.0),
        position_confidence: conf,
        ..Default::default()
    })
}
```

### Integration Tests

```rust
// Integration tests - tests/integration/engagement_flow.rs
use phoenix_rooivalk::*;
use testcontainers::*;

#[tokio::test]
async fn test_full_engagement_flow() {
    // Setup test environment
    let docker = testcontainers::clients::Cli::default();
    let cosmos = docker.run(CosmosEmulator::default());

    let app = TestApp::new(&cosmos).await;

    // Simulate threat detection
    let track = app.inject_track(TrackUpdate {
        track_id: "test-001".into(),
        classification: ThreatClassification::HostileConfirmed,
        ..Default::default()
    }).await;

    // Wait for threat processing
    tokio::time::sleep(Duration::from_millis(100)).await;

    // Verify engagement recommendation generated
    let recommendation = app.get_engagement_recommendation(&track.track_id).await;
    assert!(recommendation.is_some());

    // Simulate operator authorization
    app.authorize_engagement(&track.track_id, "test-operator").await;

    // Verify engagement executed
    let engagement = app.wait_for_engagement(&track.track_id, Duration::from_secs(5)).await;
    assert!(engagement.is_some());

    // Verify evidence recorded
    let evidence = app.get_evidence(&engagement.unwrap().engagement_id).await;
    assert!(evidence.is_complete());
    assert!(evidence.chain_is_valid());
}
```

### API Integration Tests

```typescript
// API integration tests - tests/api/tracks.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestServer, TestServer } from "../utils/test-server";

describe("Tracks API", () => {
  let server: TestServer;

  beforeAll(async () => {
    server = await createTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  it("returns active tracks", async () => {
    // Seed test data
    await server.seedTracks([
      { trackId: "track-1", status: "active" },
      { trackId: "track-2", status: "active" },
      { trackId: "track-3", status: "lost" },
    ]);

    const response = await server.request("GET", "/api/tracks?status=active");

    expect(response.status).toBe(200);
    expect(response.body.tracks).toHaveLength(2);
    expect(response.body.tracks.map((t: any) => t.trackId)).toEqual(
      expect.arrayContaining(["track-1", "track-2"]),
    );
  });

  it("requires authentication", async () => {
    const response = await server.request("GET", "/api/tracks", {
      headers: { Authorization: "" },
    });

    expect(response.status).toBe(401);
  });
});
```

---

## Coverage Requirements

### Coverage Configuration

```toml
# Cargo.toml
[package.metadata.coverage]
include = ["src/**/*.rs"]
exclude = ["src/generated/**", "tests/**"]
fail-under = 80

# Mutation testing
[package.metadata.mutants]
exclude = ["src/generated/**"]
minimum-score = 60
```

### Vitest Coverage

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      exclude: ["node_modules", "tests", "**/*.d.ts", "**/generated/**"],
      thresholds: {
        lines: 80,
        branches: 70,
        functions: 80,
        statements: 80,
      },
    },
  },
});
```

---

## CI Integration

### Test Workflow

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Rust tests
        run: cargo test --workspace

      - name: TypeScript tests
        run: pnpm test

      - name: Coverage report
        run: |
          cargo llvm-cov --lcov --output-path lcov.info
          pnpm test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: lcov.info,coverage/lcov.info
          fail_ci_if_error: true

  integration-tests:
    runs-on: ubuntu-latest
    services:
      cosmos:
        image: mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator
    steps:
      - uses: actions/checkout@v4

      - name: Integration tests
        run: cargo test --test '*' --features integration
        env:
          COSMOS_ENDPOINT: https://localhost:8081

  mutation-tests:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4

      - name: Mutation testing
        run: cargo mutants --check

      - name: Report mutations
        uses: actions/github-script@v7
        with:
          script: |
            const report = require('./mutants.json');
            // Post mutation score to PR
```

---

## Test Data Management

### Test Fixtures

```rust
// tests/fixtures/mod.rs
pub mod tracks {
    pub fn hostile_drone() -> TrackUpdate {
        TrackUpdate {
            track_id: "fixture-hostile-001".into(),
            classification: ThreatClassification::HostileConfirmed,
            position: Vector3::new(500.0, 0.0, -100.0),
            velocity: Vector3::new(-10.0, 0.0, 0.0),
            ..Default::default()
        }
    }

    pub fn friendly_aircraft() -> TrackUpdate {
        TrackUpdate {
            track_id: "fixture-friendly-001".into(),
            classification: ThreatClassification::Friendly,
            position: Vector3::new(2000.0, 1000.0, -500.0),
            velocity: Vector3::new(50.0, 0.0, 0.0),
            ..Default::default()
        }
    }
}
```

---

## Consequences

### Positive

- **Reliability**: High test coverage catches bugs early
- **Confidence**: Safe refactoring with test suite
- **Documentation**: Tests serve as usage examples
- **Regression prevention**: Automated CI catches regressions

### Negative

- **Development time**: Writing tests takes effort
- **Maintenance**: Tests must be updated with code
- **CI time**: Comprehensive tests slow pipelines

---

## Related ADRs

- [ADR 0035: CI/CD Pipeline Strategy](./adr-0035-cicd-pipeline-strategy)
- [ADR 0061: Hardware-in-Loop Testing](./adr-0061-hardware-in-loop-testing)
- [ADR 0062: Simulation Framework](./adr-0062-simulation-framework)
- [ADR 0063: E2E Testing](./adr-0063-e2e-testing)

---

_© 2025 Phoenix Rooivalk. Architecture Decision Record._
