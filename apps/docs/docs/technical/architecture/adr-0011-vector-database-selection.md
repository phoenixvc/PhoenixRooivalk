---
id: adr-0011-vector-database-selection
title: "ADR 0011: Vector Database Selection for RAG"
sidebar_label: "ADR 0011: Vector Database"
difficulty: expert
estimated_reading_time: 15
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

## Context

The Phoenix Rooivalk documentation site implements RAG (Retrieval-Augmented Generation) to provide AI-powered documentation assistance. The current implementation uses in-memory cosine similarity search over Firestore-stored embeddings, which has O(n) complexity and loads all embeddings for every query. This approach doesn't scale beyond a few hundred documents.

We need to select a vector database solution that provides:

- Efficient similarity search (sub-100ms for &lt;10K documents)
- Integration with our existing infrastructure
- Cost-effective operation for ~200 documentation files
- Build-time indexing support
- Category/metadata filtering

**Key Consideration**: We have **free Azure Foundry credits** and already host AI models there (gpt-4o, gpt-5, gpt-5.1, text-embedding-3-small, claude-sonnet-4-5). This significantly impacts the cost analysis.

### Scale Assessment

- **Current corpus**: ~107 documentation files, ~208K words
- **Estimated chunks**: ~500-1,000 chunks at 500 tokens each
- **Expected queries**: ~100-500/day initially
- **Growth projection**: Up to 1,000 docs over 2 years

---

## Options Evaluated

### Option 1: Azure AI Search

**Overview**: Enterprise-grade cognitive search service with native vector search, part of Azure AI Foundry.

**Capabilities**:
- Vector similarity search with KNN and HNSW algorithms
- Hybrid search (keyword + semantic in same query)
- Multimodal & multilingual support
- Filtered vector search with metadata
- Advanced compression (up to 92.5% storage reduction)
- Enterprise-grade security (HSM, customer-managed keys)
- Semantic ranking and reranking

**Pricing** (November 2025):
- Free tier: 50MB storage, 3 indexes
- Basic: ~$73.73/month - 15GB storage, 15 indexes
- Standard S1: ~$245.28/month - 160GB storage, 50 indexes
- **With Azure Foundry credits**: Effectively $0 for our usage

### Option 2: Firebase Vector Search Extension

**Overview**: Firebase extension using Firestore for vector storage with native KNN search.

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

### Option 3: Pinecone

**Overview**: Managed vector database purpose-built for ML embeddings.

**Capabilities**:
- Industry-leading performance (sub-10ms latency)
- Serverless and dedicated pod options
- Native metadata filtering
- Hybrid search (sparse + dense vectors)
- Excellent SDKs and documentation

**Pricing** (November 2025):
- Serverless: ~$0.25/million vectors + $0.10/million queries
- Starter pods: ~$70/month minimum
- Enterprise: Custom pricing

### Option 4: Qdrant

**Overview**: High-performance open-source vector database written in Rust.

**Capabilities**:
- Excellent performance benchmarks
- HNSW algorithm with quantization
- Cloud and self-hosted options
- Good filtering capabilities
- Rust-based (aligns with our backend stack)

**Pricing** (November 2025):
- Self-hosted: Free (infrastructure costs only)
- Cloud: Starts at ~$25/month
- Enterprise: Custom pricing

### Option 5: Weaviate

**Overview**: Open-source vector database with hybrid search.

**Capabilities**:
- GraphQL API
- Hybrid search (BM25 + vector)
- Multi-tenancy support
- Generative search capabilities
- Module ecosystem

**Pricing** (November 2025):
- Self-hosted: Free
- Cloud: ~$25/month minimum
- Enterprise: Custom pricing

### Option 6: Supabase pgvector

**Overview**: PostgreSQL extension for vector similarity search.

**Capabilities**:
- Full SQL capabilities
- ACID compliance
- Excellent metadata filtering
- Open source, self-hostable
- Integrated with Supabase platform

**Pricing** (November 2025):
- Free tier: 500MB database
- Pro: $25/month
- Team: $599/month

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

We evaluated all options against 10 key criteria, weighted by importance for our use case.

**Scoring**: 1 = Poor, 2 = Below Average, 3 = Average, 4 = Good, 5 = Excellent

### Criteria Weights

