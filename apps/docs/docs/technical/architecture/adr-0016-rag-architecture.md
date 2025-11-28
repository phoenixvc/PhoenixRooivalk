---
id: adr-0016-rag-architecture
title: "ADR 0016: RAG Architecture"
sidebar_label: "ADR 0016: RAG Architecture"
difficulty: advanced
estimated_reading_time: 10
points: 40
tags:
  - technical
  - architecture
  - ai
  - rag
  - vector-search
prerequisites:
  - adr-0011-vector-database-selection
  - adr-0012-runtime-functions
---

# ADR 0016: RAG (Retrieval-Augmented Generation) Architecture

**Date**: 2025-11-27 **Status**: Accepted (Hybrid RAG with Azure AI Search +
Firestore)

---

## Executive Summary

1. **Problem**: LLM responses lack grounding in Phoenix Rooivalk's specific
   documentation and context
2. **Decision**: Hybrid RAG architecture using Azure AI Search for vector
   retrieval with Firestore fallback
3. **Trade-off**: Increased latency (~500ms) for significantly improved accuracy
   and relevance

---

## Context

Phoenix Rooivalk's AI features need to provide accurate, contextual responses
about:

- Company products and capabilities
- Technical specifications
- Competitive landscape
- Market positioning

**Without RAG**:

- LLM generates generic responses based on training data
- May hallucinate or provide outdated information
- Cannot reference specific documentation
- No source citations possible

**With RAG**:

- Responses grounded in actual documentation
- Up-to-date information from indexed content
- Source citations for verification
- Reduced hallucination risk

---

## Decision

**Hybrid RAG architecture** with:

1. **Primary**: Azure AI Search for vector similarity search
2. **Fallback**: Firestore embeddings for offline/backup retrieval
3. **Integration**: RAG context injection into all AI functions

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     RAG Request Flow                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   User Query                                                     │
│       │                                                          │
│       ▼                                                          │
│   ┌───────────────┐                                             │
│   │ Query Embedding │  ◄── Azure OpenAI text-embedding-3-small  │
│   └───────┬───────┘                                             │
│           │                                                      │
│           ▼                                                      │
│   ┌───────────────────────────────────────────────┐             │
│   │           Vector Similarity Search             │             │
│   │  ┌─────────────────┐   ┌─────────────────┐   │             │
│   │  │ Azure AI Search │   │    Firestore    │   │             │
│   │  │   (Primary)     │   │   (Fallback)    │   │             │
│   │  └────────┬────────┘   └────────┬────────┘   │             │
│   │           │                     │            │             │
│   │           └──────────┬──────────┘            │             │
│   └──────────────────────┼───────────────────────┘             │
│                          │                                      │
│                          ▼                                      │
│   ┌───────────────────────────────────────────────┐             │
│   │           Context Assembly                     │             │
│   │  - Rank by relevance score                    │             │
│   │  - Deduplicate results                        │             │
│   │  - Format for LLM consumption                 │             │
│   └───────────────────────┬───────────────────────┘             │
│                          │                                      │
│                          ▼                                      │
│   ┌───────────────────────────────────────────────┐             │
│   │           LLM Generation                       │             │
│   │  - System prompt + RAG context                │             │
│   │  - User query                                 │             │
│   │  - Azure OpenAI (GPT-4o/4o-mini)             │             │
│   └───────────────────────┬───────────────────────┘             │
│                          │                                      │
│                          ▼                                      │
│   ┌───────────────────────────────────────────────┐             │
│   │           Response with Sources               │             │
│   │  - Generated answer                          │             │
│   │  - Source citations                          │             │
│   │  - Confidence/relevance metadata             │             │
│   └───────────────────────────────────────────────┘             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## RAG Components

### 1. Document Indexing Pipeline

```typescript
// Index a document for RAG retrieval
async function indexDocument(doc: DocumentToIndex): Promise<void> {
  // 1. Generate embedding
  const embedding = await generateEmbedding(doc.content);

  // 2. Store in Firestore (backup)
  await db.collection("doc_embeddings").doc(doc.id).set({
    embedding,
    title: doc.title,
    content: doc.content,
    category: doc.category,
    lastIndexed: new Date(),
  });

  // 3. Index in Azure AI Search (primary)
  await indexClient.uploadDocuments([
    {
      id: doc.id,
      title: doc.title,
      content: doc.content,
      category: doc.category,
      contentVector: embedding,
    },
  ]);
}
```

