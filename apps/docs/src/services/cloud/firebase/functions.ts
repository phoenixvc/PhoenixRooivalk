/**
 * Firebase Functions Service Implementation
 *
 * Implements IFunctionsService and IAIFunctionsService using Firebase Cloud Functions.
 */

import { getFunctions, httpsCallable, Functions } from 'firebase/functions';
import { getAuth } from 'firebase/auth';
import { FirebaseApp } from 'firebase/app';
import {
  IFunctionsService,
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
} from '../interfaces/functions';
import { FunctionCallOptions } from '../interfaces/types';

/**
 * Firebase Functions Service
 */
export class FirebaseFunctionsService implements IAIFunctionsService {
  private functions: Functions | null = null;
  private initialized = false;

  constructor(private app: FirebaseApp | null) {}

  isConfigured(): boolean {
    return this.app !== null;
  }

  async init(): Promise<boolean> {
    if (this.initialized) return true;

    if (!this.app) {
      console.warn('Firebase Functions: Firebase not configured');
      return false;
    }

    try {
      this.functions = getFunctions(this.app);
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Firebase Functions initialization failed:', error);
      return false;
    }
  }

  async call<TInput, TOutput>(
    name: string,
    data: TInput,
    options?: FunctionCallOptions
  ): Promise<TOutput> {
    if (!this.initialized) {
      await this.init();
    }

    if (!this.functions) {
      throw new CloudFunctionError('Functions service not available', 'unavailable');
    }

    try {
      const callable = httpsCallable<TInput, TOutput>(this.functions, name);
      const result = await callable(data);
      return result.data;
    } catch (error: any) {
      this.handleError(error);
    }
  }

  async callAuthenticated<TInput, TOutput>(
    name: string,
    data: TInput,
    options?: FunctionCallOptions
  ): Promise<TOutput> {
    // Firebase callable functions automatically include auth context
    return this.call<TInput, TOutput>(name, data, options);
  }

  // ============================================================================
  // AI Functions Implementation
  // ============================================================================

  async analyzeCompetitors(
    competitors: string[],
    focusAreas?: string[]
  ): Promise<CompetitorAnalysisResult> {
    return this.call<
      { competitors: string[]; focusAreas?: string[] },
      CompetitorAnalysisResult
    >('analyzeCompetitors', { competitors, focusAreas });
  }

  async generateSWOT(topic: string, context?: string): Promise<SWOTResult> {
    return this.call<{ topic: string; context?: string }, SWOTResult>(
      'generateSWOT',
      { topic, context }
    );
  }

  async getReadingRecommendations(
    currentDocId?: string
  ): Promise<RecommendationsResult> {
    return this.call<{ currentDocId?: string }, RecommendationsResult>(
      'getReadingRecommendations',
      { currentDocId }
    );
  }

  async suggestDocumentImprovements(
    docId: string,
    docTitle: string,
    docContent: string
  ): Promise<DocumentImprovementResult> {
    return this.call<
      { docId: string; docTitle: string; docContent: string; userId: string },
      DocumentImprovementResult
    >('suggestDocumentImprovements', {
      docId,
      docTitle,
      docContent,
      userId: '', // Will be set by the function from context
    });
  }

  async getMarketInsights(
    topic: string,
    industry?: string
  ): Promise<MarketInsightsResult> {
    return this.call<{ topic: string; industry?: string }, MarketInsightsResult>(
      'getMarketInsights',
      { topic, industry }
    );
  }

  async summarizeContent(
    content: string,
    maxLength?: number
  ): Promise<SummaryResult> {
    return this.call<{ content: string; maxLength?: number }, SummaryResult>(
      'summarizeContent',
      { content, maxLength }
    );
  }

  async askDocumentation(
    question: string,
    options?: {
      category?: string;
      format?: 'detailed' | 'concise';
      history?: Array<{ role: 'user' | 'assistant'; content: string }>;
    }
  ): Promise<RAGResponse> {
    return this.call<
      {
        question: string;
        category?: string;
        format?: string;
        history?: Array<{ role: string; content: string }>;
      },
      RAGResponse
    >('askDocumentation', {
      question,
      category: options?.category,
      format: options?.format,
      history: options?.history,
    });
  }

  async searchDocumentation(
    query: string,
    options?: { category?: string; topK?: number }
  ): Promise<SearchResultItem[]> {
    const result = await this.call<
      { query: string; category?: string; topK?: number },
      { results: SearchResultItem[] }
    >('searchDocs', {
      query,
      category: options?.category,
      topK: options?.topK,
    });
    return result.results;
  }

  async getSuggestedQuestions(
    docId?: string,
    category?: string
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
    >('getSuggestedQuestions', { docId, category });
  }

  async researchPerson(
    firstName: string,
    lastName: string,
    linkedInUrl: string
  ): Promise<FunFactsResult> {
    return this.call<
      { firstName: string; lastName: string; linkedInUrl: string },
      FunFactsResult
    >('researchPerson', { firstName, lastName, linkedInUrl });
  }

  async getIndexStats(): Promise<IndexStats> {
    return this.call<Record<string, never>, IndexStats>('getIndexStats', {});
  }

  async reviewImprovement(
    suggestionId: string,
    status: 'approved' | 'rejected' | 'implemented',
    notes?: string
  ): Promise<{ success: boolean; status: string }> {
    return this.call<
      { suggestionId: string; status: string; notes?: string },
      { success: boolean; status: string }
    >('reviewDocumentImprovement', { suggestionId, status, notes });
  }

  async getPendingImprovements(
    limit?: number
  ): Promise<{ suggestions: PendingImprovement[] }> {
    return this.call<{ limit?: number }, { suggestions: PendingImprovement[] }>(
      'getPendingImprovements',
      { limit }
    );
  }

  // ============================================================================
  // Error Handling
  // ============================================================================

  private handleError(error: any): never {
    const code = error.code || 'unknown';
    const message = error.message || 'An error occurred';

    if (code === 'unauthenticated') {
      throw new CloudFunctionError('Please sign in to use this feature', code);
    }
    if (code === 'resource-exhausted') {
      throw new CloudFunctionError('Rate limit exceeded. Please try again later.', code);
    }
    if (code === 'failed-precondition') {
      throw new CloudFunctionError('Service not configured. Contact administrator.', code);
    }

    throw new CloudFunctionError(message, code);
  }
}
