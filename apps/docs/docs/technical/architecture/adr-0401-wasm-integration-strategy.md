---
id: adr-0401-wasm-integration-strategy
title: "ADR 0401: WASM Integration Strategy"
sidebar_label: "ADR 0401: WASM Integration"
difficulty: expert
estimated_reading_time: 8
points: 30
tags:
  - technical
  - architecture
  - wasm
  - infrastructure
prerequisites: []
---

# ADR 0401: WASM Integration Strategy

**Date**: 2026-02-22 **Status**: Accepted

---

## Executive Summary

1. **Problem**: The threat simulator must run as both a standalone desktop
   application (Tauri) and an in-browser widget embedded in the marketing site,
   requiring three distinct compilation targets with shared game logic.
2. **Decision**: Use Leptos with conditional compilation (`#[cfg(target_arch)]`)
   to produce WASM-in-browser, WASM-in-iframe, and native Tauri binaries from
   the same codebase. A `sync:wasm` pre-build step copies compiled WASM
   artifacts into the marketing app's public directory.
3. **Trade-off**: Conditional compilation adds build complexity and requires
   `getrandom` feature unification, but enables code reuse across all three
   targets without maintaining separate codebases.

---

## Context

Phoenix Rooivalk's threat simulator serves dual purposes:

1. **Desktop application**: Full-featured Tauri 2 app with native file system
   access, evidence persistence, and system tray integration
2. **Marketing widget**: Embedded demo in the Next.js marketing site that lets
   visitors experience the threat simulation without installing software

The simulator is built with Leptos 0.8 (Rust reactive UI framework) and must
compile to:

- **`wasm32-unknown-unknown`**: Browser-based WASM via Trunk
- **Native**: Tauri desktop app for Linux, macOS, Windows

The game engine (state machines, object pooling, event systems, performance
monitoring) must be shared between both targets. Additionally, the marketing
site's Next.js build must have access to the compiled WASM artifacts.

---

## Options Considered

### Option 1: Conditional Compilation with Shared Core ✅ Selected

**Description**: Single crate with `#[cfg(target_arch = "wasm32")]` gates for
browser-specific code. Game engine logic compiles for both WASM and native.

**Pros**:

- One codebase for all three targets
- Game engine tests run natively (fast CI without WASM overhead)
- Leptos components shared between desktop and browser
- Trunk handles WASM packaging, Tauri handles native packaging

**Cons**:

- `cfg` attributes add complexity to code navigation
- `getrandom` requires feature unification for both 0.3 and 0.4 versions
- Build failures are harder to diagnose (wrong target selected)
- Trunk and Tauri have different build pipelines

### Option 2: Separate WASM and Native Crates ❌ Rejected

**Description**: Split into `simulator-core`, `simulator-wasm`, and
`simulator-tauri` crates.

**Pros**:

- Cleaner separation of concerns
- No conditional compilation needed

**Cons**:

- Code duplication for UI components
- Three crates to maintain instead of one
- Feature changes require coordinated updates across crates
- Leptos component reuse harder across crate boundaries

### Option 3: Electron Instead of Tauri ❌ Rejected

**Description**: Use Electron for the desktop app, share JavaScript with the
marketing site.

**Pros**:

- Single language (JavaScript/TypeScript)
- Easier WASM-to-web integration

**Cons**:

- ~150MB+ bundle size vs ~10MB for Tauri
- Higher memory usage (Chromium runtime)
- Cannot reuse Rust evidence hashing code directly
- Breaks the Rust-first architecture

---

## Decision

### Compilation Targets

```
threat-simulator-desktop/
├── src/
│   ├── lib.rs          # WASM entry point (#[cfg(wasm32)])
│   ├── app.rs          # Leptos App component (shared)
│   ├── components/     # UI components (#[cfg(wasm32)] for browser-only)
│   ├── game_engine/    # Pure Rust game logic (both targets)
│   ├── tauri_api/      # Tauri IPC (#[cfg(not(wasm32))])
│   └── ...
├── src-tauri/
│   └── src/main.rs     # Tauri native entry point
├── Trunk.toml          # WASM build configuration
└── Cargo.toml          # Conditional dependencies
```

