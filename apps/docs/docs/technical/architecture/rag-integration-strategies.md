---
title: RAG Integration Strategies
sidebar_label: RAG Strategies
description: Strategies for integrating documentation with AI features using Retrieval-Augmented Generation
---

# RAG Integration Strategies

This document outlines different approaches for integrating our documentation (~107 files, ~208K words) with the AI assistant using Retrieval-Augmented Generation (RAG).

## What is RAG?

RAG enhances AI responses by:
1. Converting documents into vector embeddings
2. Storing embeddings in a searchable database
3. When a user asks a question, finding relevant document chunks
4. Passing those chunks as context to the LLM
5. Generating responses grounded in actual documentation

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   User      │────▶│  Embedding   │────▶│  Vector     │
│   Query     │     │  Generation  │     │  Search     │
└─────────────┘     └──────────────┘     └─────────────┘
                                                │
                                                ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   AI        │◀────│  LLM with    │◀────│  Relevant   │
│   Response  │     │  Context     │     │  Chunks     │
└─────────────┘     └──────────────┘     └─────────────┘
```

## Strategy Comparison

| Strategy | Complexity | Cost | Latency | Scalability | Best For |
|----------|------------|------|---------|-------------|----------|
| OpenAI Assistants | Low | Medium | Low | High | Quick implementation |
| Firebase + Functions | Medium | Low | Medium | Medium | Staying in ecosystem |
| Pinecone | Medium | Medium | Low | High | Production at scale |
| Supabase pgvector | Medium | Low | Low | High | SQL + vectors |
| Vertex AI | Medium | Medium | Low | High | Google Cloud users |
| Build-time Static | Low | None | Very Low | Low | Small docs, client-side |

---

## Strategy 1: OpenAI Assistants API (Recommended for Quick Start)

### Overview

OpenAI's Assistants API includes built-in file search (vector store) capabilities.

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    OpenAI Platform                       │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │  Assistant  │  │  Vector     │  │  Thread         │ │
│  │  (GPT-4)    │◀─│  Store      │◀─│  (Conversation) │ │
│  └─────────────┘  └─────────────┘  └─────────────────┘ │
│         │               │                    ▲          │
│         ▼               │                    │          │
│  ┌─────────────┐        │                    │          │
│  │  Response   │        │                    │          │
│  └─────────────┘        │                    │          │
└─────────────────────────┼────────────────────┼──────────┘
                          │                    │
                    ┌─────┴─────┐         ┌────┴────┐
                    │  Upload   │         │  User   │
                    │  Docs     │         │  Query  │
                    └───────────┘         └─────────┘
```

### Implementation

```typescript
// functions/src/rag/openai-assistants.ts
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// One-time setup: Create assistant with file search
export async function createAssistant() {
  // Upload documentation files
  const files = await uploadDocumentation();

  // Create vector store
  const vectorStore = await openai.beta.vectorStores.create({
    name: "Phoenix Rooivalk Docs",
    file_ids: files.map(f => f.id),
  });

  // Create assistant with file search tool
  const assistant = await openai.beta.assistants.create({
    name: "Phoenix Rooivalk Documentation Assistant",
    instructions: `You are an expert on Phoenix Rooivalk's autonomous counter-drone systems.
    Answer questions using ONLY the provided documentation.
    Always cite the specific document when providing information.
    If the answer isn't in the docs, say so.`,
    model: "gpt-4o",
    tools: [{ type: "file_search" }],
    tool_resources: {
      file_search: {
        vector_store_ids: [vectorStore.id]
      }
    }
  });

  return assistant;
}

