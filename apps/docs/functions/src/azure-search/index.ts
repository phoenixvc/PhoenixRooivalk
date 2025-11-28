/**
 * Azure AI Search Module
 *
 * Exports all Azure AI Search functionality.
 * Uses Azure AI Search with HNSW vector search and hybrid capabilities.
 *
 * Available Cloud Functions:
 * - azureSearchDocs: Vector/hybrid search over documentation
 * - setupAzureIndex: Create/update Azure Search index (admin)
 * - getAzureStats: Get Azure Search index statistics
 */

// Configuration and types
export {
  AzureSearchConfig,
  AzureSearchResult,
  VectorSearchResult,
  AZURE_SEARCH_INDEX_SCHEMA,
  getAzureSearchConfig,
  isAzureSearchAvailable,
  buildAzureUrl,
  buildAzureHeaders,
} from "./config";

// Search operations
export { azureVectorSearch } from "./search";

// Index operations
export {
  uploadToAzureIndex,
  deleteFromAzureIndex,
  ensureAzureIndex,
  getAzureIndexStats,
} from "./index-ops";

// Cloud Functions
export { azureSearchDocs, setupAzureIndex, getAzureStats } from "./functions";
