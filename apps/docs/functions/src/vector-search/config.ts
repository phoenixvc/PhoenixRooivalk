/**
 * Vector Search Configuration
 *
 * Contains configuration and interfaces for vector search operations.
 */

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

  // Feature flags - Azure AI Search is now the default
  useAzureSearch: true, // Use Azure AI Search when available

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
 * Search metrics
 */
export interface SearchMetrics {
  searchMethod: string;
  embeddingLatencyMs: number;
  searchLatencyMs: number;
  totalLatencyMs: number;
  embeddingCached: boolean;
  resultCount: number;
  hybridSearch?: boolean;
}

/**
 * Vector stats result
 */
export interface VectorStats {
  totalVectors: number;
  totalDocuments: number;
  categories: Record<string, number>;
  searchMethod: string;
  isOptimized: boolean;
  azureStats?: {
    documentCount: number;
    storageSize: number;
    isAvailable: boolean;
  };
}
