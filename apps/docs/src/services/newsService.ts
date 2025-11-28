/**
 * News Service for Phoenix Rooivalk Documentation
 *
 * Provides client-side interface to News Cloud Functions:
 * - News feed retrieval (general + personalized)
 * - Article management (read, save)
 * - Semantic search
 */

import { getFunctions, httpsCallable } from "firebase/functions";
import { app, isFirebaseConfigured } from "./firebase";
import type {
  NewsArticle,
  PersonalizedNewsItem,
  NewsFeedResponse,
  NewsCategory,
  NewsSearchParams,
} from "../types/news";

// User profile for personalization
interface UserProfile {
  roles: string[];
  interests: string[];
  focusAreas: string[];
  experienceLevel: "beginner" | "intermediate" | "advanced";
}

// Error class for news operations
export class NewsError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "NewsError";
    this.code = code;
  }
}

/**
 * News Service class - provides all news functionality
 */
class NewsService {
  private functions: ReturnType<typeof getFunctions> | null = null;
  private isInitialized = false;

  /**
   * Initialize the news service
   */
  init(): boolean {
    if (this.isInitialized) return true;

    if (!isFirebaseConfigured() || typeof window === "undefined") {
      console.warn("News Service: Firebase not configured");
      return false;
    }

    try {
      this.functions = getFunctions(app!);
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error("News Service initialization failed:", error);
      return false;
    }
  }

  /**
   * Check if news service is available
   */
  isAvailable(): boolean {
    return this.isInitialized && this.functions !== null;
  }

  /**
   * Handle function call errors
   */
  private handleError(error: unknown): never {
    const err = error as { code?: string; message?: string };
    const code = err.code || "unknown";
    const message = err.message || "An error occurred";

    if (code === "unauthenticated") {
      throw new NewsError("Please sign in to access news features", code);
    }
    if (code === "resource-exhausted") {
      throw new NewsError("Rate limit exceeded. Please try again later.", code);
    }

    throw new NewsError(message, code);
  }

