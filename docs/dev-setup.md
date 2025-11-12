# Development Setup Instructions

## Multi-Service Development Setup

To run all services properly, you need to start them in separate terminals with
different ports:

### Terminal 1: Marketing App (Next.js)

```bash
cd apps/marketing
pnpm dev
```

- Runs on: [http://localhost:3000](http://localhost:3000)
- This is the main marketing website

### Terminal 2: Threat Simulator WASM (Trunk)

```bash
cd apps/threat-simulator-desktop
pnpm dev
```

- Runs on: [http://localhost:8080](http://localhost:8080)
- This serves the WASM files and assets
- The marketing app will fetch WASM files from this port

### Terminal 3: Utils (if needed)

```bash
cd packages/utils
pnpm dev
```

- Development mode for shared utilities

## Port Configuration

- **Marketing App**: Port 3000 (Next.js frontend)
- **WASM Server**: Port 8080 (Trunk dev server for WASM assets)
- **Utils**: Port varies (if running in dev mode)

## Important Notes

1. **Start WASM server first** - The marketing app depends on it for WASM assets
2. **Keep both terminals running** - Don't close either terminal while
   developing
3. **WASM files are served from port 8080** - The marketing app is configured to
   fetch from localhost:8080
4. **React hydration issues are fixed** - Added `suppressHydrationWarning` to
   prevent browser extension conflicts

## Troubleshooting

- If WASM fails to load: Make sure the threat-simulator-desktop service is
  running on port 8080
- If you see connection refused errors: Check that all services are running on
  their correct ports
- If you see compilation errors: Run `cargo check` in the
  threat-simulator-desktop directory

## Recent Fixes Applied

✅ Fixed React hydration mismatch (browser extension conflicts)  
✅ Fixed Rust compilation errors (type mismatches)  
✅ Configured different ports for each service  
✅ Updated WASM asset URLs to point to correct port  
✅ Fixed Trunk build directory issues
