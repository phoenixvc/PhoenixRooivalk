# Dev

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

**Port conflicts:** Marketing and docs both default to 3000; API and simulator
both default to 8080. Stop any existing service on the same port before starting
another, or use an alternate port:

- Marketing: `pnpm --filter marketing dev -- -p 3001`
- Docs: `pnpm --filter docs start -- --port 3001`
- API: `PORT=8082 cargo run -p phoenix-api`
- Simulator: `trunk serve --port 8082`

Report the URL/port when the server starts. If the server fails to start,
diagnose the issue.
