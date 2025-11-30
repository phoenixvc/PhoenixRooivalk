/**
 * Search Documentation Function
 *
 * Semantic search over documentation using embeddings.
 *
 * SCALABILITY NOTE:
 * Current implementation loads embeddings into memory for cosine similarity.
 * This works well for <5000 documents. For larger scale:
 * - Use Azure AI Search with vector search
 * - Or enable Cosmos DB vector indexing (preview)
 *
 * To use Azure AI Search instead, set AZURE_SEARCH_ENDPOINT and AZURE_SEARCH_KEY
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { SqlParameter } from '@azure/cosmos';
import { queryDocuments } from '../lib/cosmos';
import { generateEmbeddings, checkRateLimit } from '../lib/openai';

// Maximum chunks to load for in-memory search (memory protection)
const MAX_CHUNKS_IN_MEMORY = 5000;

interface SearchResult {
  docId: string;
  title: string;
  section: string;
  content: string;
  score: number;
}

interface DocChunk {
  id: string;
  docId: string;
  title: string;
  section: string;
  content: string;
  embedding: number[];
}

/**
 * Calculate cosine similarity
 */
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

async function handler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  // Get client IP for rate limiting (anonymous users)
  const clientIp = request.headers.get('x-forwarded-for') || 'unknown';

  if (!checkRateLimit(`search:${clientIp}`, 30, 60000)) {
    return {
      status: 429,
      jsonBody: { error: 'Rate limit exceeded', code: 'resource-exhausted' },
    };
  }

  try {
    const body = await request.json() as {
      query: string;
      category?: string;
      topK?: number;
    };

    const { query, category, topK = 10 } = body;

    if (!query || typeof query !== 'string') {
      return {
        status: 400,
        jsonBody: { error: 'Query is required', code: 'invalid-argument' },
      };
    }

    context.log(`Searching for: "${query.substring(0, 50)}..."`);

    // Generate embedding for the query
    const queryEmbedding = await generateEmbeddings(query);

    // Query embeddings (with limit to prevent memory issues)
    // For production scale, use Azure AI Search instead
    let dbQuery = `SELECT TOP ${MAX_CHUNKS_IN_MEMORY} * FROM c`;
    const params: SqlParameter[] = [];

    if (category) {
      dbQuery = `SELECT TOP ${MAX_CHUNKS_IN_MEMORY} * FROM c WHERE c.category = @category`;
      params.push({ name: '@category', value: category });
    }

    const chunks = await queryDocuments<DocChunk>('doc_embeddings', dbQuery, params);

    if (chunks.length >= MAX_CHUNKS_IN_MEMORY) {
      context.warn(`Search limited to ${MAX_CHUNKS_IN_MEMORY} chunks. Consider using Azure AI Search for larger datasets.`);
    }

    // Calculate similarity and sort
    const scored = chunks.map((chunk) => ({
      docId: chunk.docId,
      title: chunk.title,
      section: chunk.section,
      content: chunk.content.substring(0, 200) + '...',
      score: cosineSimilarity(queryEmbedding, chunk.embedding),
    }));

    scored.sort((a, b) => b.score - a.score);

    // Return top results
    const results: SearchResult[] = scored.slice(0, topK).map((r) => ({
      ...r,
      score: Math.round(r.score * 1000) / 1000,
    }));

    return { status: 200, jsonBody: { results } };
  } catch (error) {
    context.error('Error searching:', error);
    return {
      status: 500,
      jsonBody: { error: 'Search failed', code: 'internal' },
    };
  }
}

app.http('searchDocs', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler,
});
