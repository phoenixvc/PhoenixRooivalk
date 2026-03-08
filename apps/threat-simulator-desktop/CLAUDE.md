# Threat Simulator Desktop — Claude Code Context

## Overview

Tauri 2 + Leptos WASM desktop app with Rapier2D physics engine. Compiles to both
WASM (browser frontend) and native Rust (Tauri backend + tests).

## Two Development Modes

```bash
pnpm sim:dev          # Frontend only — trunk serve on :8080 (fastest)
pnpm sim:dev:tauri    # Full desktop — cargo tauri dev (includes native backend)
```

## WASM Entry Point

```rust
#[wasm_bindgen(start)]
pub fn main() {
    console_error_panic_hook::set_once();
    mount_to_body(|| view! { <App /> });
}
```

Uses `#[wasm_bindgen(start)]`, not a traditional library export.

## Conditional Compilation

```rust
// WASM-only dependencies (browser APIs, Leptos CSR)
[target.'cfg(target_arch = "wasm32")'.dependencies]
leptos = "0.8"
web-sys = { features = ["Canvas", "Touch", "Storage", ...] }

// Native-only dependencies (tests, Tauri backend)
[target.'cfg(not(target_arch = "wasm32"))'.dependencies]
```

Only `components`, `tauri_api`, and `App` are WASM-gated. Game engine compiles
for both targets (enables native testing).

## Trunk Configuration (`Trunk.toml`)

- Build hook: Runs `cargo build --release` during WASM build
- Watch: Must ignore "target" directory to prevent rebuild loops
- Serve: Port 8080, localhost only, auto-opens browser
- Output: `dist/` directory

## Tauri Backend (`src-tauri/`)

- Package: `threat-simulator-tauri`
- Feature: `custom-protocol` (default, enabled)
- Plugins: tauri-plugin-shell
- Integrates with `phoenix-evidence` and `phoenix-common` crates

## Build Requirements

- Rust + `wasm32-unknown-unknown` target
  (`rustup target add wasm32-unknown-unknown`)
- Trunk (`cargo install trunk`)
- Tauri CLI (`cargo install tauri-cli --version "^2.0"`)
- Linux: `libwebkit2gtk-4.1-dev`, `build-essential`, `libssl-dev`,
  `libayatana-appindicator3-dev`

## Testing

```bash
pnpm sim:test         # cargo test --lib
pnpm sim:lint         # cargo clippy --lib -- -D warnings
```

Tests run natively (not in WASM) since game engine compiles for both targets.

## Component Structure

- `src/components/` — UI: HUD, game canvas, panels, overlays, weapon systems
- `src/game/` — Logic: physics (Rapier2D), rendering, waves, formations,
  auto-targeting, particles, weapons