**WASM entry point** (`lib.rs`):

```rust
#[cfg(target_arch = "wasm32")]
#[wasm_bindgen(start)]
pub fn main() {
    console_error_panic_hook::set_once();
    mount_to_body(|| view! { <App /> });
}
```

**Conditional dependencies** (`Cargo.toml`):

```toml
[target.'cfg(target_arch = "wasm32")'.dependencies]
leptos = { version = "0.8", features = ["csr"] }
web-sys = "0.3"
wasm-bindgen = "0.2"
gloo-timers = "0.3"
js-sys = "0.3"
console_error_panic_hook = "0.1"
getrandom_03 = { package = "getrandom", version = "0.3", features = ["wasm_js"] }
```

### getrandom Feature Unification

The workspace requires two versions of `getrandom` for WASM:

- **`getrandom 0.4.1`** (workspace-level): Used by direct dependencies
- **`getrandom 0.3`** (transitive): Pulled by Leptos/rand/Tauri

Both must have `wasm_js` enabled so Cargo's feature unification selects the
JavaScript entropy backend for WASM targets. Without this, the WASM build fails
with `getrandom` trying to use an unsupported backend.

### sync:wasm Pre-Build Step

The marketing site's build pipeline includes `pnpm --filter marketing sync:wasm`
which:

1. Copies compiled WASM artifacts from the simulator's `dist/` directory
2. Places them in the marketing app's `public/` directory
3. Falls back gracefully if the simulator hasn't been built (marketing uses a
   placeholder)

This runs automatically before `next build` to ensure the embedded demo is
always up-to-date.

### iframe Isolation

When embedded in the marketing site, the WASM simulator runs inside an iframe
for:

- **DOM isolation**: WASM cannot affect the parent Next.js page
- **CSS isolation**: No style conflicts between Leptos and Tailwind
- **Security**: Additional sandboxing layer
- **Fullscreen**: Native fullscreen API support within the iframe

---

## Consequences

### Positive

1. **Code reuse**: Game engine, event system, and state machines shared across
   all targets
2. **Fast testing**: Game logic tests run natively without WASM compilation
3. **Small bundles**: Tauri desktop app ~10MB vs Electron ~150MB+
4. **Rust-first**: Evidence hashing (SHA-256) runs natively in both WASM and
   desktop
5. **Progressive enhancement**: Marketing visitors get an interactive demo;
   serious users get the full desktop app

### Negative

1. **Build complexity**: Three build pipelines (Trunk, Tauri, Next.js sync)
2. **getrandom juggling**: Two versions of `getrandom` with feature unification
3. **Debug difficulty**: WASM compilation errors are less readable than native
4. **CI requirements**: Linux GUI deps (GTK, webkit, appindicator) needed for
   Tauri CI builds

### Neutral

1. **Two dev modes**: `pnpm sim:dev` (WASM only, port 8080) vs
   `pnpm sim:dev:tauri` (full desktop) — developers choose based on what they're
   working on
2. **Trunk watch caveat**: Must ignore `target/` directory to prevent infinite
   rebuild loops

---

## Related ADRs

- ADR 0101: Rust Workspace and rustls-Only TLS Policy (workspace configuration)
- ADR D006: WASM for Threat Simulator (original decision)
- ADR D009: iframe Isolation for WASM Embedding
- ADR 0035: CI/CD Pipeline (Tauri build requirements)

---

## References

- [Leptos documentation](https://docs.rs/leptos/)
- [Trunk WASM bundler](https://trunkrs.dev/)
- [Tauri 2 documentation](https://v2.tauri.app/)
- [wasm-bindgen guide](https://rustwasm.github.io/wasm-bindgen/)
- [getrandom WASM support](https://docs.rs/getrandom/latest/getrandom/#webassembly-support)

---

## Change Log

| Date       | Change              | Author   |
| ---------- | ------------------- | -------- |
| 2026-02-22 | Initial ADR created | AI Agent |
