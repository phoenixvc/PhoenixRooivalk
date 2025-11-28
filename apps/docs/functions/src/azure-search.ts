/**
 * Azure AI Search Integration
 *
 * Implements vector search using Azure AI Search (as per ADR-0011).
 * Provides HNSW-based approximate nearest neighbor search with hybrid capabilities.
 *
 * Features:
 * - Sub-10ms vector search (HNSW algorithm)
 * - Hybrid search (keyword + semantic)
 * - Category filtering via Azure's filter syntax
 * - $0 cost with Azure Foundry credits
 *
 * Configuration:
 *   firebase functions:config:set \
 *     azure_search.endpoint="https://<name>.search.windows.net" \
 *     azure_search.key="<admin-key>" \
 *     azure_search.index="phoenix-docs"
 */

import * as functions from "firebase-functions";
import { logMetrics } from "./monitoring";
import { generateEmbedding } from "./ai-provider";
import { getCachedEmbedding, cacheEmbedding } from "./cache";

// Azure Search Configuration
export interface AzureSearchConfig {
  endpoint: string;
  apiKey: string;
  indexName: string;
  apiVersion: string;
}

// Search result from Azure
export interface AzureSearchResult {
  "@search.score": number;
  "@search.rerankerScore"?: number;
  docId: string;
  chunkId: string;
  title: string;
  section: string;
  content: string;
  category: string;
  chunkIndex: number;
  totalChunks: number;
  contentHash?: string;
}

// Unified search result (matches vector-search.ts VectorSearchResult)
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

// Index schema for Azure AI Search
export const AZURE_SEARCH_INDEX_SCHEMA = {
  name: "phoenix-docs",
  fields: [
    { name: "id", type: "Edm.String", key: true, filterable: true },
    { name: "docId", type: "Edm.String", filterable: true, sortable: true },
    { name: "chunkId", type: "Edm.String", filterable: true },
    { name: "title", type: "Edm.String", searchable: true, filterable: true },
    { name: "section", type: "Edm.String", searchable: true },
    { name: "content", type: "Edm.String", searchable: true },
    { name: "category", type: "Edm.String", filterable: true, facetable: true },
    { name: "chunkIndex", type: "Edm.Int32", filterable: true, sortable: true },
    { name: "totalChunks", type: "Edm.Int32" },
    { name: "contentHash", type: "Edm.String", filterable: true },
    {
      name: "indexedAt",
      type: "Edm.DateTimeOffset",
      filterable: true,
      sortable: true,
    },
    {
      name: "embedding",
      type: "Collection(Edm.Single)",
      searchable: true,
      dimensions: 1536,
      vectorSearchProfile: "hnsw-profile",
    },
  ],
  vectorSearch: {
    algorithms: [
      {
        name: "hnsw-algorithm",
        kind: "hnsw",
        hnswParameters: {
          m: 4, // Number of bi-directional links
          efConstruction: 400, // Size of the dynamic list for constructing graph
          efSearch: 500, // Size of the dynamic list for searching
          metric: "cosine",
        },
      },
    ],
    profiles: [
      {
        name: "hnsw-profile",
        algorithm: "hnsw-algorithm",
      },
    ],
  },
  semantic: {
    configurations: [
      {
        name: "semantic-config",
        prioritizedFields: {
          titleField: { fieldName: "title" },
          contentFields: [{ fieldName: "content" }],
          keywordFields: [{ fieldName: "section" }],
        },
      },
    ],
  },
};

/**
 * Get Azure Search configuration from Firebase config
 */
