---
title: RAG Implementation Guide
sidebar_label: RAG Implementation
description: Step-by-step guide to implementing RAG for documentation
---

# RAG Implementation Guide

This guide walks through implementing Retrieval-Augmented Generation (RAG) for the Phoenix Rooivalk documentation site using Firebase and OpenAI.

## Prerequisites

- Firebase project configured
- OpenAI API key
- Cloud Functions deployed
- Documentation indexed in Firestore

## Architecture Overview

```
┌────────────────────────────────────────────────────────────────┐
│                     Documentation Site                          │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐     ┌─────────────────────────────────────┐  │
│  │   User      │────▶│         AI Panel                    │  │
│  │   Question  │     │  "How does the RKV targeting work?" │  │
│  └─────────────┘     └─────────────────────────────────────┘  │
│                                    │                            │
│                                    ▼                            │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              Cloud Function: queryWithRAG                │  │
│  │                                                          │  │
│  │  1. Generate query embedding (OpenAI)                   │  │
│  │  2. Search doc_embeddings collection (Firestore)        │  │
│  │  3. Retrieve top K relevant chunks                      │  │
│  │  4. Build context prompt                                │  │
│  │  5. Generate answer with context (OpenAI)               │  │
│  │  6. Return answer + sources                             │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                    │                            │
│                                    ▼                            │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                    Response                              │  │
│  │  "The RKV targeting system uses... [Source: technical-  │  │
│  │   architecture.md, defense-integration.md]"             │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

## Step 1: Data Model

### Firestore Collection: `doc_embeddings`

```typescript
interface DocChunk {
  // Identifiers
  docId: string;           // e.g., "/docs/technical/architecture"
  chunkId: string;         // e.g., "technical-architecture-chunk-3"

  // Content
  title: string;           // Document title
  section: string;         // Section heading
  content: string;         // Chunk text (500-1000 tokens)

  // Vector
  embedding: number[];     // 1536 dimensions (text-embedding-3-small)

  // Metadata
  metadata: {
    category: string;      // e.g., "technical", "business", "operations"
    wordCount: number;
    charCount: number;
    chunkIndex: number;    // Position in original doc
    totalChunks: number;   // Total chunks in this doc
  };

  // Timestamps
  indexedAt: Timestamp;
  docUpdatedAt: Timestamp;
}
```

### Firestore Collection: `doc_metadata`

```typescript
interface DocMetadata {
  docId: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  wordCount: number;
  chunkCount: number;
  lastIndexed: Timestamp;
  frontmatter: Record<string, any>;
}
```

## Step 2: Indexing Function

Create the document indexing Cloud Function:

```typescript
// functions/src/rag/indexer.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import OpenAI from 'openai';
import * as crypto from 'crypto';

const db = admin.firestore();
const openai = new OpenAI({ apiKey: functions.config().openai.key });

// Configuration
const CONFIG = {
  embeddingModel: 'text-embedding-3-small',
  chunkSize: 500,        // Target tokens per chunk
  chunkOverlap: 50,      // Overlap between chunks
  maxChunkChars: 2000,   // Max characters per chunk
  batchSize: 20,         // Embeddings per batch (OpenAI limit)
};

/**
 * Index a single document
 */
