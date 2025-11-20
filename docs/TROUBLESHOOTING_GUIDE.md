# Troubleshooting Guide

This guide provides solutions to common problems encountered when developing,
deploying, or using Phoenix Rooivalk.

## Table of Contents

- [Development Issues](#development-issues)
- [Build Failures](#build-failures)
- [Runtime Errors](#runtime-errors)
- [Performance Problems](#performance-problems)
- [Database Issues](#database-issues)
- [Blockchain Integration](#blockchain-integration)
- [WASM Simulator](#wasm-simulator)
- [Deployment Issues](#deployment-issues)
- [Testing Problems](#testing-problems)

---

## Development Issues

### pnpm install fails

**Symptoms:**

```
ERROR: Cannot find module '...'
```

**Solutions:**

1. Clear cache and reinstall:

   ```bash
   pnpm store prune
   rm -rf node_modules
   rm pnpm-lock.yaml
   pnpm install
   ```

2. Check Node.js version:

   ```bash
   node --version  # Should be 18.x or 20.x
   corepack enable
   ```

3. Verify network connectivity:
   ```bash
   ping registry.npmjs.org
   ```

### Cargo build fails

**Symptoms:**

```
error: could not compile `phoenix-api`
```

**Solutions:**

1. Update Rust toolchain:

   ```bash
   rustup update stable
   rustup default stable
   ```

2. Clean build artifacts:

   ```bash
   cargo clean
   cargo build
   ```

3. Check for missing system dependencies:

   ```bash
   # Ubuntu/Debian
   sudo apt-get install build-essential pkg-config libssl-dev

   # macOS
   brew install pkg-config openssl
   ```

### TypeScript errors after update

**Symptoms:**

```
error TS2304: Cannot find name 'X'
```

**Solutions:**

1. Rebuild TypeScript declarations:

   ```bash
   pnpm turbo build --force
   ```

2. Clear TypeScript cache:

   ```bash
   rm -rf apps/*/tsconfig.tsbuildinfo
   rm -rf packages/*/tsconfig.tsbuildinfo
   ```

3. Restart TypeScript server:
   - VSCode: `Cmd/Ctrl + Shift + P` → "TypeScript: Restart TS Server"

---

## Build Failures

### Next.js build fails with memory error

**Symptoms:**

```
FATAL ERROR: Reached heap limit
```

**Solutions:**

1. Increase Node.js memory:

   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" pnpm build
   ```

2. Add to `package.json` scripts:
   ```json
   {
     "build": "NODE_OPTIONS='--max-old-space-size=4096' next build"
   }
   ```

### Turborepo cache issues

**Symptoms:**

- Stale output
- Build not reflecting changes

**Solutions:**

1. Clear Turbo cache:

   ```bash
   pnpm turbo build --force
   rm -rf .turbo
   ```

2. Disable cache temporarily:
   ```bash
   pnpm turbo build --no-cache
   ```

### WASM build fails

**Symptoms:**

```
error: failed to execute `wasm-pack`
```

**Solutions:**

1. Install/update wasm-pack:

   ```bash
   cargo install wasm-pack
   ```

2. Install Trunk:

   ```bash
   cargo install trunk
   ```

3. Verify Rust WASM target:
   ```bash
   rustup target add wasm32-unknown-unknown
   ```

---

## Runtime Errors

### API returns 500 Internal Server Error

**Symptoms:**

```json
{ "error": "internal_error", "message": "..." }
```

**Solutions:**

1. Check API logs:

   ```bash
   # If running with cargo
   RUST_LOG=debug cargo run --manifest-path apps/api/Cargo.toml
   ```

2. Verify database connection:

   ```bash
   ls -la *.db  # Check if database file exists
   ```

3. Check environment variables:
   ```bash
   ./scripts/validate-env.sh api
   ```

### React hydration mismatch

**Symptoms:**

```
Warning: Text content did not match
```

**Solutions:**

1. Ensure server/client rendering matches:
   - Check for `typeof window` checks
   - Use `useEffect` for client-only code
   - Add `suppressHydrationWarning` if intentional

2. Disable React Strict Mode temporarily:
   ```tsx
   // next.config.js
   module.exports = {
     reactStrictMode: false,
   };
   ```

### CORS errors in browser console

**Symptoms:**

```
Access to fetch at '...' has been blocked by CORS policy
```

**Solutions:**

1. Configure CORS in API:

   ```rust
   // apps/api/src/main.rs
   use tower_http::cors::CorsLayer;

   let cors = CorsLayer::new()
       .allow_origin("http://localhost:3000".parse().unwrap())
       .allow_methods(vec![Method::GET, Method::POST]);

   let app = Router::new()
       .layer(cors);
   ```

2. Use proxy in Next.js:
   ```javascript
   // next.config.js
   module.exports = {
     async rewrites() {
       return [
         {
           source: "/api/:path*",
           destination: "http://localhost:8080/api/:path*",
         },
       ];
     },
   };
   ```

---

## Performance Problems

### Low FPS in threat simulator

**Symptoms:**

- Frame rate drops below 30 FPS
- Stuttering animations

**Solutions:**

1. Reduce particle count:

   ```typescript
   // src/components/utils/particleSystem.ts
   MAX_PARTICLES = 500; // Reduce from 1000
   ```

2. Enable requestAnimationFrame gating:

   ```typescript
   useEffect(() => {
     if (document.hidden) return;
     // ... game loop
   }, []);
   ```

3. Profile performance:
   - Open Chrome DevTools → Performance tab
   - Record while interacting with simulator
   - Look for long-running tasks

### High memory usage

**Symptoms:**

- Browser tab crashes
- "Out of memory" errors

**Solutions:**

1. Clear threat trails periodically:

   ```typescript
   if (threat.trail.length > 20) {
     threat.trail = threat.trail.slice(-10);
   }
   ```

2. Remove old threats:

   ```typescript
   const currentTime = Date.now();
   threats = threats.filter(
     (t) => t.status === "active" || currentTime - t.neutralizedAt < 10000,
   );
   ```

3. Use Chrome Task Manager:
   - `Shift + Esc` → identify memory leaks

### Slow database queries

**Symptoms:**

- API requests take >5s
- Keeper service lag

**Solutions:**

1. Add indexes:

   ```sql
   CREATE INDEX idx_outbox_status ON outbox_jobs(status, next_attempt_ms);
   CREATE INDEX idx_tx_confirmed ON outbox_tx_refs(confirmed);
   ```

2. Analyze query plans:

   ```bash
   sqlite3 keeper.db
   EXPLAIN QUERY PLAN SELECT * FROM outbox_jobs WHERE status='queued';
   ```

3. Vacuum database:
   ```bash
   sqlite3 keeper.db "VACUUM;"
   ```

---

## Database Issues

### SQLite database locked

**Symptoms:**

```
Error: database is locked
```

**Solutions:**

1. Close other connections:

   ```bash
   lsof keeper.db  # See what's accessing the file
   ```

2. Increase busy timeout:

   ```rust
   // In SQLx connection code
   sqlx::sqlite::SqliteConnectOptions::new()
       .busy_timeout(Duration::from_secs(30))
   ```

3. Use WAL mode:
   ```sql
   PRAGMA journal_mode=WAL;
   ```

### Database corruption

**Symptoms:**

```
Error: database disk image is malformed
```

**Solutions:**

1. Try to recover:

   ```bash
   sqlite3 keeper.db ".recover" | sqlite3 keeper_recovered.db
   ```

2. Restore from backup:

   ```bash
   cp backup/keeper_YYYYMMDD.db keeper.db
   ```

3. Recreate from scratch:
   ```bash
   rm keeper.db
   cargo run --manifest-path apps/keeper/Cargo.toml
   ```

### Missing tables

**Symptoms:**

```
Error: no such table: outbox_jobs
```

**Solutions:**

1. Run schema initialization:

   ```rust
   // In keeper service
   phoenix_keeper::ensure_schema(&pool).await?;
   ```

2. Manual schema creation:
   ```bash
   sqlite3 keeper.db < schema.sql
   ```

---

## Blockchain Integration

### Solana RPC rate limiting

**Symptoms:**

```
Error: 429 Too Many Requests
```

**Solutions:**

1. Use paid RPC endpoint:

   ```bash
   export SOLANA_RPC_URL="https://your-paid-rpc.com"
   ```

2. Implement exponential backoff:

   ```rust
   let mut retries = 0;
   while retries < 5 {
       match rpc_call().await {
           Ok(res) => return Ok(res),
           Err(_) if retries < 4 => {
               tokio::time::sleep(Duration::from_secs(2u64.pow(retries))).await;
               retries += 1;
           }
           Err(e) => return Err(e),
       }
   }
   ```

3. Use multiple RPC endpoints with load balancing

### Transaction not confirming

**Symptoms:**

- Transaction stuck in "pending"
- No confirmation after 5 minutes

**Solutions:**

1. Check transaction status:

   ```bash
   solana confirm <TRANSACTION_SIGNATURE>
   ```

2. Increase commitment level:

   ```rust
   let commitment = CommitmentConfig::finalized();
   ```

3. Re-submit with higher priority fee

### Invalid address checksum

**Symptoms:**

```
Error: invalid checksum
```

**Solutions:**

1. Normalize address:

   ```rust
   use phoenix_address_validation::to_eip55_checksum;
   let normalized = to_eip55_checksum(address)?;
   ```

2. Validate before use:
   ```rust
   validate_evm_address(address, true)?;
   ```

---

## WASM Simulator

### WASM fails to load

**Symptoms:**

- Blank screen
- Console: "failed to fetch wasm"

**Solutions:**

1. Check MIME type:

   ```nginx
   # nginx.conf
   types {
       application/wasm wasm;
   }
   ```

2. Verify file exists:

   ```bash
   ls -la public/wasm/
   ```

3. Check browser console for specific error

### WASM renders outside container

**Symptoms:**

- Leptos app appears outside designated div
- Z-index issues

**Solutions:**

1. Use iframe isolation (already implemented):

   ```tsx
   <iframe src="/wasm-embed.html" />
   ```

2. Check CSS containment:
   ```css
   .wasm-container {
     contain: layout style paint;
   }
   ```

### WASM performance degradation

**Symptoms:**

- Starts fast, slows down over time
- Memory usage increases

**Solutions:**

1. Check for memory leaks in Rust code
2. Profile with Chrome DevTools → Memory tab
3. Implement periodic cleanup:
   ```rust
   if frame_count % 1000 == 0 {
       cleanup_old_objects();
   }
   ```

---

## Deployment Issues

### Netlify build fails

**Symptoms:**

- Build error in GitHub Actions
- Deployment never completes

**Solutions:**

1. Check build logs in Actions tab
2. Verify build command:

   ```toml
   # netlify.toml
   [build]
     command = "pnpm turbo build --filter=marketing"
     publish = "apps/marketing/out"
   ```

3. Check environment variables in Netlify dashboard

### Missing environment variables

**Symptoms:**

```
Error: NEXT_PUBLIC_API_URL is not defined
```

**Solutions:**

1. Set in Netlify dashboard:
   - Site Settings → Environment Variables
   - Add `NEXT_PUBLIC_API_URL=https://...`

2. Verify with validation script:
   ```bash
   ./scripts/validate-env.sh marketing
   ```

### 404 on deployed site

**Symptoms:**

- Routes work locally but 404 in production

**Solutions:**

1. Add `_redirects` file:

   ```
   /*    /index.html   200
   ```

2. For Next.js with `output: 'export'`:
   ```javascript
   // next.config.js
   module.exports = {
     output: "export",
     trailingSlash: true,
   };
   ```

---

## Testing Problems

### Tests fail intermittently

**Symptoms:**

- Tests pass locally but fail in CI
- Flaky tests

**Solutions:**

1. Add explicit waits:

   ```typescript
   await waitFor(() => expect(element).toBeInTheDocument());
   ```

2. Mock time-dependent code:

   ```typescript
   jest.useFakeTimers();
   ```

3. Increase timeout:
   ```typescript
   jest.setTimeout(10000);
   ```

### Playwright tests timeout

**Symptoms:**

```
Error: Timeout 30000ms exceeded
```

**Solutions:**

1. Increase timeout globally:

   ```typescript
   // playwright.config.ts
   export default defineConfig({
     timeout: 60000,
   });
   ```

2. Wait for specific elements:

   ```typescript
   await page.waitForSelector('[data-testid="loaded"]');
   ```

3. Run in headed mode to debug:
   ```bash
   pnpm playwright test --headed
   ```

---

## Getting Help

If you can't resolve your issue:

1. **Search existing issues**: Check GitHub Issues
2. **Ask in discussions**: Use GitHub Discussions
3. **Contact support**: engineering@phoenixrooivalk.com
4. **Check documentation**: https://docs.phoenixrooivalk.com

When asking for help, include:

- Error message (full stack trace)
- Steps to reproduce
- Environment (OS, Node version, Rust version)
- Relevant code snippets

---

_Last Updated: November 18, 2024_
