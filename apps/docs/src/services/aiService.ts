/**
 * AI Service for Phoenix Rooivalk Documentation
 *
 * Provides client-side interface to Azure Functions AI endpoints:
 * - Competitor analysis
 * - SWOT analysis
 * - Reading recommendations
 * - Document improvements
 * - Market insights
 * - Content summarization
 */

import { getFunctionsService, isCloudConfigured } from "./cloud";

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
 * AI Service class - provides all AI functionality via Azure Functions
 */
class AIService {
  private isInitialized = false;

  /**
   * Initialize the AI service
   */
  init(): boolean {
    if (this.isInitialized) return true;

    if (!isCloudConfigured() || typeof window === "undefined") {
      console.warn("AI Service: Azure not configured");
      return false;
    }

    this.isInitialized = true;
    return true;
  }

  /**
   * Check if AI service is available
   */
  isAvailable(): boolean {
    return this.isInitialized || isCloudConfigured();
  }

  /**
   * Get diagnostic information about AI service configuration
   * Helps users troubleshoot configuration issues
   */
  getDiagnostics(): {
    available: boolean;
    configured: boolean;
    functionsBaseUrl: string | null;
    provider: string;
    issues: string[];
  } {
    const issues: string[] = [];
    let functionsBaseUrl: string | null = null;

    // Check if window and Docusaurus data are available
    if (typeof window !== "undefined") {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const docusaurusData = (window as any).__DOCUSAURUS__;
        const config = docusaurusData?.siteConfig?.customFields?.azureConfig;
        functionsBaseUrl = config?.functionsBaseUrl || null;

        if (!functionsBaseUrl) {
          issues.push(
            "AZURE_FUNCTIONS_BASE_URL not set in build environment. This must be set in Netlify environment variables with 'All scopes' or 'Builds' selected.",
          );
        }

        if (!config?.clientId) {
          issues.push(
            "AZURE_ENTRA_CLIENT_ID not set. User authentication may not work.",
          );
        }

        if (!config?.tenantId) {
          issues.push(
            "AZURE_ENTRA_TENANT_ID not set. User authentication may not work.",
          );
        }
      } catch (error) {
        issues.push("Failed to read Docusaurus configuration.");
      }
    } else {
      issues.push("Window object not available (server-side rendering).");
    }