### 2. Retrieval Functions

```typescript
// Primary: Azure AI Search
// Note: Default minScore is 0.65. Azure AI Search scoring ranges vary by algorithm:
// - Cosine similarity: ~0.333–1.0
// - Euclidean/dot-product: ~0–1
async function searchDocuments(
  query: string,
  options: SearchOptions = {},
): Promise<SearchResult[]> {
  // Use nullish coalescing (??) to preserve explicit falsy values like 0
  const { topK = 5, minScore } = options;
  const effectiveMinScore = minScore ?? 0.65;

  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query);

  // Vector search
  const results = await searchClient.search("*", {
    vectorSearchOptions: {
      queries: [
        {
          kind: "vector",
          vector: queryEmbedding,
          kNearestNeighborsCount: topK,
          fields: ["contentVector"],
        },
      ],
    },
  });

  // Filter by score and format
  return results
    .filter((r) => r.score >= effectiveMinScore)
    .map((r) => ({
      id: r.document.id,
      title: r.document.title,
      content: r.document.content,
      score: r.score,
    }));
}

// Fallback: Firestore with cosine similarity
async function searchDocumentsFallback(
  query: string,
  options: SearchOptions = {},
): Promise<SearchResult[]> {
  // Use nullish coalescing (??) for proper defaults matching primary search path
  const { topK = 5, minScore } = options;
  const effectiveMinScore = minScore ?? 0.65;

  const queryEmbedding = await generateEmbedding(query);
  const snapshot = await db.collection("doc_embeddings").get();

  const results = snapshot.docs.map((doc) => {
    const data = doc.data();
    const similarity = cosineSimilarity(queryEmbedding, data.embedding);
    return { id: doc.id, ...data, score: similarity };
  });

  return results
    .filter((r) => r.score >= effectiveMinScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
```

### 3. Context Assembly

```typescript
// Build RAG context for LLM
function buildRAGContext(
  results: SearchResult[],
  maxTokens: number = 2000,
): RAGContext {
  let context = "";
  const sources: Source[] = [];
  let tokenCount = 0;

  for (const result of results) {
    const chunk = formatChunk(result);
    const chunkTokens = estimateTokens(chunk);

    if (tokenCount + chunkTokens > maxTokens) break;

    context += chunk + "\n\n---\n\n";
    sources.push({
      id: result.id,
      title: result.title,
      score: result.score,
    });
    tokenCount += chunkTokens;
  }

  return { context, sources, tokenCount };
}

function formatChunk(result: SearchResult): string {
  return `[Source: ${result.title}]
${result.content}`;
}
```

---

## Integration Patterns

### Pattern 1: Query-Time RAG

Used by: `askDocumentation`, `searchDocs`

```typescript
async function askDocumentation(question: string): Promise<Answer> {
  // 1. Retrieve relevant documents
  const results = await searchDocuments(question, { topK: 5 });
  const { context, sources } = buildRAGContext(results);

  // 2. Build prompt with RAG context
  const systemPrompt = `${RAG_SYSTEM_PROMPT}

Documentation Context:
${context}`;

  // 3. Generate answer
  const answer = await generateCompletion(systemPrompt, question);

  return { answer, sources, ragEnabled: true };
}
```

### Pattern 2: Context-Enhanced Analysis

Used by: `analyzeCompetitors`, `generateSWOT`, `getMarketInsights`

```typescript
async function analyzeCompetitors(
  competitors: string[],
  focusAreas?: string[],
): Promise<Analysis> {
  // 1. Search for Phoenix context (not competitor data)
  const searchQuery = `Phoenix Rooivalk capabilities ${focusAreas?.join(" ")}`;
  const results = await searchDocuments(searchQuery, { topK: 5 });

  // 2. Build enhanced system prompt
  let systemPrompt = COMPETITOR_SYSTEM_PROMPT;
  if (results.length > 0) {
    const { context } = buildRAGContext(results);
    systemPrompt += `\n\nPHOENIX ROOIVALK DOCUMENTATION:\n${context}`;
  }

  // 3. Generate analysis with grounded Phoenix context
  const analysis = await generateCompletion(systemPrompt, userPrompt);

  return {
    analysis,
    sources: results.map((r) => r.id),
    ragEnabled: results.length > 0,
  };
}
```

