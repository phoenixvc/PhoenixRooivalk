/**
 * RAG (Retrieval-Augmented Generation) Functions
 *
 * Exports all RAG-related functions for documentation search and Q&A.
 */

// Export indexer functions
export {
  indexAllDocumentation,
  reindexDocument,
  deleteFromIndex,
  getIndexStats,
  RAG_CONFIG,
} from "./indexer";

// Export search functions
export {
  searchDocs,
  searchDocuments,
  searchDocumentsUnique,
  getRelatedDocuments,
  cosineSimilarity,
} from "./search";

// Export search types
export type { SearchResult } from "./search";

// Export query functions
export { askDocumentation, getSuggestedQuestions, queryWithRAG } from "./query";

// Export query types
export type { RAGResponse } from "./query";
