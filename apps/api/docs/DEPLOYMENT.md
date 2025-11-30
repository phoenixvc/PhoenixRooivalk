# Phoenix Rooivalk Deployment Guide

## Architecture Overview

The system consists of three main components:

- **API** (`apps/api`): HTTP endpoints for evidence submission and status
  queries
- **Keeper** (`apps/keeper`): Background worker for evidence anchoring and
  confirmation polling
- **Database**: SQLite (development) or PostgreSQL (production)

## Development Setup

### Prerequisites

- Rust 1.70+
- Node.js 20+
- pnpm

### Local Development

```bash
# Install dependencies
pnpm install
cargo build --workspace

# Start services (separate terminals)
KEEPER_DB_URL=sqlite://blockchain_outbox.sqlite3 cargo run -p phoenix-keeper
API_DB_URL=sqlite://blockchain_outbox.sqlite3 cargo run -p phoenix-api

# Test the system
curl -X POST http://localhost:8080/evidence \
  -H "Content-Type: application/json" \
  -d '{"digest_hex":"deadbeef..."}'
```

## Production Deployment

### Environment Variables

#### Database

```bash
# PostgreSQL (recommended for production)
KEEPER_DB_URL=postgresql://user:pass@host:5432/phoenix_db
API_DB_URL=postgresql://user:pass@host:5432/phoenix_db

# SQLite (development only)
KEEPER_DB_URL=sqlite://blockchain_outbox.sqlite3
API_DB_URL=sqlite://blockchain_outbox.sqlite3
```

#### Keeper Configuration

```bash
# Provider selection
KEEPER_PROVIDER=etherlink  # or 'solana', 'multi', 'stub'

# Etherlink configuration
ETHERLINK_ENDPOINT=https://node.ghostnet.etherlink.com
ETHERLINK_NETWORK=ghostnet
ETHERLINK_PRIVATE_KEY=0x...  # Optional, for signing transactions

# Solana configuration
SOLANA_ENDPOINT=https://api.devnet.solana.com
SOLANA_NETWORK=devnet

# Polling intervals
KEEPER_POLL_MS=5000           # Job polling (default: 5s)
KEEPER_CONFIRM_POLL_MS=30000  # Confirmation polling (default: 30s)

# HTTP server
KEEPER_HTTP_PORT=8081
```

#### API Configuration

```bash
PORT=8080  # API server port
```

#### Logging

```bash
RUST_LOG=info  # or debug, warn, error
```

### Multi-Chain Configuration

For multi-chain anchoring, set `KEEPER_PROVIDER=multi` and configure both
chains:

```bash
KEEPER_PROVIDER=multi
ETHERLINK_ENDPOINT=https://node.ghostnet.etherlink.com
ETHERLINK_NETWORK=ghostnet
SOLANA_ENDPOINT=https://api.devnet.solana.com
SOLANA_NETWORK=devnet
```

### Database Schema

The system automatically creates required tables:

```sql
-- Evidence jobs with exponential backoff
CREATE TABLE outbox_jobs (
    id TEXT PRIMARY KEY,
    payload_sha256 TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued',
    attempts INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    created_ms INTEGER NOT NULL,
    updated_ms INTEGER NOT NULL,
    next_attempt_ms INTEGER NOT NULL DEFAULT 0
);

-- Transaction references for audit trail
CREATE TABLE outbox_tx_refs (
    job_id TEXT NOT NULL,
    network TEXT NOT NULL,
    chain TEXT NOT NULL,
    tx_id TEXT NOT NULL,
    confirmed INTEGER NOT NULL,
    timestamp INTEGER,
    PRIMARY KEY (job_id, network, chain)
);
```

### Docker Deployment

#### API Service

```dockerfile
FROM rust:1.70 as builder
WORKDIR /app
COPY . .
RUN cargo build --release -p phoenix-api

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/target/release/phoenix-api /usr/local/bin/
EXPOSE 8080
CMD ["phoenix-api"]
```

#### Keeper Service

```dockerfile
FROM rust:1.70 as builder
WORKDIR /app
COPY . .
RUN cargo build --release -p phoenix-keeper

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/target/release/phoenix-keeper /usr/local/bin/
EXPOSE 8081
CMD ["phoenix-keeper"]
```

#### Docker Compose

