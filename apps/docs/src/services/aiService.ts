/**
 * AI Service for Phoenix Rooivalk Documentation
 *
 * Provides client-side interface to AI Cloud Functions:
 * - Competitor analysis
 * - SWOT analysis
 * - Reading recommendations
 * - Document improvements
 * - Market insights
 * - Content summarization
 */

import { getFunctions, httpsCallable, HttpsCallableResult } from "firebase/functions";
import { app, isFirebaseConfigured } from "./firebase";

// Types for AI responses
export interface CompetitorAnalysisResult {
  analysis: string;
}

export interface SWOTResult {
  swot: string;
}

export interface ReadingRecommendation {
  docId: string;
  reason: string;
  relevanceScore: number;
}

export interface RecommendationsResult {
  recommendations: ReadingRecommendation[];
  learningPath?: string;
  message?: string;
}

export interface DocumentImprovementResult {
  suggestionId: string;
  suggestions: string;
  message: string;
}

export interface MarketInsightsResult {
  insights: string;
}

export interface SummaryResult {
  summary: string;
}

export interface PendingImprovement {
  id: string;
  docId: string;
  docTitle: string;
  userId: string;
  userEmail?: string;
  suggestions: string;
  status: "pending" | "approved" | "rejected" | "implemented";
  createdAt: unknown;
  reviewedAt?: unknown;
  reviewedBy?: string;
  reviewNotes?: string;
}

// RAG Response types
export interface RAGSource {
  docId: string;
  title: string;
  section: string;
  relevance: number;
}

export interface RAGResponse {
  answer: string;
  sources: RAGSource[];
  confidence: "high" | "medium" | "low";
  tokensUsed?: number;
}

export interface SearchResultItem {
  docId: string;
  title: string;
  section: string;
  content: string;
  score: number;
}

export interface IndexStats {
  totalChunks: number;
  totalDocuments: number;
  categories: Record<string, number>;
}

// AI Feature types
export type AIFeature =
  | "competitor"
  | "swot"
  | "recommendations"
  | "improvements"
  | "market"
  | "summary"
  | "ask";

// Error types
export class AIError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "AIError";
    this.code = code;
  }
}

/**
 * AI Service class - provides all AI functionality
 */
class AIService {
  private functions: ReturnType<typeof getFunctions> | null = null;
  private isInitialized = false;

  /**
   * Initialize the AI service
   */
  init(): boolean {
    if (this.isInitialized) return true;

    if (!isFirebaseConfigured() || typeof window === "undefined") {
      console.warn("AI Service: Firebase not configured");
      return false;
    }

    try {
      this.functions = getFunctions(app!);
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error("AI Service initialization failed:", error);
      return false;
    }
  }

  /**
   * Check if AI service is available
   */
  isAvailable(): boolean {
    return this.isInitialized && this.functions !== null;
  }

  /**
   * Handle function call errors
   */
  private handleError(error: any): never {
    const code = error.code || "unknown";
    const message = error.message || "An error occurred";

    if (code === "unauthenticated") {
      throw new AIError("Please sign in to use AI features", code);
    }
    if (code === "resource-exhausted") {
      throw new AIError("Rate limit exceeded. Please try again later.", code);
    }
    if (code === "failed-precondition") {
      throw new AIError("AI service not configured. Contact administrator.", code);
    }

    throw new AIError(message, code);
  }

