---
id: adr-0403-tauri-desktop-packaging
title: "ADR 0403: Tauri 2 for Desktop Application Packaging"
sidebar_label: "ADR 0403: Tauri Desktop"
difficulty: intermediate
estimated_reading_time: 5
points: 20
tags:
  - technical
  - architecture
  - infrastructure
  - desktop
prerequisites:
  - adr-0401-wasm-integration-strategy
---

# ADR 0403: Tauri 2 for Desktop Application Packaging

**Date**: 2026-02-22 **Status**: Accepted (Implemented)

---

## Executive Summary

1. **Problem**: The threat simulator needs a desktop distribution that provides
   native file system access (evidence persistence), system tray integration,
   and offline operation — while reusing the same Leptos/WASM UI.
2. **Decision**: Use Tauri 2 for desktop packaging. Tauri wraps the system's
   native webview (WebKit on Linux, WebView2 on Windows, WKWebView on macOS)
   with a Rust backend for IPC, producing ~10MB binaries.
3. **Trade-off**: Tauri requires platform-specific build dependencies (GTK/
   webkit on Linux) and the webview rendering may differ slightly across
   platforms, but bundle size is 15x smaller than Electron.

---

## Context

The threat simulator desktop app must:

- Save evidence sessions to the local file system
- Run offline without a web server
- Integrate with the OS (system tray, file associations)
- Reuse the same Leptos UI that runs in the browser

---

## Options Considered

### Option 1: Tauri 2 ✅ Selected

| Metric         | Value                                      |
| -------------- | ------------------------------------------ |
| Bundle size    | ~10MB                                      |
| Memory usage   | ~50-80MB (uses system webview)             |
| Backend        | Rust (shared with evidence/blockchain crates)|
| IPC            | Typed Rust ↔ JS/WASM commands              |
| Linux deps     | libwebkit2gtk-4.1-dev, libayatana-appindicator3-dev |

### Option 2: Electron ❌ Rejected

| Metric         | Value                                      |
| -------------- | ------------------------------------------ |
| Bundle size    | ~150MB+ (bundles Chromium)                 |
| Memory usage   | ~200-400MB                                 |
| Backend        | Node.js (would need separate Rust bridge)  |
| IPC            | contextBridge, preload scripts             |

### Option 3: WASM-Only (No Desktop) ❌ Rejected

| Metric         | Value                                      |
| -------------- | ------------------------------------------ |
| Bundle size    | 0 (web only)                               |
| File system    | No native access (only downloads)          |
| Offline        | Requires PWA service worker                |
| Evidence       | Cannot persist to local filesystem         |

---

## Decision

Tauri 2 is used with:

- **Rust backend** (`src-tauri/src/main.rs`): Handles evidence persistence,
  file system operations, and Tauri commands
- **Leptos frontend** (`src/`): Same components as WASM-in-browser mode
- **Conditional compilation**: `#[cfg(not(target_arch = "wasm32"))]` gates
  native-only code (Tauri API calls)

### Build Modes

| Command              | Mode         | Output              |
| -------------------- | ------------ | -------------------- |
| `pnpm sim:dev`       | WASM only    | Browser on :8080     |
| `pnpm sim:dev:tauri` | Full desktop | Native window        |
| `pnpm sim:build:tauri`| Release     | Platform installer   |

### Linux CI Dependencies

Tauri CI builds require:

```bash
sudo apt-get install -y libwebkit2gtk-4.1-dev build-essential \
  libssl-dev libayatana-appindicator3-dev
```

These are installed in the `release-desktop.yml` GitHub Actions workflow.

---

## Consequences

### Positive

- 15x smaller bundles than Electron (~10MB vs ~150MB)
- 4x lower memory usage
- Native Rust backend shares crates with API and keeper
- Evidence persistence via native file system access

### Negative

- Platform-specific webview rendering differences (minor CSS tweaks needed)
- Linux build requires GTK/webkit development packages
- Tauri 2 is newer with a smaller ecosystem than Electron

---

## Change Log

| Date       | Change              | Author   |
| ---------- | ------------------- | -------- |
| 2026-02-22 | Initial ADR created | AI Agent |
