# Deployment Runbook

## Overview

This runbook describes the step-by-step process for deploying Phoenix Rooivalk
applications:

- Marketing (Next.js) → Netlify
- Documentation (Docusaurus) → Netlify
- API (Rust) → Containerized service / Kubernetes
- Keeper Service (Rust) → Background worker service

---

## Prerequisites

1. Access to GitHub repository
2. Netlify team access (marketing/docs)
3. Container registry access (API/Keeper)
4. Production environment credentials
5. Verified environment variable inventory (see `ENVIRONMENT_VALIDATION.md`)

---

## Change Management

1. Create feature branch: `git checkout -b feature/<description>`
2. Implement changes + tests
3. Open PR → Run CI checks
4. Obtain approvals (engineering lead + security if required)
5. Merge to `main`
6. Deployment pipeline triggers automatically

---

## Marketing Site Deployment (Netlify)

### Build Command

```bash
pnpm install
pnpm turbo build --filter=marketing
```

### Publish Directory

```
apps/marketing/out
```

### Environment Variables

| Variable               | Description            |
| ---------------------- | ---------------------- |
| `NEXT_PUBLIC_API_URL`  | Public API endpoint    |
| `NEXT_PUBLIC_DOCS_URL` | Documentation site URL |
| `NEXT_PUBLIC_WASM_URL` | Path to WASM bundle    |

### Manual Deployment Steps

1. Run build locally:
   ```bash
   pnpm install
   pnpm --filter marketing build
   ```
2. Verify output in `apps/marketing/out`
3. Deploy to Netlify:
   ```bash
   netlify deploy --dir=apps/marketing/out --prod
   ```

### Post-Deployment Checks

- [ ] Homepage loads (200 OK)
- [ ] WASM simulator loads successfully
- [ ] All links work (docs, contact)
- [ ] Lighthouse score > 90
- [ ] Analytics events firing

---

## Documentation Site Deployment (Netlify)

### Build Command

```bash
pnpm install
pnpm --filter docs build
```

### Publish Directory

```
apps/docs/build
```

### Environment Variables

| Variable        | Description                |
| --------------- | -------------------------- |
| `MARKETING_URL` | Backlink to marketing site |
| `DOCS_BASE_URL` | Custom domain base URL     |

### Manual Deployment

```bash
netlify deploy --dir=apps/docs/build --prod
```

### Post-Deployment Checklist

- [ ] Landing page renders
- [ ] Sidebar navigation works
- [ ] Search functionality operational
- [ ] No broken links (use `pnpm docs:check-links`)

---

## API Deployment (Rust + Containers)

### Build & Test

```bash
cargo fmt --all
cargo clippy --all-targets
cargo test --all
cargo build --release --manifest-path apps/api/Cargo.toml
```

### Docker Build

```Dockerfile
# apps/api/Dockerfile
FROM rust:1.82 as builder
WORKDIR /app
COPY . .
RUN cargo build --release --manifest-path apps/api/Cargo.toml

FROM debian:bookworm-slim
RUN useradd -m phoenix
WORKDIR /home/phoenix
COPY --from=builder /app/target/release/phoenix-api ./phoenix-api
COPY apps/api/Rocket.toml ./
USER phoenix
CMD ["./phoenix-api"]
```

### Deployment Targets

- Kubernetes (preferred)
- Systemd service (small deployments)
- Docker Compose (dev/staging)

### Environment Variables

| Variable            | Description                       |
| ------------------- | --------------------------------- |
| `DATABASE_URL`      | SQLite/Postgres connection string |
| `RUST_LOG`          | Logging level (info/debug)        |
| `SOLANA_RPC_URL`    | RPC endpoint                      |
| `ETHERLINK_RPC_URL` | RPC endpoint                      |
| `PORT`              | API port (default 8080)           |

### Kubernetes Deployment Example

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: phoenix-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: phoenix-api
  template:
    metadata:
      labels:
        app: phoenix-api
    spec:
      containers:
        - name: api
          image: registry.example.com/phoenix-api:latest
          ports:
            - containerPort: 8080
          envFrom:
            - secretRef:
                name: phoenix-api-secrets
          readinessProbe:
            httpGet:
              path: /health
              port: 8080
          livenessProbe:
            httpGet:
              path: /health
              port: 8080
```

### Post-Deployment Verification

- [ ] `/health` returns 200
- [ ] `/metrics` accessible (Prometheus)
- [ ] Evidence creation endpoint functional
- [ ] Anchoring job enqueued
- [ ] Logs show no errors

---

## Keeper Service Deployment

### Build & Test

```bash
cargo fmt --all
cargo clippy --all-targets
cargo test --manifest-path apps/keeper/Cargo.toml
cargo build --release --manifest-path apps/keeper/Cargo.toml
```

### Docker Build

```Dockerfile
# apps/keeper/Dockerfile
FROM rust:1.82 as builder
WORKDIR /app
COPY . .
RUN cargo build --release --manifest-path apps/keeper/Cargo.toml

