/**
 * Azure Functions Service Implementation
 *
 * Implements IFunctionsService and IAIFunctionsService using Azure Functions.
 */

import {
  IAIFunctionsService,
  CloudFunctionError,
  CompetitorAnalysisResult,
  SWOTResult,
  RecommendationsResult,
  DocumentImprovementResult,
  MarketInsightsResult,
  SummaryResult,
  RAGResponse,
  SearchResultItem,
  IndexStats,
  FunFactsResult,
  PendingImprovement,
} from "../interfaces/functions";
import { FunctionCallOptions } from "../interfaces/types";

/**
 * Azure Functions Configuration
 */
export interface AzureFunctionsConfig {
  baseUrl: string;
  apiKey?: string;
}

/**
 * Azure Functions Service
 */
export class AzureFunctionsService implements IAIFunctionsService {
  private config: AzureFunctionsConfig | null = null;
  private initialized = false;
  private authToken: string | null = null;

  constructor(config?: AzureFunctionsConfig) {
    this.config = config || null;
  }

  /**
   * Set the auth token for authenticated calls
   */
  setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  isConfigured(): boolean {
    return this.config !== null && Boolean(this.config.baseUrl);
  }

  async init(): Promise<boolean> {
    if (this.initialized) return true;
    if (!this.config) return false;

    this.initialized = true;
    return true;
  }