| Criterion | Weight | Rationale |
|-----------|--------|-----------|
| Cost Efficiency | 20% | Budget constraints, Azure credits available |
| Performance at Scale | 15% | Sub-100ms queries required for UX |
| Ecosystem Integration | 15% | Firebase + Azure existing stack |
| Production Readiness | 12% | Must be stable for documentation site |
| Search Features | 10% | Hybrid search, filtering needs |
| Operational Simplicity | 10% | Limited DevOps bandwidth |
| Data Residency Control | 6% | Defense sector compliance |
| Compression/Storage | 5% | Cost optimization |
| Security Features | 4% | Enterprise requirements |
| Documentation/Support | 3% | Developer productivity |

### Weighted Scores by Option

| Criterion | Weight | Azure AI Search | Firebase Vector | Pinecone | Qdrant | Weaviate | Supabase pgvector | Current (In-Memory) |
|-----------|--------|-----------------|-----------------|----------|--------|----------|-------------------|---------------------|
| **Cost Efficiency** | 20% | 5 (1.00) | 3 (0.60) | 2 (0.40) | 3 (0.60) | 3 (0.60) | 4 (0.80) | 5 (1.00) |
| **Performance at Scale** | 15% | 5 (0.75) | 2 (0.30) | 5 (0.75) | 5 (0.75) | 4 (0.60) | 3 (0.45) | 1 (0.15) |
| **Ecosystem Integration** | 15% | 4 (0.60) | 5 (0.75) | 2 (0.30) | 2 (0.30) | 2 (0.30) | 2 (0.30) | 5 (0.75) |
| **Production Readiness** | 12% | 5 (0.60) | 2 (0.24) | 5 (0.60) | 4 (0.48) | 4 (0.48) | 4 (0.48) | 3 (0.36) |
| **Search Features** | 10% | 5 (0.50) | 2 (0.20) | 4 (0.40) | 4 (0.40) | 5 (0.50) | 3 (0.30) | 1 (0.10) |
| **Operational Simplicity** | 10% | 3 (0.30) | 4 (0.40) | 4 (0.40) | 2 (0.20) | 2 (0.20) | 3 (0.30) | 5 (0.50) |
| **Data Residency Control** | 6% | 5 (0.30) | 4 (0.24) | 3 (0.18) | 4 (0.24) | 3 (0.18) | 4 (0.24) | 5 (0.30) |
| **Compression/Storage** | 5% | 5 (0.25) | 2 (0.10) | 4 (0.20) | 4 (0.20) | 3 (0.15) | 3 (0.15) | 1 (0.05) |
| **Security Features** | 4% | 5 (0.20) | 3 (0.12) | 4 (0.16) | 3 (0.12) | 3 (0.12) | 4 (0.16) | 3 (0.12) |
| **Documentation/Support** | 3% | 5 (0.15) | 3 (0.09) | 5 (0.15) | 4 (0.12) | 4 (0.12) | 4 (0.12) | 2 (0.06) |

### Final Weighted Scores

| Rank | Solution | Total Weighted Score | Percentage |
|------|----------|---------------------|------------|
| 🥇 **1** | **Azure AI Search** | **4.65** | **93%** |
| 🥈 2 | Pinecone | 3.54 | 71% |
| 🥉 3 | Current (In-Memory) | 3.39 | 68% |
| 4 | Qdrant | 3.41 | 68% |
| 5 | Supabase pgvector | 3.30 | 66% |
| 6 | Weaviate | 3.25 | 65% |
| 7 | Firebase Vector Search | 3.04 | 61% |

---

## Decision

**Adopt Azure AI Search** as the vector database solution for RAG.

## Rationale

### 1. Cost Advantage with Azure Credits (Score: 5/5)

Given our free Azure Foundry credits, Azure AI Search is effectively **$0** for our usage:
- Basic tier ($73.73/month) is fully covered by credits
- 15GB storage is 15x what we need for ~1K documents
- Same billing as our existing AI models (gpt-4o, gpt-5, gpt-5.1)

### 2. Superior Performance (Score: 5/5)

Azure AI Search uses **HNSW (Hierarchical Navigable Small World)** algorithm:
- Sub-10ms query latency vs Firebase's flat index O(n)
- Efficient at scale (tested to millions of vectors)
- 92.5% storage compression available

### 3. Unified Azure Ecosystem (Score: 4/5)

