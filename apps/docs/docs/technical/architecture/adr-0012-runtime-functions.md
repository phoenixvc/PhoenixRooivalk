---
id: adr-0012-runtime-functions
title: "ADR 0012: Runtime Functions Architecture"
sidebar_label: "ADR 0012: Runtime Functions"
difficulty: expert
estimated_reading_time: 8
points: 40
tags:
  - technical
  - architecture
  - ai
  - rag
  - firebase
  - azure
prerequisites:
  - adr-0011-vector-database-selection
---

# ADR 0012: Runtime Functions Architecture (rFunctions)

**Date**: 2025-11-27  
**Status**: Accepted (Firebase Cloud Functions)

---

## Executive Summary

1. **Problem**: Need a runtime layer to orchestrate RAG search + AI inference across Firebase and Azure
2. **Decision**: Firebase Cloud Functions as the runtime orchestrator with Azure as inference backend
3. **Trade-off**: Cross-cloud latency (+50-150ms) is acceptable for RAG UX; Firebase provides tighter Firestore integration

---

## Context

The Phoenix Rooivalk documentation site requires a runtime layer that:

- Receives user queries from the React frontend
- Orchestrates vector search (Azure AI Search)
- Injects context into LLM calls (Azure OpenAI)
- Returns responses with source citations
- Handles rate limiting, caching, and monitoring

### Current Architecture

```
React (Browser)
    │
    ▼
Firebase Cloud Functions (Node.js)
    │
    ├──▶ Azure AI Search (vector query)
    │
    └──▶ Azure OpenAI (chat completion)
    │
    ▼
Firebase Firestore (cache, logs, usage)
```

### Key Constraints

- **Existing stack**: Firebase for auth, hosting, and Firestore
- **Azure investment**: AI models already deployed (gpt-4o, gpt-5, text-embedding-3-small)
- **Latency budget**: 500-2000ms for thoughtful RAG responses
- **Cold starts**: Acceptable for documentation use case (not real-time gaming)

---

## Decision

**Retain Firebase Cloud Functions** as the runtime orchestrator for RAG and AI services.

---

## Options Considered

### Option 1: Firebase Cloud Functions (Current) ✅ Selected

| Aspect | Details |
|--------|---------|
| **Runtime** | Node.js 20 |
| **Cold start** | ~500-1500ms |
| **Warm latency** | ~20-50ms per invocation |
| **Integration** | Native Firestore, Auth, Hosting |
| **Scaling** | Automatic (0 to 1000 instances) |
| **Cost** | 2M free invocations/month |

**Pros**:
- Already deployed and functional
- Native Firestore integration for caching/logging
- Native Firebase Auth for user context
- Same deployment as existing functions

**Cons**:
- Cross-cloud calls to Azure (latency)
- Cold starts can be slow
- Node.js (not Rust) for compute-heavy tasks

---

### Option 2: Azure Functions

| Aspect | Details |
|--------|---------|
| **Runtime** | Node.js, Python, C#, etc. |
| **Cold start** | ~500-2000ms (consumption tier) |
| **Integration** | Native with Azure AI services |
| **Scaling** | Automatic or Premium (pre-warmed) |

**Pros**:
- Same cloud as AI models (eliminates cross-cloud hop)
- Premium tier eliminates cold starts
- Tighter Azure AI Search/OpenAI integration

**Cons**:
- Lose Firebase Firestore native integration
- Split runtime between Firebase and Azure
- Additional complexity in deployment
- Must implement Firebase Auth verification

---

### Option 3: Cloudflare Workers

| Aspect | Details |
|--------|---------|
| **Runtime** | V8 isolates (JavaScript/WASM) |
| **Cold start** | ~0ms (always-warm) |
| **Latency** | Edge-deployed, lowest latency |
| **Integration** | D1 (SQLite), KV, Durable Objects |

**Pros**:
- Zero cold starts
- Edge deployment for global low latency
- Workers AI for inference (if models available)

**Cons**:
- No native Firestore integration
- Must implement all caching manually
- Limited to V8 runtime (no native modules)
- Separate deployment pipeline

---

### Option 4: Hybrid (Firebase + Azure Functions)

Split workloads:
- Firebase: Auth, Firestore ops, simple queries
- Azure: AI-heavy operations, vector search

**Pros**:
- Each function runs on optimal platform

**Cons**:
- Complex deployment and debugging
- Inter-function calls add latency
- Split logging and monitoring

---

## Rationale

### Why Firebase Functions (Not Azure Functions)?

| Factor | Firebase | Azure | Winner |
|--------|----------|-------|--------|
| **Firestore integration** | Native | SDK needed | Firebase |
| **Firebase Auth** | Native | Verify manually | Firebase |
| **Cross-cloud latency** | +50-150ms to Azure | 0ms | Azure |
| **Existing deployment** | ✅ Deployed | New setup | Firebase |
| **Cold starts** | Acceptable | Similar | Tie |
| **Monitoring** | Firebase Console | Azure Monitor | Tie |

**Decision**: The +50-150ms latency to Azure is acceptable within our 500-2000ms RAG budget. Migrating to Azure Functions would require:
- Re-implementing Firebase Auth verification
- Setting up Firestore SDK connections
- New deployment pipeline
- Split monitoring between consoles

The operational cost exceeds the latency benefit.

---