export async function indexDocument(
  docId: string,
  content: string,
  metadata: {
    title: string;
    category: string;
    description?: string;
    tags?: string[];
  }
): Promise<{ chunksCreated: number; tokensUsed: number }> {
  // Parse frontmatter if present
  const { frontmatter, body } = parseFrontmatter(content);

  // Split into chunks
  const chunks = chunkDocument(body, CONFIG.chunkSize, CONFIG.chunkOverlap);

  if (chunks.length === 0) {
    functions.logger.warn(`No chunks generated for ${docId}`);
    return { chunksCreated: 0, tokensUsed: 0 };
  }

  // Generate embeddings in batches
  const allEmbeddings: number[][] = [];
  let totalTokens = 0;

  for (let i = 0; i < chunks.length; i += CONFIG.batchSize) {
    const batch = chunks.slice(i, i + CONFIG.batchSize);

    const response = await openai.embeddings.create({
      model: CONFIG.embeddingModel,
      input: batch.map(c => c.text),
    });

    allEmbeddings.push(...response.data.map(d => d.embedding));
    totalTokens += response.usage?.total_tokens || 0;
  }

  // Delete existing chunks for this document
  const existingChunks = await db.collection('doc_embeddings')
    .where('docId', '==', docId)
    .get();

  const deleteBatch = db.batch();
  existingChunks.docs.forEach(doc => deleteBatch.delete(doc.ref));
  await deleteBatch.commit();

  // Store new chunks
  const writeBatch = db.batch();
  const now = admin.firestore.FieldValue.serverTimestamp();

  chunks.forEach((chunk, index) => {
    const chunkId = `${hashString(docId)}-${index}`;
    const ref = db.collection('doc_embeddings').doc(chunkId);

    writeBatch.set(ref, {
      docId,
      chunkId,
      title: metadata.title || frontmatter.title || 'Untitled',
      section: chunk.section,
      content: chunk.text,
      embedding: allEmbeddings[index],
      metadata: {
        category: metadata.category || frontmatter.category || 'general',
        wordCount: chunk.text.split(/\s+/).length,
        charCount: chunk.text.length,
        chunkIndex: index,
        totalChunks: chunks.length,
      },
      indexedAt: now,
      docUpdatedAt: now,
    });
  });

  await writeBatch.commit();

  // Update document metadata
  await db.collection('doc_metadata').doc(hashString(docId)).set({
    docId,
    title: metadata.title || frontmatter.title || 'Untitled',
    description: metadata.description || frontmatter.description || '',
    category: metadata.category || frontmatter.category || 'general',
    tags: metadata.tags || frontmatter.tags || [],
    wordCount: body.split(/\s+/).length,
    chunkCount: chunks.length,
    lastIndexed: now,
    frontmatter,
  });

  functions.logger.info(`Indexed ${docId}: ${chunks.length} chunks, ${totalTokens} tokens`);

  return { chunksCreated: chunks.length, tokensUsed: totalTokens };
}

/**
 * Chunk document into smaller pieces
 */