We already use Azure for AI models:
- `gpt-4o` (965K quota) for chat
- `gpt-5` (5M quota) for advanced reasoning
- `text-embedding-3-small` (492K quota) for embeddings
- `claude-sonnet-4-5` (2M quota) for alternatives
- Single API surface, single billing, single credential management

### 4. Production Maturity (Score: 5/5)

Azure AI Search is GA with enterprise SLAs:
- Firebase Vector Search is still in Preview/Pre-GA (November 2025)
- Risk of breaking changes or feature limitations with Firebase
- Enterprise support available for production issues

### 5. Advanced Features (Score: 5/5)

Azure provides capabilities others lack:
- **Hybrid search**: Combine keyword and semantic search in one query
- **Semantic ranking**: AI-powered reranking for better relevance
- **Filtered search**: Complex metadata filtering with facets
- **Multimodal**: Support for image and document embeddings

### Why Not Others?

| Option | Why Not Selected |
|--------|------------------|
| **Firebase Vector Search** | Pre-GA status, flat index only, limited features |
| **Pinecone** | Additional vendor, no cost advantage, separate billing |
| **Qdrant** | Self-hosting complexity, no existing relationship |
| **Weaviate** | Higher operational overhead, no cost advantage |
| **Supabase pgvector** | Separate infrastructure, not aligned with stack |
| **Current In-Memory** | O(n) doesn't scale, no advanced features |

---

## Implementation Plan

### Phase 3A: Azure AI Search Setup

1. Create Azure AI Search service (Basic tier, covered by credits)
2. Configure index schema for documentation chunks
3. Set up data source connection from build pipeline
4. Create skillset for embedding generation via Azure OpenAI

### Phase 3B: Build-Time Indexing

1. Modify Docusaurus build plugin to push to Azure
2. Use Azure Search indexer for batch updates
3. Implement content hashing for incremental updates
4. Set up CI/CD to trigger reindex on doc changes

### Phase 3C: Query Integration

1. Update Cloud Functions to call Azure AI Search
2. Implement hybrid search (keyword + semantic)
3. Add faceted filtering by category
4. Enable semantic ranking for improved results

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Build Pipeline (GitHub Actions)             │
│  ┌─────────────┐    ┌──────────────┐    ┌───────────────────┐  │
│  │ Docusaurus  │───▶│ RAG Indexer  │───▶│ Azure AI Search   │  │
│  │   Build     │    │   Plugin     │    │ (Vector Index)    │  │
│  └─────────────┘    └──────────────┘    └───────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                                    │
                    ┌───────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Runtime (User Query)                      │
│  ┌─────────────┐    ┌──────────────┐    ┌───────────────────┐  │
│  │  AI Panel   │───▶│ Firebase     │───▶│ Azure AI Search   │  │
│  │  (React)    │    │ Functions    │    │ (Hybrid Query)    │  │
│  └─────────────┘    └──────────────┘    └───────────────────┘  │
│                              │                    │              │
│                              ▼                    │              │
│                     ┌──────────────┐              │              │
│                     │ Azure OpenAI │◀─────────────┘              │
│                     │ (gpt-4o/5)   │   (context injection)      │
│                     └──────────────┘                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Consequences

### Positive

- **Zero Cost**: Covered entirely by Azure credits
- **Performance**: Sub-10ms vector search at scale
- **Features**: Hybrid search, semantic ranking, filtering
- **Maturity**: Production-ready enterprise service
- **Integration**: Unified Azure billing and management

### Negative

- **Vendor Consolidation**: Deeper Azure commitment
- **Added Complexity**: Azure Search API alongside Firebase
- **Network Latency**: Cross-cloud calls (Firebase → Azure)
- **Learning Curve**: New service to configure and maintain

### Risks and Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Azure credits expire | Low | High | Monitor usage, set alerts, budget fallback |
| Cross-cloud latency | Medium | Low | Cache frequent queries, use connection pooling |
| Service unavailability | Low | Medium | Fallback to Firestore in-memory search |
| Configuration errors | Medium | Medium | Infrastructure as Code, thorough testing |

---

## Feature Comparison Summary

