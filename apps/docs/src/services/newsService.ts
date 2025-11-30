/**
 * News Service for Phoenix Rooivalk Documentation
 *
 * Provides client-side interface to Azure Functions for news:
 * - News feed retrieval (general + personalized)
 * - Article management (read, save)
 * - Semantic search
 */

import { getFunctionsService, isCloudConfigured } from "./cloud";
import { withRetry, defaultIsRetryable } from "../utils/retry";
import { memoryCache } from "../utils/cache";
import type {
  NewsArticle,
  PersonalizedNewsItem,
  NewsFeedResponse,
  NewsCategory,
  NewsSearchParams,
  UserNewsPreferences,
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
 * News Service class - provides all news functionality via Azure Functions
 */
class NewsService {
  private isInitialized = false;

  /**
   * Initialize the news service
   */
  init(): boolean {
    if (this.isInitialized) return true;

    if (!isCloudConfigured() || typeof window === "undefined") {
      console.warn("News Service: Azure not configured");
      return false;
    }

    this.isInitialized = true;
    return true;
  }

  /**
   * Check if news service is available
   */
  isAvailable(): boolean {
    return this.isInitialized || isCloudConfigured();
  }

  /**
   * Call an Azure Function
   */
  private async callFunction<T>(
    functionName: string,
    data: Record<string, unknown>,
  ): Promise<T> {
    const functionsService = getFunctionsService();
    return functionsService.call<T>(functionName, data);
  }

  /**
   * Handle function call errors
   */
  private handleError(error: unknown): never {
    const err = error as { code?: string; message?: string };
    const code = err.code || "unknown";
    const message = err.message || "An error occurred";

    if (code === "unauthenticated" || code === "401") {
      throw new NewsError("Please sign in to access news features", "unauthenticated");
    }
    if (code === "resource-exhausted" || code === "429") {
      throw new NewsError("Rate limit exceeded. Please try again later.", "resource-exhausted");
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
    if (options?.categories?.length)
      parts.push(`cats:${options.categories.sort().join(",")}`);
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
      // Use retry with exponential backoff for network resilience
      const result = await withRetry(
        () => this.callFunction<NewsFeedResponse>("getNewsFeed", options || {}),
        {
          maxRetries: 3,
          isRetryable: defaultIsRetryable,
          onRetry: (attempt, error) => {
            console.warn(`News feed fetch retry ${attempt}:`, error);
          },
        },
      );

      // Cache the result (only for non-personalized requests)
      if (!options?.userProfile) {
        memoryCache.set(cacheKey, result, NEWS_FEED_CACHE_TTL);
      }

      return result;
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
      return await this.callFunction<{
        articles: PersonalizedNewsItem[];
        totalMatched: number;
      }>("getPersonalizedNews", { userProfile, limit });
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
      return await this.callFunction<{ success: boolean }>("markArticleRead", {
        articleId,
      });
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
      const result = await this.callFunction<{
        success: boolean;
        saved: boolean;
      }>("saveArticle", { articleId, save });

      // Invalidate saved articles cache
      memoryCache.delete("saved_articles");

      return result;
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
    const cached = memoryCache.get<{ articles: NewsArticle[] }>(
      "saved_articles",
    );
    if (cached) {
      return cached;
    }

    try {
      const result = await this.callFunction<{ articles: NewsArticle[] }>(
        "getSavedArticles",
        {},
      );

      // Cache the result
      memoryCache.set("saved_articles", result, SAVED_ARTICLES_CACHE_TTL);

      return result;
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
    if (params.categories?.length)
      parts.push(`cats:${params.categories.sort().join(",")}`);
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
    const cached = memoryCache.get<{
      results: NewsArticle[];
      totalFound: number;
    }>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const result = await this.callFunction<{
        results: NewsArticle[];
        totalFound: number;
      }>("searchNews", params as Record<string, unknown>);

      // Cache the search results
      memoryCache.set(cacheKey, result, SEARCH_CACHE_TTL);

      return result;
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
      const result = await this.callFunction<{
        totalArticles: number;
        lastIngestionTime: string | null;
        articlesByCategory: Record<string, number>;
        articlesLast24h: number;
        articlesLast7d: number;
      }>("getNewsIngestionStats", {});

      return {
        ...result,
        lastIngestionTime: result.lastIngestionTime
          ? new Date(result.lastIngestionTime)
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
      return await this.callFunction<{
        success: boolean;
        articlesAdded: number;
        errors: string[];
      }>("triggerNewsIngestion", options || {});
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
      return await this.callFunction<{
        success: boolean;
        articleCount: number;
        digest: string;
      }>("generateAINewsDigest", {});
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
    topArticles: Array<{
      id: string;
      title: string;
      views: number;
      saves: number;
    }>;
    engagementByCategory: Record<string, { views: number; saves: number }>;
    dailyViews: Array<{ date: string; views: number }>;
  }> {
    if (!this.init()) {
      throw new NewsError("News service not available", "unavailable");
    }

    try {
      return await this.callFunction<{
        totalViews: number;
        totalSaves: number;
        uniqueReaders: number;
        avgReadTime: number;
        topArticles: Array<{
          id: string;
          title: string;
          views: number;
          saves: number;
        }>;
        engagementByCategory: Record<
          string,
          { views: number; saves: number }
        >;
        dailyViews: Array<{ date: string; views: number }>;
      }>("getNewsAnalytics", options || {});
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
      return await this.callFunction<{
        success: boolean;
        subscriptionId: string;
      }>("subscribeToBreakingNews", options);
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
      return await this.callFunction<{ success: boolean }>(
        "unsubscribeFromBreakingNews",
        {},
      );
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get user news preferences
   */
  async getUserPreferences(): Promise<UserNewsPreferences | null> {
    if (!this.init()) {
      throw new NewsError("News service not available", "unavailable");
    }

    // Check cache
    const cached = memoryCache.get<UserNewsPreferences>(
      "user_news_preferences",
    );
    if (cached) {
      return cached;
    }

    try {
      const result = await this.callFunction<{
        preferences: UserNewsPreferences | null;
      }>("getUserNewsPreferences", {});

      // Cache the result
      if (result.preferences) {
        memoryCache.set(
          "user_news_preferences",
          result.preferences,
          NEWS_FEED_CACHE_TTL,
        );
      }

      return result.preferences;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Save user news preferences
   */
  async saveUserPreferences(
    preferences: Partial<
      Omit<UserNewsPreferences, "userId" | "createdAt" | "updatedAt">
    >,
  ): Promise<{ success: boolean }> {
    if (!this.init()) {
      throw new NewsError("News service not available", "unavailable");
    }

    try {
      const result = await this.callFunction<{ success: boolean }>(
        "saveUserNewsPreferences",
        { preferences },
      );

      // Invalidate cache
      memoryCache.delete("user_news_preferences");

      return result;
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
