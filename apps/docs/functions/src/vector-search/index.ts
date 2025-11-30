/**
 * Vector Search Abstraction Layer
 *
 * Provides a unified interface for vector search operations that can work with:
 * - Azure AI Search (primary, as per ADR-0011) - HNSW + hybrid search
 * - Firestore + in-memory search (fallback)
 *
 * This abstraction allows easy migration between vector databases without
 * changing the application code.
 *
 * Priority order:
 * 1. Azure AI Search (if configured) - sub-10ms, hybrid search
 * 2. In-memory Firestore search (fallback) - O(n), no hybrid
 */

// Configuration and types
export {
  VECTOR_SEARCH_CONFIG,
  VectorSearchResult,
  VectorSearchOptions,
  SearchMetrics,
  VectorStats,
} from "./config";

// Similarity utilities
export { cosineSimilarity, getQueryEmbedding } from "./similarity";

// Search operations
export {
  vectorSearch,
  vectorSearchUnique,
  findRelatedDocuments,
} from "./search";

// Statistics
export { getVectorSearchStats } from "./stats";

// Cloud Functions
export { vectorSearchDocs, getVectorStats } from "./functions";
