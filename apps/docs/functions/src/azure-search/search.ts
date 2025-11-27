/**
 * Azure Vector Search Operations
 *
 * Implements vector and hybrid search using Azure AI Search.
 */

import * as functions from "firebase-functions";
import { logMetrics } from "../monitoring";
import { generateEmbedding } from "../ai-provider";
import { getCachedEmbedding, cacheEmbedding } from "../cache";
import {
  AzureSearchResult,
  VectorSearchResult,
  getAzureSearchConfig,
  buildAzureUrl,
  buildAzureHeaders,
} from "./config";

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
      let errorMessage = "Azure Search API error";
      try {
        const error = await response.json();
        functions.logger.error("Azure Search error:", error);
        errorMessage = error.error?.message || errorMessage;
      } catch {
        const text = await response.text();
        functions.logger.error("Azure Search error (non-JSON):", text);
      }
      throw new Error(errorMessage);
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
