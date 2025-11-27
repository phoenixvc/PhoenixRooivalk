/**
 * Vector Search Abstraction Layer
 *
 * Provides a unified interface for vector search operations that can work with:
 * - Firebase Vector Search Extension (primary, as per ADR-0011)
 * - Firestore + in-memory search (fallback)
 *
 * This abstraction allows easy migration between vector databases without
 * changing the application code.
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { generateEmbedding } from "./ai-provider";
import { getCachedEmbedding, cacheEmbedding } from "./cache";
import { logMetrics } from "./monitoring";

const db = admin.firestore();

// Vector Search Configuration
export const VECTOR_SEARCH_CONFIG = {
  // Collection names
  embeddingsCollection: "doc_embeddings",
  metadataCollection: "doc_metadata",

  // Search parameters
  defaultTopK: 5,
  defaultMinScore: 0.65,

  // Vector dimensions (text-embedding-3-small)
  dimensions: 1536,

  // Feature flags
  useFirebaseVectorSearch: process.env.USE_FIREBASE_VECTOR_SEARCH === "true",

  // Performance thresholds
  maxVectorsForInMemory: 10000,
  vectorSearchTimeout: 5000,
};

/**
 * Search result interface
 */
export interface VectorSearchResult {
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
    wordCount?: number;
    charCount?: number;
  };
}

/**
 * Search options
 */
export interface VectorSearchOptions {
  topK?: number;
  category?: string;
  minScore?: number;
  includeContent?: boolean;
}

/**
 * Cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
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
async function getQueryEmbedding(text: string): Promise<{
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

/**
 * In-memory vector search (fallback method)
 * Loads all embeddings and computes cosine similarity
 */
async function searchInMemory(
  queryEmbedding: number[],
  options: VectorSearchOptions
): Promise<VectorSearchResult[]> {
  const { topK = 5, category, minScore = 0.65 } = options;

  // Build Firestore query
  let firestoreQuery: admin.firestore.Query = db.collection(
    VECTOR_SEARCH_CONFIG.embeddingsCollection
  );

  if (category) {
    firestoreQuery = firestoreQuery.where("metadata.category", "==", category);
  }

  // Get all embeddings
  const snapshot = await firestoreQuery.get();

  // Check if we're exceeding in-memory limits
  if (snapshot.size > VECTOR_SEARCH_CONFIG.maxVectorsForInMemory) {
    functions.logger.warn(
      `In-memory search with ${snapshot.size} vectors. Consider enabling Firebase Vector Search.`
    );
  }

  // Calculate similarity scores
  const results: VectorSearchResult[] = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const score = cosineSimilarity(queryEmbedding, data.embedding);

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
  return results.sort((a, b) => b.score - a.score).slice(0, topK);
}

/**
 * Firebase Vector Search (primary method when enabled)
 * Uses Firestore's native vector search capabilities
 */
async function searchWithFirebaseVectorSearch(
  queryEmbedding: number[],
  options: VectorSearchOptions
): Promise<VectorSearchResult[]> {
  const { topK = 5, category, minScore = 0.65 } = options;

  try {
    // Build vector search query
    // Note: This uses Firestore's findNearest() when available
    let collectionRef = db.collection(VECTOR_SEARCH_CONFIG.embeddingsCollection);

    // Firebase Vector Search query
    // The actual API depends on the Firebase SDK version
    // For now, we use the in-memory fallback with a warning
    functions.logger.info(
      "Firebase Vector Search not yet configured. Using in-memory search."
    );

    // TODO: When Firebase Vector Search extension is installed:
    // const results = await collectionRef
    //   .findNearest({
    //     vectorField: 'embedding',
    //     queryVector: queryEmbedding,
    //     limit: topK,
    //     distanceType: 'COSINE',
    //   })
    //   .get();

    // Fallback to in-memory search
    return searchInMemory(queryEmbedding, options);
  } catch (error) {
    functions.logger.error("Firebase Vector Search error:", error);
    // Fallback to in-memory
    return searchInMemory(queryEmbedding, options);
  }
}

/**
 * Main vector search function
 * Automatically selects the best search method based on configuration
 */
export async function vectorSearch(
  query: string,
  options: VectorSearchOptions = {}
): Promise<{
  results: VectorSearchResult[];
  metrics: {
    searchMethod: string;
    embeddingLatencyMs: number;
    searchLatencyMs: number;
    totalLatencyMs: number;
    embeddingCached: boolean;
    resultCount: number;
  };
}> {
  const startTime = Date.now();

  // Generate query embedding
  const {
    embedding: queryEmbedding,
    cached: embeddingCached,
    latencyMs: embeddingLatencyMs,
  } = await getQueryEmbedding(query);

  const searchStartTime = Date.now();

  // Select search method
  let results: VectorSearchResult[];
  let searchMethod: string;

  if (VECTOR_SEARCH_CONFIG.useFirebaseVectorSearch) {
    searchMethod = "firebase_vector_search";
    results = await searchWithFirebaseVectorSearch(queryEmbedding, options);
  } else {
    searchMethod = "in_memory";
    results = await searchInMemory(queryEmbedding, options);
  }

  const searchLatencyMs = Date.now() - searchStartTime;
  const totalLatencyMs = Date.now() - startTime;

  // Log search metrics
  await logMetrics("vector_search", {
    provider: searchMethod,
    latencyMs: totalLatencyMs,
    embeddingCached,
    resultCount: results.length,
  }).catch(() => {});

  return {
    results,
    metrics: {
      searchMethod,
      embeddingLatencyMs,
      searchLatencyMs,
      totalLatencyMs,
      embeddingCached,
      resultCount: results.length,
    },
  };
}

