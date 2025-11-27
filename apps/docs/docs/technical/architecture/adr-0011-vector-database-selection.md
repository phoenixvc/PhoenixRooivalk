---
id: adr-0011-vector-database-selection
title: "ADR 0011: Vector Database Selection for RAG"
sidebar_label: "ADR 0011: Vector Database"
difficulty: expert
estimated_reading_time: 5
points: 40
tags:
  - technical
  - architecture
  - ai
  - rag
  - vector-database
prerequisites:
  - rag-implementation
---

# ADR 0011: Vector Database Selection for RAG

**Date**: 2025-11-27  
**Status**: Accepted (Azure AI Search)  
**Appendix**: [Full Analysis & Comparison](./adr-0011-appendix-vector-db-analysis.md)

---

## Executive Summary

1. **Problem**: Current O(n) Firestore similarity search doesn't scale beyond ~500 documents
2. **Decision**: Azure AI Search provides sub-10ms vector search at **$0 cost** (covered by existing Azure credits)
3. **Trade-off**: Deeper Azure vendor commitment is acceptable given our Azure-native AI strategy

---

## Context

The Phoenix Rooivalk documentation site uses RAG for AI-powered assistance. Current in-memory cosine similarity over Firestore embeddings has O(n) complexity—unsustainable beyond a few hundred documents.

**Scale**: ~107 docs, ~500-1K chunks, 100-500 queries/day, growing to 1K docs over 2 years.

**Key constraint**: We have **free Azure Foundry credits** and already host AI models there (gpt-4o, gpt-5, text-embedding-3-small).

---

## Decision

**Adopt Azure AI Search** as the vector database for RAG.

---

## Rationale (Top 3 Factors)

| Factor | Why Azure AI Search Wins |
|--------|--------------------------|
| **Cost** | $0 with Azure credits (Basic tier ~$74/mo covered) |
| **Performance** | HNSW algorithm: sub-10ms queries vs O(n) flat scan |
| **Hybrid Search** | Only option with native keyword + semantic in one query |

**Final Score**: Azure AI Search scored **93%** in weighted evaluation (10 criteria, 7 options compared).

See [Appendix: Weighted Decision Matrix](./adr-0011-appendix-vector-db-analysis.md#weighted-decision-matrix) for full scoring.

---

## Alternatives Rejected

| Option | Why Not |
|--------|---------|
| Firebase Vector Search | Pre-GA, flat index only, no hybrid search |
| Pinecone | Additional vendor, separate billing, no cost advantage |
| Qdrant (self-hosted) | Operational overhead, no hybrid search |
| Current In-Memory | O(n) doesn't scale |

See [Appendix: Azure Deployment Alternatives](./adr-0011-appendix-vector-db-analysis.md#azure-deployment-alternatives) for 7 Azure-specific options evaluated.

---

## Consequences

### Positive
- **Zero cost** (covered by credits)
- **Sub-10ms queries** at scale
- **Unified platform** with existing AI models
- **Production-ready** (GA with enterprise SLA)

### Negative
- **Vendor consolidation**: Deeper Azure commitment (embeddings, indexes, metrics, gateway)
- **Cross-cloud latency**: Firebase → Azure adds +50-150ms P99 per query
- **Fallback is partial**: If Azure fails, fallback is keyword-only (no vector search)

---

## Long-Term Strategic Impact

### Vendor Lock-in Reality

This decision anchors the following to Azure:
- Embeddings storage
- Vector indexes
- Metrics and logs
- AI gateway

**Mitigation**:
- Store vectors in neutral format (JSON with float32 arrays)
- Abstract access behind `SearchAdapter` interface
- Maintain ability to export embeddings

### Cost If Credits Expire

| Year | Monthly Cost | Annual |
|------|--------------|--------|
| 2025-2026 | $0 (credits) | $0 |
| 2027+ | ~$74 (Basic) | ~$888 |

### Operational SLO Targets

- **p95 search latency**: < 300ms end-to-end
- **p99 system availability**: > 99.5%

---

## Cross-Cloud Performance Note

Runtime flow: `React → Firebase Functions → Azure AI Search → Azure OpenAI → back`

This introduces:
- Two network hops
- One cross-cloud boundary
- +50-150ms P99 latency (acceptable given 500-1000ms RAG UX budget)

Cold-starts on Firebase Functions may compound this on initial requests.

---

## Implementation

```
┌─────────────────────────────────────────────────────────┐
│              Build Pipeline (GitHub Actions)             │
│  Docusaurus ──▶ RAG Indexer Plugin ──▶ Azure AI Search  │
└─────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────┐
│                    Runtime (User Query)                  │
│  AI Panel ──▶ Firebase Functions ──▶ Azure AI Search    │
│                        │                │               │
│                        ▼                ▼               │
│                   Azure OpenAI (context injection)      │
└─────────────────────────────────────────────────────────┘
```

---

## Related ADRs

- [ADR 0006: AI/ML Architecture](./architecture-decision-records#adr-0006-aiml-architecture)
- [ADR 0012: Runtime Functions Architecture](./adr-0012-runtime-functions.md)
- [ADR 0013: Identity & Auth Strategy](./adr-0013-identity-auth.md)
- [ADR D003: Rust for Backend Services](./architecture-decision-records#adr-d003-rust-for-backend-services)

---

_© 2025 Phoenix Rooivalk. Confidential._
