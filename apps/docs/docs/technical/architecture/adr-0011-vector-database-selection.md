---
id: adr-0011-vector-database-selection
title: "ADR 0011: Vector Database Selection for RAG"
sidebar_label: "ADR 0011: Vector Database"
difficulty: expert
estimated_reading_time: 8
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
**Status**: Accepted (Firebase Vector Search)

## Context

The Phoenix Rooivalk documentation site implements RAG (Retrieval-Augmented Generation) to provide AI-powered documentation assistance. The current implementation uses in-memory cosine similarity search over Firestore-stored embeddings, which has O(n) complexity and loads all embeddings for every query. This approach doesn't scale beyond a few hundred documents.

We need to select a vector database solution that provides:

- Efficient similarity search (sub-100ms for &lt;10K documents)
- Integration with our existing Firebase/GCP infrastructure
- Cost-effective operation for ~200 documentation files
- Build-time indexing support
- Category/metadata filtering

### Scale Assessment

- **Current corpus**: ~107 documentation files, ~208K words
- **Estimated chunks**: ~500-1,000 chunks at 500 tokens each
- **Expected queries**: ~100-500/day initially
- **Growth projection**: Up to 1,000 docs over 2 years

## Options Considered

### Option 1: Pinecone

**Overview**: Managed vector database purpose-built for ML embeddings.

**Pros**:

- Industry-leading performance (sub-10ms latency)
- Serverless option with pay-per-query pricing
- Native metadata filtering
- Excellent documentation and SDKs
- Hybrid search (sparse + dense vectors)

**Cons**:

- External service (data leaves GCP)
- Additional vendor dependency
- Minimum $70/month for dedicated pods
- Serverless has cold-start latency

**Cost**: ~$0.25/million vectors + $0.10/million queries (serverless)

### Option 2: Firebase Vector Search Extension

**Overview**: Firebase extension using Vertex AI for embeddings and Firestore for storage with vector search capabilities.

**Pros**:

- Native GCP/Firebase integration
- Data stays within Firebase ecosystem
- Leverages existing Firestore infrastructure
- No additional service to manage
- Uses Vertex AI Matching Engine under the hood
- Free tier includes 2GB vector storage

**Cons**:

- Relatively new (GA in 2024)
- Limited to OpenAI or Vertex AI embeddings
- Less mature than dedicated vector DBs
- Firestore query limitations apply

**Cost**: Included in Firestore pricing + Vertex AI embedding costs

### Option 3: Supabase pgvector

**Overview**: PostgreSQL extension for vector similarity search.

**Pros**:

- Open source, self-hostable
- Full SQL capabilities
- Excellent metadata filtering
- Generous free tier (500MB)
- ACID compliance

**Cons**:

- Requires PostgreSQL instance
- Additional infrastructure to manage
- Not as optimized as purpose-built solutions
- Separate from Firebase ecosystem

**Cost**: Free tier available, $25/month for Pro

### Option 4: Weaviate

**Overview**: Open-source vector database with hybrid search.

**Pros**:

- Open source with cloud option
- GraphQL API
- Hybrid search (BM25 + vector)
- Good multi-tenancy support

**Cons**:

- Heavier infrastructure requirements
- More complex setup
- Cloud pricing higher than alternatives

**Cost**: $25/month minimum for cloud

### Option 5: Qdrant

**Overview**: High-performance open-source vector database.

**Pros**:

- Excellent performance benchmarks
- Rust-based (aligns with backend stack)
- Cloud and self-hosted options
- Good filtering capabilities

**Cons**:

- Smaller community than Pinecone
- Cloud option relatively new
- Separate infrastructure

**Cost**: Free self-hosted, cloud starts at $25/month

### Option 6: Keep Current Firestore + In-Memory Search

**Overview**: Enhance current approach with caching and optimization.

**Pros**:

- No additional services
- Minimal changes required
- Already implemented

**Cons**:

- O(n) complexity doesn't scale
- High memory usage
- Slow for large corpora

**Cost**: Current Firestore costs

## Decision

**Adopt Firebase Vector Search Extension** as the primary vector database solution.

## Rationale

### 1. Ecosystem Alignment

Firebase Vector Search integrates natively with our existing infrastructure:

- Firestore for document storage
- Firebase Functions for serverless compute
- Firebase Auth for access control
- GCP for hosting and security

### 2. Operational Simplicity

- No new service accounts or API keys
- Unified billing through GCP
- Same deployment model as existing functions
- Familiar Firestore query patterns

### 3. Data Residency

- All data remains within Firebase/GCP
- Compliant with existing security policies
- No data transfer to third-party services
- Leverages existing GCP security controls

### 4. Cost Efficiency

For our scale (~1K documents):

- Pinecone serverless: ~$5-10/month
- Firebase Vector Search: ~$2-5/month (included in Firestore)
- Supabase: $0 (free tier) to $25/month

Firebase Vector Search provides the best balance of cost and integration.

### 5. Future-Proofing

- Backed by Google/Vertex AI infrastructure
- Continuous improvements expected
- Natural upgrade path to Vertex AI Matching Engine for larger scale

## Implementation Plan

### Phase 3A: Firebase Vector Search Setup

1. Install Firebase Vector Search extension
2. Configure embeddings with `text-embedding-3-small`
3. Migrate existing `doc_embeddings` collection
4. Update search functions to use extension

### Phase 3B: Build-Time Indexing

1. Create Docusaurus plugin for indexing
2. Generate embeddings during `npm run build`
3. Upload vectors to Firebase on deploy
4. Add staleness detection via content hashing

### Phase 3C: Enhanced Search

1. Implement hybrid search (keyword + semantic)
2. Add category-weighted scoring
3. Enable related document discovery
4. Implement query expansion

## Consequences

### Positive

- **Performance**: Sub-100ms vector search for 10K+ vectors
- **Scalability**: Can grow to 100K+ documents without architecture change
- **Maintainability**: Single ecosystem reduces operational complexity
- **Cost**: Predictable, included in existing Firebase billing

### Negative

- **Vendor Lock-in**: Deeper commitment to Firebase/GCP ecosystem
- **Maturity**: Less battle-tested than Pinecone for edge cases
- **Flexibility**: Tied to Firestore query patterns and limitations

### Risks and Mitigations

| Risk                     | Probability | Impact | Mitigation                                                   |
| ------------------------ | ----------- | ------ | ------------------------------------------------------------ |
| Extension deprecation    | Low         | High   | Abstract vector ops behind interface for easy swap           |
| Performance degradation  | Low         | Medium | Monitor latency, fallback to Pinecone if needed              |
| Cost increase at scale   | Medium      | Low    | Re-evaluate at 10K documents, consider Vertex AI direct      |
| Feature limitations      | Medium      | Medium | Supplement with application-level filtering                  |

## Alternatives Considered for Future

If Firebase Vector Search proves insufficient:

1. **Pinecone Serverless**: Best performance, minimal cold-start impact
2. **Qdrant Cloud**: Good Rust ecosystem alignment
3. **Vertex AI Matching Engine Direct**: For massive scale (100K+ vectors)

## Related ADRs

- [ADR 0001: Chain Selection for On-Chain Anchoring](/docs/technical/architecture/architecture-decision-records#adr-0001-chain-selection-for-on-chain-anchoring-solana-vs-others)
- [ADR 0006: AI/ML Architecture](/docs/technical/architecture/architecture-decision-records#adr-0006-aiml-architecture)

---

_This document contains confidential architectural information. Distribution is
restricted to authorized personnel only. © 2025 Phoenix Rooivalk. All rights
reserved._