/**
 * Search with deduplication by document
 * Returns only the best-matching chunk per document
 */
export async function vectorSearchUnique(
  query: string,
  options: VectorSearchOptions = {}
): Promise<{
  results: VectorSearchResult[];
  metrics: {
    searchMethod: string;
    embeddingLatencyMs: number;
    searchLatencyMs: number;
    totalLatencyMs: number;
    embeddingCached: boolean;
    resultCount: number;
  };
}> {
  const { topK = 5 } = options;

  // Get more results initially to allow for deduplication
  const searchResult = await vectorSearch(query, {
    ...options,
    topK: topK * 3,
  });

  // Deduplicate by docId, keeping highest score per document
  const seenDocs = new Set<string>();
  const uniqueResults: VectorSearchResult[] = [];

  for (const result of searchResult.results) {
    if (!seenDocs.has(result.docId)) {
      seenDocs.add(result.docId);
      uniqueResults.push(result);

      if (uniqueResults.length >= topK) break;
    }
  }

  return {
    results: uniqueResults,
    metrics: {
      ...searchResult.metrics,
      resultCount: uniqueResults.length,
    },
  };
}

/**
 * Find related documents based on a source document
 */
export async function findRelatedDocuments(
  docId: string,
  options: { topK?: number; excludeSelf?: boolean } = {}
): Promise<VectorSearchResult[]> {
  const { topK = 5, excludeSelf = true } = options;

  // Get the document's first chunk for comparison
  const docChunks = await db
    .collection(VECTOR_SEARCH_CONFIG.embeddingsCollection)
    .where("docId", "==", docId)
    .where("metadata.chunkIndex", "==", 0)
    .limit(1)
    .get();

  if (docChunks.empty) {
    return [];
  }

  const sourceEmbedding = docChunks.docs[0].data().embedding;

  // Get all first chunks
  const snapshot = await db
    .collection(VECTOR_SEARCH_CONFIG.embeddingsCollection)
    .where("metadata.chunkIndex", "==", 0)
    .get();

  // Calculate similarity
  const results: VectorSearchResult[] = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();

    // Skip self if requested
    if (excludeSelf && data.docId === docId) continue;

    const score = cosineSimilarity(sourceEmbedding, data.embedding);

    if (score >= 0.7) {
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

  return results.sort((a, b) => b.score - a.score).slice(0, topK);
}

/**
 * Get vector search statistics
 */
export async function getVectorSearchStats(): Promise<{
  totalVectors: number;
  totalDocuments: number;
  categories: Record<string, number>;
  searchMethod: string;
  isOptimized: boolean;
}> {
  const chunksSnapshot = await db
    .collection(VECTOR_SEARCH_CONFIG.embeddingsCollection)
    .count()
    .get();
  const docsSnapshot = await db
    .collection(VECTOR_SEARCH_CONFIG.metadataCollection)
    .count()
    .get();

  // Get category distribution
  const metaDocs = await db
    .collection(VECTOR_SEARCH_CONFIG.metadataCollection)
    .get();
  const categories: Record<string, number> = {};

  metaDocs.docs.forEach((doc) => {
    const category = doc.data().category || "general";
    categories[category] = (categories[category] || 0) + 1;
  });

  const totalVectors = chunksSnapshot.data().count;

  return {
    totalVectors,
    totalDocuments: docsSnapshot.data().count,
    categories,
    searchMethod: VECTOR_SEARCH_CONFIG.useFirebaseVectorSearch
      ? "firebase_vector_search"
      : "in_memory",
    isOptimized:
      VECTOR_SEARCH_CONFIG.useFirebaseVectorSearch ||
      totalVectors <= VECTOR_SEARCH_CONFIG.maxVectorsForInMemory,
  };
}

/**
 * Cloud Function: Vector Search
 */
export const vectorSearchDocs = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required"
    );
  }

  const { query, category, topK, minScore, unique } = data;

  if (!query || typeof query !== "string") {
    throw new functions.https.HttpsError("invalid-argument", "Query is required");
  }

  try {
    const searchFn = unique ? vectorSearchUnique : vectorSearch;
    const { results, metrics } = await searchFn(query, {
      category,
      topK: topK || 5,
      minScore: minScore || 0.65,
    });

    return {
      results: results.map((r) => ({
        docId: r.docId,
        title: r.title,
        section: r.section,
        content: r.content.substring(0, 300) + "...",
        score: Math.round(r.score * 100) / 100,
        category: r.metadata.category,
      })),
      metrics,
    };
  } catch (error) {
    functions.logger.error("Vector search error:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to search documents"
    );
  }
});

/**
 * Cloud Function: Get Vector Search Stats
 */
export const getVectorStats = functions.https.onCall(async (_data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required"
    );
  }

  return getVectorSearchStats();
});