  /**
   * Analyze competitors in the defense/drone market
   */
  async analyzeCompetitors(
    competitors: string[],
    focusAreas?: string[]
  ): Promise<CompetitorAnalysisResult> {
    if (!this.init()) {
      throw new AIError("AI service not available", "unavailable");
    }

    try {
      const analyzeCompetitorsFn = httpsCallable<
        { competitors: string[]; focusAreas?: string[] },
        CompetitorAnalysisResult
      >(this.functions!, "analyzeCompetitors");

      const result = await analyzeCompetitorsFn({ competitors, focusAreas });
      return result.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Generate SWOT analysis for a topic
   */
  async generateSWOT(topic: string, context?: string): Promise<SWOTResult> {
    if (!this.init()) {
      throw new AIError("AI service not available", "unavailable");
    }

    try {
      const generateSWOTFn = httpsCallable<
        { topic: string; context?: string },
        SWOTResult
      >(this.functions!, "generateSWOT");

      const result = await generateSWOTFn({ topic, context });
      return result.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get personalized reading recommendations
   */
  async getReadingRecommendations(
    currentDocId?: string
  ): Promise<RecommendationsResult> {
    if (!this.init()) {
      throw new AIError("AI service not available", "unavailable");
    }

    try {
      const getRecommendationsFn = httpsCallable<
        { currentDocId?: string },
        RecommendationsResult
      >(this.functions!, "getReadingRecommendations");

      const result = await getRecommendationsFn({ currentDocId });
      return result.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Suggest improvements for a document
   */
  async suggestDocumentImprovements(
    docId: string,
    docTitle: string,
    docContent: string
  ): Promise<DocumentImprovementResult> {
    if (!this.init()) {
      throw new AIError("AI service not available", "unavailable");
    }

    try {
      const suggestImprovementsFn = httpsCallable<
        { docId: string; docTitle: string; docContent: string; userId: string },
        DocumentImprovementResult
      >(this.functions!, "suggestDocumentImprovements");

      const result = await suggestImprovementsFn({
        docId,
        docTitle,
        docContent,
        userId: "", // Will be set by the function from context
      });
      return result.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get market insights on a topic
   */
  async getMarketInsights(
    topic: string,
    industry?: string
  ): Promise<MarketInsightsResult> {
    if (!this.init()) {
      throw new AIError("AI service not available", "unavailable");
    }

    try {
      const getMarketInsightsFn = httpsCallable<
        { topic: string; industry?: string },
        MarketInsightsResult
      >(this.functions!, "getMarketInsights");

      const result = await getMarketInsightsFn({ topic, industry });
      return result.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Summarize content
   */
  async summarizeContent(
    content: string,
    maxLength?: number
  ): Promise<SummaryResult> {
    if (!this.init()) {
      throw new AIError("AI service not available", "unavailable");
    }

    try {
      const summarizeContentFn = httpsCallable<
        { content: string; maxLength?: number },
        SummaryResult
      >(this.functions!, "summarizeContent");

      const result = await summarizeContentFn({ content, maxLength });
      return result.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Review a document improvement suggestion (admin only)
   */
  async reviewImprovement(
    suggestionId: string,
    status: "approved" | "rejected" | "implemented",
    notes?: string
  ): Promise<{ success: boolean; status: string }> {
    if (!this.init()) {
      throw new AIError("AI service not available", "unavailable");
    }

    try {
      const reviewFn = httpsCallable<
        { suggestionId: string; status: string; notes?: string },
        { success: boolean; status: string }
      >(this.functions!, "reviewDocumentImprovement");

      const result = await reviewFn({ suggestionId, status, notes });
      return result.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get pending improvement suggestions (admin only)
   */
  async getPendingImprovements(
    limit?: number
  ): Promise<{ suggestions: PendingImprovement[] }> {
    if (!this.init()) {
      throw new AIError("AI service not available", "unavailable");
    }

    try {
      const getPendingFn = httpsCallable<
        { limit?: number },
        { suggestions: PendingImprovement[] }
      >(this.functions!, "getPendingImprovements");

      const result = await getPendingFn({ limit });
      return result.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Ask questions about documentation using RAG
   */
  async askDocumentation(
    question: string,
    options?: {
      category?: string;
      format?: "detailed" | "concise";
      history?: Array<{ role: "user" | "assistant"; content: string }>;
    }
  ): Promise<RAGResponse> {
    if (!this.init()) {
      throw new AIError("AI service not available", "unavailable");
    }

    try {
      const askDocsFn = httpsCallable<
        {
          question: string;
          category?: string;
          format?: string;
          history?: Array<{ role: string; content: string }>;
        },
        RAGResponse
      >(this.functions!, "askDocumentation");

      const result = await askDocsFn({
        question,
        category: options?.category,
        format: options?.format,
        history: options?.history,
      });

      return result.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Search documentation using semantic search
   */
  async searchDocumentation(
    query: string,
    options?: { category?: string; topK?: number }
  ): Promise<SearchResultItem[]> {
    if (!this.init()) {
      throw new AIError("AI service not available", "unavailable");
    }

    try {
      const searchFn = httpsCallable<
        { query: string; category?: string; topK?: number },
        { results: SearchResultItem[] }
      >(this.functions!, "searchDocs");

      const result = await searchFn({
        query,
        category: options?.category,
        topK: options?.topK,
      });

      return result.data.results;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get suggested questions based on current context
   */
  async getSuggestedQuestions(
    docId?: string,
    category?: string
  ): Promise<{ suggestions: string[]; docInfo: { title: string; category: string } | null }> {
    if (!this.init()) {
      throw new AIError("AI service not available", "unavailable");
    }

    try {
      const getSuggestionsFn = httpsCallable<
        { docId?: string; category?: string },
        { suggestions: string[]; docInfo: { title: string; category: string } | null }
      >(this.functions!, "getSuggestedQuestions");

      const result = await getSuggestionsFn({ docId, category });
      return result.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get RAG index statistics (admin only)
   */
  async getIndexStats(): Promise<IndexStats> {
    if (!this.init()) {
      throw new AIError("AI service not available", "unavailable");
    }

    try {
      const getStatsFn = httpsCallable<Record<string, never>, IndexStats>(
        this.functions!,
        "getIndexStats"
      );

      const result = await getStatsFn({});
      return result.data;
    } catch (error) {
      this.handleError(error);
    }
  }
}

// Singleton instance
export const aiService = new AIService();

// React hook for AI service
export function useAI() {
  return aiService;
}

// Predefined competitor lists for quick analysis
export const KNOWN_COMPETITORS = {
  kinetic: [
    "Anduril Industries",
    "DroneShield",
    "Dedrone",
    "RADA Electronic Industries",
    "Blighter Surveillance Systems",
  ],
  electronic: [
    "DroneShield",
    "Dedrone",
    "Battelle DroneDefender",
    "Department 13",
    "Black Sage Technologies",
  ],
  laser: [
    "Raytheon",
    "Lockheed Martin",
    "Northrop Grumman",
    "Rafael Advanced Defense Systems",
    "Rheinmetall",
  ],
  comprehensive: [
    "Anduril Industries",
    "Rafael Advanced Defense Systems",
    "Raytheon",
    "MBDA",
    "Leonardo",
  ],
};

// Predefined SWOT topics
export const SWOT_TOPICS = {
  product: "Phoenix Rooivalk Autonomous Kinetic Interceptor",
  market: "Counter-UAS Defense Market Entry Strategy",
  technology: "Reusable Kinetic Vehicle Technology",
  blockchain: "Blockchain-Verified Chain of Custody in Defense",
  partnerships: "Defense Industry Partnership Strategy",
};

// Predefined market insight topics
export const MARKET_TOPICS = {
  cuasMarket: "Counter-UAS (C-UAS) Defense Market",
  autonomousDefense: "Autonomous Defense Systems",
  criticalInfrastructure: "Critical Infrastructure Protection",
  militaryDrones: "Military Drone Defense",
  regulatoryLandscape: "Drone Defense Regulations and Certification",
};