// Query the assistant
export async function queryDocumentation(
  assistantId: string,
  question: string,
  threadId?: string
) {
  // Create or continue thread
  const thread = threadId
    ? { id: threadId }
    : await openai.beta.threads.create();

  // Add message
  await openai.beta.threads.messages.create(thread.id, {
    role: "user",
    content: question
  });

  // Run assistant
  const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
    assistant_id: assistantId
  });

  // Get response
  const messages = await openai.beta.threads.messages.list(thread.id);
  const response = messages.data[0];

  return {
    answer: response.content[0].text.value,
    citations: response.content[0].text.annotations,
    threadId: thread.id
  };
}
```

### Pros
- Built-in chunking and embedding
- Automatic citation support
- Conversation memory via threads
- No vector DB to manage

### Cons
- Data stored on OpenAI servers
- Less control over retrieval
- Cost per token + storage

### Cost Estimate
- Storage: $0.10/GB/day (~1MB docs = ~$0.003/day)
- Retrieval: ~$0.03 per query (embedding + search)
- Generation: ~$0.01-0.03 per response

---

## Strategy 2: Firebase + Cloud Functions (Recommended for Ecosystem)

### Overview

Store embeddings in Firestore, search with Cloud Functions.

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Firebase                              │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │  Firestore  │  │  Cloud      │  │  Cloud          │ │
│  │  Embeddings │◀─│  Functions  │◀─│  Functions      │ │
│  │  Collection │  │  (Search)   │  │  (Index)        │ │
│  └─────────────┘  └─────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
                    ┌─────┴─────┐
                    │  OpenAI   │
                    │  Embed    │
                    └───────────┘
```

### Data Model

```typescript
// Firestore collection: doc_embeddings
interface DocChunk {
  id: string;                    // chunk_id
  docId: string;                 // Original doc path
  docTitle: string;              // Document title
  chunkIndex: number;            // Position in document
  content: string;               // Chunk text (500-1000 tokens)
  embedding: number[];           // 1536-dim vector (text-embedding-3-small)
  metadata: {
    section: string;             // Section heading
    category: string;            // Doc category
    wordCount: number;
    lastUpdated: Timestamp;
  };
}
```

### Implementation

```typescript
// functions/src/rag/firebase-rag.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import OpenAI from 'openai';

const db = admin.firestore();
const openai = new OpenAI();

// Chunk size configuration
const CHUNK_SIZE = 500;  // tokens
const CHUNK_OVERLAP = 100;  // tokens

/**
 * Index a document into the vector store
 */
export async function indexDocument(
  docPath: string,
  content: string,
  metadata: { title: string; category: string }
) {
  // Split into chunks
  const chunks = chunkDocument(content, CHUNK_SIZE, CHUNK_OVERLAP);

  // Generate embeddings for all chunks
  const embeddings = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: chunks.map(c => c.text),
  });

  // Store in Firestore
  const batch = db.batch();

  chunks.forEach((chunk, i) => {
    const ref = db.collection('doc_embeddings').doc();
    batch.set(ref, {
      docId: docPath,
      docTitle: metadata.title,
      chunkIndex: i,
      content: chunk.text,
      embedding: embeddings.data[i].embedding,
      metadata: {
        section: chunk.section,
        category: metadata.category,
        wordCount: chunk.text.split(/\s+/).length,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      },
    });
  });

  await batch.commit();
  return chunks.length;
}

/**
 * Search for relevant document chunks
 */
export async function searchDocuments(
  query: string,
  topK: number = 5,
  filters?: { category?: string }
): Promise<Array<{ chunk: DocChunk; score: number }>> {
  // Generate query embedding
  const queryEmbedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query,
  });
  const queryVector = queryEmbedding.data[0].embedding;

  // Get all embeddings (for small-medium collections)
  // For larger collections, use batch processing or external vector DB
  let query = db.collection('doc_embeddings');

  if (filters?.category) {
    query = query.where('metadata.category', '==', filters.category);
  }

  const snapshot = await query.get();

  // Calculate cosine similarity
  const results = snapshot.docs.map(doc => {
    const data = doc.data() as DocChunk;
    const score = cosineSimilarity(queryVector, data.embedding);
    return { chunk: data, score };
  });

  // Sort by similarity and return top K
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/**
 * Query documentation with RAG
 */
export async function queryWithRAG(
  question: string,
  options?: {
    category?: string;
    topK?: number;
    includeSource?: boolean;
  }
) {
  const { category, topK = 5, includeSource = true } = options || {};

  // Search for relevant chunks
  const relevantChunks = await searchDocuments(question, topK, { category });

  // Build context from chunks
  const context = relevantChunks
    .map(r => `[Source: ${r.chunk.docTitle}]\n${r.chunk.content}`)
    .join('\n\n---\n\n');

  // Query LLM with context
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are Phoenix Rooivalk's documentation assistant.
Answer questions using ONLY the provided context.
If the context doesn't contain the answer, say "I don't have information about that in the documentation."
Always cite which document you're referencing.`
      },
      {
        role: 'user',
        content: `Context:\n${context}\n\nQuestion: ${question}`
      }
    ],
    temperature: 0.3,
  });

  return {
    answer: response.choices[0].message.content,
    sources: includeSource
      ? relevantChunks.map(r => ({
          title: r.chunk.docTitle,
          docId: r.chunk.docId,
          relevance: r.score
        }))
      : undefined
  };
}

