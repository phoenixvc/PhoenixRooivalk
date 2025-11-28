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
import { withRetry, defaultIsRetryable } from "../utils/retry";
import { memoryCache } from "../utils/cache";
import type {
  NewsArticle,
  PersonalizedNewsItem,
  NewsFeedResponse,
  NewsCategory,
  NewsSearchParams,
} from "../types/news";

// Cache TTLs (in milliseconds)
const NEWS_FEED_CACHE_TTL = 3 * 60 * 1000; // 3 minutes
const SEARCH_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const SAVED_ARTICLES_CACHE_TTL = 60 * 1000; // 1 minute

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
   * Generate cache key for news feed
   */
  private getNewsFeedCacheKey(options?: {
    userProfile?: UserProfile;
    limit?: number;
    cursor?: string;
    categories?: NewsCategory[];
  }): string {
    const parts = ["news_feed"];
    if (options?.cursor) parts.push(`cursor:${options.cursor}`);
    if (options?.limit) parts.push(`limit:${options.limit}`);
    if (options?.categories?.length) parts.push(`cats:${options.categories.sort().join(",")}`);
    // Don't include userProfile in cache key - it's user-specific
    return parts.join("_");
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

    // Check cache for general news (skip if user profile is provided for personalization)
    const cacheKey = this.getNewsFeedCacheKey(options);
    if (!options?.userProfile) {
      const cached = memoryCache.get<NewsFeedResponse>(cacheKey);
      if (cached) {
        return cached;
      }
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

      // Use retry with exponential backoff for network resilience
      const result = await withRetry(
        () => getNewsFeedFn(options || {}),
        {
          maxRetries: 3,
          isRetryable: defaultIsRetryable,
          onRetry: (attempt, error) => {
            console.warn(`News feed fetch retry ${attempt}:`, error);
          },
        }
      );

      // Cache the result (only for non-personalized requests)
      if (!options?.userProfile) {
        memoryCache.set(cacheKey, result.data, NEWS_FEED_CACHE_TTL);
      }

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

      // Invalidate saved articles cache
      memoryCache.delete("saved_articles");

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

    // Check cache
    const cached = memoryCache.get<{ articles: NewsArticle[] }>("saved_articles");
    if (cached) {
      return cached;
    }

    try {
      const getSavedFn = httpsCallable<
        Record<string, never>,
        { articles: NewsArticle[] }
      >(this.functions!, "getSavedArticles");

      const result = await getSavedFn({});

      // Cache the result
      memoryCache.set("saved_articles", result.data, SAVED_ARTICLES_CACHE_TTL);

      return result.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Generate cache key for search
   */
  private getSearchCacheKey(params: NewsSearchParams): string {
    const parts = ["news_search"];
    if (params.query) parts.push(`q:${params.query}`);
    if (params.categories?.length) parts.push(`cats:${params.categories.sort().join(",")}`);
    if (params.type) parts.push(`type:${params.type}`);
    if (params.limit) parts.push(`limit:${params.limit}`);
    if (params.cursor) parts.push(`cursor:${params.cursor}`);
    return parts.join("_");
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

    // Check cache
    const cacheKey = this.getSearchCacheKey(params);
    const cached = memoryCache.get<{ results: NewsArticle[]; totalFound: number }>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const searchFn = httpsCallable<
        NewsSearchParams,
        { results: NewsArticle[]; totalFound: number }
      >(this.functions!, "searchNews");

      const result = await searchFn(params);

      // Cache the search results
      memoryCache.set(cacheKey, result.data, SEARCH_CACHE_TTL);

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
