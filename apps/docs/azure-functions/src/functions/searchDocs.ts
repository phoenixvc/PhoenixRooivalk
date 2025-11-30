/**
 * Search Documentation Function
 *
 * Semantic search over documentation.
 * Replaces Firebase searchDocs function.
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { queryDocuments } from '../lib/cosmos';
import { generateEmbeddings, checkRateLimit } from '../lib/openai';

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

    // Query all embeddings
    let dbQuery = 'SELECT * FROM c';
    const params: { name: string; value: unknown }[] = [];

    if (category) {
      dbQuery += ' WHERE c.category = @category';
      params.push({ name: '@category', value: category });
    }

    const chunks = await queryDocuments<DocChunk>('doc_embeddings', dbQuery, params);

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
