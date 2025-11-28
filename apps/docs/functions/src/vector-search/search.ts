/**
 * Vector Search Operations
 *
 * Core search functions including in-memory fallback and Azure AI Search integration.
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { logMetrics } from "../monitoring";
import { isAzureSearchAvailable, azureVectorSearch } from "../azure-search";
import {
  VECTOR_SEARCH_CONFIG,
  VectorSearchResult,
  VectorSearchOptions,
  SearchMetrics,
} from "./config";
import { cosineSimilarity, getQueryEmbedding } from "./similarity";

const db = admin.firestore();

/**
 * In-memory vector search (fallback method)
 * Loads all embeddings and computes cosine similarity
 *
 * Note: This is O(n) and should only be used for:
 * - Development/testing
 * - Fallback when Azure AI Search is unavailable
 * - Small document sets (<10,000 vectors)
 */
async function searchInMemory(
  queryEmbedding: number[],
  options: VectorSearchOptions,
): Promise<VectorSearchResult[]> {
  const { topK = 5, category, minScore = 0.65 } = options;

  // Build Firestore query
  let firestoreQuery: admin.firestore.Query = db.collection(
    VECTOR_SEARCH_CONFIG.embeddingsCollection,
  );

  if (category) {
    firestoreQuery = firestoreQuery.where("metadata.category", "==", category);
  }

  // Get all embeddings
  const snapshot = await firestoreQuery.get();

  // Check if we're exceeding in-memory limits
  if (snapshot.size > VECTOR_SEARCH_CONFIG.maxVectorsForInMemory) {
    functions.logger.warn(
      `In-memory search with ${snapshot.size} vectors. Consider enabling Firebase Vector Search.`,
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
 * Main vector search function
 * Automatically selects the best search method based on configuration
 *
 * Priority:
 * 1. Azure AI Search (if configured) - HNSW + hybrid search, sub-10ms
 * 2. In-memory Firestore search (fallback) - O(n), for development/testing
 */
export async function vectorSearch(
  query: string,
  options: VectorSearchOptions = {},
): Promise<{
  results: VectorSearchResult[];
  metrics: SearchMetrics;
}> {
  const startTime = Date.now();

  // Try Azure AI Search first (recommended per ADR-0011)
  if (VECTOR_SEARCH_CONFIG.useAzureSearch && isAzureSearchAvailable()) {
    try {
      const { results, metrics } = await azureVectorSearch(query, {
        topK: options.topK || VECTOR_SEARCH_CONFIG.defaultTopK,
        category: options.category,
        minScore: options.minScore || VECTOR_SEARCH_CONFIG.defaultMinScore,
        hybridSearch: true, // Use hybrid search for better results
      });

      return {
        results,
        metrics: {
          searchMethod: "azure_ai_search",
          embeddingLatencyMs: 0, // Azure handles embedding internally
          searchLatencyMs: metrics.latencyMs,
          totalLatencyMs: Date.now() - startTime,
          embeddingCached: metrics.embeddingCached,
          resultCount: results.length,
          hybridSearch: true,
        },
      };
    } catch (error) {
      functions.logger.warn(
        "Azure AI Search failed, falling back to in-memory:",
        error,
      );
      // Fall through to in-memory search
    }
  }

  // Fallback to in-memory search
  // Generate query embedding
  const {
    embedding: queryEmbedding,
    cached: embeddingCached,
    latencyMs: embeddingLatencyMs,
  } = await getQueryEmbedding(query);

  const searchStartTime = Date.now();
  const results = await searchInMemory(queryEmbedding, options);
  const searchLatencyMs = Date.now() - searchStartTime;
  const totalLatencyMs = Date.now() - startTime;

  // Log search metrics
  await logMetrics("vector_search", {
    provider: "in_memory",
    latencyMs: totalLatencyMs,
    embeddingCached,
    resultCount: results.length,
  }).catch(() => {});

  return {
    results,
    metrics: {
      searchMethod: "in_memory",
      embeddingLatencyMs,
      searchLatencyMs,
      totalLatencyMs,
      embeddingCached,
      resultCount: results.length,
      hybridSearch: false,
    },
  };
}

/**
 * Search with deduplication by document
 * Returns only the best-matching chunk per document
 */
export async function vectorSearchUnique(
  query: string,
  options: VectorSearchOptions = {},
): Promise<{
  results: VectorSearchResult[];
  metrics: SearchMetrics;
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
  options: { topK?: number; excludeSelf?: boolean } = {},
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