// Helper: Cosine similarity
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Helper: Chunk document
function chunkDocument(
  content: string,
  chunkSize: number,
  overlap: number
): Array<{ text: string; section: string }> {
  // Simple implementation - split by sections/paragraphs
  const sections = content.split(/\n#{1,3}\s/);
  const chunks: Array<{ text: string; section: string }> = [];

  for (const section of sections) {
    const lines = section.split('\n');
    const sectionTitle = lines[0] || 'Content';
    let currentChunk = '';

    for (const line of lines) {
      if ((currentChunk + line).length > chunkSize * 4) { // ~4 chars per token
        if (currentChunk) {
          chunks.push({ text: currentChunk.trim(), section: sectionTitle });
        }
        currentChunk = line;
      } else {
        currentChunk += '\n' + line;
      }
    }

    if (currentChunk.trim()) {
      chunks.push({ text: currentChunk.trim(), section: sectionTitle });
    }
  }

  return chunks;
}
```

### Pros
- Stays within Firebase ecosystem
- Full control over chunking/retrieval
- No external vector DB cost
- Works well for <10K documents

### Cons
- Manual implementation of vector search
- Slower than purpose-built vector DBs
- All embeddings loaded for search (unless paginated)

### Cost Estimate
- Firestore: ~$0.06 per 100K reads
- OpenAI Embeddings: $0.02 per 1M tokens (~$0.004 for all docs)
- OpenAI Generation: ~$0.01-0.02 per query

---

## Strategy 3: Pinecone Vector Database

### Overview

Purpose-built vector database for production scale.

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Firebase Functions                                      │
│  ┌─────────────────────────────────────────────────────┐│
│  │  ┌─────────┐    ┌──────────┐    ┌────────────────┐ ││
│  │  │ Index   │───▶│ Pinecone │◀───│ Query Function │ ││
│  │  │ Function│    │ Index    │    │ (RAG)          │ ││
│  │  └─────────┘    └──────────┘    └────────────────┘ ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### Implementation

```typescript
// functions/src/rag/pinecone-rag.ts
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!
});

const openai = new OpenAI();
const index = pinecone.index('phoenix-docs');

/**
 * Upsert document chunks to Pinecone
 */
export async function indexToPinecone(
  chunks: Array<{
    id: string;
    text: string;
    metadata: Record<string, any>;
  }>
) {
  // Generate embeddings
  const embeddings = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: chunks.map(c => c.text),
  });

  // Prepare vectors for Pinecone
  const vectors = chunks.map((chunk, i) => ({
    id: chunk.id,
    values: embeddings.data[i].embedding,
    metadata: {
      ...chunk.metadata,
      text: chunk.text, // Store text in metadata for retrieval
    },
  }));

  // Upsert in batches
  const batchSize = 100;
  for (let i = 0; i < vectors.length; i += batchSize) {
    await index.upsert(vectors.slice(i, i + batchSize));
  }

  return vectors.length;
}