export function getAzureSearchConfig(): AzureSearchConfig | null {
  try {
    const config = functions.config();

    if (config.azure_search?.endpoint && config.azure_search?.key) {
      return {
        endpoint: config.azure_search.endpoint,
        apiKey: config.azure_search.key,
        indexName: config.azure_search.index || "phoenix-docs",
        apiVersion: config.azure_search.api_version || "2024-07-01",
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Check if Azure Search is available
 */
export function isAzureSearchAvailable(): boolean {
  return getAzureSearchConfig() !== null;
}

/**
 * Build Azure Search API URL
 */
function buildAzureUrl(
  config: AzureSearchConfig,
  path: string,
  queryParams?: Record<string, string>,
): string {
  const params = new URLSearchParams({
    "api-version": config.apiVersion,
    ...queryParams,
  });
  return `${config.endpoint}/indexes/${config.indexName}/${path}?${params}`;
}

/**
 * Azure Search request headers
 */
function buildAzureHeaders(config: AzureSearchConfig): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "api-key": config.apiKey,
  };
}

/**
 * Vector search using Azure AI Search
 */
export async function azureVectorSearch(
  query: string,
  options: {
    topK?: number;
    category?: string;
    minScore?: number;
    hybridSearch?: boolean;
  } = {},
): Promise<{
  results: VectorSearchResult[];
  metrics: {
    provider: string;
    latencyMs: number;
    embeddingCached: boolean;
    resultCount: number;
    searchType: string;
  };
}> {
  const config = getAzureSearchConfig();

  if (!config) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Azure Search not configured. Set azure_search.endpoint and azure_search.key",
    );
  }

  const { topK = 5, category, minScore = 0.65, hybridSearch = true } = options;
  const startTime = Date.now();

  // Get query embedding with caching
  let embedding: number[];
  let embeddingCached = false;

  const cachedEmbedding = await getCachedEmbedding(query);
  if (cachedEmbedding) {
    embedding = cachedEmbedding;
    embeddingCached = true;
  } else {
    const { embeddings } = await generateEmbedding(query);
    embedding = embeddings[0];
    await cacheEmbedding(query, embedding);
  }

  // Build search request
  const searchRequest: Record<string, unknown> = {
    count: true,
    top: topK,
    select:
      "docId,chunkId,title,section,content,category,chunkIndex,totalChunks",
  };

  // Add vector search
  searchRequest.vectorQueries = [
    {
      kind: "vector",
      vector: embedding,
      fields: "embedding",
      k: topK,
    },
  ];

  // Add hybrid text search if enabled
  if (hybridSearch) {
    searchRequest.search = query;
    searchRequest.queryType = "semantic";
    searchRequest.semanticConfiguration = "semantic-config";
    searchRequest.captions = "extractive";
    searchRequest.answers = "extractive";
  }

  // Add category filter
  if (category) {
    searchRequest.filter = `category eq '${category}'`;
  }

  try {
    const url = buildAzureUrl(config, "docs/search");
    const response = await fetch(url, {
      method: "POST",
      headers: buildAzureHeaders(config),
      body: JSON.stringify(searchRequest),
    });

    if (!response.ok) {
      const error = await response.json();
      functions.logger.error("Azure Search error:", error);
      throw new Error(error.error?.message || "Azure Search API error");
    }

    const data = await response.json();
    const latencyMs = Date.now() - startTime;

    // Transform results
    const results: VectorSearchResult[] = (data.value || [])
      .filter((hit: AzureSearchResult) => {
        const score = hit["@search.rerankerScore"] || hit["@search.score"];
        return score >= minScore;
      })
      .map((hit: AzureSearchResult) => ({
        docId: hit.docId,
        chunkId: hit.chunkId,
        title: hit.title,
        section: hit.section,
        content: hit.content,
        score: hit["@search.rerankerScore"] || hit["@search.score"],
        metadata: {
          category: hit.category,
          chunkIndex: hit.chunkIndex,
          totalChunks: hit.totalChunks,
        },
      }));

    // Log metrics (non-blocking)
    logMetrics("azure_vector_search", {
      provider: "azure_ai_search",
      latencyMs,
      resultCount: results.length,
      hybridSearch,
      embeddingCached,
      category: category || "all",
    }).catch(() => {});

    return {
      results,
      metrics: {
        provider: "azure_ai_search",
        latencyMs,
        embeddingCached,
        resultCount: results.length,
        searchType: hybridSearch ? "hybrid" : "vector",
      },
    };
  } catch (error) {
    functions.logger.error("Azure vector search failed:", error);
    throw new functions.https.HttpsError("internal", "Vector search failed");
  }
}

/**
 * Upload documents to Azure Search index
 */
export async function uploadToAzureIndex(
  documents: Array<{
    id: string;
    docId: string;
    chunkId: string;
    title: string;
    section: string;
    content: string;
    category: string;
    chunkIndex: number;
    totalChunks: number;
    contentHash: string;
    embedding: number[];
  }>,
): Promise<{
  success: boolean;
  indexed: number;
  failed: number;
  errors: string[];
}> {
  const config = getAzureSearchConfig();

  if (!config) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Azure Search not configured",
    );
  }

  const startTime = Date.now();

  // Add indexedAt timestamp to all documents
  const docsWithTimestamp = documents.map((doc) => ({
    ...doc,
    indexedAt: new Date().toISOString(),
    "@search.action": "mergeOrUpload",
  }));

  try {
    const url = buildAzureUrl(config, "docs/index");
    const response = await fetch(url, {
      method: "POST",
      headers: buildAzureHeaders(config),
      body: JSON.stringify({ value: docsWithTimestamp }),
    });

    if (!response.ok) {
      const error = await response.json();
      functions.logger.error("Azure index upload error:", error);
      throw new Error(error.error?.message || "Azure index upload failed");
    }

    const data = await response.json();
    const latencyMs = Date.now() - startTime;

    // Process results
    const results = data.value || [];
    const indexed = results.filter(
      (r: { status: boolean }) => r.status === true,
    ).length;
    const failed = results.filter(
      (r: { status: boolean }) => r.status === false,
    ).length;
    const errors = results
      .filter((r: { status: boolean; errorMessage?: string }) => !r.status)
      .map(
        (r: { key: string; errorMessage?: string }) =>
          `${r.key}: ${r.errorMessage || "Unknown error"}`,
      );

    // Log metrics
    await logMetrics("azure_index_upload", {
      indexed,
      failed,
      latencyMs,
      batchSize: documents.length,
    });

    return {
      success: failed === 0,
      indexed,
      failed,
      errors,
    };
  } catch (error) {
    functions.logger.error("Azure index upload failed:", error);
    throw new functions.https.HttpsError("internal", "Index upload failed");
  }
}

