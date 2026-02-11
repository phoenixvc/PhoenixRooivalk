Build the project. Accepts an optional argument to scope the build.

Arguments: $ARGUMENTS

If no argument is provided, build everything:
1. `pnpm build` — All JS/TS apps via Turborepo
2. `cargo build` — Rust workspace

If an argument is provided, scope the build:
- `marketing` → `pnpm --filter marketing build` (includes sync:wasm)
- `docs` → `pnpm --filter docs build`
- `rust` → `cargo build` (all Rust workspace crates)
- `api` → `cargo build -p phoenix-api`
- `keeper` → `cargo build -p phoenix-keeper`
- `evidence-cli` → `cargo build -p evidence-cli`
- `sim` → `pnpm sim:build:tauri` (Tauri desktop installer)
- `wasm` → `trunk build --release` (in apps/threat-simulator-desktop/)
- Any other value → try `pnpm --filter $ARGUMENTS build`

Report any build errors and offer to fix them.
