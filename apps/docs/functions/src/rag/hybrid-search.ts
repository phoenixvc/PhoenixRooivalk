/**
 * Hybrid Search - Phase 2.3
 *
 * Combines vector (semantic) search with keyword (BM25-style) search
 * for improved relevance and exact match handling.
 *
 * Features:
 * - Weighted combination of vector and keyword results
 * - Reciprocal rank fusion for score normalization
 * - Configurable weights per search type
 * - Support for exact phrase matching
 */

import { searchDocuments, SearchResult } from "./search";

/**
 * Hybrid search configuration
 */
export interface HybridSearchOptions {
  /** Weight for vector (semantic) search results (0-1) */
  vectorWeight?: number;
  /** Weight for keyword search results (0-1) */
  keywordWeight?: number;
  /** Maximum results to return */
  topK?: number;
  /** Minimum score threshold */
  minScore?: number;
  /** Document category filter */
  category?: string;
  /** Boost exact phrase matches */
  boostExactMatches?: boolean;
  /** K constant for RRF (Reciprocal Rank Fusion) */
  rrfK?: number;
}

/**
 * Hybrid search result with score breakdown
 */
export interface HybridSearchResult extends SearchResult {
  /** Combined score from both search methods */
  combinedScore: number;
  /** Score breakdown */
  scoreBreakdown: {
    vector: number;
    keyword: number;
    exactMatchBoost: number;
  };
}

/**
 * Simple keyword search using string matching
 * Returns results scored by keyword frequency and position
 */
async function keywordSearch(
  query: string,
  options: { topK?: number; category?: string } = {},
): Promise<SearchResult[]> {
  const { topK = 10, category } = options;

  // Extract keywords from query (simple tokenization)
  const keywords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2)
    .slice(0, 10);

  if (keywords.length === 0) {
    return [];
  }

  // Use vector search with keyword-focused query
  // This leverages the existing search infrastructure
  const keywordQuery = keywords.join(" ");
  const results = await searchDocuments(keywordQuery, {
    topK: topK * 2, // Get more results to allow for filtering
    minScore: 0.3,
    category,
  });

  // Re-score based on keyword presence
  const rescoredResults = results.map((result) => {
    const contentLower = result.content.toLowerCase();
    const titleLower = result.title.toLowerCase();

    let keywordScore = 0;
    let matchCount = 0;

    keywords.forEach((keyword) => {
      // Title matches are worth more
      if (titleLower.includes(keyword)) {
        keywordScore += 0.3;
        matchCount++;
      }
      // Content matches
      const contentMatches = (contentLower.match(new RegExp(keyword, "g")) || [])
        .length;
      if (contentMatches > 0) {
        keywordScore += Math.min(0.1 * contentMatches, 0.3);
        matchCount++;
      }
    });

    // Normalize by keyword count
    const normalizedScore =
      keywords.length > 0 ? keywordScore / keywords.length : 0;

    return {
      ...result,
      score: Math.min(normalizedScore + result.score * 0.3, 1),
    };
  });

  return rescoredResults.sort((a, b) => b.score - a.score).slice(0, topK);
}

/**
 * Check if content contains exact phrase match
 */
function hasExactMatch(content: string, query: string): boolean {
  return content.toLowerCase().includes(query.toLowerCase());
}

/**
 * Reciprocal Rank Fusion (RRF) for combining ranked lists
 * RRF score = 1 / (k + rank)
 */
function calculateRRFScore(rank: number, k: number = 60): number {
  return 1 / (k + rank);
}

/**
 * Combine and re-rank results from multiple search methods
 */
function combineResults(
  vectorResults: SearchResult[],
  keywordResults: SearchResult[],
  options: HybridSearchOptions,
): HybridSearchResult[] {
  const {
    vectorWeight = 0.7,
    keywordWeight = 0.3,
    rrfK = 60,
    boostExactMatches = true,
  } = options;

  const resultMap = new Map<
    string,
    {
      result: SearchResult;
      vectorRank: number | null;
      keywordRank: number | null;
      exactMatch: boolean;
    }
  >();

  // Add vector results with rank
  vectorResults.forEach((result, index) => {
    resultMap.set(result.docId, {
      result,
      vectorRank: index + 1,
      keywordRank: null,
      exactMatch: false,
    });
  });

  // Merge keyword results
  keywordResults.forEach((result, index) => {
    const existing = resultMap.get(result.docId);
    if (existing) {
      existing.keywordRank = index + 1;
    } else {
      resultMap.set(result.docId, {
        result,
        vectorRank: null,
        keywordRank: index + 1,
        exactMatch: false,
      });
    }
  });

  // Calculate combined scores using RRF
  const combinedResults: HybridSearchResult[] = [];

  resultMap.forEach(({ result, vectorRank, keywordRank }) => {
    // Calculate RRF scores
    const vectorRRF = vectorRank ? calculateRRFScore(vectorRank, rrfK) : 0;
    const keywordRRF = keywordRank ? calculateRRFScore(keywordRank, rrfK) : 0;

    // Weighted combination
    const baseScore = vectorRRF * vectorWeight + keywordRRF * keywordWeight;

    // Exact match boost
    let exactMatchBoost = 0;
    if (boostExactMatches && options.query) {
      if (hasExactMatch(result.content, options.query)) {
        exactMatchBoost = 0.1;
      }
      if (hasExactMatch(result.title, options.query)) {
        exactMatchBoost = 0.2;
      }
    }

    const combinedScore = Math.min(baseScore + exactMatchBoost, 1);

    combinedResults.push({
      ...result,
      score: combinedScore, // Override with combined score
      combinedScore,
      scoreBreakdown: {
        vector: vectorRRF,
        keyword: keywordRRF,
        exactMatchBoost,
      },
    });
  });

  // Sort by combined score
  return combinedResults.sort((a, b) => b.combinedScore - a.combinedScore);
}

