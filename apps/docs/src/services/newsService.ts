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
}

// Singleton instance
export const newsService = new NewsService();

// React hook for news service
export function useNews() {
  return newsService;
}