  /**
   * Get news feed with general and personalized articles
   */
  async getNewsFeed(options?: {
    userProfile?: UserProfile;
    limit?: number;
    cursor?: string;
    categories?: NewsCategory[];
  }): Promise<NewsFeedResponse> {
    if (!this.init()) {
      throw new NewsError("News service not available", "unavailable");
    }

    try {
      const getNewsFeedFn = httpsCallable<
        {
          userProfile?: UserProfile;
          limit?: number;
          cursor?: string;
          categories?: NewsCategory[];
        },
        NewsFeedResponse
      >(this.functions!, "getNewsFeed");

      const result = await getNewsFeedFn(options || {});
      return result.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get personalized news based on user profile
   */
  async getPersonalizedNews(
    userProfile: UserProfile,
    limit?: number,
  ): Promise<{ articles: PersonalizedNewsItem[]; totalMatched: number }> {
    if (!this.init()) {
      throw new NewsError("News service not available", "unavailable");
    }

    try {
      const getPersonalizedNewsFn = httpsCallable<
        { userProfile: UserProfile; limit?: number },
        { articles: PersonalizedNewsItem[]; totalMatched: number }
      >(this.functions!, "getPersonalizedNews");

      const result = await getPersonalizedNewsFn({ userProfile, limit });
      return result.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Mark an article as read
   */
  async markArticleRead(articleId: string): Promise<{ success: boolean }> {
    if (!this.init()) {
      throw new NewsError("News service not available", "unavailable");
    }

    try {
      const markReadFn = httpsCallable<
        { articleId: string },
        { success: boolean }
      >(this.functions!, "markArticleRead");

      const result = await markReadFn({ articleId });
      return result.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Save or unsave an article
   */
  async saveArticle(
    articleId: string,
    save: boolean,
  ): Promise<{ success: boolean; saved: boolean }> {
    if (!this.init()) {
      throw new NewsError("News service not available", "unavailable");
    }

    try {
      const saveFn = httpsCallable<
        { articleId: string; save: boolean },
        { success: boolean; saved: boolean }
      >(this.functions!, "saveArticle");

      const result = await saveFn({ articleId, save });
      return result.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get saved articles
   */
  async getSavedArticles(): Promise<{ articles: NewsArticle[] }> {
    if (!this.init()) {
      throw new NewsError("News service not available", "unavailable");
    }

    try {
      const getSavedFn = httpsCallable<
        Record<string, never>,
        { articles: NewsArticle[] }
      >(this.functions!, "getSavedArticles");

      const result = await getSavedFn({});
      return result.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Search news articles
   */
  async searchNews(
    params: NewsSearchParams,
  ): Promise<{ results: NewsArticle[]; totalFound: number }> {
    if (!this.init()) {
      throw new NewsError("News service not available", "unavailable");
    }

    try {
      const searchFn = httpsCallable<
        NewsSearchParams,
        { results: NewsArticle[]; totalFound: number }
      >(this.functions!, "searchNews");

      const result = await searchFn(params);
      return result.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // ========== Admin Functions ==========

  /**
   * Get news ingestion statistics (admin only)
   */
  async getIngestionStats(): Promise<{
    totalArticles: number;
    lastIngestionTime: Date | null;
    articlesByCategory: Record<string, number>;
    articlesLast24h: number;
    articlesLast7d: number;
  }> {
    if (!this.init()) {
      throw new NewsError("News service not available", "unavailable");
    }

    try {
      const getStatsFn = httpsCallable<
        Record<string, never>,
        {
          totalArticles: number;
          lastIngestionTime: string | null;
          articlesByCategory: Record<string, number>;
          articlesLast24h: number;
          articlesLast7d: number;
        }
      >(this.functions!, "getNewsIngestionStats");

      const result = await getStatsFn({});
      return {
        ...result.data,
        lastIngestionTime: result.data.lastIngestionTime
          ? new Date(result.data.lastIngestionTime)
          : null,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Trigger news ingestion manually (admin only)
   */
  async triggerIngestion(options?: {
    topics?: string[];
    force?: boolean;
  }): Promise<{
    success: boolean;
    articlesAdded: number;
    errors: string[];
  }> {
    if (!this.init()) {
      throw new NewsError("News service not available", "unavailable");
    }

    try {
      const triggerFn = httpsCallable<
        { topics?: string[]; force?: boolean },
        { success: boolean; articlesAdded: number; errors: string[] }
      >(this.functions!, "triggerNewsIngestion");

      const result = await triggerFn(options || {});
      return result.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Generate AI news digest (admin only)
   */
  async generateDigest(): Promise<{
    success: boolean;
    articleCount: number;
    digest: string;
  }> {
    if (!this.init()) {
      throw new NewsError("News service not available", "unavailable");
    }

    try {
      const digestFn = httpsCallable<
        Record<string, never>,
        { success: boolean; articleCount: number; digest: string }
      >(this.functions!, "generateAINewsDigest");

      const result = await digestFn({});
      return result.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get news engagement analytics (admin only)
   */
  async getAnalytics(options?: { dateRange?: "7d" | "30d" | "90d" }): Promise<{
    totalViews: number;
    totalSaves: number;
    uniqueReaders: number;
    avgReadTime: number;
    topArticles: Array<{ id: string; title: string; views: number; saves: number }>;
    engagementByCategory: Record<string, { views: number; saves: number }>;
    dailyViews: Array<{ date: string; views: number }>;
  }> {
    if (!this.init()) {
      throw new NewsError("News service not available", "unavailable");
    }

    try {
      const analyticsFn = httpsCallable<
        { dateRange?: string },
        {
          totalViews: number;
          totalSaves: number;
          uniqueReaders: number;
          avgReadTime: number;
          topArticles: Array<{ id: string; title: string; views: number; saves: number }>;
          engagementByCategory: Record<string, { views: number; saves: number }>;
          dailyViews: Array<{ date: string; views: number }>;
        }
      >(this.functions!, "getNewsAnalytics");

      const result = await analyticsFn(options || {});
      return result.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Subscribe to breaking news notifications
   */
  async subscribeToBreakingNews(options: {
    categories?: NewsCategory[];
    pushEnabled?: boolean;
    emailEnabled?: boolean;
  }): Promise<{ success: boolean; subscriptionId: string }> {
    if (!this.init()) {
      throw new NewsError("News service not available", "unavailable");
    }

    try {
      const subscribeFn = httpsCallable<
        typeof options,
        { success: boolean; subscriptionId: string }
      >(this.functions!, "subscribeToBreakingNews");

      const result = await subscribeFn(options);
      return result.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Unsubscribe from breaking news notifications
   */
  async unsubscribeFromBreakingNews(): Promise<{ success: boolean }> {
    if (!this.init()) {
      throw new NewsError("News service not available", "unavailable");
    }

    try {
      const unsubscribeFn = httpsCallable<
        Record<string, never>,
        { success: boolean }
      >(this.functions!, "unsubscribeFromBreakingNews");

      const result = await unsubscribeFn({});
      return result.data;
    } catch (error) {
      this.handleError(error);
    }
  }
}

// Singleton instance
export const newsService = new NewsService();

// React hook for news service
export function useNews() {
  return newsService;
}
