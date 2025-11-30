---
id: adr-0011-appendix-vector-db-analysis
title: "ADR 0011 Appendix: Vector Database Analysis"
sidebar_label: "ADR 0011 Appendix"
difficulty: expert
estimated_reading_time: 20
points: 30
tags:
  - technical
  - architecture
  - ai
  - rag
  - vector-database
  - appendix
prerequisites:
  - adr-0011-vector-database-selection
---

# ADR 0011 Appendix: Vector Database Analysis

**Supporting Analysis for
[ADR 0011: Vector Database Selection](./adr-0011-vector-database-selection.md)**

This appendix contains the detailed technical analysis, cost models, and
comparison data that informed the vector database decision.

---

## Table of Contents

1. [Scale Assessment](#scale-assessment)
2. [Options Evaluated](#options-evaluated)
3. [Weighted Decision Matrix](#weighted-decision-matrix)
4. [Azure Deployment Alternatives](#azure-deployment-alternatives)
5. [Cost Model (2-Year Projection)](#cost-model-2-year-projection)
6. [Performance Benchmarks](#performance-benchmarks)
7. [Why Hybrid Search Matters](#why-hybrid-search-matters)
8. [Feature Comparison](#feature-comparison)
9. [Risk Assessment](#risk-assessment)
10. [Export Strategy](#export-strategy)

---

## Scale Assessment

### Current State

| Metric              | Value                          |
| ------------------- | ------------------------------ |
| Documentation files | ~107                           |
| Total words         | ~208,000                       |
| Estimated chunks    | 500-1,000 (at 500 tokens each) |
| Expected queries    | 100-500/day initially          |
| Growth projection   | Up to 1,000 docs over 2 years  |

### Corpus Characteristics

- **Content type**: Technical documentation, architecture guides, API references
- **Versioning**: Multiple versions of documents may exist
- **Categories**: Technical, Business, Operations, Tutorials
- **Update frequency**: ~10-20 docs/month

---

## Options Evaluated

### Option 1: Azure AI Search

**Overview**: Enterprise-grade cognitive search service with native vector
search, part of Azure AI Foundry.

**Capabilities**:

- Vector similarity search with KNN and HNSW algorithms
- Hybrid search (keyword + semantic in same query)
- Multimodal & multilingual support
- Filtered vector search with metadata
- Advanced compression (up to 92.5% storage reduction)
- Enterprise-grade security (HSM, customer-managed keys)
- Semantic ranking and reranking

**Pricing** (November 2025): | Tier | Storage | Indexes | Cost/Month |
|------|---------|---------|------------| | Free | 50 MB | 3 | $0 | | Basic | 15
GB | 15 | ~$74 | | Standard S1 | 160 GB | 50 | ~$245 | | Standard S2 | 512 GB |
200 | ~$980 | | Standard S3 | 2 TB | 200 | ~$1,960 |

**With Azure Foundry credits**: Effectively $0 for our usage

---

### Option 2: Firebase Vector Search Extension

**Overview**: Firebase extension using Firestore for vector storage with native
KNN search.

**Capabilities**:

- Native Firestore integration with automatic indexing
- Cosine similarity and Euclidean distance metrics
- Maximum vector dimension: 2048
- Flat index type only (no HNSW/ANN algorithms)
- Trigger-based embedding generation via Vertex AI/Gemini

**Pricing**:

- Requires Blaze (pay-as-you-go) plan
- ~$0.01/month base extension cost
- $0.03/100K document reads (after free tier)
- Free tier: 1 GiB storage, 50K reads/day, 20K writes/day

**Limitations**:

- Preview/Beta status (Pre-GA in November 2025)
- Only flat index type (less efficient at scale)
- 1 MiB max document size

---

### Option 3: Pinecone

**Overview**: Managed vector database purpose-built for ML embeddings.

**Capabilities**:

- Industry-leading performance (sub-10ms latency)
- Serverless and dedicated pod options
- Native metadata filtering
- Hybrid search (sparse + dense vectors)
- Excellent SDKs and documentation

**Pricing** (November 2025): | Tier | Cost | |------|------| | Serverless |
~$0.25/M vectors + $0.10/M queries | | Starter pods | ~$70/month minimum | |
Enterprise | Custom pricing |

---

### Option 4: Qdrant

**Overview**: High-performance open-source vector database written in Rust.

**Capabilities**:

- Excellent performance benchmarks
- HNSW algorithm with quantization
- Cloud and self-hosted options
- Good filtering capabilities
- Rust-based (aligns with our backend stack)

**Pricing** (November 2025): | Tier | Cost | |------|------| | Self-hosted |
Free (infrastructure only) | | Cloud | Starts at ~$25/month | | Enterprise |
Custom pricing |

---

### Option 5: Weaviate

**Overview**: Open-source vector database with hybrid search.

**Capabilities**:

- GraphQL API
- Hybrid search (BM25 + vector)
- Multi-tenancy support
- Generative search capabilities
- Module ecosystem

**Pricing** (November 2025): | Tier | Cost | |------|------| | Self-hosted |
Free | | Cloud | ~$25/month minimum | | Enterprise | Custom pricing |

---

### Option 6: Supabase pgvector

**Overview**: PostgreSQL extension for vector similarity search.

**Capabilities**:

- Full SQL capabilities
- ACID compliance
- Excellent metadata filtering
- Open source, self-hostable
- Integrated with Supabase platform

**Pricing** (November 2025): | Tier | Cost | |------|------| | Free tier | 500MB
database | | Pro | $25/month | | Team | $599/month |

---

### Option 7: Keep Current (Firestore + In-Memory)

**Overview**: Enhance current approach with caching and optimization.

**Capabilities**:

- No additional services
- Already implemented
- Full control over search logic

**Limitations**:

- O(n) complexity doesn't scale
- High memory usage at scale
- No advanced search features

---

## Weighted Decision Matrix

### Criteria Weights

| Criterion              | Weight | Rationale                                   |
| ---------------------- | ------ | ------------------------------------------- |
| Cost Efficiency        | 20%    | Budget constraints, Azure credits available |
| Performance at Scale   | 15%    | Sub-100ms queries required for UX           |
| Ecosystem Integration  | 15%    | Firebase + Azure existing stack             |
| Production Readiness   | 12%    | Must be stable for documentation site       |
| Search Features        | 10%    | Hybrid search, filtering needs              |
| Operational Simplicity | 10%    | Limited DevOps bandwidth                    |
| Data Residency Control | 6%     | Defense sector compliance                   |
| Compression/Storage    | 5%     | Cost optimization                           |
| Security Features      | 4%     | Enterprise requirements                     |
| Documentation/Support  | 3%     | Developer productivity                      |

### Scoring Legend

- 1 = Poor
- 2 = Below Average
- 3 = Average
- 4 = Good
- 5 = Excellent

### Detailed Scoring Matrix

| Criterion                  | Weight | Azure AI Search | Firebase Vector | Pinecone | Qdrant   | Weaviate | Supabase pgvector | Current (In-Memory) |
| -------------------------- | ------ | --------------- | --------------- | -------- | -------- | -------- | ----------------- | ------------------- |
| **Cost Efficiency**        | 20%    | 5 (1.00)        | 3 (0.60)        | 2 (0.40) | 3 (0.60) | 3 (0.60) | 4 (0.80)          | 5 (1.00)            |
| **Performance at Scale**   | 15%    | 5 (0.75)        | 2 (0.30)        | 5 (0.75) | 5 (0.75) | 4 (0.60) | 3 (0.45)          | 1 (0.15)            |
| **Ecosystem Integration**  | 15%    | 4 (0.60)        | 5 (0.75)        | 2 (0.30) | 2 (0.30) | 2 (0.30) | 2 (0.30)          | 5 (0.75)            |
| **Production Readiness**   | 12%    | 5 (0.60)        | 2 (0.24)        | 5 (0.60) | 4 (0.48) | 4 (0.48) | 4 (0.48)          | 3 (0.36)            |
| **Search Features**        | 10%    | 5 (0.50)        | 2 (0.20)        | 4 (0.40) | 4 (0.40) | 5 (0.50) | 3 (0.30)          | 1 (0.10)            |
| **Operational Simplicity** | 10%    | 3 (0.30)        | 4 (0.40)        | 4 (0.40) | 2 (0.20) | 2 (0.20) | 3 (0.30)          | 5 (0.50)            |
| **Data Residency Control** | 6%     | 5 (0.30)        | 4 (0.24)        | 3 (0.18) | 4 (0.24) | 3 (0.18) | 4 (0.24)          | 5 (0.30)            |
| **Compression/Storage**    | 5%     | 5 (0.25)        | 2 (0.10)        | 4 (0.20) | 4 (0.20) | 3 (0.15) | 3 (0.15)          | 1 (0.05)            |
| **Security Features**      | 4%     | 5 (0.20)        | 3 (0.12)        | 4 (0.16) | 3 (0.12) | 3 (0.12) | 4 (0.16)          | 3 (0.12)            |
| **Documentation/Support**  | 3%     | 5 (0.15)        | 3 (0.09)        | 5 (0.15) | 4 (0.12) | 4 (0.12) | 4 (0.12)          | 2 (0.06)            |

### Final Weighted Scores

| Rank     | Solution               | Total Weighted Score | Percentage |
| -------- | ---------------------- | -------------------- | ---------- |
| 🥇 **1** | **Azure AI Search**    | **4.65**             | **93%**    |
| 🥈 2     | Pinecone               | 3.54                 | 71%        |
| 🥉 3     | Qdrant                 | 3.41                 | 68%        |
| 4        | Current (In-Memory)    | 3.39                 | 68%        |
| 5        | Supabase pgvector      | 3.30                 | 66%        |
| 6        | Weaviate               | 3.25                 | 65%        |
| 7        | Firebase Vector Search | 3.04                 | 61%        |

---

## Azure Deployment Alternatives

### 1. Azure AI Search (Managed Service) — **Recommended**

| Tier        | Storage | Indexes | Cost/Month | With Credits |
| ----------- | ------- | ------- | ---------- | ------------ |
| Free        | 50 MB   | 3       | $0         | $0           |
| Basic       | 15 GB   | 15      | ~$74       | $0           |
| Standard S1 | 160 GB  | 50      | ~$245      | $0           |
| Standard S2 | 512 GB  | 200     | ~$980      | $0           |

**Best for**: Most use cases, managed infrastructure, built-in scaling.

---

### 2. Azure Container Apps + Qdrant/Milvus

Deploy open-source vector databases on Azure Container Apps.

```
┌───────────────────────────────────────────────────┐
│               Azure Container Apps                 │
│  ┌─────────────────┐    ┌─────────────────┐       │
│  │    Qdrant       │    │   Azure Files   │       │
│  │   Container     │◀──▶│   (Persistent)  │       │
│  └─────────────────┘    └─────────────────┘       │
└───────────────────────────────────────────────────┘
```

| Component                     | Cost/Month | With Credits |
| ----------------------------- | ---------- | ------------ |
| Container Apps (1 vCPU, 2 GB) | ~$50       | $0           |
| Azure Files (10 GB)           | ~$2        | $0           |
| **Total**                     | ~$52       | $0           |

**Pros**: Full control, Rust-native (Qdrant), no vendor lock-in  
**Cons**: Operational overhead, no hybrid search, must manage separately

---

### 3. Azure Kubernetes Service (AKS) + Helm

| Component                  | Cost/Month | With Credits |
| -------------------------- | ---------- | ------------ |
| AKS Cluster (3 nodes, B2s) | ~$150      | $0           |
| Managed Disks              | ~$20       | $0           |
| Load Balancer              | ~$20       | $0           |
| **Total**                  | ~$190      | $0           |

**Best for**: Enterprise deployments with existing K8s infrastructure.

---

### 4. Azure Cosmos DB MongoDB vCore (Vector Preview)

| Tier            | Storage | Cost/Month | With Credits |
| --------------- | ------- | ---------- | ------------ |
| M25 (burstable) | 32 GB   | ~$87       | $0           |
| M40             | 128 GB  | ~$438      | $0           |

**Status**: Preview (not GA as of November 2025)

---

### 5. Azure PostgreSQL + pgvector

| Tier                   | vCores | RAM  | Cost/Month | With Credits |
| ---------------------- | ------ | ---- | ---------- | ------------ |
| Burstable B1ms         | 1      | 2 GB | ~$25       | $0           |
| General Purpose D2s_v3 | 2      | 8 GB | ~$90       | $0           |

---

### 6. Azure OpenAI Assistants API

Use built-in Retrieval via Assistants API.

| Component    | Cost          | With Credits |
| ------------ | ------------- | ------------ |
| Azure OpenAI | Included      | $0           |
| File storage | ~$0.10/GB/day | ~$0          |

**Pros**: No separate vector DB, simple API  
**Cons**: Less control, file size limits

---

### Azure Deployment Comparison

| Option                  | Setup    | Cost | Hybrid Search | HNSW | Fit        |
| ----------------------- | -------- | ---- | ------------- | ---- | ---------- |
| **Azure AI Search**     | Low      | $0   | ✅            | ✅   | ⭐⭐⭐⭐⭐ |
| Container Apps + Qdrant | Medium   | $0   | ❌            | ✅   | ⭐⭐⭐⭐   |
| AKS + Helm              | High     | $0   | ❌            | ✅   | ⭐⭐       |
| Cosmos DB vCore         | Low      | $0   | ❌            | ✅   | ⭐⭐⭐     |
| PostgreSQL + pgvector   | Medium   | $0   | ❌            | ❌   | ⭐⭐⭐     |
| OpenAI Assistants       | Very Low | $0   | ❌            | ❌   | ⭐⭐⭐     |

---

## Cost Model (2-Year Projection)

### Scenario A: Azure Credits Continue

| Year      | Azure AI Search | Alternative (Pinecone) |
| --------- | --------------- | ---------------------- |
| 2025      | $0              | $840+                  |
| 2026      | $0              | $840+                  |
| **Total** | **$0**          | **$1,680+**            |

### Scenario B: Azure Credits Expire (Year 2)

| Year      | Azure AI Search | Alternative (Self-Host Qdrant) |
| --------- | --------------- | ------------------------------ |
| 2025      | $0              | $0 (setup time)                |
| 2026      | ~$888           | ~$624                          |
| 2027      | ~$888           | ~$624                          |
| **Total** | **$1,776**      | **$1,248**                     |

### Break-Even Analysis

If Azure credits expire, Azure AI Search costs ~$74/month. Self-hosting Qdrant
on Container Apps costs ~$52/month.

**Difference**: $22/month ($264/year)

**Trade-off**: $264/year buys hybrid search, semantic ranking, zero ops,
enterprise SLA.

---

## Performance Benchmarks

### Expected Query Latencies

| Solution          | P50 Latency | P99 Latency | Index Algorithm |
| ----------------- | ----------- | ----------- | --------------- |
| Azure AI Search   | ~5ms        | ~15ms       | HNSW            |
| Pinecone          | ~5ms        | ~10ms       | HNSW            |
| Qdrant            | ~5ms        | ~20ms       | HNSW            |
| Firebase Vector   | ~50ms       | ~200ms      | Flat (O(n))     |
| Current In-Memory | ~100ms      | ~500ms      | Flat (O(n))     |

### Cross-Cloud Latency Impact

Runtime call chain:
`React → Firebase Functions → Azure AI Search → Azure OpenAI → back`

| Segment                     | Latency     |
| --------------------------- | ----------- |
| React → Firebase            | 20-50ms     |
| Firebase → Azure Search     | 30-80ms     |
| Azure Search query          | 5-15ms      |
| Azure Search → Azure OpenAI | 5-10ms      |
| Azure OpenAI response       | 200-2000ms  |
| Return trip                 | 30-80ms     |
| **Total P50**               | **~350ms**  |
| **Total P99**               | **~2500ms** |

**Acceptable**: RAG UX budget is 500-2000ms for thoughtful responses.

---

## Why Hybrid Search Matters

### Phoenix Rooivalk Documentation Characteristics

1. **Technical jargon**: Terms like "RKV", "HNSW", "c-UAS" need exact matching
2. **Version references**: "v2.3.1", "ADR-0011" require keyword precision
3. **Low-signal text**: Dense technical content benefits from semantic
   understanding
4. **Narrow queries**: "How do I configure the keeper service?" needs both
   keyword + semantic

### Semantic-Only Limitations

```
Query: "ADR-0011 vector database"
Semantic-only: May return general vector DB content, miss our specific ADR
Hybrid: Exact match on "ADR-0011" + semantic on "vector database"
```

### Why Only Azure AI Search Has This

| Solution        | Keyword Search | Vector Search | Combined in One Query |
| --------------- | -------------- | ------------- | --------------------- |
| Azure AI Search | ✅ BM25        | ✅ HNSW       | ✅ Hybrid             |
| Pinecone        | ❌             | ✅            | ❌ (separate calls)   |
| Qdrant          | ❌             | ✅            | ❌                    |
| Firebase Vector | ❌             | ✅ (flat)     | ❌                    |

---

## Feature Comparison

| Feature               | Azure AI | Firebase | Pinecone | Qdrant   | Weaviate | pgvector |
| --------------------- | -------- | -------- | -------- | -------- | -------- | -------- |
| **Cost (our usage)**  | $0       | $5-20    | $70+     | $25+     | $25+     | $25+     |
| **Index Algorithm**   | HNSW     | Flat     | HNSW     | HNSW     | HNSW     | IVFFlat  |
| **Max Vectors**       | Millions | ~100K    | Billions | Millions | Millions | Millions |
| **Hybrid Search**     | ✅       | ❌       | ✅       | ✅       | ✅       | ❌       |
| **Semantic Ranking**  | ✅       | ❌       | ❌       | ❌       | ✅       | ❌       |
| **Compression**       | ✅ 92.5% | ❌       | ✅       | ✅       | ✅       | ❌       |
| **Production Status** | GA       | Preview  | GA       | GA       | GA       | GA       |
| **Same Platform**     | ✅       | ❌       | ❌       | ❌       | ❌       | ❌       |

---

## Risk Assessment

### Risk Matrix

| Risk                       | Probability | Impact | Mitigation                                               |
| -------------------------- | ----------- | ------ | -------------------------------------------------------- |
| Azure credits expire       | Low         | High   | Monitor usage, budget alerts, reserve funds              |
| Cross-cloud latency spikes | Medium      | Low    | Cache queries, connection pooling, regional optimization |
| Azure AI Search outage     | Low         | Medium | Fallback to keyword-only Firestore search                |
| Index corruption           | Very Low    | High   | Daily backups, content hashing for rebuild               |
| Configuration errors       | Medium      | Medium | Infrastructure as Code, staging environment              |
| Vendor lock-in severity    | Medium      | Medium | SearchAdapter abstraction, export capability             |

### Failure Isolation

**If Azure AI Search fails**:

- Primary: Fallback to cached query results (Firestore)
- Secondary: Keyword-only search via Firestore text fields
- Tertiary: Show "AI temporarily unavailable" message

**Note**: Fallback is **partial** — no vector search, only keyword matching.

---

## Export Strategy

### Vendor Lock-in Mitigation

1. **Store vectors in neutral format**

   ```typescript
   interface VectorDocument {
     id: string;
     content: string;
     embedding: number[]; // float32 array, portable
     metadata: Record<string, unknown>;
   }
   ```

2. **SearchAdapter abstraction**

   ```typescript
   interface SearchAdapter {
     search(query: string, options: SearchOptions): Promise<SearchResult[]>;
     index(docs: Document[]): Promise<void>;
     delete(ids: string[]): Promise<void>;
   }
   ```

3. **Export capability**
   - Admin function to export all vectors to JSON
   - Weekly backup to Azure Blob Storage
   - Content hashes enable rebuild from source

### Migration Path (if needed)

| From            | To                 | Effort   | Risk           |
| --------------- | ------------------ | -------- | -------------- |
| Azure AI Search | Pinecone           | 1-2 days | Low            |
| Azure AI Search | Qdrant (self-host) | 2-3 days | Medium         |
| Azure AI Search | Firestore fallback | 1 day    | Low (degraded) |

---

## Conclusion

Azure AI Search provides the optimal balance of:

- **Zero cost** (with credits)
- **Enterprise performance** (sub-10ms HNSW)
- **Unique capabilities** (hybrid search, semantic ranking)
- **Platform alignment** (same billing as AI models)
- **Production maturity** (GA with SLA)

The trade-off of deeper Azure commitment is acceptable given our existing Azure
AI strategy and the export/abstraction mitigations in place.

---

_This document contains confidential architectural information. Distribution is
restricted to authorized personnel only. © 2025 Phoenix Rooivalk. All rights
reserved._