| Feature | Azure AI Search | Firebase Vector | Pinecone | Qdrant | Weaviate | pgvector |
|---------|-----------------|-----------------|----------|--------|----------|----------|
| **Monthly Cost (our usage)** | $0 (credits) | $5-20 | $70+ | $25+ | $25+ | $25+ |
| **Index Algorithm** | HNSW | Flat | HNSW | HNSW | HNSW | IVFFlat/HNSW |
| **Max Vectors** | Millions | ~100K | Billions | Millions | Millions | Millions |
| **Hybrid Search** | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No |
| **Semantic Ranking** | ✅ Yes | ❌ No | ❌ No | ❌ No | ✅ Yes | ❌ No |
| **Compression** | ✅ 92.5% | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No |
| **Production Status** | GA | Preview | GA | GA | GA | GA |
| **Our AI Models** | ✅ Same platform | ❌ Separate | ❌ Separate | ❌ Separate | ❌ Separate | ❌ Separate |

---

## Azure Deployment Alternatives

Beyond the standard Azure AI Search option, Azure provides several alternative deployment paths that may suit different requirements:

### 1. Azure AI Search (Managed Service) — **Recommended**

The standard managed offering evaluated above.

| Tier | Storage | Indexes | Cost/Month | With Credits |
|------|---------|---------|------------|--------------|
| Free | 50 MB | 3 | $0 | $0 |
| Basic | 15 GB | 15 | ~$74 | $0 |
| Standard S1 | 160 GB | 50 | ~$245 | $0 |
| Standard S2 | 512 GB | 200 | ~$980 | $0 |
| Standard S3 | 2 TB | 200 | ~$1,960 | $0 |

**Best for**: Most use cases, managed infrastructure, built-in scaling.

### 2. Azure Container Apps + Qdrant/Milvus (Self-Managed Vector DB)

Deploy open-source vector databases (Qdrant, Milvus, or Weaviate) on Azure Container Apps for full control.

```
┌───────────────────────────────────────────────────┐
│               Azure Container Apps                 │
│  ┌─────────────────┐    ┌─────────────────┐       │
│  │    Qdrant       │    │   Azure Files   │       │
│  │   Container     │◀──▶│   (Persistent)  │       │
│  └─────────────────┘    └─────────────────┘       │
└───────────────────────────────────────────────────┘
```

| Component | Estimated Cost | With Credits |
|-----------|----------------|--------------|
| Container Apps (1 vCPU, 2 GB) | ~$50/month | $0 |
| Azure Files (10 GB) | ~$2/month | $0 |
| Total | ~$52/month | $0 |

**Pros**:
- Full control over vector DB configuration
- Use latest Qdrant/Milvus features immediately
- Rust-native (Qdrant aligns with our backend)
- No vendor lock-in to Azure Search schema

**Cons**:
- Operational overhead (updates, backups, scaling)
- No hybrid search unless manually implemented
- Must manage embeddings separately

**Best for**: Teams needing full control, specific features, or Rust ecosystem alignment.

### 3. Azure Kubernetes Service (AKS) + Helm Charts

Enterprise-grade deployment of vector databases on Kubernetes.

| Component | Estimated Cost | With Credits |
|-----------|----------------|--------------|
| AKS Cluster (3 nodes, B2s) | ~$150/month | $0 |
| Managed Disks | ~$20/month | $0 |
| Load Balancer | ~$20/month | $0 |
| Total | ~$190/month | $0 |

**Pros**:
- Kubernetes ecosystem integration
- Auto-scaling, self-healing
- Helm charts available for Qdrant, Milvus, Weaviate

**Cons**:
- Significant operational complexity
- Overkill for <10K documents
- Requires Kubernetes expertise

**Best for**: Enterprise deployments with existing Kubernetes infrastructure.

### 4. Azure Cosmos DB with MongoDB vCore (Vector Search Preview)

Vector search capabilities in Cosmos DB's MongoDB vCore offering.

| Tier | Storage | RU/s | Cost/Month | With Credits |
|------|---------|------|------------|--------------|
| M25 (burstable) | 32 GB | - | ~$87 | $0 |
| M40 | 128 GB | - | ~$438 | $0 |
| M80 | 256 GB | - | ~$875 | $0 |

**Pros**:
- MongoDB API compatibility
- HNSW index support (Cosmos DB DiskANN)
- Global distribution
- Integrated with existing Cosmos DB data

**Cons**:
- Preview status (not GA as of November 2025)
- Higher cost than AI Search for pure vector workloads
- MongoDB-specific implementation

**Best for**: Teams already using Cosmos DB who want to add vector search.

### 5. Azure PostgreSQL Flexible Server + pgvector

