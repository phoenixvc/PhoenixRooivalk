# Performance Benchmarking Guide

## Objectives

- Maintain 60 FPS in threat simulator under heavy load
- Keep API latency below 100ms p95
- Ensure keeper processes 100 anchoring jobs/minute
- Maintain memory usage < 512MB for frontend and < 256MB for Rust services

## Key Metrics

| Component | Metric | Target | Tool |
|-----------|--------|--------|------|
| Threat Simulator | Frame Rate | 60 FPS | Chrome DevTools, FPS meter |
| Threat Simulator | Input Latency | < 100ms | Chrome Performance profiler |
| API | p95 Latency | < 100ms | k6, wrk |
| API | Throughput | 1000 req/s | k6, wrk |
| Keeper | Job Throughput | 100 jobs/min | Custom metrics, Prometheus |
| Keeper | Confirmation Latency | < 5 min | Prometheus, Grafana |
| WASM Bundle | Load Time | < 1s on broadband | Lighthouse, WebPageTest |
| Next.js | LCP | < 1.5s | Lighthouse |
| Next.js | CLS | < 0.1 | Lighthouse |
| Database | Query Latency | < 10ms p99 | sqlite-analyzer |

## Benchmark Environments

### Frontend (Next.js + WASM)

- Chrome 121+ (desktop)  
- Safari 17+ (desktop)  
- Edge 121+  
- iPadOS Safari 17+  
- Android Chrome 120+

### Backend (Rust Services)

- Ubuntu 22.04 LTS  
- 4 vCPU, 8GB RAM  
- Fast NVMe storage  
- SQLite WAL mode enabled

## Benchmark Scenarios

### Threat Simulator Stress Test

1. **Baseline**: No threats, idle state  
2. **Medium Load**: 25 simultaneous threats, no swarms  
3. **High Load**: 100 threats, 3 swarms, multiple particle systems  
4. **Extreme Load**: 200 threats, 5 swarms, max particle effects

**Procedure:**
- Use deterministic seed for threat spawning
- Record FPS (Chrome DevTools > Rendering > FPS Meter)
- Record CPU/GPU usage (Chrome Task Manager)
- Capture performance trace (Performance tab)

**Metrics:**
- Average FPS  
- Frame time (ms)  
- CPU usage (%)  
- GPU memory usage  
- JS heap size

### WASM Load Performance

1. Measure initial load time with network throttling:  
   - Good 3G (1.6Mbps)  
   - 4G (9Mbps)  
   - WiFi (30Mbps)

2. Use Lighthouse CLI:  
   ```bash
   lighthouse https://phoenixrooivalk.netlify.app --view
   ```

3. Metrics:  
   - Time to First Byte (TTFB)  
   - Time to Interactive (TTI)  
   - Total Blocking Time (TBT)  
   - Largest Contentful Paint (LCP)

### API Throughput Test

Use k6 script (`tests/load/api-load-test.js`):

```bash
k6 run tests/load/api-load-test.js
```

**Scenarios:**
- 100 VUs for 30s  
- 500 VUs for 60s  
- Spike test: 1000 VUs for 10s  
- Soak test: 200 VUs for 30 minutes

**Metrics:**
- p50, p90, p95, p99 latency  
- Error rate  
- Throughput (req/s)  
- CPU/memory usage (Prometheus)

### Keeper Job Throughput

1. Seed database with 1000 queued jobs
2. Run keeper with instrumentation
3. Track `jobs_processed_total` metric
4. Measure time to process entire queue

**Expected:** 100 jobs/minute sustained throughput

### Database Performance

1. Use sqlite-analyzer:  
   ```bash
   sqlite3 keeper.db "ANALYZE;"  
   sqlite3 keeper.db "EXPLAIN QUERY PLAN SELECT ..."  
   ```

2. Metrics:  
   - Query execution time (ms)  
   - Cache hits vs misses  
   - Lock contention  
   - WAL checkpoint frequency

### Memory Profiling

#### React App

1. Chrome DevTools > Memory tab  
2. Take heap snapshot after:  
   - Initial load  
   - 10 minutes of gameplay  
   - Closing/reopening modals  
   - Swarm spawn/clear cycles

3. Compare node count, retained size

#### Rust Services

1. Use `valgrind` or `heaptrack`:  
   ```bash
   heaptrack cargo run --manifest-path apps/keeper/Cargo.toml
   ```

2. Monitor with `ps` or `htop` via PID

## Regression Benchmarks

Automate benchmarks in CI (optional):

```yaml
name: performance

on:
  workflow_dispatch

jobs:
  benchmark:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test:performance
```

## Optimization Checklist

- [ ] Memoize expensive computations (`useMemo`, `useCallback`)  
- [ ] Use `requestIdleCallback` for non-critical work  
- [ ] Pool DOM nodes for frequently created/destructed elements  
- [ ] Batch state updates (React 18 automatic batching)  
- [ ] Offload heavy work to Web Workers  
- [ ] Use `transform` instead of `top/left` for animations  
- [ ] Avoid large object allocations per frame  
- [ ] Reuse canvas contexts and WebGL resources  
- [ ] Stream JSON/NDJSON data instead of full payloads  
- [ ] Enable HTTP/2 for API + assets

## Reporting Template

```
## Performance Report - YYYY-MM-DD

### Threat Simulator
- Average FPS:
- Min FPS:
- Max FPS:
- CPU Usage:
- Memory Usage:

### API Benchmark (k6)
- p50 latency:
- p95 latency:
- Error rate:
- Throughput:

### WASM Load Metrics
- Bundle size:
- TTI:
- LCP:

### Keeper Throughput
- Jobs processed per minute:
- Average confirmation time:

### Notes
- Observations:
- Regression vs last benchmark:
- Action items:
```

## Tools & References

- Chrome DevTools Performance Profiler  
- Firefox Performance Tools  
- Safari Web Inspector  
- k6 Load Testing  
- wrk HTTP benchmarking  
- Criterion.rs for Rust benchmarks  
- Lighthouse CLI  
- WebPageTest.org  
- sqlite-analyzer  
- Prometheus + Grafana dashboards

---

*Last Updated: November 18, 2024*