  async call<TInput, TOutput>(
    name: string,
    data: TInput,
    options?: FunctionCallOptions,
  ): Promise<TOutput> {
    if (!this.initialized) {
      await this.init();
    }

    if (!this.config) {
      // Return a graceful response instead of throwing
      // This allows the UI to handle unconfigured state gracefully
      return {
        success: false,
        offline: true,
        answer:
          "I'm currently unable to answer questions because the AI backend is not configured.\n\n" +
          "**What you can do:**\n" +
          "- Browse the documentation manually using the sidebar\n" +
          "- Use the search feature to find specific topics\n" +
          "- Check back later once the AI service is set up\n\n" +
          "If you're an administrator, visit `/admin/diagnostics` to configure the AI backend.",
        sources: [],
        confidence: "low",
        message: "AI backend not configured. Set AZURE_FUNCTIONS_BASE_URL.",
      } as TOutput;
    }

    // Remove trailing slash to prevent double-slash in URL
    const baseUrl = this.config.baseUrl.replace(/\/+$/, "");
    const url = `${baseUrl}/api/${name}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add API key if configured
    if (this.config.apiKey) {
      headers["x-functions-key"] = this.config.apiKey;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        options?.timeout || 30000,
      );

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
        signal: controller.signal,
        credentials: "include",
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new CloudFunctionError(
          error.message || `Function call failed: ${response.statusText}`,
          error.code || `http_${response.status}`,
        );
      }

      return response.json();
    } catch (error: any) {
      if (error.name === "AbortError") {
        throw new CloudFunctionError("Request timed out", "timeout");
      }
      if (error instanceof CloudFunctionError) {
        throw error;
      }
      throw new CloudFunctionError(error.message || "Unknown error", "unknown");
    }
  }

  async callAuthenticated<TInput, TOutput>(
    name: string,
    data: TInput,
    options?: FunctionCallOptions,
  ): Promise<TOutput> {
    if (!this.initialized) {
      await this.init();
    }

    if (!this.config) {
      // Return a graceful response instead of throwing
      return {
        success: false,
        offline: true,
        answer:
          "I'm currently unable to answer questions because the AI backend is not configured.\n\n" +
          "**What you can do:**\n" +
          "- Browse the documentation manually using the sidebar\n" +
          "- Use the search feature to find specific topics\n" +
          "- Check back later once the AI service is set up\n\n" +
          "If you're an administrator, visit `/admin/diagnostics` to configure the AI backend.",
        sources: [],
        confidence: "low",
        message: "AI backend not configured. Set AZURE_FUNCTIONS_BASE_URL.",
      } as TOutput;
    }

    if (!this.authToken) {
      throw new CloudFunctionError("Not authenticated", "unauthenticated");
    }

    // Remove trailing slash to prevent double-slash in URL
    const baseUrl = this.config.baseUrl.replace(/\/+$/, "");
    const url = `${baseUrl}/api/${name}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.authToken}`,
    };

    if (this.config.apiKey) {
      headers["x-functions-key"] = this.config.apiKey;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        options?.timeout || 30000,
      );

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
        signal: controller.signal,
        credentials: "include",
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        this.handleHttpError(response.status, error);
      }

      return response.json();
    } catch (error: any) {
      if (error.name === "AbortError") {
        throw new CloudFunctionError("Request timed out", "timeout");
      }
      if (error instanceof CloudFunctionError) {
        throw error;
      }
      throw new CloudFunctionError(error.message || "Unknown error", "unknown");
    }
  }

  // ============================================================================
  // AI Functions Implementation
  // ============================================================================

  async analyzeCompetitors(
    competitors: string[],
    focusAreas?: string[],
  ): Promise<CompetitorAnalysisResult> {
    return this.callAuthenticated<
      { competitors: string[]; focusAreas?: string[] },
      CompetitorAnalysisResult
    >("analyzeCompetitors", { competitors, focusAreas });
  }

  async generateSWOT(topic: string, context?: string): Promise<SWOTResult> {
    return this.callAuthenticated<
      { topic: string; context?: string },
      SWOTResult
    >("generateSWOT", { topic, context });
  }

  async getReadingRecommendations(
    currentDocId?: string,
  ): Promise<RecommendationsResult> {
    return this.callAuthenticated<
      { currentDocId?: string },
      RecommendationsResult
    >("getReadingRecommendations", { currentDocId });
  }

  async suggestDocumentImprovements(
    docId: string,
    docTitle: string,
    docContent: string,
  ): Promise<DocumentImprovementResult> {
    return this.callAuthenticated<
      { docId: string; docTitle: string; docContent: string },
      DocumentImprovementResult
    >("suggestDocumentImprovements", { docId, docTitle, docContent });
  }

  async getMarketInsights(
    topic: string,
    industry?: string,
  ): Promise<MarketInsightsResult> {
    return this.callAuthenticated<
      { topic: string; industry?: string },
      MarketInsightsResult
    >("getMarketInsights", { topic, industry });
  }

  async summarizeContent(
    content: string,
    maxLength?: number,
  ): Promise<SummaryResult> {
    return this.callAuthenticated<
      { content: string; maxLength?: number },
      SummaryResult
    >("summarizeContent", { content, maxLength });
  }

  async askDocumentation(
    question: string,
    options?: {
      category?: string;
      format?: "detailed" | "concise";
      history?: Array<{ role: "user" | "assistant"; content: string }>;
    },
  ): Promise<RAGResponse> {
    return this.callAuthenticated<
      {
        question: string;
        category?: string;
        format?: string;
        history?: Array<{ role: string; content: string }>;
      },
      RAGResponse
    >("askDocumentation", {
      question,
      category: options?.category,
      format: options?.format,
      history: options?.history,
    });
  }

  async searchDocumentation(
    query: string,
    options?: { category?: string; topK?: number },
  ): Promise<SearchResultItem[]> {
    const result = await this.call<
      { query: string; category?: string; topK?: number },
      { results: SearchResultItem[] }
    >("searchDocs", {
      query,
      category: options?.category,
      topK: options?.topK,
    });
    return result.results;
  }

  async getSuggestedQuestions(
    docId?: string,
    category?: string,
  ): Promise<{
    suggestions: string[];
    docInfo: { title: string; category: string } | null;
  }> {
    return this.call<
      { docId?: string; category?: string },
      {
        suggestions: string[];
        docInfo: { title: string; category: string } | null;
      }
    >("getSuggestedQuestions", { docId, category });
  }

  async researchPerson(
    firstName: string,
    lastName: string,
    linkedInUrl: string,
  ): Promise<FunFactsResult> {
    return this.callAuthenticated<
      { firstName: string; lastName: string; linkedInUrl: string },
      FunFactsResult
    >("researchPerson", { firstName, lastName, linkedInUrl });
  }

  async getIndexStats(): Promise<IndexStats> {
    return this.callAuthenticated<Record<string, never>, IndexStats>(
      "getIndexStats",
      {},
    );
  }

  async reviewImprovement(
    suggestionId: string,
    status: "approved" | "rejected" | "implemented",
    notes?: string,
  ): Promise<{ success: boolean; status: string }> {
    return this.callAuthenticated<
      { suggestionId: string; status: string; notes?: string },
      { success: boolean; status: string }
    >("reviewDocumentImprovement", { suggestionId, status, notes });
  }

  async getPendingImprovements(
    limit?: number,
  ): Promise<{ suggestions: PendingImprovement[] }> {
    return this.callAuthenticated<
      { limit?: number },
      { suggestions: PendingImprovement[] }
    >("getPendingImprovements", { limit });
  }

  // ============================================================================
  // Error Handling
  // ============================================================================

  private handleHttpError(status: number, error: any): never {
    const message = error.message || "An error occurred";

    switch (status) {
      case 401:
        throw new CloudFunctionError(
          "Please sign in to use this feature",
          "unauthenticated",
        );
      case 403:
        throw new CloudFunctionError("Access denied", "permission-denied");
      case 429:
        throw new CloudFunctionError(
          "Rate limit exceeded. Please try again later.",
          "resource-exhausted",
        );
      case 500:
        throw new CloudFunctionError(
          "Server error. Please try again.",
          "internal",
        );
      case 503:
        throw new CloudFunctionError(
          "Service unavailable. Please try again later.",
          "unavailable",
        );
      default:
        throw new CloudFunctionError(message, error.code || `http_${status}`);
    }
  }
}