/**
 * Hybrid search combining vector and keyword search
 */
export async function hybridSearch(
  query: string,
  options: HybridSearchOptions = {},
): Promise<HybridSearchResult[]> {
  const {
    vectorWeight = 0.7,
    keywordWeight = 0.3,
    topK = 5,
    minScore = 0.3,
    category,
  } = options;

  // Run searches in parallel for better performance
  const [vectorResults, keywordResults] = await Promise.all([
    searchDocuments(query, {
      topK: topK * 2,
      minScore: minScore * 0.8, // Lower threshold for initial retrieval
      category,
    }),
    keywordSearch(query, {
      topK: topK * 2,
      category,
    }),
  ]);

  // Combine results
  const combined = combineResults(vectorResults, keywordResults, {
    ...options,
    query, // Pass query for exact match checking
    vectorWeight,
    keywordWeight,
  });

  // Filter and limit
  return combined.filter((r) => r.combinedScore >= minScore).slice(0, topK);
}

/**
 * Search with automatic method selection based on query characteristics
 */
export async function smartSearch(
  query: string,
  options: Omit<HybridSearchOptions, "vectorWeight" | "keywordWeight"> = {},
): Promise<HybridSearchResult[]> {
  // Analyze query to determine optimal weights
  const queryWords = query.split(/\s+/);
  const hasQuotes = query.includes('"');
  const isShortQuery = queryWords.length <= 3;
  const hasSpecialTerms = /[A-Z]{2,}|[0-9]+|Phoenix|Rooivalk/i.test(query);

  // Adjust weights based on query characteristics
  let vectorWeight = 0.7;
  let keywordWeight = 0.3;

  if (hasQuotes) {
    // Exact phrase search - favor keyword
    vectorWeight = 0.3;
    keywordWeight = 0.7;
  } else if (isShortQuery && hasSpecialTerms) {
    // Short technical query - balanced
    vectorWeight = 0.5;
    keywordWeight = 0.5;
  } else if (queryWords.length > 6) {
    // Long natural language query - favor vector
    vectorWeight = 0.8;
    keywordWeight = 0.2;
  }

  return hybridSearch(query, {
    ...options,
    vectorWeight,
    keywordWeight,
  });
}

/**
 * Get search method statistics for monitoring
 */
export function getSearchStats(results: HybridSearchResult[]): {
  avgVectorScore: number;
  avgKeywordScore: number;
  exactMatchCount: number;
  topResultSource: "vector" | "keyword" | "both";
} {
  if (results.length === 0) {
    return {
      avgVectorScore: 0,
      avgKeywordScore: 0,
      exactMatchCount: 0,
      topResultSource: "vector",
    };
  }

  const avgVectorScore =
    results.reduce((sum, r) => sum + r.scoreBreakdown.vector, 0) / results.length;
  const avgKeywordScore =
    results.reduce((sum, r) => sum + r.scoreBreakdown.keyword, 0) / results.length;
  const exactMatchCount = results.filter(
    (r) => r.scoreBreakdown.exactMatchBoost > 0,
  ).length;

  const topResult = results[0];
  let topResultSource: "vector" | "keyword" | "both" = "vector";
  if (topResult) {
    if (
      topResult.scoreBreakdown.vector > 0 &&
      topResult.scoreBreakdown.keyword > 0
    ) {
      topResultSource = "both";
    } else if (topResult.scoreBreakdown.keyword > topResult.scoreBreakdown.vector) {
      topResultSource = "keyword";
    }
  }

  return {
    avgVectorScore,
    avgKeywordScore,
    exactMatchCount,
    topResultSource,
  };
}
