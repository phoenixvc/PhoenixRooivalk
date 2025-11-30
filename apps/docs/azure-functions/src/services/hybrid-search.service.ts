/**
 * Hybrid Search Service
 *
 * Combines vector (semantic) search with keyword (BM25-like) search
 * using Reciprocal Rank Fusion (RRF) for result merging.
 */

import { SqlParameter } from "@azure/cosmos";
import { createLogger, Logger } from "../lib/logger";
import { generateEmbeddings } from "../lib/openai";
import { queryDocuments } from "../lib/cosmos";

const logger: Logger = createLogger({ feature: "hybrid-search" });

/**
 * Search result with scores
 */
export interface SearchResult {
  id: string;
  score: number;
  vectorScore?: number;
  keywordScore?: number;
  title?: string;
  content?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Hybrid search options
 */
export interface HybridSearchOptions {
  /** Weight for vector search (0-1), remainder goes to keyword */
  vectorWeight?: number;
  /** Maximum results to return */
  limit?: number;
  /** Minimum score threshold */
  minScore?: number;
  /** RRF constant (typically 60) */
  rrfK?: number;
  /** Container to search */
  container?: string;
  /** Fields to return */
  fields?: string[];
  /** Category filter */
  category?: string;
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
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

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

/**
 * Calculate BM25-like keyword score
 */
function calculateKeywordScore(
  query: string,
  text: string,
  avgDocLength: number = 500,
  k1: number = 1.2,
  b: number = 0.75,
): number {
  const queryTerms = query.toLowerCase().split(/\s+/);
  const docTerms = text.toLowerCase().split(/\s+/);
  const docLength = docTerms.length;

  // Term frequency in document
  const termFreq = new Map<string, number>();
  for (const term of docTerms) {
    termFreq.set(term, (termFreq.get(term) || 0) + 1);
  }

  let score = 0;

  for (const queryTerm of queryTerms) {
    const tf = termFreq.get(queryTerm) || 0;
    if (tf === 0) continue;

    // Simplified BM25 scoring (without IDF for single-doc scoring)
    const numerator = tf * (k1 + 1);
    const denominator = tf + k1 * (1 - b + b * (docLength / avgDocLength));
    score += numerator / denominator;
  }

  // Normalize by query length
  return score / queryTerms.length;
}

/**
 * Reciprocal Rank Fusion (RRF) to merge ranked lists
 *
 * RRF score = sum(1 / (k + rank_i)) for each ranking
 */
function reciprocalRankFusion(
  rankings: Map<string, number>[],
  k: number = 60,
): Map<string, number> {
  const fusedScores = new Map<string, number>();

  for (const ranking of rankings) {
    // Convert scores to ranks (higher score = lower rank number)
    const sortedEntries = [...ranking.entries()].sort((a, b) => b[1] - a[1]);

    sortedEntries.forEach(([id], rank) => {
      const rrfScore = 1 / (k + rank + 1); // +1 because rank is 0-indexed
      fusedScores.set(id, (fusedScores.get(id) || 0) + rrfScore);
    });
  }

  return fusedScores;
}

/**
 * Perform vector search
 */
async function vectorSearch(
  query: string,
  container: string,
  limit: number,
  category?: string,
): Promise<Map<string, { score: number; doc: Record<string, unknown> }>> {
  const queryEmbedding = await generateEmbeddings(query);

  // Query documents with embeddings
  let queryStr =
    "SELECT c.id, c.title, c.content, c.embedding, c.category, c.metadata FROM c WHERE IS_ARRAY(c.embedding)";
  const params: SqlParameter[] = [];

  if (category) {
    queryStr += " AND c.category = @category";
    params.push({ name: "@category", value: category });
  }

  const documents = await queryDocuments<{
    id: string;
    title?: string;
    content?: string;
    embedding: number[];
    category?: string;
    metadata?: Record<string, unknown>;
  }>(container, queryStr, params);

  const results = new Map<
    string,
    { score: number; doc: Record<string, unknown> }
  >();

  for (const doc of documents) {
    const similarity = cosineSimilarity(queryEmbedding, doc.embedding);
    results.set(doc.id, {
      score: similarity,
      doc: {
        id: doc.id,
        title: doc.title,
        content: doc.content,
        category: doc.category,
        metadata: doc.metadata,
      },
    });
  }

  return results;
}

/**
 * Perform keyword search
 */
async function keywordSearch(
  query: string,
  container: string,
  limit: number,
  category?: string,
): Promise<Map<string, { score: number; doc: Record<string, unknown> }>> {
  // Query documents
  let queryStr =
    "SELECT c.id, c.title, c.content, c.category, c.metadata FROM c";
  const params: SqlParameter[] = [];

  if (category) {
    queryStr += " WHERE c.category = @category";
    params.push({ name: "@category", value: category });
  }

  const documents = await queryDocuments<{
    id: string;
    title?: string;
    content?: string;
    category?: string;
    metadata?: Record<string, unknown>;
  }>(container, queryStr, params);

  const results = new Map<
    string,
    { score: number; doc: Record<string, unknown> }
  >();

  // Calculate average document length for BM25
  const totalLength = documents.reduce(
    (sum, doc) => sum + ((doc.content?.length || 0) + (doc.title?.length || 0)),
    0,
  );
  const avgDocLength =
    documents.length > 0 ? totalLength / documents.length : 500;

  for (const doc of documents) {
    const text = `${doc.title || ""} ${doc.content || ""}`;
    const score = calculateKeywordScore(query, text, avgDocLength);

    if (score > 0) {
      results.set(doc.id, {
        score,
        doc: {
          id: doc.id,
          title: doc.title,
          content: doc.content,
          category: doc.category,
          metadata: doc.metadata,
        },
      });
    }
  }

  return results;
}

/**
 * Perform hybrid search combining vector and keyword search
 */
export async function hybridSearch(
  query: string,
  options: HybridSearchOptions = {},
): Promise<SearchResult[]> {
  const {
    vectorWeight = 0.7,
    limit = 10,
    minScore = 0,
    rrfK = 60,
    container = "documents",
    category,
  } = options;

  logger.info("Performing hybrid search", {
    query: query.substring(0, 50),
    vectorWeight,
    limit,
    container,
  });

  try {
    // Perform both searches in parallel
    const [vectorResults, keywordResults] = await Promise.all([
      vectorSearch(query, container, limit * 2, category),
      keywordSearch(query, container, limit * 2, category),
    ]);

    // Extract score maps for RRF
    const vectorScores = new Map<string, number>();
    const keywordScores = new Map<string, number>();

    for (const [id, { score }] of vectorResults) {
      vectorScores.set(id, score);
    }
    for (const [id, { score }] of keywordResults) {
      keywordScores.set(id, score);
    }

    // Apply RRF to merge results
    const fusedScores = reciprocalRankFusion(
      [vectorScores, keywordScores],
      rrfK,
    );

    // Combine all documents
    const allDocs = new Map<string, Record<string, unknown>>();
    for (const [id, { doc }] of vectorResults) {
      allDocs.set(id, doc);
    }
    for (const [id, { doc }] of keywordResults) {
      if (!allDocs.has(id)) {
        allDocs.set(id, doc);
      }
    }

    // Build final results
    const results: SearchResult[] = [];

    for (const [id, score] of fusedScores) {
      if (score < minScore) continue;

      const doc = allDocs.get(id);
      if (!doc) continue;

      results.push({
        id,
        score,
        vectorScore: vectorScores.get(id),
        keywordScore: keywordScores.get(id),
        title: doc.title as string | undefined,
        content: doc.content as string | undefined,
        metadata: doc.metadata as Record<string, unknown> | undefined,
      });
    }

    // Sort by score and limit
    results.sort((a, b) => b.score - a.score);
    const finalResults = results.slice(0, limit);

    logger.info("Hybrid search complete", {
      totalResults: results.length,
      returned: finalResults.length,
      topScore: finalResults[0]?.score,
    });

    return finalResults;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error("Hybrid search failed", { error: errorMessage });
    throw error;
  }
}

/**
 * Search with weighted combination instead of RRF
 */
export async function weightedHybridSearch(
  query: string,
  options: HybridSearchOptions = {},
): Promise<SearchResult[]> {
  const {
    vectorWeight = 0.7,
    limit = 10,
    minScore = 0,
    container = "documents",
    category,
  } = options;

  const keywordWeight = 1 - vectorWeight;

  logger.info("Performing weighted hybrid search", {
    query: query.substring(0, 50),
    vectorWeight,
    keywordWeight,
    container,
  });

  try {
    // Perform both searches in parallel
    const [vectorResults, keywordResults] = await Promise.all([
      vectorSearch(query, container, limit * 2, category),
      keywordSearch(query, container, limit * 2, category),
    ]);

    // Normalize scores to 0-1 range
    const normalizeScores = (
      results: Map<string, { score: number; doc: Record<string, unknown> }>,
    ): Map<string, number> => {
      const scores = [...results.values()].map((r) => r.score);
      const maxScore = Math.max(...scores, 0.001);
      const minScoreVal = Math.min(...scores, 0);
      const range = maxScore - minScoreVal || 1;

      const normalized = new Map<string, number>();
      for (const [id, { score }] of results) {
        normalized.set(id, (score - minScoreVal) / range);
      }
      return normalized;
    };

    const normalizedVector = normalizeScores(vectorResults);
    const normalizedKeyword = normalizeScores(keywordResults);

    // Combine all document IDs
    const allIds = new Set([
      ...normalizedVector.keys(),
      ...normalizedKeyword.keys(),
    ]);

    // Combine all documents
    const allDocs = new Map<string, Record<string, unknown>>();
    for (const [id, { doc }] of vectorResults) {
      allDocs.set(id, doc);
    }
    for (const [id, { doc }] of keywordResults) {
      if (!allDocs.has(id)) {
        allDocs.set(id, doc);
      }
    }

    // Calculate weighted scores
    const results: SearchResult[] = [];

    for (const id of allIds) {
      const vectorScore = normalizedVector.get(id) || 0;
      const keywordScore = normalizedKeyword.get(id) || 0;
      const combinedScore =
        vectorWeight * vectorScore + keywordWeight * keywordScore;

      if (combinedScore < minScore) continue;

      const doc = allDocs.get(id);
      if (!doc) continue;

      results.push({
        id,
        score: combinedScore,
        vectorScore,
        keywordScore,
        title: doc.title as string | undefined,
        content: doc.content as string | undefined,
        metadata: doc.metadata as Record<string, unknown> | undefined,
      });
    }

    // Sort by score and limit
    results.sort((a, b) => b.score - a.score);
    const finalResults = results.slice(0, limit);

    logger.info("Weighted hybrid search complete", {
      totalResults: results.length,
      returned: finalResults.length,
      topScore: finalResults[0]?.score,
    });

    return finalResults;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error("Weighted hybrid search failed", { error: errorMessage });
    throw error;
  }
}

/**
 * Search documents with re-ranking
 */
export async function searchWithRerank(
  query: string,
  options: HybridSearchOptions & { rerankTopK?: number } = {},
): Promise<SearchResult[]> {
  const { rerankTopK = 20, limit = 10 } = options;

  // First, get more candidates using hybrid search
  const candidates = await hybridSearch(query, {
    ...options,
    limit: rerankTopK,
  });

  // Re-rank candidates based on more detailed scoring
  // In production, you might use a cross-encoder model here
  const reranked = candidates.map((result) => {
    // Calculate more detailed relevance
    const titleMatch = result.title?.toLowerCase().includes(query.toLowerCase())
      ? 0.2
      : 0;
    const exactMatch = result.content
      ?.toLowerCase()
      .includes(query.toLowerCase())
      ? 0.1
      : 0;

    return {
      ...result,
      score: result.score + titleMatch + exactMatch,
    };
  });

  reranked.sort((a, b) => b.score - a.score);

  return reranked.slice(0, limit);
}
