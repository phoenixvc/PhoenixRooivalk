/**
 * News Service
 *
 * Business logic for news operations, separated from HTTP handlers.
 */

import {
  newsRepository,
  userPreferencesRepository,
  NewsArticle,
  NewsQueryFilters,
  PaginatedResult,
} from "../repositories";
import { generateEmbeddings, generateCompletion } from "../lib/openai";
import {
  NEWS_CATEGORIZATION_PROMPT,
  NEWS_SUMMARY_PROMPT,
  buildUserPrompt,
  getModelConfig,
} from "../prompts";
import { isValidCategory, getCategoryIds } from "../config";
import { generateId } from "../lib/utils/ids";

/**
 * User profile for personalization
 */
export interface UserProfile {
  roles: string[];
  interests: string[];
  focusAreas: string[];
  experienceLevel: "beginner" | "intermediate" | "advanced";
}

/**
 * Relevance score for personalized news
 */
export interface NewsRelevance {
  score: number;
  matchedRoles: string[];
  matchedInterests: string[];
  matchedFocusAreas: string[];
  reason: string;
}

/**
 * Personalized news item
 */
export interface PersonalizedNewsItem extends NewsArticle {
  relevance: NewsRelevance;
  isRead: boolean;
}

/**
 * News feed result
 */
export interface NewsFeedResult {
  generalNews: NewsArticle[];
  specializedNews: PersonalizedNewsItem[];
  totalCount: number;
  hasMore: boolean;
  nextCursor?: string;
}

/**
 * News service class
 */
export class NewsService {
  /**
   * Calculate relevance score between article and user profile
   */
  calculateRelevanceScore(
    article: NewsArticle,
    userProfile: UserProfile,
  ): NewsRelevance {
    const matchedRoles = article.targetRoles.filter((role) =>
      userProfile.roles.some(
        (r) =>
          r.toLowerCase().includes(role.toLowerCase()) ||
          role.toLowerCase().includes(r.toLowerCase()),
      ),
    );

    const matchedInterests = article.targetInterests.filter((interest) =>
      userProfile.interests.some(
        (i) =>
          i.toLowerCase() === interest.toLowerCase() ||
          i.toLowerCase().includes(interest.toLowerCase()),
      ),
    );

    const matchedFocusAreas = article.targetFocusAreas.filter((area) =>
      userProfile.focusAreas.some(
        (f) =>
          f.toLowerCase() === area.toLowerCase() ||
          f.toLowerCase().includes(area.toLowerCase()),
      ),
    );

    // Calculate weighted score
    const roleScore = matchedRoles.length > 0 ? 0.4 : 0;
    const interestScore =
      (matchedInterests.length / Math.max(article.targetInterests.length, 1)) *
      0.4;
    const focusScore =
      (matchedFocusAreas.length / Math.max(article.targetFocusAreas.length, 1)) *
      0.2;

    const score = Math.min(roleScore + interestScore + focusScore, 1);

    // Generate reason
    const reasons: string[] = [];
    if (matchedRoles.length > 0) {
      reasons.push(`matches your ${matchedRoles.join(", ")} role`);
    }
    if (matchedInterests.length > 0) {
      reasons.push(`aligns with your interest in ${matchedInterests.join(", ")}`);
    }
    if (matchedFocusAreas.length > 0) {
      reasons.push(`relevant to your ${matchedFocusAreas.join(", ")} focus`);
    }

    return {
      score,
      matchedRoles,
      matchedInterests,
      matchedFocusAreas,
      reason:
        reasons.length > 0
          ? `This article ${reasons.join(" and ")}.`
          : "General industry news.",
    };
  }

  /**
   * Get news feed with optional personalization
   */
  async getNewsFeed(
    options: {
      userProfile?: UserProfile;
      userId?: string;
      categories?: string[];
      limit?: number;
    } = {},
  ): Promise<NewsFeedResult> {
    const { userProfile, userId, categories, limit = 20 } = options;

    // Validate categories
    if (categories) {
      const validCategories = getCategoryIds();
      const invalidCats = categories.filter(
        (c) => !validCategories.includes(c),
      );
      if (invalidCats.length > 0) {
        throw new Error(`Invalid categories: ${invalidCats.join(", ")}`);
      }
    }

    // Fetch articles
    const filters: NewsQueryFilters = {};
    if (categories && categories.length > 0) {
      filters.categories = categories;
    }

    const result = await newsRepository.findWithFilters(filters, {
      limit: limit * 2,
    });

    // Get user read status
    let readArticleIds: string[] = [];
    if (userId) {
      readArticleIds = await userPreferencesRepository.getReadArticleIds(
        userId,
      );
    }

    // Separate general and specialized news
    const generalNews: NewsArticle[] = [];
    const specializedNews: PersonalizedNewsItem[] = [];

    for (const article of result.items) {
      if (article.type === "general" || !userProfile) {
        generalNews.push(article);
      } else {
        const relevance = this.calculateRelevanceScore(article, userProfile);

        if (relevance.score >= 0.3) {
          specializedNews.push({
            ...article,
            relevance,
            isRead: readArticleIds.includes(article.id),
          });
        } else {
          generalNews.push(article);
        }
      }
    }

    // Sort specialized news by relevance
    specializedNews.sort((a, b) => b.relevance.score - a.relevance.score);

    return {
      generalNews: generalNews.slice(0, Math.ceil(limit / 2)),
      specializedNews: specializedNews.slice(0, Math.floor(limit / 2)),
      totalCount: result.items.length,
      hasMore: result.hasMore,
      nextCursor:
        result.items.length > 0
          ? result.items[result.items.length - 1].id
          : undefined,
    };
  }