### Pattern 3: Semantic Recommendations

Used by: `getReadingRecommendations`

```typescript
async function getReadingRecommendations(
  readDocs: string[],
  currentDocId?: string,
): Promise<Recommendations> {
  // 1. Find related documents to current reading
  const relatedDocs = currentDocId
    ? await getRelatedDocuments(currentDocId, { topK: 5 })
    : [];

  // 2. Find trending/popular in user's categories
  const readCategories = await getDocCategories(readDocs);
  const categoryDocs = await searchByCategories(readCategories);

  // 3. Combine and deduplicate
  const candidates = deduplicateResults([...relatedDocs, ...categoryDocs]);

  // 4. Use LLM to rank and explain
  const recommendations = await rankWithLLM(candidates, {
    readDocs,
    currentDocId,
  });

  return recommendations;
}
```

---

## Options Considered

### Option 1: Azure AI Search (Hybrid) ✅ Selected

| Aspect            | Details                      |
| ----------------- | ---------------------------- |
| **Vector Search** | Native HNSW index            |
| **Hybrid Search** | Vector + keyword combination |
| **Scalability**   | Managed, auto-scaling        |
| **Latency**       | ~100-200ms per query         |

**Pros**:

- Production-grade vector search
- Hybrid search (vector + BM25)
- Semantic ranking
- Managed infrastructure

**Cons**:

- Cost (~$70/month for basic)
- Azure lock-in
- Requires embedding sync

---

### Option 2: Firestore Only

| Aspect          | Details                                   |
| --------------- | ----------------------------------------- |
| **Storage**     | Firestore documents with embedding arrays |
| **Search**      | Client-side cosine similarity             |
| **Scalability** | Limited by document reads                 |

**Pros**:

- No additional service
- Simple implementation
- Firestore already in stack

**Cons**:

- Poor performance at scale (full scan)
- No native vector index
- High read costs with large corpus

---

### Option 3: Pinecone

| Aspect            | Details                  |
| ----------------- | ------------------------ |
| **Vector Search** | Purpose-built vector DB  |
| **Scalability**   | Serverless, auto-scaling |
| **Latency**       | ~50ms per query          |

**Pros**:

- Best-in-class vector search
- Simple API
- Excellent performance

**Cons**:

- Additional vendor
- Cost at scale
- Another service to manage

---

### Option 4: pgvector (PostgreSQL)

| Aspect             | Details                |
| ------------------ | ---------------------- |
| **Vector Search**  | PostgreSQL extension   |
| **Infrastructure** | Self-hosted or managed |
| **Hybrid**         | SQL + vector in one DB |

**Pros**:

- Single database for all data
- SQL joins with vector search
- Open source

**Cons**:

- Requires PostgreSQL setup
- Performance tuning needed
- Not in current stack

---

### Option 5: Cognitive Mesh (Future)

| Aspect             | Details                                |
| ------------------ | -------------------------------------- |
| **Vector Search**  | Integrated RAG in Foundation Layer     |
| **Infrastructure** | C#/.NET enterprise platform            |
| **Hybrid**         | Multi-source retrieval with governance |

**Repository**: https://github.com/justaghost/cognitive-mesh

**Pros**:

- Enterprise-grade RAG with compliance built-in
- Zero-trust security for document access
- RBAC for retrieval permissions
- Audit logging for all queries
- Multi-tenant isolation
- Integrated with reasoning engines

**Cons**:

