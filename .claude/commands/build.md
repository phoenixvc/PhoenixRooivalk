Build the project. Accepts an optional argument to scope the build.

Arguments: $ARGUMENTS

If no argument is provided, build everything:
1. `pnpm build` — All JS/TS apps via Turborepo
2. `cargo build` — Rust workspace

If an argument is provided, scope the build:
- `marketing` → `pnpm --filter marketing build`
- `docs` → `pnpm --filter docs build`
- `rust` → `cargo build`
- `sim` → `pnpm sim:build:tauri`
- Any other value → try `pnpm --filter $ARGUMENTS build`

Report any build errors and offer to fix them.