/**
 * Search Pinecone and generate response
 */
export async function queryPinecone(
  question: string,
  options?: {
    topK?: number;
    filter?: Record<string, any>;
    namespace?: string;
  }
) {
  const { topK = 5, filter, namespace } = options || {};

  // Generate query embedding
  const queryEmbedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: question,
  });

  // Query Pinecone
  const results = await index.query({
    vector: queryEmbedding.data[0].embedding,
    topK,
    filter,
    includeMetadata: true,
    namespace,
  });

  // Extract context from results
  const context = results.matches
    .map(m => `[${m.metadata?.docTitle}]\n${m.metadata?.text}`)
    .join('\n\n---\n\n');

  // Generate response with context
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Answer using only the provided documentation context.`
      },
      {
        role: 'user',
        content: `Context:\n${context}\n\nQuestion: ${question}`
      }
    ],
  });

  return {
    answer: response.choices[0].message.content,
    sources: results.matches.map(m => ({
      docId: m.metadata?.docId,
      title: m.metadata?.docTitle,
      score: m.score,
    })),
  };
}
```

### Pros
- Purpose-built for vector search
- Fast queries (~50ms)
- Scales to millions of vectors
- Metadata filtering

### Cons
- Additional service to manage
- Cost at scale
- Network latency to external service

### Cost Estimate
- Pinecone Starter: Free (100K vectors)
- Pinecone Standard: $70/month (1M vectors)
- Plus OpenAI costs

---

## Strategy 4: Build-Time Static RAG

### Overview

Generate embeddings at build time, store in static JSON, search client-side.

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Build Time                            │
│  ┌────────────┐    ┌─────────────┐    ┌──────────────┐ │
│  │  Markdown  │───▶│  Generate   │───▶│  Static JSON │ │
│  │  Files     │    │  Embeddings │    │  (chunks +   │ │
│  │            │    │             │    │   vectors)   │ │
│  └────────────┘    └─────────────┘    └──────────────┘ │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    Runtime (Client)                      │
│  ┌────────────┐    ┌─────────────┐    ┌──────────────┐ │
│  │  User      │───▶│  Local      │───▶│  Send to     │ │
│  │  Query     │    │  Vector     │    │  OpenAI with │ │
│  │            │    │  Search     │    │  Context     │ │
│  └────────────┘    └─────────────┘    └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Implementation

```typescript
// scripts/generate-embeddings.ts (run at build time)
import fs from 'fs';
import path from 'path';
import glob from 'glob';
import OpenAI from 'openai';

const openai = new OpenAI();

async function generateEmbeddings() {
  const docsPath = 'docs/**/*.md';
  const files = glob.sync(docsPath);

  const chunks: Array<{
    id: string;
    docId: string;
    title: string;
    content: string;
    embedding: number[];
  }> = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const title = extractTitle(content);
    const textChunks = chunkText(content, 500);

    for (let i = 0; i < textChunks.length; i++) {
      const embedding = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: textChunks[i],
      });

      chunks.push({
        id: `${file}-${i}`,
        docId: file,
        title,
        content: textChunks[i],
        embedding: embedding.data[0].embedding,
      });
    }
  }

  // Write to static file
  fs.writeFileSync(
    'static/embeddings.json',
    JSON.stringify(chunks)
  );

  console.log(`Generated ${chunks.length} chunks`);
}

// Client-side search
// src/utils/localRAG.ts
export class LocalRAG {
  private chunks: Array<{
    id: string;
    docId: string;
    title: string;
    content: string;
    embedding: number[];
  }> = [];

  async load() {
    const response = await fetch('/embeddings.json');
    this.chunks = await response.json();
  }

  async search(queryEmbedding: number[], topK: number = 5) {
    const scored = this.chunks.map(chunk => ({
      ...chunk,
      score: this.cosineSimilarity(queryEmbedding, chunk.embedding),
    }));

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    // Same implementation as before
  }
}
```