function chunkDocument(
  content: string,
  targetSize: number,
  overlap: number
): Array<{ text: string; section: string }> {
  const chunks: Array<{ text: string; section: string }> = [];

  // Split by headers first
  const sections = content.split(/(?=^#{1,3}\s)/m);

  for (const section of sections) {
    if (!section.trim()) continue;

    // Extract section heading
    const headingMatch = section.match(/^#{1,3}\s+(.+)/);
    const sectionName = headingMatch ? headingMatch[1].trim() : 'Content';

    // Split large sections by paragraphs
    const paragraphs = section.split(/\n\n+/);
    let currentChunk = '';

    for (const para of paragraphs) {
      const cleanPara = para.trim();
      if (!cleanPara) continue;

      // If adding this paragraph exceeds max size, save current chunk
      if (currentChunk && (currentChunk + '\n\n' + cleanPara).length > CONFIG.maxChunkChars) {
        chunks.push({
          text: currentChunk.trim(),
          section: sectionName,
        });

        // Start new chunk with overlap
        const words = currentChunk.split(/\s+/);
        const overlapWords = words.slice(-overlap);
        currentChunk = overlapWords.join(' ') + '\n\n' + cleanPara;
      } else {
        currentChunk = currentChunk
          ? currentChunk + '\n\n' + cleanPara
          : cleanPara;
      }
    }

    // Don't forget the last chunk
    if (currentChunk.trim()) {
      chunks.push({
        text: currentChunk.trim(),
        section: sectionName,
      });
    }
  }

  return chunks;
}

/**
 * Parse frontmatter from markdown
 */
function parseFrontmatter(content: string): {
  frontmatter: Record<string, any>;
  body: string;
} {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!fmMatch) {
    return { frontmatter: {}, body: content };
  }

  try {
    // Simple YAML-like parsing
    const fm: Record<string, any> = {};
    const lines = fmMatch[1].split('\n');

    for (const line of lines) {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length) {
        const value = valueParts.join(':').trim();
        fm[key.trim()] = value.replace(/^["']|["']$/g, '');
      }
    }

    return { frontmatter: fm, body: fmMatch[2] };
  } catch {
    return { frontmatter: {}, body: content };
  }
}

/**
 * Generate consistent hash for document ID
 */
function hashString(str: string): string {
  return crypto.createHash('md5').update(str).digest('hex').slice(0, 12);
}
```

## Step 3: Search Function

Create the semantic search function:

```typescript
// functions/src/rag/search.ts
import * as admin from 'firebase-admin';
import OpenAI from 'openai';
import * as functions from 'firebase-functions';

const db = admin.firestore();
const openai = new OpenAI({ apiKey: functions.config().openai.key });

interface SearchResult {
  docId: string;
  chunkId: string;
  title: string;
  section: string;
  content: string;
  score: number;
  metadata: {
    category: string;
    chunkIndex: number;
    totalChunks: number;
  };
}

/**
 * Search for relevant document chunks
 */
export async function searchDocuments(
  query: string,
  options?: {
    topK?: number;
    category?: string;
    minScore?: number;
  }
): Promise<SearchResult[]> {
  const { topK = 5, category, minScore = 0.7 } = options || {};

  // Generate query embedding
  const queryEmbedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query,
  });
  const queryVector = queryEmbedding.data[0].embedding;

  // Build Firestore query
  let firestoreQuery: admin.firestore.Query = db.collection('doc_embeddings');

  if (category) {
    firestoreQuery = firestoreQuery.where('metadata.category', '==', category);
  }

  // Get all embeddings (for collections < 10K docs)
  const snapshot = await firestoreQuery.get();

  // Calculate similarity scores
  const results: SearchResult[] = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const score = cosineSimilarity(queryVector, data.embedding);

    if (score >= minScore) {
      results.push({
        docId: data.docId,
        chunkId: data.chunkId,
        title: data.title,
        section: data.section,
        content: data.content,
        score,
        metadata: data.metadata,
      });
    }
  }

  // Sort by score and return top K
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/**
 * Cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);

  if (magnitude === 0) return 0;

  return dotProduct / magnitude;
}
```

## Step 4: RAG Query Function

Create the main RAG query function:

```typescript
// functions/src/rag/query.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import OpenAI from 'openai';
import { searchDocuments, SearchResult } from './search';

const db = admin.firestore();
const openai = new OpenAI({ apiKey: functions.config().openai.key });

interface RAGResponse {
  answer: string;
  sources: Array<{
    docId: string;
    title: string;
    section: string;
    relevance: number;
  }>;
  confidence: 'high' | 'medium' | 'low';
  tokensUsed: number;
}

/**
 * Query documentation with RAG
 */
export async function queryWithRAG(
  question: string,
  options?: {
    topK?: number;
    category?: string;
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
    responseFormat?: 'detailed' | 'concise';
  }
): Promise<RAGResponse> {
  const {
    topK = 5,
    category,
    conversationHistory = [],
    responseFormat = 'detailed'
  } = options || {};

  // Search for relevant chunks
  const relevantChunks = await searchDocuments(question, {
    topK,
    category,
    minScore: 0.65,
  });

  // Determine confidence based on top scores
  const avgScore = relevantChunks.length > 0
    ? relevantChunks.reduce((sum, c) => sum + c.score, 0) / relevantChunks.length
    : 0;

  const confidence: 'high' | 'medium' | 'low' =
    avgScore > 0.85 ? 'high' :
    avgScore > 0.75 ? 'medium' : 'low';

  // Build context from chunks
  const context = relevantChunks
    .map((chunk, i) =>
      `[Source ${i + 1}: ${chunk.title} - ${chunk.section}]\n${chunk.content}`
    )
    .join('\n\n---\n\n');

  // Build system prompt
  const systemPrompt = `You are Phoenix Rooivalk's documentation assistant, an expert on autonomous counter-drone defense systems.

IMPORTANT RULES:
1. Answer ONLY using information from the provided documentation context
2. If the context doesn't contain relevant information, say "I don't have specific documentation on that topic"
3. Always cite your sources using [Source X] notation
4. Be accurate and technical, but explain complex concepts clearly
5. If asked about competitors or sensitive topics, refer to the appropriate documentation sections

Context about Phoenix Rooivalk:
- Autonomous reusable kinetic interceptor for counter-UAS defense
- Uses blockchain-verified chain of custody
- AI-powered targeting with human-in-the-loop options
- Designed for military and critical infrastructure protection

Response format: ${responseFormat === 'detailed'
  ? 'Provide comprehensive answers with technical details and multiple source citations.'
  : 'Provide concise, focused answers. Be brief but accurate.'}`;

  // Build messages
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
  ];

  // Add conversation history
  for (const msg of conversationHistory.slice(-4)) { // Last 4 messages
    messages.push({ role: msg.role, content: msg.content });
  }

  // Add context and question
  messages.push({
    role: 'user',
    content: `Documentation Context:
${context}

---

Question: ${question}

Please answer based on the documentation above. Cite sources using [Source X] notation.`
  });

  // Generate response
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    temperature: 0.3,
    max_tokens: 1500,
  });

  const answer = completion.choices[0].message.content || 'Unable to generate response.';

  return {
    answer,
    sources: relevantChunks.map(chunk => ({
      docId: chunk.docId,
      title: chunk.title,
      section: chunk.section,
      relevance: Math.round(chunk.score * 100) / 100,
    })),
    confidence,
    tokensUsed: completion.usage?.total_tokens || 0,
  };
}