/**
 * Delete documents from Azure Search index
 */
export async function deleteFromAzureIndex(documentIds: string[]): Promise<{
  success: boolean;
  deleted: number;
}> {
  const config = getAzureSearchConfig();

  if (!config) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Azure Search not configured",
    );
  }

  const deleteActions = documentIds.map((id) => ({
    "@search.action": "delete",
    id,
  }));

  try {
    const url = buildAzureUrl(config, "docs/index");
    const response = await fetch(url, {
      method: "POST",
      headers: buildAzureHeaders(config),
      body: JSON.stringify({ value: deleteActions }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Azure delete failed");
    }

    return {
      success: true,
      deleted: documentIds.length,
    };
  } catch (error) {
    functions.logger.error("Azure delete failed:", error);
    throw new functions.https.HttpsError("internal", "Delete failed");
  }
}

/**
 * Create or update Azure Search index with our schema
 */
export async function ensureAzureIndex(): Promise<{
  success: boolean;
  message: string;
}> {
  const config = getAzureSearchConfig();

  if (!config) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Azure Search not configured",
    );
  }

  try {
    // Check if index exists
    const checkUrl = `${config.endpoint}/indexes/${config.indexName}?api-version=${config.apiVersion}`;
    const checkResponse = await fetch(checkUrl, {
      method: "GET",
      headers: buildAzureHeaders(config),
    });

    if (checkResponse.ok) {
      // Index exists, update it
      const updateUrl = `${config.endpoint}/indexes/${config.indexName}?api-version=${config.apiVersion}`;
      const updateResponse = await fetch(updateUrl, {
        method: "PUT",
        headers: buildAzureHeaders(config),
        body: JSON.stringify(AZURE_SEARCH_INDEX_SCHEMA),
      });

      if (!updateResponse.ok) {
        const error = await updateResponse.json();
        throw new Error(error.error?.message || "Failed to update index");
      }

      return {
        success: true,
        message: "Index updated successfully",
      };
    }

    // Index doesn't exist, create it
    const createUrl = `${config.endpoint}/indexes?api-version=${config.apiVersion}`;
    const createResponse = await fetch(createUrl, {
      method: "POST",
      headers: buildAzureHeaders(config),
      body: JSON.stringify(AZURE_SEARCH_INDEX_SCHEMA),
    });

    if (!createResponse.ok) {
      const error = await createResponse.json();
      throw new Error(error.error?.message || "Failed to create index");
    }

    return {
      success: true,
      message: "Index created successfully",
    };
  } catch (error) {
    functions.logger.error("Azure index setup failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new functions.https.HttpsError(
      "internal",
      `Index setup failed: ${message}`,
    );
  }
}

/**
 * Get Azure Search index statistics
 */
export async function getAzureIndexStats(): Promise<{
  documentCount: number;
  storageSize: number;
  isAvailable: boolean;
}> {
  const config = getAzureSearchConfig();

  if (!config) {
    return {
      documentCount: 0,
      storageSize: 0,
      isAvailable: false,
    };
  }

  try {
    const url = `${config.endpoint}/indexes/${config.indexName}/stats?api-version=${config.apiVersion}`;
    const response = await fetch(url, {
      method: "GET",
      headers: buildAzureHeaders(config),
    });

    if (!response.ok) {
      return {
        documentCount: 0,
        storageSize: 0,
        isAvailable: false,
      };
    }

    const data = await response.json();

    return {
      documentCount: data.documentCount || 0,
      storageSize: data.storageSize || 0,
      isAvailable: true,
    };
  } catch {
    return {
      documentCount: 0,
      storageSize: 0,
      isAvailable: false,
    };
  }
}

/**
 * Cloud Function: Azure Vector Search
 */
export const azureSearchDocs = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required",
    );
  }

  const { query, category, topK, hybridSearch } = data;

  if (!query || typeof query !== "string") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Query is required",
    );
  }

  const { results, metrics } = await azureVectorSearch(query, {
    category,
    topK: topK || 5,
    hybridSearch: hybridSearch !== false, // default to true
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
});

/**
 * Cloud Function: Setup Azure Index (Admin only)
 */
export const setupAzureIndex = functions.https.onCall(
  async (_data, context) => {
    if (!context.auth?.token.admin) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Admin access required",
      );
    }

    return ensureAzureIndex();
  },
);

/**
 * Cloud Function: Get Azure Index Stats
 */
export const getAzureStats = functions.https.onCall(async (_data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required",
    );
  }

  return getAzureIndexStats();
});