    return {
      available: this.isAvailable(),
      configured: isCloudConfigured(),
      functionsBaseUrl,
      provider: typeof window !== "undefined" ? "azure" : "unknown",
      issues,
    };
  }

  /**
   * Call an Azure Function
   */
  private async callFunction<T>(
    functionName: string,
    data: Record<string, unknown>,
  ): Promise<T> {
    const functionsService = getFunctionsService();
    return functionsService.call<Record<string, unknown>, T>(
      functionName,
      data,
    );
  }

  /**
   * Handle function call errors
   */
  private handleError(error: any): never {
    const code = error.code || "unknown";
    const message = error.message || "An error occurred";

    if (code === "unauthenticated" || code === "401") {
      throw new AIError("Please sign in to use AI features", "unauthenticated");
    }
    if (code === "resource-exhausted" || code === "429") {
      throw new AIError(
        "Rate limit exceeded. Please try again later.",
        "resource-exhausted",
      );
    }
    if (code === "failed-precondition" || code === "503") {
      throw new AIError(
        "AI service not configured. Contact administrator.",
        "failed-precondition",
      );
    }

    throw new AIError(message, code);
  }

  /**
   * Analyze competitors in the defense/drone market
   */
  async analyzeCompetitors(
    competitors: string[],
    focusAreas?: string[],
  ): Promise<CompetitorAnalysisResult> {
    if (!this.init()) {
      throw new AIError("AI service not available", "unavailable");
    }

    try {
      return await this.callFunction<CompetitorAnalysisResult>(
        "analyzeCompetitors",
        { competitors, focusAreas },
      );
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
      return await this.callFunction<SWOTResult>("generateSWOT", {
        topic,
        context,
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get personalized reading recommendations
   */
  async getReadingRecommendations(
    currentDocId?: string,
  ): Promise<RecommendationsResult> {
    if (!this.init()) {
      throw new AIError("AI service not available", "unavailable");
    }

    try {
      return await this.callFunction<RecommendationsResult>(
        "getReadingRecommendations",
        { currentDocId },
      );
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
    docContent: string,
  ): Promise<DocumentImprovementResult> {
    if (!this.init()) {
      throw new AIError("AI service not available", "unavailable");
    }

    try {
      return await this.callFunction<DocumentImprovementResult>(
        "suggestImprovements",
        {
          documentPath: docId,
          documentContent: docContent,
          focusArea: "all",
        },
      );
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get market insights on a topic
   */
  async getMarketInsights(
    topic: string,
    industry?: string,
  ): Promise<MarketInsightsResult> {
    if (!this.init()) {
      throw new AIError("AI service not available", "unavailable");
    }

    try {
      return await this.callFunction<MarketInsightsResult>(
        "getMarketInsights",
        {
          topic,
          industry,
        },
      );
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Summarize content
   */
  async summarizeContent(
    content: string,
    maxLength?: number,
  ): Promise<SummaryResult> {
    if (!this.init()) {
      throw new AIError("AI service not available", "unavailable");
    }

    try {
      return await this.callFunction<SummaryResult>("summarizeContent", {
        content,
        maxLength,
      });
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
    notes?: string,
  ): Promise<{ success: boolean; status: string }> {
    if (!this.init()) {
      throw new AIError("AI service not available", "unavailable");
    }

    try {
      return await this.callFunction<{ success: boolean; status: string }>(
        "reviewDocumentImprovement",
        { suggestionId, status, notes },
      );
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get pending improvement suggestions (admin only)
   */
  async getPendingImprovements(
    limit?: number,
  ): Promise<{ suggestions: PendingImprovement[] }> {
    if (!this.init()) {
      throw new AIError("AI service not available", "unavailable");
    }

    try {
      return await this.callFunction<{ suggestions: PendingImprovement[] }>(
        "getPendingImprovements",
        { limit },
      );
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
    },
  ): Promise<RAGResponse> {
    if (!this.init()) {
      throw new AIError("AI service not available", "unavailable");
    }

    try {
      return await this.callFunction<RAGResponse>("askDocumentation", {
        question,
        category: options?.category,
        format: options?.format,
        history: options?.history,
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Search documentation using semantic search
   */
  async searchDocumentation(
    query: string,
    options?: { category?: string; topK?: number },
  ): Promise<SearchResultItem[]> {
    if (!this.init()) {
      throw new AIError("AI service not available", "unavailable");
    }

    try {
      const result = await this.callFunction<{ results: SearchResultItem[] }>(
        "searchDocs",
        {
          query,
          category: options?.category,
          topK: options?.topK,
        },
      );
      return result.results;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get suggested questions based on current context
   */
  async getSuggestedQuestions(
    docId?: string,
    category?: string,
  ): Promise<{
    suggestions: string[];
    docInfo: { title: string; category: string } | null;
  }> {
    if (!this.init()) {
      throw new AIError("AI service not available", "unavailable");
    }

    try {
      return await this.callFunction<{
        suggestions: string[];
        docInfo: { title: string; category: string } | null;
      }>("getSuggestedQuestions", { docId, category });
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
      return await this.callFunction<IndexStats>("getIndexStats", {});
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Research a person and generate fun facts
   * Uses LinkedIn profile and name to generate interesting facts
   */
  async researchPerson(
    firstName: string,
    lastName: string,
    linkedInUrl: string,
  ): Promise<FunFactsResult> {
    if (!this.init()) {
      throw new AIError("AI service not available", "unavailable");
    }

    try {
      return await this.callFunction<FunFactsResult>("researchPerson", {
        firstName,
        lastName,
        linkedInUrl,
      });
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

// Fun facts research result
export interface FunFactsResult {
  facts: Array<{
    id: string;
    fact: string;
    category:
      | "professional"
      | "education"
      | "achievement"
      | "interest"
      | "other";
  }>;
  summary: string;
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