/**
 * Exposed Cloud Function
 */
export const askDocumentation = functions.https.onCall(async (data, context) => {
  // Require authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated to query documentation'
    );
  }

  // Rate limiting
  const canProceed = await checkRateLimit(context.auth.uid, 'rag_query');
  if (!canProceed) {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      'Rate limit exceeded. Please try again later.'
    );
  }

  const { question, category, format } = data;

  if (!question || typeof question !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Question is required'
    );
  }

  try {
    const response = await queryWithRAG(question, {
      category,
      responseFormat: format || 'detailed',
    });

    // Log usage
    await db.collection('ai_usage').add({
      userId: context.auth.uid,
      feature: 'rag_query',
      question: question.substring(0, 200),
      sourcesUsed: response.sources.length,
      confidence: response.confidence,
      tokensUsed: response.tokensUsed,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return response;
  } catch (error) {
    functions.logger.error('RAG query error:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to process question'
    );
  }
});

// Rate limiting helper
async function checkRateLimit(userId: string, feature: string): Promise<boolean> {
  const ref = db.collection('ai_rate_limits').doc(`${userId}_${feature}`);
  const doc = await ref.get();

  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  const maxRequests = 50; // 50 RAG queries per hour

  if (doc.exists) {
    const data = doc.data();
    const windowStart = data?.windowStart || 0;
    const count = data?.count || 0;

    if (now - windowStart < windowMs) {
      if (count >= maxRequests) return false;
      await ref.update({ count: count + 1 });
    } else {
      await ref.set({ windowStart: now, count: 1 });
    }
  } else {
    await ref.set({ windowStart: now, count: 1 });
  }

  return true;
}
```

## Step 5: Index All Documentation

Create a script to index all documentation:

```typescript
// functions/src/rag/index-all.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { indexDocument } from './indexer';

const db = admin.firestore();

// Category mapping based on path
const CATEGORY_MAP: Record<string, string> = {
  'technical': 'technical',
  'business': 'business',
  'operations': 'operations',
  'executive': 'executive',
  'legal': 'legal',
  'research': 'research',
};

/**
 * Admin function to index all documentation
 * Run via: firebase functions:call indexAllDocumentation
 */
export const indexAllDocumentation = functions
  .runWith({ timeoutSeconds: 540, memory: '1GB' })
  .https.onCall(async (data, context) => {
    // Admin only
    if (!context.auth?.token.admin) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Admin access required'
      );
    }

    const { docs } = data;

    if (!Array.isArray(docs)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'docs must be an array of { path, content, title }'
      );
    }

    const results = {
      indexed: 0,
      failed: 0,
      totalChunks: 0,
      totalTokens: 0,
      errors: [] as string[],
    };

    for (const doc of docs) {
      try {
        // Determine category from path
        const pathParts = doc.path.split('/');
        const categoryKey = pathParts.find(p => CATEGORY_MAP[p]) || 'general';
        const category = CATEGORY_MAP[categoryKey] || 'general';

        const { chunksCreated, tokensUsed } = await indexDocument(
          doc.path,
          doc.content,
          {
            title: doc.title || pathFromId(doc.path),
            category,
          }
        );

        results.indexed++;
        results.totalChunks += chunksCreated;
        results.totalTokens += tokensUsed;
      } catch (error) {
        results.failed++;
        results.errors.push(`${doc.path}: ${error}`);
      }
    }

    functions.logger.info('Indexing complete:', results);

    return results;
  });

/**
 * Reindex a single document (triggered on update)
 */
