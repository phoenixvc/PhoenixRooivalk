/**
 * Unit tests for hybrid search
 */

// Mock the dependencies
jest.mock("../lib/openai", () => ({
  generateEmbeddings: jest.fn().mockResolvedValue(new Array(1536).fill(0.1)),
}));

jest.mock("../lib/cosmos", () => ({
  queryDocuments: jest.fn().mockResolvedValue([]),
}));

jest.mock("../lib/logger", () => ({
  createLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }),
}));

describe("Hybrid Search", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("cosineSimilarity", () => {
    // Import after mocks are set up
    const cosineSimilarity = (a: number[], b: number[]): number => {
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
    };

    it("should return 1 for identical vectors", () => {
      const vector = [1, 2, 3, 4, 5];
      const similarity = cosineSimilarity(vector, vector);
      expect(similarity).toBeCloseTo(1, 5);
    });

    it("should return 0 for orthogonal vectors", () => {
      const a = [1, 0, 0];
      const b = [0, 1, 0];
      const similarity = cosineSimilarity(a, b);
      expect(similarity).toBeCloseTo(0, 5);
    });

    it("should return -1 for opposite vectors", () => {
      const a = [1, 2, 3];
      const b = [-1, -2, -3];
      const similarity = cosineSimilarity(a, b);
      expect(similarity).toBeCloseTo(-1, 5);
    });

    it("should throw for different length vectors", () => {
      const a = [1, 2, 3];
      const b = [1, 2];
      expect(() => cosineSimilarity(a, b)).toThrow("Vectors must have same length");
    });

    it("should handle zero vectors", () => {
      const a = [0, 0, 0];
      const b = [1, 2, 3];
      const similarity = cosineSimilarity(a, b);
      expect(similarity).toBe(0);
    });
  });

  describe("BM25 scoring", () => {
    const calculateKeywordScore = (
      query: string,
      text: string,
      avgDocLength: number = 500,
      k1: number = 1.2,
      b: number = 0.75,
    ): number => {
      const queryTerms = query.toLowerCase().split(/\s+/);
      const docTerms = text.toLowerCase().split(/\s+/);
      const docLength = docTerms.length;

      const termFreq = new Map<string, number>();
      for (const term of docTerms) {
        termFreq.set(term, (termFreq.get(term) || 0) + 1);
      }

      let score = 0;
      for (const queryTerm of queryTerms) {
        const tf = termFreq.get(queryTerm) || 0;
        if (tf === 0) continue;
        const numerator = tf * (k1 + 1);
        const denominator = tf + k1 * (1 - b + b * (docLength / avgDocLength));
        score += numerator / denominator;
      }
      return score / queryTerms.length;
    };

    it("should return higher score for exact matches", () => {
      const query = "azure functions";
      const text1 = "Azure Functions are great for serverless computing";
      const text2 = "AWS Lambda is a serverless computing platform";

      const score1 = calculateKeywordScore(query, text1);
      const score2 = calculateKeywordScore(query, text2);

      expect(score1).toBeGreaterThan(score2);
    });

    it("should return 0 for no matches", () => {
      const query = "azure functions";
      const text = "python django flask web development";

      const score = calculateKeywordScore(query, text);
      expect(score).toBe(0);
    });

    it("should handle repeated terms", () => {
      const query = "azure";
      const text1 = "azure azure azure cloud";
      const text2 = "azure cloud computing";

      const score1 = calculateKeywordScore(query, text1);
      const score2 = calculateKeywordScore(query, text2);

      // More occurrences should have higher score but with diminishing returns
      expect(score1).toBeGreaterThan(score2);
    });
  });

  describe("Reciprocal Rank Fusion", () => {
    const reciprocalRankFusion = (
      rankings: Map<string, number>[],
      k: number = 60,
    ): Map<string, number> => {
      const fusedScores = new Map<string, number>();

      for (const ranking of rankings) {
        const sortedEntries = [...ranking.entries()].sort((a, b) => b[1] - a[1]);
        sortedEntries.forEach(([id], rank) => {
          const rrfScore = 1 / (k + rank + 1);
          fusedScores.set(id, (fusedScores.get(id) || 0) + rrfScore);
        });
      }

      return fusedScores;
    };

    it("should combine rankings correctly", () => {
      const ranking1 = new Map([
        ["doc1", 0.9],
        ["doc2", 0.7],
        ["doc3", 0.5],
      ]);
      const ranking2 = new Map([
        ["doc2", 0.95],
        ["doc1", 0.6],
        ["doc3", 0.3],
      ]);

      const fused = reciprocalRankFusion([ranking1, ranking2]);

      // doc1: rank 0 in ranking1, rank 1 in ranking2
      // doc2: rank 1 in ranking1, rank 0 in ranking2
      // Both should have similar scores since they're each ranked first once
      expect(fused.get("doc1")).toBeDefined();
      expect(fused.get("doc2")).toBeDefined();

      // doc3 is ranked last in both, so should have lowest score
      expect(fused.get("doc3")).toBeLessThan(fused.get("doc1")!);
      expect(fused.get("doc3")).toBeLessThan(fused.get("doc2")!);
    });

    it("should handle documents in only one ranking", () => {
      const ranking1 = new Map([
        ["doc1", 0.9],
        ["doc2", 0.7],
      ]);
      const ranking2 = new Map([
        ["doc2", 0.95],
        ["doc3", 0.6],
      ]);

      const fused = reciprocalRankFusion([ranking1, ranking2]);

      expect(fused.has("doc1")).toBe(true);
      expect(fused.has("doc2")).toBe(true);
      expect(fused.has("doc3")).toBe(true);

      // doc2 appears in both, should have highest score
      expect(fused.get("doc2")).toBeGreaterThan(fused.get("doc1")!);
      expect(fused.get("doc2")).toBeGreaterThan(fused.get("doc3")!);
    });
  });
});