  /**
   * Add new article with AI categorization
   */
  async addArticle(data: {
    title: string;
    content: string;
    source: string;
    sourceUrl?: string;
    category?: string;
  }): Promise<NewsArticle> {
    const { title, content, source, sourceUrl, category } = data;

    // Use AI to categorize
    let categorization;
    try {
      const prompt = buildUserPrompt(NEWS_CATEGORIZATION_PROMPT, {
        title,
        content: content.substring(0, 2000),
      });

      const config = getModelConfig(NEWS_CATEGORIZATION_PROMPT);
      const result = await generateCompletion(
        NEWS_CATEGORIZATION_PROMPT.system.base,
        prompt,
        { temperature: config.temperature },
      );

      categorization = JSON.parse(result);
    } catch (error) {
      console.warn("AI categorization failed, using defaults:", error);
      categorization = {
        category: category && isValidCategory(category) ? category : "company-news",
        targetRoles: [],
        targetInterests: [],
        keywords: [],
        isGeneral: true,
        sentiment: "neutral",
      };
    }

    // Generate embedding
    const embedding = await generateEmbeddings(
      `${title}. ${content.substring(0, 1000)}`,
    );

    // Generate summary
    let summary = "";
    try {
      const summaryPrompt = buildUserPrompt(NEWS_SUMMARY_PROMPT, {
        title,
        content,
      });
      summary = await generateCompletion(
        NEWS_SUMMARY_PROMPT.system.base,
        summaryPrompt,
        { temperature: 0.3, maxTokens: 200 },
      );
    } catch (error) {
      console.warn("AI summary generation failed, using truncated content:", error);
      summary = content.substring(0, 200) + "...";
    }

    const now = new Date().toISOString();
    const articleId = generateId("news");

    const article: NewsArticle = {
      id: articleId,
      title,
      summary,
      content,
      category: category && isValidCategory(category) ? category : categorization.category,
      type: categorization.isGeneral ? "general" : "specialized",
      source,
      sourceUrl,
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
      targetRoles: categorization.targetRoles || [],
      targetInterests: categorization.targetInterests || [],
      targetFocusAreas: [],
      viewCount: 0,
      keywords: categorization.keywords || [],
      sentiment: categorization.sentiment,
      embedding,
    };

    return newsRepository.save(article);
  }

  /**
   * Mark article as read
   */
  async markArticleRead(userId: string, articleId: string): Promise<void> {
    await Promise.all([
      userPreferencesRepository.markArticleRead(userId, articleId),
      newsRepository.incrementViewCount(articleId),
    ]);
  }

  /**
   * Save/unsave article
   */
  async toggleSaveArticle(
    userId: string,
    articleId: string,
    save: boolean,
  ): Promise<void> {
    await userPreferencesRepository.toggleSavedArticle(userId, articleId, save);
  }

  /**
   * Get saved articles for user
   */
  async getSavedArticles(userId: string): Promise<NewsArticle[]> {
    const savedIds = await userPreferencesRepository.getSavedArticleIds(userId);
    if (savedIds.length === 0) return [];
    return newsRepository.findByIds(savedIds.slice(0, 50));
  }

  /**
   * Search news using semantic similarity
   */
  async searchNews(
    query: string,
    options: { categories?: string[]; limit?: number } = {},
  ): Promise<Array<NewsArticle & { similarity: number }>> {
    const { categories, limit = 20 } = options;

    // Generate query embedding
    const queryEmbedding = await generateEmbeddings(query);

    // Fetch articles with embeddings
    const articles = await newsRepository.findWithEmbeddings(
      { categories },
      100,
    );

    // Calculate similarity and filter
    const results = articles
      .map((article) => ({
        ...article,
        similarity: this.cosineSimilarity(queryEmbedding, article.embedding!),
      }))
      .filter((a) => a.similarity > 0.5)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    // Remove embedding from response
    return results.map(({ embedding: _, ...rest }) => rest);
  }

  /**
   * Cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
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
}

/**
 * Singleton instance
 */
export const newsService = new NewsService();