### Cross-Cloud Call Chain Analysis

```
React
  │ (20-50ms)
  ▼
Firebase Functions
  │ (30-80ms) ← Cross-cloud hop #1
  ▼
Azure AI Search
  │ (5-15ms)
  ▼
Azure OpenAI
  │ (200-2000ms) ← LLM inference
  ▼
Firebase Functions
  │ (30-80ms) ← Return hop
  ▼
React
```

**Total P50**: ~350ms  
**Total P99**: ~2500ms  

**Acceptable**: RAG users expect "thinking" time. Sub-3s is good UX for documentation queries.

---

## Consequences

### Positive

- **Zero migration cost**: Already deployed
- **Native Firestore**: Caching, logging, rate limiting
- **Native Firebase Auth**: User context in every request
- **Single console**: All Firebase services in one place
- **Free tier**: 2M invocations/month covers documentation use

### Negative

- **Cross-cloud latency**: +50-150ms P99 per Azure call
- **Cold starts**: ~500-1500ms on first request after idle
- **Debugging complexity**: Logs split between Firebase and Azure
- **Vendor lock-in**: Firebase Functions API is Firebase-specific

### Failure Isolation

If Firebase Functions fail:
- **Impact**: Entire AI/RAG system unavailable
- **Mitigation**: 
  - Firebase has 99.95% SLA
  - Static documentation still available (Docusaurus)
  - Error page with "AI temporarily unavailable" message

If Azure AI Search fails:
- **Impact**: Vector search unavailable
- **Fallback**: Keyword-only search via Firestore
- **Mitigation**: Cached query results in Firestore

If Azure OpenAI fails:
- **Impact**: No AI responses
- **Fallback**: Return search results without AI summary
- **Mitigation**: Model fallback (gpt-4o → gpt-5-nano)

---

## Operational Requirements

### Cold Start Mitigation

```typescript
// Scheduled function to keep instances warm
export const keepWarm = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async () => {
    // Minimal invocation to prevent cold start
    await admin.firestore().collection('_warmup').doc('ping').set({
      timestamp: Date.now()
    });
  });
```

### Circuit Breaker Pattern

```typescript
const circuitBreaker = {
  failures: 0,
  lastFailure: 0,
  threshold: 5,
  resetTimeout: 60000, // 1 minute
  
  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.isOpen()) {
      throw new Error('Circuit breaker open');
    }
    try {
      const result = await fn();
      this.reset();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }
};
```

### Rate Limiting

- **Per-user**: 50 RAG queries/hour
- **Global**: 10,000 queries/hour
- **Enforcement**: Firestore counters with TTL

---

## Security Considerations

### Authentication Flow

```
Browser (Firebase Auth token)
    │
    ▼
Firebase Functions (verify token automatically)
    │
    ├──▶ Extract user ID, roles from token
    │
    └──▶ Apply rate limits per user
    │
    ▼
Azure (API key in Cloud Functions config)
```

### Secret Management

| Secret | Storage | Access |
|--------|---------|--------|
| Azure AI Search key | Firebase Config | `functions.config().azure.search_key` |
| Azure OpenAI key | Firebase Config | `functions.config().azure.openai_key` |
| Firebase Admin | Auto-injected | `admin.initializeApp()` |

**Rotation**: Secrets rotated via `firebase functions:config:set`

---

## Monitoring & Observability

### Metrics Tracked

| Metric | Source | Alert Threshold |
|--------|--------|-----------------|
| Function latency | Firebase Console | P99 > 5s |
| Error rate | Firebase Console | > 5% |
| Cold starts | Firebase Console | > 20% |
| Azure Search latency | Custom logging | P99 > 500ms |
| Token usage | Custom Firestore | > 100K/day |

### Logging Strategy

```typescript
// Structured logging for distributed tracing
logger.info('RAG query', {
  userId: context.auth?.uid,
  queryId: uuidv4(),
  step: 'azure_search',
  latencyMs: 45,
  resultCount: 5
});
```

---

## Migration Path (If Needed)

### To Azure Functions

1. Create Azure Functions project
2. Port function logic
3. Implement Firebase Auth verification
4. Set up Firestore SDK connection
5. Deploy and test in parallel
6. Switch DNS/routing
7. Deprecate Firebase functions

**Effort**: 2-3 weeks  
**Risk**: Medium (auth verification complexity)

### To Cloudflare Workers

1. Create Workers project
2. Implement D1/KV for caching
3. Implement auth verification
4. Port function logic to V8-compatible code
5. Deploy and test in parallel
6. Switch routing

**Effort**: 3-4 weeks  
**Risk**: High (V8 runtime limitations)

---

## Appendix

For detailed weighted analysis, benchmarks, and cost projections, see:
- [ADR 0012 Appendix: Runtime Functions Weighted Analysis](./adr-0012-appendix-runtime-functions-analysis.md)

---

## Related ADRs

- [ADR 0006: AI/ML Architecture](./architecture-decision-records#adr-0006-aiml-architecture)
- [ADR 0011: Vector Database Selection](./adr-0011-vector-database-selection.md)
- [ADR 0013: Identity & Auth Strategy](./adr-0013-identity-auth.md)
- [ADR 0014: Service-to-Service Auth](./adr-0014-service-auth.md)

---

_© 2025 Phoenix Rooivalk. Confidential._