FROM debian:bookworm-slim
RUN useradd -m keeper
WORKDIR /home/keeper
COPY --from=builder /app/target/release/phoenix-keeper ./phoenix-keeper
USER keeper
CMD ["./phoenix-keeper"]
```

### Systemd Service Example

```ini
# /etc/systemd/system/phoenix-keeper.service
[Unit]
Description=Phoenix Keeper Service
After=network.target

[Service]
User=phoenix
WorkingDirectory=/opt/phoenix
EnvironmentFile=/etc/phoenix/keeper.env
ExecStart=/opt/phoenix/phoenix-keeper --poll-interval 5000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### Environment Variables

| Variable            | Description      |
| ------------------- | ---------------- |
| `DATABASE_URL`      | SQLite file path |
| `SOLANA_RPC_URL`    | RPC endpoint     |
| `ETHERLINK_RPC_URL` | RPC endpoint     |
| `ANCHOR_BATCH_SIZE` | Jobs per cycle   |
| `POLL_INTERVAL_MS`  | Loop delay       |

### Post-Deployment Checklist

- [ ] Service running (`systemctl status phoenix-keeper`)
- [ ] Logs show job processing
- [ ] `outbox_jobs` queue decreases over time
- [ ] Blockchain confirmations recorded

---

## Rollback Procedure

### Marketing / Docs (Netlify)

1. Open Netlify dashboard
2. Go to Deploys tab
3. Click "Rollback" on previous successful deploy
4. Confirm and monitor logs

### API / Keeper (Kubernetes)

```bash
kubectl rollout undo deployment/phoenix-api
kubectl rollout undo deployment/phoenix-keeper
```

Verify rollback status:

```bash
kubectl rollout status deployment/phoenix-api
```

### API / Keeper (Systemd)

```bash
sudo systemctl stop phoenix-api
sudo cp releases/api-previous/phoenix-api /opt/phoenix/phoenix-api
sudo systemctl start phoenix-api
```

### Database Rollback

1. Restore backup:
   ```bash
   cp backups/keeper_YYYYMMDD.db keeper.db
   ```
2. Verify integrity:
   ```bash
   sqlite3 keeper.db "PRAGMA integrity_check;"
   ```

---

## Monitoring & Alerts

| Component | Metric          | Threshold | Action                                      |
| --------- | --------------- | --------- | ------------------------------------------- |
| API       | Error rate      | >1%       | Investigate logs, roll back if needed       |
| API       | p95 latency     | >250ms    | Scale up pods, analyze slow queries         |
| Keeper    | Pending jobs    | >500      | Increase worker count, check blockchain RPC |
| Keeper    | Confirm pending | >100      | Investigate blockchain connectivity         |
| Marketing | Uptime          | <99.9%    | Check Netlify status, redeploy              |

---

## Incident Response

1. Identify issue and severity
2. Page on-call engineer (PagerDuty/Slack)
3. Capture logs, metrics, error messages
4. Mitigate impact (scale, restart, rollback)
5. Post-incident report within 24h

Incident log template:

```
### Incident Report - YYYY-MM-DD

**Summary:**

**Timeline:**
- 10:05 - Alert triggered
- 10:10 - Engineer notified

**Impact:**

**Root Cause:**

**Resolution:**

**Follow-up Actions:**
```

---

## Manual Runbook Commands

### Validate Environment

```bash
./scripts/validate-env.sh marketing
./scripts/validate-env.sh docs
./scripts/validate-env.sh api
./scripts/validate-env.sh keeper
```

### Seed Keeper Database

```bash
cargo run --manifest-path apps/keeper/Cargo.toml -- --seed 10
```

### Trigger Anchoring

```bash
curl -X POST https://api.phoenixrooivalk.com/api/anchor/<ID>
```

---

## Appendices

### Checklist

- [ ] Code merged to main
- [ ] CI passed (unit, integration, E2E)
- [ ] Docs updated (if necessary)
- [ ] Release notes prepared
- [ ] Environment variables verified
- [ ] Backups verified
- [ ] Monitoring dashboards updated

### Contacts

| Role             | Contact                      |
| ---------------- | ---------------------------- |
| Engineering Lead | eng-lead@phoenixrooivalk.com |
| DevOps           | devops@phoenixrooivalk.com   |
| Security         | security@phoenixrooivalk.com |
| Product Owner    | product@phoenixrooivalk.com  |

---

_Last Updated: November 18, 2024_
