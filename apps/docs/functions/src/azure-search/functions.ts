/**
 * Azure Search Cloud Functions
 *
 * HTTP-callable functions for Azure AI Search operations.
 */

import * as functions from "firebase-functions";
import { azureVectorSearch } from "./search";
import { ensureAzureIndex, getAzureIndexStats } from "./index-ops";

/**
 * Cloud Function: Azure Vector Search
 */
export const azureSearchDocs = functions.https.onCall(
  async (
    data: {
      query: string;
      category?: string;
      topK?: number;
      hybridSearch?: boolean;
    },
    context,
  ) => {
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
  },
);

/**
 * Cloud Function: Setup Azure Index (Admin only)
 */
export const setupAzureIndex = functions.https.onCall(
  async (_data: unknown, context) => {
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
export const getAzureStats = functions.https.onCall(
  async (_data: unknown, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Authentication required",
      );
    }

    return getAzureIndexStats();
  },
);