```yaml
version: "3.8"
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: phoenix_db
      POSTGRES_USER: phoenix
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  api:
    build:
      context: .
      dockerfile: Dockerfile.api
    environment:
      API_DB_URL: postgresql://phoenix:secure_password@postgres:5432/phoenix_db
      PORT: 8080
      RUST_LOG: info
    ports:
      - "8080:8080"
    depends_on:
      - postgres

  keeper:
    build:
      context: .
      dockerfile: Dockerfile.keeper
    environment:
      KEEPER_DB_URL: postgresql://phoenix:secure_password@postgres:5432/phoenix_db
      KEEPER_PROVIDER: etherlink
      ETHERLINK_ENDPOINT: https://node.ghostnet.etherlink.com
      ETHERLINK_NETWORK: ghostnet
      RUST_LOG: info
    ports:
      - "8081:8081"
    depends_on:
      - postgres

volumes:
  postgres_data:
```

### Kubernetes Deployment

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
          image: phoenix-api:latest
          ports:
            - containerPort: 8080
          env:
            - name: API_DB_URL
              valueFrom:
                secretKeyRef:
                  name: phoenix-secrets
                  key: database-url
            - name: RUST_LOG
              value: "info"

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: phoenix-keeper
spec:
  replicas: 2 # Multiple keepers for redundancy
  selector:
    matchLabels:
      app: phoenix-keeper
  template:
    metadata:
      labels:
        app: phoenix-keeper
    spec:
      containers:
        - name: keeper
          image: phoenix-keeper:latest
          ports:
            - containerPort: 8081
          env:
            - name: KEEPER_DB_URL
              valueFrom:
                secretKeyRef:
                  name: phoenix-secrets
                  key: database-url
            - name: KEEPER_PROVIDER
              value: "etherlink"
            - name: ETHERLINK_ENDPOINT
              value: "https://node.ghostnet.etherlink.com"
            - name: RUST_LOG
              value: "info"
```

### Monitoring and Observability

#### Health Checks

- API: `GET /health` (port 8080)
- Keeper: `GET /health` (port 8081)

#### Metrics

Both services emit structured logs with tracing. Key metrics to monitor:

- Job processing rate
- Confirmation success rate
- Database connection health
- RPC endpoint availability

#### Alerting

Set up alerts for:

- High job failure rate
- Confirmation delays
- Database connectivity issues
- Memory/CPU usage

### Security Considerations

1. **Private Keys**: Store in secure key management (AWS KMS, HashiCorp Vault)
2. **Database**: Use connection pooling and SSL
3. **Network**: Deploy behind load balancer with TLS termination
4. **Secrets**: Use Kubernetes secrets or environment-specific secret management

### Scaling

#### Horizontal Scaling

- **API**: Stateless, can scale horizontally behind load balancer
- **Keeper**: Multiple instances supported with PostgreSQL (job locking prevents
  conflicts)

#### Vertical Scaling

- Monitor memory usage (primarily from HTTP clients and DB connections)
- CPU usage scales with job processing volume

### Backup and Recovery

#### Database Backups

```bash
# PostgreSQL
pg_dump phoenix_db > backup.sql

# Restore
psql phoenix_db < backup.sql
```

#### Disaster Recovery

- Evidence jobs are idempotent (safe to retry)
- Transaction references provide audit trail
- Failed jobs automatically retry with exponential backoff

### Performance Tuning

#### Database

- Index on `(status, next_attempt_ms)` for job selection
- Index on `(confirmed)` for confirmation polling
- Connection pooling (5-10 connections per service)

#### Network

- Configure HTTP client timeouts (30s default)
- Use connection pooling for RPC endpoints
- Monitor rate limits on blockchain RPCs

### Troubleshooting

#### Common Issues

1. **Jobs stuck in 'queued'**: Check keeper logs and RPC connectivity
2. **High confirmation delays**: Verify blockchain network status
3. **Database locks**: Ensure PostgreSQL for multi-keeper deployments
4. **Memory leaks**: Monitor HTTP client connection pools

#### Debug Commands

```bash
# Check job status
curl http://localhost:8080/evidence/{job_id}

# View keeper health
curl http://localhost:8081/health

# Database queries
SELECT status, COUNT(*) FROM outbox_jobs GROUP BY status;
SELECT confirmed, COUNT(*) FROM outbox_tx_refs GROUP BY confirmed;
```
