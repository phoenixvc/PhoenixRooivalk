/**
 * Vector Search Cloud Functions
 *
 * Provides Cloud Functions for vector search operations.
 */

import * as functions from "firebase-functions";
import { vectorSearch, vectorSearchUnique } from "./search";
import { getVectorSearchStats } from "./stats";

/**
 * Cloud Function: Vector Search
 */
export const vectorSearchDocs = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Authentication required",
      );
    }

    // Guard against null/undefined data before destructuring
    const { query, category, topK, minScore, unique } = (data ?? {}) as {
      query?: unknown;
      category?: string;
      topK?: number;
      minScore?: number;
      unique?: boolean;
    };

    // Validate query is a non-empty trimmed string
    if (typeof query !== "string" || query.trim().length === 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Query is required",
      );
    }

    try {
      const searchFn = unique ? vectorSearchUnique : vectorSearch;
      const { results, metrics } = await searchFn(query.trim(), {
        category,
        topK: topK ?? 5,
        minScore: minScore ?? 0.65,
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
    } catch (error) {
      functions.logger.error("Vector search error:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to search documents",
      );
    }
  },
);

/**
 * Cloud Function: Get Vector Search Stats
 */
export const getVectorStats = functions.https.onCall(async (_data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required",
    );
  }

  return getVectorSearchStats();
});
