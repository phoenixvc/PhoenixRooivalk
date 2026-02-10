Start a development server for a specific app.

Arguments: $ARGUMENTS

If no argument is provided, start all apps: `pnpm dev`

If an argument is provided, start the specific app:
- `marketing` → `pnpm --filter marketing dev` (port 3000)
- `docs` → `pnpm --filter docs start` (port 3000)
- `api` → `cargo run -p phoenix-api` (port 8080)
- `keeper` → `KEEPER_USE_STUB=true cargo run -p phoenix-keeper` (port 8081)
- `sim` or `simulator` → `pnpm sim:dev` (trunk serve on port 8080)
- `sim:tauri` or `desktop` → `pnpm sim:dev:tauri` (full Tauri desktop app)
- `all` → `pnpm dev` (all JS/TS apps via Turborepo)

Report the URL/port when the server starts. If the server fails to start, diagnose the issue.
