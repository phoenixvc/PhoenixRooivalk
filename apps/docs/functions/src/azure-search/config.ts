/**
 * Azure AI Search Configuration
 *
 * Configuration, schema, and utilities for Azure AI Search integration.
 */

import * as functions from "firebase-functions";

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
    {
      name: "category",
      type: "Edm.String",
      filterable: true,
      facetable: true,
    },
    {
      name: "chunkIndex",
      type: "Edm.Int32",
      filterable: true,
      sortable: true,
    },
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
export function buildAzureUrl(
  config: AzureSearchConfig,
  path: string,
  queryParams?: Record<string, string>
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
export function buildAzureHeaders(
  config: AzureSearchConfig
): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "api-key": config.apiKey,
  };
}
