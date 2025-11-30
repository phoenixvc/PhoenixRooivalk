/**
 * Vector Search Statistics
 *
 * Provides statistics about the vector search index.
 */

import * as admin from "firebase-admin";
import { isAzureSearchAvailable, getAzureIndexStats } from "../azure-search";
import { VECTOR_SEARCH_CONFIG, VectorStats } from "./config";

const db = admin.firestore();

/**
 * Get vector search statistics
 */
export async function getVectorSearchStats(): Promise<VectorStats> {
  // Check Azure Search availability first
  const azureAvailable = isAzureSearchAvailable();

  // Get Firestore stats (for fallback/metadata)
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

  // Determine search method and optimization status
  let searchMethod = "in_memory";
  let isOptimized = totalVectors <= VECTOR_SEARCH_CONFIG.maxVectorsForInMemory;
  let azureStats:
    | {
        documentCount: number;
        storageSize: number;
        isAvailable: boolean;
      }
    | undefined;

  if (azureAvailable && VECTOR_SEARCH_CONFIG.useAzureSearch) {
    searchMethod = "azure_ai_search";
    isOptimized = true; // Azure AI Search is always optimized (HNSW)
    azureStats = await getAzureIndexStats();
  }

  return {
    totalVectors,
    totalDocuments: docsSnapshot.data().count,
    categories,
    searchMethod,
    isOptimized,
    azureStats,
  };
}