- Different tech stack (C#/.NET vs TypeScript/Firebase)
- Currently in development
- Requires infrastructure migration
- Higher operational complexity

**When to Consider**:

- When document access requires RBAC controls
- When query audit trails are mandated
- When deploying to regulated industries (defense, finance)
- When multi-tenant isolation is required

**Current Status**: In development. RAG capabilities exist but not
production-ready.

---

## Rationale

### Why Azure AI Search?

| Factor            | Azure Search | Firestore   | Pinecone      | pgvector     | Cognitive Mesh |
| ----------------- | ------------ | ----------- | ------------- | ------------ | -------------- |
| **Performance**   | ✅ Fast      | ❌ Slow     | ✅ Fastest    | ⚠️ Medium    | ✅ Fast        |
| **Stack fit**     | ✅ Azure AI  | ✅ Firebase | ⚠️ New vendor | ⚠️ New infra | ⚠️ C#/.NET     |
| **Hybrid search** | ✅ Native    | ❌ None     | ⚠️ Limited    | ⚠️ Extension | ✅ Native      |
| **Cost**          | ⚠️ Medium    | ✅ Low      | ⚠️ Medium     | ✅ Low       | ⚠️ Self-hosted |
| **Maintenance**   | ✅ Managed   | ✅ Managed  | ✅ Managed    | ⚠️ Self      | ⚠️ Self        |
| **Compliance**    | ⚠️ Manual    | ⚠️ Manual   | ⚠️ Manual     | ⚠️ Manual    | ✅ Built-in    |
| **RBAC**          | ⚠️ External  | ⚠️ External | ❌ Limited    | ⚠️ External  | ✅ Native      |

**Decision**: Azure AI Search provides the best balance of performance,
features, and integration with our existing Azure AI services.

---

## Embedding Strategy

### Model Selection

| Model                  | Dimensions | Performance | Cost            |
| ---------------------- | ---------- | ----------- | --------------- |
| text-embedding-3-small | 1536       | Good        | $0.02/1M tokens |
| text-embedding-3-large | 3072       | Better      | $0.13/1M tokens |
| text-embedding-ada-002 | 1536       | Good        | $0.10/1M tokens |

**Selected**: `text-embedding-3-small` - best cost/performance ratio

### Chunking Strategy

```typescript
const CHUNK_CONFIG = {
  maxChunkSize: 1000, // tokens
  chunkOverlap: 100, // tokens for context
  minChunkSize: 100, // don't create tiny chunks
  splitOn: ["##", "\n\n"], // headers and paragraphs
};

function chunkDocument(content: string): Chunk[] {
  // 1. Split on natural boundaries
  const sections = content.split(/(?=^##)/m);

  // 2. Further split large sections
  const chunks: Chunk[] = [];
  for (const section of sections) {
    if (estimateTokens(section) > CHUNK_CONFIG.maxChunkSize) {
      chunks.push(...splitWithOverlap(section));
    } else if (estimateTokens(section) >= CHUNK_CONFIG.minChunkSize) {
      chunks.push({ content: section });
    }
  }

  return chunks;
}
```

---

## Performance Characteristics

### Latency Breakdown

| Stage            | Latency    | Notes                    |
| ---------------- | ---------- | ------------------------ |
| Query embedding  | ~100ms     | Azure OpenAI             |
| Vector search    | ~100-200ms | Azure AI Search          |
| Context assembly | ~10ms      | Local processing         |
| LLM generation   | ~1-3s      | Depends on output length |
| **Total**        | ~1.5-3.5s  | End-to-end               |

### Caching Strategy

```typescript
// Cache embeddings for repeated queries
const embeddingCache = new Map<string, number[]>();
const CACHE_TTL = 3600000; // 1 hour

async function getEmbeddingCached(text: string): Promise<number[]> {
  const cacheKey = hashText(text);

  if (embeddingCache.has(cacheKey)) {
    return embeddingCache.get(cacheKey)!;
  }

  const embedding = await generateEmbedding(text);
  embeddingCache.set(cacheKey, embedding);

  // Cleanup old entries
  setTimeout(() => embeddingCache.delete(cacheKey), CACHE_TTL);

  return embedding;
}
```

---

## Error Handling & Fallbacks

### Graceful Degradation

```typescript
async function searchWithFallback(query: string): Promise<SearchResult[]> {
  try {
    // Primary: Azure AI Search
    return await searchDocuments(query);
  } catch (error) {
    logger.warn("Azure Search failed, using Firestore fallback", { error });

    try {
      // Fallback: Firestore
      return await searchDocumentsFallback(query);
    } catch (fallbackError) {
      logger.error("All search methods failed", { fallbackError });

      // Return empty results, let LLM respond without context
      return [];
    }
  }
}
```

### RAG-Optional Responses

```typescript
async function generateResponse(prompt: string): Promise<Response> {
  const ragResults = await searchWithFallback(prompt);
  const ragEnabled = ragResults.length > 0;

  const response = await callLLM(
    buildPrompt(prompt, ragEnabled ? ragResults : undefined),
  );

  return {
    answer: response,
    ragEnabled,
    sources: ragEnabled ? ragResults.map((r) => r.id) : [],
    // Include disclaimer if no RAG
    disclaimer: !ragEnabled
      ? "Response generated without documentation context"
      : undefined,
  };
}
```

---

## Monitoring & Observability

### Metrics to Track

| Metric               | Purpose      | Alert Threshold |
| -------------------- | ------------ | --------------- |
| Search latency       | Performance  | > 500ms p95     |
| Search result count  | Relevance    | 0 results > 10% |
| Relevance scores     | Quality      | Avg < 0.6       |
| Fallback rate        | Reliability  | > 5%            |
| Embedding API errors | Availability | > 1%            |

### Logging

```typescript
logger.info("RAG search completed", {
  query: truncate(query, 100),
  resultCount: results.length,
  topScore: results[0]?.score,
  avgScore: average(results.map((r) => r.score)),
  latencyMs: Date.now() - startTime,
  usedFallback: false,
});
```

---

## Consequences

### Positive

- **Grounded responses**: LLM answers based on actual documentation
- **Source citations**: Users can verify information
- **Reduced hallucination**: Context constrains LLM responses
- **Up-to-date info**: Indexed content reflects latest docs
- **Scalable**: Azure AI Search handles growth

### Negative

- **Added latency**: ~500ms for RAG retrieval
- **Complexity**: More moving parts to maintain
- **Cost**: Azure AI Search + embedding API costs
- **Index sync**: Need to keep search index updated

### Risks

| Risk                | Mitigation                        |
| ------------------- | --------------------------------- |
| Stale index         | Automated indexing on doc publish |
| Search service down | Firestore fallback                |
| Poor relevance      | Tune min score, hybrid search     |
| Cost overrun        | Monitor usage, set quotas         |

---

## Future Enhancements

### Short-term

1. **Hybrid search tuning**: Optimize vector + keyword balance
2. **Semantic caching**: Cache full RAG results for common queries
3. **Index monitoring**: Track index freshness and coverage

### Long-term

1. **Multi-modal RAG**: Include images and diagrams
2. **Query expansion**: Use LLM to expand queries before search
3. **Feedback loop**: Use user ratings to improve relevance
4. **Agentic RAG**: Multi-step retrieval for complex queries

---

## Implementation Recommendation

### Decision: **Keep Here** ✅

| Factor                 | Assessment                           |
| ---------------------- | ------------------------------------ |
| **Current Status**     | Implemented with Azure AI Search     |
| **CM Equivalent**      | FoundationLayer (~30% complete)      |
| **Migration Value**    | Low - Azure AI Search works well     |
| **Resource Trade-off** | Current solution is production-ready |

**Rationale**: The Azure AI Search + Firestore fallback architecture is working
well for the documentation site. Cognitive Mesh's RAG is designed for
multi-tenant deployments with document-level RBAC, which is unnecessary here
since all documentation is public.

**Action**: No changes needed. Continue using current implementation.

See
[ADR 0000 Appendix: CM Feature Recommendations](./adr-0000-appendix-cogmesh-feature-recommendations.md)
for full analysis.

---

## Related ADRs

- [ADR 0000: ADR Management](./adr-0000-adr-management.md) - Platform decision
  framework
- [ADR 0011: Vector Database Selection](./adr-0011-vector-database-selection.md)
- [ADR 0012: Runtime Functions Architecture](./adr-0012-runtime-functions.md)
- [ADR 0015: Prompt Management](./adr-0015-prompt-management.md)
- [ADR 0017: Context Management](./adr-0017-context-management.md)
- [Cognitive Mesh](https://github.com/justaghost/cognitive-mesh) - Future
  enterprise platform

---

_© 2025 Phoenix Rooivalk. Confidential._