PostgreSQL with the pgvector extension for SQL-native vector search.

| Tier | vCores | RAM | Storage | Cost/Month | With Credits |
|------|--------|-----|---------|------------|--------------|
| Burstable B1ms | 1 | 2 GB | 32 GB | ~$25 | $0 |
| General Purpose D2s_v3 | 2 | 8 GB | 64 GB | ~$90 | $0 |
| Memory Optimized E4s_v3 | 4 | 32 GB | 128 GB | ~$250 | $0 |

**Pros**:
- Full SQL capabilities
- Open-source pgvector extension
- ACID compliance
- Existing PostgreSQL tooling works

**Cons**:
- IVFFlat index less efficient than HNSW
- No hybrid search built-in
- Requires PostgreSQL expertise

**Best for**: Teams preferring SQL, existing PostgreSQL workflows.

### 6. Azure OpenAI + Assistants API with File Search

Use Azure OpenAI's built-in Retrieval capabilities via Assistants API.

| Component | Estimated Cost | With Credits |
|-----------|----------------|--------------|
| Azure OpenAI (existing) | Included | $0 |
| File storage (per GB/day) | ~$0.10 | ~$0 |
| Vector storage (per GB/day) | ~$0.10 | ~$0 |

**Pros**:
- No separate vector DB needed
- Built-in chunking and embedding
- Managed by Azure OpenAI team
- Simple API

**Cons**:
- Less control over retrieval algorithm
- Limited to Azure OpenAI models only
- File size limits
- Can't reuse embeddings across models

**Best for**: Quick POC, simple RAG use cases, minimal infrastructure.

### 7. Azure AI Foundry Hub with Custom Model Deployments

Deploy custom embedding models alongside chat models in a unified hub.

**Available in our Azure Foundry**:
- `text-embedding-3-small` (1536 dimensions) — Already deployed
- `text-embedding-ada-002` (1536 dimensions) — Available
- Custom fine-tuned models — Possible

**Deployment options**:
| Deployment Type | Scaling | Latency | Cost |
|-----------------|---------|---------|------|
| Global Standard | Auto | Variable | Pay-per-token |
| Provisioned Throughput | Reserved | Consistent | Fixed monthly |
| Global Batch | Queue-based | High | 50% discount |

**For embedding + search**:
- Combine with any Azure vector store option
- Use same credentials/billing as chat models
- Unified monitoring in AI Foundry portal

---

## Azure Deployment Comparison Matrix

| Deployment Option | Setup Complexity | Monthly Cost (Credits) | Hybrid Search | HNSW | Our Use Case Fit |
|-------------------|------------------|------------------------|---------------|------|------------------|
| **Azure AI Search (Managed)** | Low | $0 | ✅ | ✅ | ⭐⭐⭐⭐⭐ |
| Container Apps + Qdrant | Medium | $0 | ❌ | ✅ | ⭐⭐⭐⭐ |
| AKS + Helm Charts | High | $0 | ❌ | ✅ | ⭐⭐ |
| Cosmos DB vCore | Low | $0 | ❌ | ✅ | ⭐⭐⭐ |
| PostgreSQL + pgvector | Medium | $0 | ❌ | ❌ | ⭐⭐⭐ |
| Azure OpenAI Assistants | Very Low | $0 | ❌ | ❌ | ⭐⭐⭐ |
| AI Foundry Custom | Medium | $0 | ❌ | ❌ | ⭐⭐⭐ |

### Decision Rationale for Azure AI Search

Given our requirements:
1. **Zero cost** — All Azure options are $0 with credits
2. **Hybrid search needed** — Only Azure AI Search provides this natively
3. **Production maturity** — Azure AI Search is GA; Cosmos DB vector is preview
4. **Minimal ops** — Managed service beats Container Apps/AKS complexity
5. **Unified platform** — Same portal as our AI models

**Conclusion**: Azure AI Search remains the optimal choice for our documentation RAG use case.

---

## Related ADRs

- [ADR 0006: AI/ML Architecture](/docs/technical/architecture/architecture-decision-records#adr-0006-aiml-architecture)
- [ADR D003: Rust for Backend Services](/docs/technical/architecture/architecture-decision-records#adr-d003-rust-for-backend-services)

---

_This document contains confidential architectural information. Distribution is
restricted to authorized personnel only. © 2025 Phoenix Rooivalk. All rights
reserved._