### Pros
- No runtime infrastructure
- Fast client-side search
- Works offline
- No per-query costs

### Cons
- Embeddings in client bundle (~3MB for 200K words)
- Query embedding still needs API
- Updates require rebuild
- Exposes content structure

---

## Strategy 5: Hybrid Approach (Recommended)

### Overview

Combine strategies for optimal cost/performance:
- **Frequently asked**: Pre-computed answers in Firestore
- **Documentation queries**: Firebase + OpenAI RAG
- **Complex analysis**: Direct to GPT-4 with context

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Query Router                          │
│  ┌─────────────────────────────────────────────────────┐│
│  │         ┌─────────────────────────────┐             ││
│  │         │      Query Classifier       │             ││
│  │         └─────────────────────────────┘             ││
│  │                      │                              ││
│  │         ┌────────────┼────────────┐                ││
│  │         ▼            ▼            ▼                ││
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐        ││
│  │  │   FAQ     │ │    RAG    │ │  Complex  │        ││
│  │  │   Cache   │ │  Search   │ │  Analysis │        ││
│  │  │ (Fast)    │ │ (Medium)  │ │  (Slow)   │        ││
│  │  └───────────┘ └───────────┘ └───────────┘        ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### Implementation Overview

```typescript
// functions/src/rag/hybrid-rag.ts

export async function answerQuestion(question: string, userId: string) {
  // 1. Check FAQ cache first
  const cachedAnswer = await checkFAQCache(question);
  if (cachedAnswer) {
    return { answer: cachedAnswer, source: 'cache', cost: 0 };
  }

  // 2. Classify query complexity
  const queryType = classifyQuery(question);

  // 3. Route to appropriate handler
  switch (queryType) {
    case 'simple':
      // Use lightweight RAG with gpt-4o-mini
      return await simpleRAG(question);

    case 'documentation':
      // Full RAG with context retrieval
      return await documentationRAG(question);

    case 'analysis':
      // Complex analysis with gpt-4o
      return await complexAnalysis(question);

    default:
      return await documentationRAG(question);
  }
}

function classifyQuery(question: string): 'simple' | 'documentation' | 'analysis' {
  const lowerQ = question.toLowerCase();

  // Simple factual queries
  if (lowerQ.match(/what is|define|meaning of|how does.*work/)) {
    return 'simple';
  }

  // Analysis queries
  if (lowerQ.match(/compare|analyze|recommend|strategy|should we/)) {
    return 'analysis';
  }

  // Default to documentation search
  return 'documentation';
}
```

---

## Recommendation for Phoenix Rooivalk

Given our documentation size (~208K words, 107 files) and existing Firebase infrastructure:

### Phase 1: Quick Implementation (1-2 days)
**Strategy: Firebase + Cloud Functions RAG**

1. Index all docs at deploy time
2. Store embeddings in Firestore
3. Simple cosine similarity search
4. Integrate with existing AI functions

### Phase 2: Enhancement (Future)
**Strategy: Add OpenAI Assistants for conversations**

1. Create persistent assistant
2. Enable conversation threads
3. Add citation support

### Phase 3: Scale (If needed)
**Strategy: Migrate to Pinecone**

1. Move embeddings to Pinecone
2. Keep Firestore for metadata
3. Faster queries at scale

---

## Next Steps

1. **Implement Firebase RAG**
   - Create indexing function
   - Create search function
   - Integrate with AI panel

2. **Index documentation**
   - Run indexing on all 107 docs
   - Store ~500-1000 chunks

3. **Update AI functions**
   - Add documentation context
   - Improve prompts with RAG

4. **Add feedback loop**
   - Track which chunks are used
   - Improve retrieval over time

See [RAG Implementation Guide](./rag-implementation.md) for detailed implementation steps.
