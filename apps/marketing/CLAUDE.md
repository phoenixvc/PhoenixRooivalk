# Marketing App — Claude Code Context

## Overview

Next.js 16 static export marketing website with interactive threat simulator,
email-based auth, career applications, and shopping cart.

## Critical Gotchas

- **Static export** (`output: "export"` in next.config.js) — no SSR, no API
  routes, no server components. Everything runs client-side.
- **Two next.config files** — `next.config.js` is the real one with full config.
  `next.config.mjs` exists but is minimal/ignored.
- **WASM sync before build** — `pnpm sync:wasm` runs automatically before
  `next build`. If the threat simulator hasn't been built, it warns but uses a
  fallback.
- **suppressHydrationWarning** on `<html>` — needed because theme + cart state
  loads from localStorage on mount.

## Commands

```bash
pnpm --filter marketing dev        # Dev server on :3000
pnpm --filter marketing build      # sync:wasm + next build
pnpm --filter marketing test       # Vitest
pnpm --filter marketing lint       # ESLint
pnpm --filter marketing typecheck  # TypeScript check
```

## Dual Game Engines

Two threat simulator implementations exist side by side:

- `src/components/ThreatSimulator.tsx` — JS/React
- `src/components/WasmThreatSimulator.tsx` — Leptos WASM

The WASM version loads from `public/wasm/` (synced from
threat-simulator-desktop).

## Authentication

Email-only (no passwords):

- `POST /auth/login` creates or finds user by email
- Session stored in localStorage: `session_id`, `user` (JSON)
- After login, redirects to `/contact#careers`
- Team members (pre-seeded list) see welcome instead of application form

## Theme System (`src/contexts/ThemeContext.tsx`)

Three themes: "phoenix" (default orange), "blue", "green". Stored in
localStorage key `phoenix-theme`. Sets CSS custom properties on
`document.documentElement`.

## Shopping Cart (`src/contexts/CartContext.tsx`)

localStorage key: `phoenix-rooivalk-cart`. Silent failure on storage errors.

## Component Organization

| Directory                   | Purpose                                       |
| --------------------------- | --------------------------------------------- |
| `src/components/sections/`  | Page sections (Hero, Features, Team, etc.)    |
| `src/components/simulator/` | Game engine components                        |
| `src/components/ui/`        | Shared UI (Button, Card, Badge)               |
| `src/components/cart/`      | Shopping cart                                 |
| `src/components/weapon/`    | Weapon/research panels                        |
| `src/components/hooks/`     | Simulator-specific hooks                      |
| `src/components/utils/`     | Game utilities (engine, particles, collision) |

## Routes

`/`, `/about`, `/capabilities`, `/products`, `/technical`, `/methods`,
`/financial`, `/roi-calculator`, `/interactive-demo`, `/contact`, `/login`,
`/profile/confirm`, `/timeline`, `/schedule`, `/partnerships`, `/preorder`,
`/sbir`, `/compliance` (+ sub-routes: iso-27001, itar, security-clearance)

## Path Aliases

- `@/*` → `./src/*`
- `@phoenix-rooivalk/types` → `../../packages/types/src/index.ts`
- `@phoenix-rooivalk/utils` → `../../packages/utils/src/index.ts`

Configured in both tsconfig.json AND vitest.config.ts (must stay in sync).

## Testing

Vitest with jsdom. Coverage via v8 provider. Setup in `src/__tests__/setup.ts`.

## Environment Variables

```text
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_ENABLE_TOUR_SKIP=true
NEXT_PUBLIC_TOUR_AUTO_START=true
```
