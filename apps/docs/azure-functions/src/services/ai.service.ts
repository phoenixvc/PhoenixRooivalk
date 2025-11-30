/**
 * AI Service
 *
 * Business logic for AI-powered analysis operations.
 */

import { generateCompletion, generateEmbeddings } from "../lib/openai";
import { queryDocuments } from "../lib/cosmos";
import { createLogger, Logger } from "../lib/logger";
import {
  COMPETITOR_PROMPT,
  SWOT_PROMPT,
  MARKET_PROMPT,
  SUMMARY_PROMPT,
  RECOMMENDATIONS_PROMPT,
  IMPROVEMENTS_PROMPT,
  RAG_QUERY_PROMPT,
  RESEARCH_PROMPT,
  buildUserPrompt,
  getModelConfig,
} from "../prompts";

// Module-level logger
const logger: Logger = createLogger({ feature: "ai-service" });

/**
 * Document chunk for RAG search
 */
interface DocChunk {
  id: string;
  docId: string;
  title: string;
  section: string;
  content: string;
  embedding: number[];
  category?: string;
}

/**
 * Search result with score
 */
interface SearchResult {
  docId: string;
  title: string;
  section: string;
  content: string;
  score: number;
}

/**
 * Cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

/**
 * AI Service class
 */
export class AIService {
  /**
   * Search documentation for RAG context
   */
  async searchDocuments(
    query: string,
    options: { topK?: number; minScore?: number; category?: string } = {},
  ): Promise<SearchResult[]> {
    const { topK = 5, minScore = 0.6, category } = options;

    // Generate query embedding
    const queryEmbedding = await generateEmbeddings(query);

    // Query documents
    let dbQuery = "SELECT * FROM c";
    const params: Array<{ name: string; value: string }> = [];

    if (category) {
      dbQuery += " WHERE c.category = @category";
      params.push({ name: "@category", value: category });
    }

    const chunks = await queryDocuments<DocChunk>(
      "doc_embeddings",
      dbQuery,
      params,
    );

    // Calculate similarity and filter
    const results: SearchResult[] = [];

    for (const chunk of chunks) {
      if (!chunk.embedding) continue;

      const score = cosineSimilarity(queryEmbedding, chunk.embedding);
      if (score >= minScore) {
        results.push({
          docId: chunk.docId,
          title: chunk.title,
          section: chunk.section,
          content: chunk.content,
          score,
        });
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, topK);
  }

  /**
   * Build context string from search results
   */
  private buildDocumentContext(results: SearchResult[]): string {
    if (results.length === 0) return "";

    return results
      .map(
        (r, i) =>
          `[Source ${i + 1}: ${r.title} - ${r.section}]\n${r.content.substring(0, 500)}`,
      )
      .join("\n\n---\n\n");
  }

  /**
   * Analyze competitors
   */
  async analyzeCompetitors(
    competitors: string[],
    focusAreas?: string[],
  ): Promise<{
    analysis: string;
    sources: Array<{ title: string; section: string }>;
    ragEnabled: boolean;
  }> {
    // Search for relevant Phoenix Rooivalk documentation
    const searchQuery = `Phoenix Rooivalk technical capabilities specifications ${
      focusAreas?.length
        ? focusAreas.join(" ")
        : "counter-UAS defense drone interceptor"
    }`;

    let documentContext = "";
    let sources: Array<{ title: string; section: string }> = [];

    try {
      const ragResults = await this.searchDocuments(searchQuery, { topK: 5 });
      if (ragResults.length > 0) {
        documentContext = this.buildDocumentContext(ragResults);
        sources = ragResults.map((r) => ({
          title: r.title,
          section: r.section,
        }));
      }
    } catch (error) {
      logger.warn(
        "RAG search failed for competitor analysis, continuing without context",
        {
          operation: "analyzeCompetitors",
          competitors: competitors.slice(0, 3).join(", "),
        },
      );
    }

    const systemPrompt = documentContext
      ? `${COMPETITOR_PROMPT.system.base}\n\nRelevant Documentation:\n${documentContext}`
      : COMPETITOR_PROMPT.system.base;

    const userPrompt = buildUserPrompt(COMPETITOR_PROMPT, {
      competitors: competitors.join(", "),
      focusAreas: focusAreas?.join(", "),
    });

    const config = getModelConfig(COMPETITOR_PROMPT);
    const analysis = await generateCompletion(systemPrompt, userPrompt, {
      temperature: config.temperature,
      maxTokens: config.maxTokens,
    });

    return { analysis, sources, ragEnabled: documentContext.length > 0 };
  }

  /**
   * Generate SWOT analysis
   */
  async generateSWOT(options: {
    context?: string;
    focusArea?: string;
  }): Promise<{
    analysis: string;
    sources: Array<{ title: string; section: string }>;
  }> {
    // Search for relevant documentation
    let documentContext = "";
    let sources: Array<{ title: string; section: string }> = [];

    try {
      const ragResults = await this.searchDocuments(
        `Phoenix Rooivalk ${options.focusArea || "capabilities technology market"}`,
        { topK: 5 },
      );
      if (ragResults.length > 0) {
        documentContext = this.buildDocumentContext(ragResults);
        sources = ragResults.map((r) => ({
          title: r.title,
          section: r.section,
        }));
      }
    } catch (error) {
      logger.warn(
        "RAG search failed for SWOT analysis, continuing without context",
        {
          operation: "generateSWOT",
          focusArea: options.focusArea,
        },
      );
    }

    const systemPrompt = documentContext
      ? `${SWOT_PROMPT.system.base}\n\nRelevant Documentation:\n${documentContext}`
      : SWOT_PROMPT.system.base;

    const userPrompt = buildUserPrompt(SWOT_PROMPT, {
      context: options.context,
      focusArea: options.focusArea,
    });

    const config = getModelConfig(SWOT_PROMPT);
    const analysis = await generateCompletion(systemPrompt, userPrompt, {
      temperature: config.temperature,
      maxTokens: config.maxTokens,
    });

    return { analysis, sources };
  }

  /**
   * Get market insights
   */
  async getMarketInsights(options: {
    region?: string;
    segment?: string;
    timeframe?: string;
  }): Promise<{
    analysis: string;
    sources: Array<{ title: string; section: string }>;
  }> {
    // Search for market-related documentation
    let documentContext = "";
    let sources: Array<{ title: string; section: string }> = [];

    try {
      const ragResults = await this.searchDocuments(
        `counter-UAS market ${options.region || ""} ${options.segment || ""}`,
        { topK: 5 },
      );
      if (ragResults.length > 0) {
        documentContext = this.buildDocumentContext(ragResults);
        sources = ragResults.map((r) => ({
          title: r.title,
          section: r.section,
        }));
      }
    } catch (error) {
      logger.warn(
        "RAG search failed for market insights, continuing without context",
        {
          operation: "getMarketInsights",
          region: options.region,
          segment: options.segment,
        },
      );
    }

    const systemPrompt = documentContext
      ? `${MARKET_PROMPT.system.base}\n\nRelevant Documentation:\n${documentContext}`
      : MARKET_PROMPT.system.base;

    const userPrompt = buildUserPrompt(MARKET_PROMPT, {
      region: options.region,
      segment: options.segment,
      timeframe: options.timeframe,
    });

    const config = getModelConfig(MARKET_PROMPT);
    const analysis = await generateCompletion(systemPrompt, userPrompt, {
      temperature: config.temperature,
      maxTokens: config.maxTokens,
    });

    return { analysis, sources };
  }

  /**
   * Summarize content
   */
  async summarizeContent(
    content: string,
    options: { length?: string; audience?: string; format?: string } = {},
  ): Promise<string> {
    const userPrompt = buildUserPrompt(SUMMARY_PROMPT, {
      content,
      length: options.length,
      audience: options.audience,
      format: options.format,
    });

    const config = getModelConfig(SUMMARY_PROMPT);
    return generateCompletion(SUMMARY_PROMPT.system.base, userPrompt, {
      temperature: config.temperature,
      maxTokens: config.maxTokens,
    });
  }

  /**
   * Get reading recommendations
   */
  async getReadingRecommendations(userProfile: {
    role: string;
    interests: string[];
    experienceLevel: string;
    readHistory?: string[];
  }): Promise<{ recommendations: string }> {
    // Get available documentation sections
    const docs = await queryDocuments<{
      docId: string;
      title: string;
      category: string;
    }>("doc_metadata", "SELECT c.docId, c.title, c.category FROM c");

    const availableDocs = docs
      .map((d) => `- ${d.title} (${d.category})`)
      .join("\n");

    const userPrompt = buildUserPrompt(RECOMMENDATIONS_PROMPT, {
      role: userProfile.role,
      interests: userProfile.interests.join(", "),
      experienceLevel: userProfile.experienceLevel,
      readHistory: userProfile.readHistory?.join(", "),
      availableDocs,
    });

    const config = getModelConfig(RECOMMENDATIONS_PROMPT);
    const recommendations = await generateCompletion(
      RECOMMENDATIONS_PROMPT.system.base,
      userPrompt,
      { temperature: config.temperature, maxTokens: config.maxTokens },
    );

    return { recommendations };
  }

  /**
   * Suggest document improvements
   */
  async suggestImprovements(
    title: string,
    content: string,
    focusArea?: string,
  ): Promise<string> {
    const userPrompt = buildUserPrompt(IMPROVEMENTS_PROMPT, {
      title,
      content,
      focusArea,
    });

    const config = getModelConfig(IMPROVEMENTS_PROMPT);
    return generateCompletion(IMPROVEMENTS_PROMPT.system.base, userPrompt, {
      temperature: config.temperature,
      maxTokens: config.maxTokens,
    });
  }

  /**
   * Answer question using RAG
   */
  async askDocumentation(
    question: string,
    options: { category?: string; topK?: number } = {},
  ): Promise<{
    answer: string;
    sources: Array<{ title: string; section: string; relevance: number }>;
    confidence: "high" | "medium" | "low";
  }> {
    const ragResults = await this.searchDocuments(question, {
      topK: options.topK || 5,
      category: options.category,
    });

    if (ragResults.length === 0) {
      return {
        answer:
          "I couldn't find relevant documentation to answer your question. Please try rephrasing or ask about a different topic.",
        sources: [],
        confidence: "low",
      };
    }

    const context = this.buildDocumentContext(ragResults);
    const userPrompt = buildUserPrompt(RAG_QUERY_PROMPT, { context, question });

    const config = getModelConfig(RAG_QUERY_PROMPT);
    const answer = await generateCompletion(
      RAG_QUERY_PROMPT.system.base,
      userPrompt,
      {
        temperature: config.temperature,
        maxTokens: config.maxTokens,
      },
    );

    // Determine confidence based on scores
    const avgScore =
      ragResults.reduce((sum, r) => sum + r.score, 0) / ragResults.length;
    const confidence: "high" | "medium" | "low" =
      avgScore > 0.85 ? "high" : avgScore > 0.7 ? "medium" : "low";

    return {
      answer,
      sources: ragResults.map((r) => ({
        title: r.title,
        section: r.section,
        relevance: Math.round(r.score * 100) / 100,
      })),
      confidence,
    };
  }

  /**
   * Research a person
   */
  async researchPerson(
    name: string,
    options: { company?: string; role?: string; context?: string } = {},
  ): Promise<string> {
    const userPrompt = buildUserPrompt(RESEARCH_PROMPT, {
      name,
      company: options.company,
      role: options.role,
      context: options.context,
    });

    const config = getModelConfig(RESEARCH_PROMPT);
    return generateCompletion(RESEARCH_PROMPT.system.base, userPrompt, {
      temperature: config.temperature,
      maxTokens: config.maxTokens,
    });
  }
}

/**
 * Singleton instance
 */
export const aiService = new AIService();
