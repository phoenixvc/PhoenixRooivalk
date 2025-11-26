/**
 * RAG Search for Phoenix Rooivalk Documentation
 *
 * Provides semantic search functionality:
 * - Generates query embeddings
 * - Performs cosine similarity search
 * - Returns relevant document chunks
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { RAG_CONFIG } from "./indexer";

const db = admin.firestore();

// Configuration constants
const SEARCH_CONTENT_PREVIEW_LENGTH = 300;

/**
 * Search result interface
 */
export interface SearchResult {
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
  };
}

/**
 * Call OpenAI Embeddings API for query
 */
async function getQueryEmbedding(text: string): Promise<number[]> {
  const apiKey = functions.config().openai?.key;

  if (!apiKey) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "OpenAI API key not configured"
    );
  }

  try {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: RAG_CONFIG.embeddingModel,
        input: text,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "OpenAI Embeddings API error");
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    functions.logger.error("OpenAI Embeddings error:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to generate query embedding"
    );
  }
}

/**
 * Cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have same length");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);

  if (magnitude === 0) return 0;

  return dotProduct / magnitude;
}

/**
 * Search for relevant document chunks
 */
export async function searchDocuments(
  query: string,
  options?: {
    topK?: number;
    category?: string;
    minScore?: number;
  }
): Promise<SearchResult[]> {
  const { topK = 5, category, minScore = 0.65 } = options || {};

  // Generate query embedding
  const queryVector = await getQueryEmbedding(query);

  // Build Firestore query
  let firestoreQuery: admin.firestore.Query = db.collection("doc_embeddings");

  if (category) {
    firestoreQuery = firestoreQuery.where("metadata.category", "==", category);
  }

  // Get all embeddings (for collections < 10K docs)
  const snapshot = await firestoreQuery.get();

  // Calculate similarity scores
  const results: SearchResult[] = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const score = cosineSimilarity(queryVector, data.embedding);

    if (score >= minScore) {
      results.push({
        docId: data.docId,
        chunkId: data.chunkId,
        title: data.title,
        section: data.section,
        content: data.content,
        score,
        metadata: data.metadata,
      });
    }
  }

  // Sort by score and return top K
  return results.sort((a, b) => b.score - a.score).slice(0, topK);
}

/**
 * Search documents with deduplication by document
 */
export async function searchDocumentsUnique(
  query: string,
  options?: {
    topK?: number;
    category?: string;
    minScore?: number;
  }
): Promise<SearchResult[]> {
  const { topK = 5 } = options || {};

  // Get more results initially to allow for deduplication
  const results = await searchDocuments(query, {
    ...options,
    topK: topK * 3,
  });

  // Deduplicate by docId, keeping highest score per document
  const seenDocs = new Set<string>();
  const uniqueResults: SearchResult[] = [];

  for (const result of results) {
    if (!seenDocs.has(result.docId)) {
      seenDocs.add(result.docId);
      uniqueResults.push(result);

      if (uniqueResults.length >= topK) break;
    }
  }

  return uniqueResults;
}

/**
 * Get related documents based on a source document
 */
export async function getRelatedDocuments(
  docId: string,
  options?: {
    topK?: number;
    excludeSelf?: boolean;
  }
): Promise<SearchResult[]> {
  const { topK = 5, excludeSelf = true } = options || {};

  // Get the document's first chunk for comparison
  const docChunks = await db
    .collection("doc_embeddings")
    .where("docId", "==", docId)
    .where("metadata.chunkIndex", "==", 0)
    .limit(1)
    .get();

  if (docChunks.empty) {
    return [];
  }

  const sourceEmbedding = docChunks.docs[0].data().embedding;

  // Get all embeddings
  const snapshot = await db.collection("doc_embeddings").get();

  // Calculate similarity
  const results: SearchResult[] = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();

    // Skip self if requested
    if (excludeSelf && data.docId === docId) continue;

    // Only use first chunk of each document
    if (data.metadata.chunkIndex !== 0) continue;

    const score = cosineSimilarity(sourceEmbedding, data.embedding);

    if (score >= 0.7) {
      results.push({
        docId: data.docId,
        chunkId: data.chunkId,
        title: data.title,
        section: data.section,
        content: data.content,
        score,
        metadata: data.metadata,
      });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, topK);
}

/**
 * Exposed Cloud Function for searching documents
 */
export const searchDocs = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required"
    );
  }

  const { query, category, topK, minScore } = data;

  if (!query || typeof query !== "string") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Query is required"
    );
  }

  try {
    const results = await searchDocuments(query, {
      category,
      topK: topK || 5,
      minScore: minScore || 0.65,
    });

    return {
      results: results.map((r) => ({
        docId: r.docId,
        title: r.title,
        section: r.section,
        content: r.content.substring(0, SEARCH_CONTENT_PREVIEW_LENGTH) + "...",
        score: Math.round(r.score * 100) / 100,
      })),
    };
  } catch (error) {
    functions.logger.error("Search error:", error);
    throw new functions.https.HttpsError("internal", "Failed to search documents");
  }
});
