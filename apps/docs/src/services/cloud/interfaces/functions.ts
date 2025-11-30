/**
 * Cloud Functions Service Interface
 *
 * Provides abstraction for serverless function calls across different cloud providers.
 * Implementations: Firebase Cloud Functions, Azure Functions
 */

import { FunctionCallOptions } from './types';

/**
 * Function call result
 */
export interface FunctionResult<T> {
  data: T;
}

/**
 * Function error
 */
export class CloudFunctionError extends Error {
  code: string;
  details?: unknown;

  constructor(message: string, code: string, details?: unknown) {
    super(message);
    this.name = 'CloudFunctionError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Cloud functions service interface
 */
export interface IFunctionsService {
  /**
   * Check if the functions service is configured and ready
   */
  isConfigured(): boolean;

  /**
   * Initialize the functions service
   */
  init(): Promise<boolean>;

  /**
   * Call a cloud function
   * @param name - Function name
   * @param data - Input data for the function
   * @param options - Call options (timeout, region)
   */
  call<TInput, TOutput>(
    name: string,
    data: TInput,
    options?: FunctionCallOptions
  ): Promise<TOutput>;

  /**
   * Call a cloud function with authentication
   * Automatically includes the user's ID token
   */
  callAuthenticated<TInput, TOutput>(
    name: string,
    data: TInput,
    options?: FunctionCallOptions
  ): Promise<TOutput>;
}

// ============================================================================
// AI Service Types (shared across implementations)
// ============================================================================

/**
 * Competitor analysis result
 */
export interface CompetitorAnalysisResult {
  analysis: string;
}

/**
 * SWOT analysis result
 */
export interface SWOTResult {
  swot: string;
}

/**
 * Reading recommendation
 */
export interface ReadingRecommendation {
  docId: string;
  reason: string;
  relevanceScore: number;
}

/**
 * Recommendations result
 */
export interface RecommendationsResult {
  recommendations: ReadingRecommendation[];
  learningPath?: string;
  message?: string;
}

/**
 * Document improvement result
 */
export interface DocumentImprovementResult {
  suggestionId: string;
  suggestions: string;
  message: string;
}

/**
 * Market insights result
 */
export interface MarketInsightsResult {
  insights: string;
}

/**
 * Summary result
 */
export interface SummaryResult {
  summary: string;
}

/**
 * RAG source
 */
export interface RAGSource {
  docId: string;
  title: string;
  section: string;
  relevance: number;
}

/**
 * RAG response
 */
export interface RAGResponse {
  answer: string;
  sources: RAGSource[];
  confidence: 'high' | 'medium' | 'low';
  tokensUsed?: number;
}

/**
 * Search result item
 */
export interface SearchResultItem {
  docId: string;
  title: string;
  section: string;
  content: string;
  score: number;
}

/**
 * Index statistics
 */
export interface IndexStats {
  totalChunks: number;
  totalDocuments: number;
  categories: Record<string, number>;
}

/**
 * Fun facts result
 */
export interface FunFactsResult {
  facts: Array<{
    id: string;
    fact: string;
    category: 'professional' | 'education' | 'achievement' | 'interest' | 'other';
  }>;
  summary: string;
}

/**
 * Pending improvement
 */
export interface PendingImprovement {
  id: string;
  docId: string;
  docTitle: string;
  userId: string;
  userEmail?: string;
  suggestions: string;
  status: 'pending' | 'approved' | 'rejected' | 'implemented';
  createdAt: unknown;
  reviewedAt?: unknown;
  reviewedBy?: string;
  reviewNotes?: string;
}

// ============================================================================
// AI Functions Interface
// ============================================================================

/**
 * AI functions interface - extends base functions with AI-specific methods
 */
export interface IAIFunctionsService extends IFunctionsService {
  /**
   * Analyze competitors
   */
  analyzeCompetitors(
    competitors: string[],
    focusAreas?: string[]
  ): Promise<CompetitorAnalysisResult>;

  /**
   * Generate SWOT analysis
   */
  generateSWOT(topic: string, context?: string): Promise<SWOTResult>;

  /**
   * Get reading recommendations
   */
  getReadingRecommendations(currentDocId?: string): Promise<RecommendationsResult>;

  /**
   * Suggest document improvements
   */
  suggestDocumentImprovements(
    docId: string,
    docTitle: string,
    docContent: string
  ): Promise<DocumentImprovementResult>;

  /**
   * Get market insights
   */
  getMarketInsights(topic: string, industry?: string): Promise<MarketInsightsResult>;

  /**
   * Summarize content
   */
  summarizeContent(content: string, maxLength?: number): Promise<SummaryResult>;

  /**
   * Ask documentation using RAG
   */
  askDocumentation(
    question: string,
    options?: {
      category?: string;
      format?: 'detailed' | 'concise';
      history?: Array<{ role: 'user' | 'assistant'; content: string }>;
    }
  ): Promise<RAGResponse>;

  /**
   * Search documentation
   */
  searchDocumentation(
    query: string,
    options?: { category?: string; topK?: number }
  ): Promise<SearchResultItem[]>;

  /**
   * Get suggested questions
   */
  getSuggestedQuestions(
    docId?: string,
    category?: string
  ): Promise<{
    suggestions: string[];
    docInfo: { title: string; category: string } | null;
  }>;

  /**
   * Research a person and generate fun facts
   */
  researchPerson(
    firstName: string,
    lastName: string,
    linkedInUrl: string
  ): Promise<FunFactsResult>;

  /**
   * Get index statistics
   */
  getIndexStats(): Promise<IndexStats>;

  /**
   * Review document improvement (admin)
   */
  reviewImprovement(
    suggestionId: string,
    status: 'approved' | 'rejected' | 'implemented',
    notes?: string
  ): Promise<{ success: boolean; status: string }>;

  /**
   * Get pending improvements (admin)
   */
  getPendingImprovements(limit?: number): Promise<{ suggestions: PendingImprovement[] }>;
}