export const reindexDocument = functions.https.onCall(async (data, context) => {
  if (!context.auth?.token.admin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Admin access required'
    );
  }

  const { path, content, title, category } = data;

  if (!path || !content) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'path and content are required'
    );
  }

  const result = await indexDocument(path, content, { title, category });

  return result;
});

function pathFromId(docId: string): string {
  return docId
    .replace(/^\/docs\//, '')
    .replace(/\//g, ' > ')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}
```

## Step 6: Update AI Panel

Add RAG query tab to the AI Panel:

```typescript
// Add to AIPanel.tsx

// In AI_TABS array
{
  id: "ask",
  label: "Ask Docs",
  icon: "📖",
  description: "Ask questions about the documentation",
},

// Add state
const [docQuestion, setDocQuestion] = useState("");

// Add handler
const handleAskDocumentation = async () => {
  if (!docQuestion.trim()) {
    setError("Please enter a question");
    return;
  }

  setIsLoading(true);
  setError(null);
  setResult(null);

  try {
    const response = await aiService.askDocumentation(docQuestion);

    const formatted = `## Answer

${response.answer}

---

### Sources (${response.confidence} confidence)

${response.sources.map((s, i) =>
  `${i + 1}. **${s.title}** - ${s.section} _(${Math.round(s.relevance * 100)}% relevant)_`
).join('\n')}
`;

    setResult(formatted);
  } catch (err) {
    handleError(err);
  } finally {
    setIsLoading(false);
  }
};

// Add tab content
{activeTab === "ask" && (
  <div className="ai-tab-content">
    <p className="ai-tab-description">
      Ask questions about Phoenix Rooivalk documentation. AI will search
      and cite relevant sources.
    </p>

    <textarea
      className="ai-textarea"
      placeholder="e.g., How does the RKV targeting system work?"
      value={docQuestion}
      onChange={(e) => setDocQuestion(e.target.value)}
      rows={3}
    />

    <button
      className="ai-submit-btn"
      onClick={handleAskDocumentation}
      disabled={isLoading || !docQuestion.trim()}
    >
      {isLoading ? "Searching..." : "Ask Documentation"}
    </button>
  </div>
)}
```

## Step 7: Add to AI Service

```typescript
// Add to aiService.ts

export interface RAGResponse {
  answer: string;
  sources: Array<{
    docId: string;
    title: string;
    section: string;
    relevance: number;
  }>;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Ask questions about documentation using RAG
 */
async askDocumentation(
  question: string,
  options?: { category?: string; format?: 'detailed' | 'concise' }
): Promise<RAGResponse> {
  if (!this.init()) {
    throw new AIError("AI service not available", "unavailable");
  }

  try {
    const askDocsFn = httpsCallable<
      { question: string; category?: string; format?: string },
      RAGResponse
    >(this.functions!, "askDocumentation");

    const result = await askDocsFn({
      question,
      category: options?.category,
      format: options?.format,
    });

    return result.data;
  } catch (error) {
    this.handleError(error);
  }
}
```

## Deployment Checklist

1. **Deploy Functions**
   ```bash
   cd apps/docs/functions
   npm install openai
   npm run build
   firebase deploy --only functions
   ```

2. **Index Documentation**
   ```bash
   # Create a script to read all .md files and call indexAllDocumentation
   node scripts/prepare-docs-for-indexing.js
   ```

3. **Verify Indexing**
   ```bash
   firebase firestore:get doc_embeddings --limit 5
   ```

4. **Test Query**
   ```bash
   firebase functions:call askDocumentation \
     --data '{"question": "How does the RKV work?"}'
   ```

## Cost Estimation

| Component | Cost |
|-----------|------|
| Indexing (one-time) | ~$0.42 (208K words × $0.02/1M tokens) |
| Query embedding | ~$0.00002 per query |
| Search (Firestore) | ~$0.06 per 100K reads |
| Generation | ~$0.01-0.02 per query |
| **Total per query** | **~$0.02-0.03** |

With 50 queries/hour limit: Max $1.50/hour per active user.

## Optimization Tips

1. **Cache frequent queries** - Store common Q&A pairs
2. **Batch similar questions** - Reuse retrieved context
3. **Hierarchical search** - Filter by category first
4. **Incremental indexing** - Only reindex changed docs
5. **Compression** - Store embeddings as Float16 (50% storage reduction)
