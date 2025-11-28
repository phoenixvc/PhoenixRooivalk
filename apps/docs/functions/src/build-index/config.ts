/**
 * Build-Time Indexing Configuration
 *
 * Contains configuration, interfaces, and constants for build-time document indexing.
 */

import * as admin from "firebase-admin";

// Build-time indexing configuration
export const BUILD_INDEX_CONFIG = {
  // Collections
  embeddingsCollection: "doc_embeddings",
  metadataCollection: "doc_metadata",
  buildIndexCollection: "build_index_status",

  // Chunking
  chunkSize: 500, // Target tokens per chunk
  chunkOverlap: 50, // Overlap between chunks
  maxChunkChars: 2000, // Max characters per chunk

  // Batch processing
  batchSize: 20, // Embeddings per batch
  maxConcurrent: 3, // Max concurrent batches
};

// Category mapping based on path
export const CATEGORY_MAP: Record<string, string> = {
  technical: "technical",
  business: "business",
  operations: "operations",
  executive: "executive",
  legal: "legal",
  research: "research",
};

/**
 * Document input for indexing
 */
export interface DocumentInput {
  path: string;
  content: string;
  title?: string;
  description?: string;
  tags?: string[];
}

/**
 * Index result for a single document
 */
export interface DocumentIndexResult {
  path: string;
  status: "indexed" | "unchanged" | "failed";
  chunksCreated?: number;
  tokensUsed?: number;
  contentHash?: string;
  error?: string;
}

/**
 * Build index status
 */
export interface BuildIndexStatus {
  buildId: string;
  status: "running" | "completed" | "failed";
  startedAt: admin.firestore.Timestamp;
  completedAt?: admin.firestore.Timestamp;
  totalDocs: number;
  indexed: number;
  unchanged: number;
  failed: number;
  totalChunks: number;
  totalTokens: number;
  errors: string[];
}

/**
 * Staleness check result for a document
 */
export interface StalenessResult {
  path: string;
  status: "stale" | "current" | "new";
  currentHash?: string;
  newHash: string;
}
