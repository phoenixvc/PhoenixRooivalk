/**
 * Similarity and Embedding Utilities
 *
 * Provides cosine similarity calculation and embedding retrieval with caching.
 */

import { generateEmbedding } from "../ai-provider";
import { getCachedEmbedding, cacheEmbedding } from "../cache";
import { logMetrics } from "../monitoring";

/**
 * Cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have same length");
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

/**
 * Get query embedding with caching
 */
export async function getQueryEmbedding(text: string): Promise<{
  embedding: number[];
  cached: boolean;
  latencyMs: number;
}> {
  const startTime = Date.now();

  // Check cache first
  const cached = await getCachedEmbedding(text);
  if (cached) {
    return {
      embedding: cached,
      cached: true,
      latencyMs: Date.now() - startTime,
    };
  }

  // Generate new embedding
  const { embeddings, metrics } = await generateEmbedding(text);
  const embedding = embeddings[0];

  // Cache for future use
  await cacheEmbedding(text, embedding);

  // Log metrics (non-blocking)
  logMetrics("embedding_query", metrics).catch(() => {});

  return {
    embedding,
    cached: false,
    latencyMs: Date.now() - startTime,
  };
}
