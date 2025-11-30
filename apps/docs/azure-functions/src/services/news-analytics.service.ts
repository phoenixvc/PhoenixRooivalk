/**
 * News Analytics Service
 *
 * Business logic for news analytics, ingestion, and notifications.
 */

import { getContainer, queryDocuments, upsertDocument } from "../lib/cosmos";
import { generateCompletion, generateEmbeddings } from "../lib/openai";
import {
  NEWS_CATEGORIZATION_PROMPT,
  NEWS_SUMMARY_PROMPT,
  buildUserPrompt,
  getModelConfig,
} from "../prompts";
import { newsRepository, NewsArticle } from "../repositories";

/**
 * Analytics event
 */
interface AnalyticsEvent {
  id: string;
  articleId: string;
  userId: string;
  action: "view" | "save" | "unsave";
  timestamp: string;
}

/**
 * News analytics result
 */
export interface NewsAnalyticsResult {
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
}

/**
 * Ingestion log entry
 */
interface IngestionLogEntry {
  id: string;
  timestamp: string;
  queriesUsed: string[];
  resultsFound: number;
  processedCount: number;
  duplicateCount: number;
  status: "completed" | "failed";
}

/**
 * News analytics service class
 */
export class NewsAnalyticsService {
  private readonly analyticsContainer = "news_analytics";
  private readonly ingestionLogContainer = "news_ingestion_log";

  /**
   * Get news engagement analytics
   */
  async getAnalytics(
    dateRange: "7d" | "30d" | "90d" = "7d",
  ): Promise<NewsAnalyticsResult> {
    const daysMap = { "7d": 7, "30d": 30, "90d": 90 };
    const days = daysMap[dateRange] || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString();

    // Get analytics events
    const events = await queryDocuments<AnalyticsEvent>(
      this.analyticsContainer,
      "SELECT * FROM c WHERE c.timestamp >= @startDate",
      [{ name: "@startDate", value: startDateStr }],
    );

    // Calculate metrics
    const viewEvents = events.filter((e) => e.action === "view");
    const saveEvents = events.filter((e) => e.action === "save");
    const uniqueUsers = new Set(events.map((e) => e.userId)).size;

    // Group by article
    const articleViews: Record<string, number> = {};
    const articleSaves: Record<string, number> = {};

    for (const event of events) {
      if (event.action === "view") {
        articleViews[event.articleId] = (articleViews[event.articleId] || 0) + 1;
      } else if (event.action === "save") {
        articleSaves[event.articleId] = (articleSaves[event.articleId] || 0) + 1;
      }
    }

    // Get top articles
    const topArticleIds = Object.entries(articleViews)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id]) => id);

    const topArticles: Array<{
      id: string;
      title: string;
      views: number;
      saves: number;
    }> = [];

    const engagementByCategory: Record<string, { views: number; saves: number }> = {};

    if (topArticleIds.length > 0) {
      const articles = await newsRepository.findByIds(topArticleIds);

      for (const article of articles) {
        topArticles.push({
          id: article.id,
          title: article.title,
          views: articleViews[article.id] || 0,
          saves: articleSaves[article.id] || 0,
        });

        const category = article.category || "uncategorized";
        if (!engagementByCategory[category]) {
          engagementByCategory[category] = { views: 0, saves: 0 };
        }
        engagementByCategory[category].views += articleViews[article.id] || 0;
        engagementByCategory[category].saves += articleSaves[article.id] || 0;
      }
    }

    // Calculate daily views
    const dailyViews: Record<string, number> = {};
    for (const event of viewEvents) {
      const date = event.timestamp.split("T")[0];
      dailyViews[date] = (dailyViews[date] || 0) + 1;
    }

    // Fill in missing days
    const dailyViewsArray: Array<{ date: string; views: number }> = [];
    const currentDate = new Date(startDate);
    const endDate = new Date();

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split("T")[0];
      dailyViewsArray.push({
        date: dateStr,
        views: dailyViews[dateStr] || 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      totalViews: viewEvents.length,
      totalSaves: saveEvents.length,
      uniqueReaders: uniqueUsers,
      avgReadTime: 45, // Placeholder - would need actual timing data
      topArticles,
      engagementByCategory,
      dailyViews: dailyViewsArray,
    };
  }

  /**
   * Get ingestion statistics
   */
  async getIngestionStats(): Promise<{
    totalArticles: number;
    lastIngestionTime: string | null;
    articlesByCategory: Record<string, number>;
    articlesLast24h: number;
    articlesLast7d: number;
  }> {
    // Get all articles
    const articles = await queryDocuments<NewsArticle>(
      "news_articles",
      "SELECT c.id, c.category, c.createdAt FROM c",
    );

    const articlesByCategory: Record<string, number> = {};
    let lastIngestionTime: string | null = null;

    for (const article of articles) {
      const category = article.category || "uncategorized";
      articlesByCategory[category] = (articlesByCategory[category] || 0) + 1;

      if (!lastIngestionTime || (article.createdAt && article.createdAt > lastIngestionTime)) {
        lastIngestionTime = article.createdAt || null;
      }
    }

    // Count recent articles
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    const articlesLast24h = articles.filter(
      (a) => a.createdAt && new Date(a.createdAt) >= yesterday,
    ).length;

    const articlesLast7d = articles.filter(
      (a) => a.createdAt && new Date(a.createdAt) >= lastWeek,
    ).length;

    return {
      totalArticles: articles.length,
      lastIngestionTime,
      articlesByCategory,
      articlesLast24h,
      articlesLast7d,
    };
  }

  /**
   * Log analytics event
   */
  async logEvent(
    articleId: string,
    userId: string,
    action: "view" | "save" | "unsave",
  ): Promise<void> {
    const eventId = `${userId}_${articleId}_${action}_${Date.now()}`;

    await upsertDocument(this.analyticsContainer, {
      id: eventId,
      articleId,
      userId,
      action,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Import news articles with AI processing
   */
  async importArticles(
    articles: Array<{
      title: string;
      content: string;
      source: string;
      sourceUrl?: string;
      publishedAt?: string;
    }>,
  ): Promise<{
    total: number;
    imported: number;
    failed: number;
    results: Array<{ title: string; id?: string; error?: string }>;
  }> {
    const results: Array<{ title: string; id?: string; error?: string }> = [];

    for (const article of articles.slice(0, 50)) {
      try {
        // Check for duplicates
        const existing = await queryDocuments<{ id: string }>(
          "news_articles",
          "SELECT c.id FROM c WHERE c.title = @title",
          [{ name: "@title", value: article.title }],
        );

        if (existing.length > 0) {
          results.push({ title: article.title, error: "Duplicate" });
          continue;
        }

        // Process with AI
        const processed = await this.processArticleWithAI(
          article.title,
          article.content,
          article.source,
        );

        if (processed) {
          processed.sourceUrl = article.sourceUrl || "";
          if (article.publishedAt) {
            processed.publishedAt = article.publishedAt;
          }

          await newsRepository.save(processed);
          results.push({ title: article.title, id: processed.id });
        } else {
          results.push({ title: article.title, error: "Processing failed" });
        }
      } catch (error) {
        results.push({
          title: article.title,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      total: articles.length,
      imported: results.filter((r) => r.id).length,
      failed: results.filter((r) => r.error).length,
      results,
    };
  }

  /**
   * Process article with AI categorization and embedding
   */
  private async processArticleWithAI(
    title: string,
    content: string,
    source: string,
  ): Promise<NewsArticle | null> {
    try {
      // Categorize
      const categorizationPrompt = buildUserPrompt(NEWS_CATEGORIZATION_PROMPT, {
        title,
        content: content.substring(0, 2000),
      });

      const config = getModelConfig(NEWS_CATEGORIZATION_PROMPT);
      const categorizationResult = await generateCompletion(
        NEWS_CATEGORIZATION_PROMPT.system.base,
        categorizationPrompt,
        { temperature: config.temperature },
      );

      let categorization;
      try {
        categorization = JSON.parse(categorizationResult);
      } catch {
        categorization = {
          category: "company-news",
          targetRoles: [],
          targetInterests: [],
          keywords: [],
          isGeneral: true,
          sentiment: "neutral",
        };
      }

      // Generate summary
      const summaryPrompt = buildUserPrompt(NEWS_SUMMARY_PROMPT, {
        title,
        content,
      });
      const summary = await generateCompletion(
        NEWS_SUMMARY_PROMPT.system.base,
        summaryPrompt,
        { temperature: 0.3, maxTokens: 200 },
      );

      // Generate embedding
      const embedding = await generateEmbeddings(
        `${title}. ${summary}. ${content.substring(0, 500)}`,
      );

      const now = new Date().toISOString();
      const articleId = `news_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      return {
        id: articleId,
        title,
        summary,
        content,
        category: categorization.category,
        type: categorization.isGeneral ? "general" : "specialized",
        source,
        sourceUrl: "",
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
    } catch (error) {
      console.error("Error processing article with AI:", error);
      return null;
    }
  }

  /**
   * Generate AI news digest
   */
  async generateNewsDigest(
    topics?: string[],
    userRoles?: string[],
  ): Promise<{
    digest: string;
    topics: string[];
    generatedAt: string;
    disclaimer: string;
  }> {
    const defaultTopics = [
      "counter-drone technology",
      "defense contracts",
      "drone regulations",
      "AI in defense",
      "military technology",
    ];

    const selectedTopics = topics || defaultTopics.slice(0, 5);

    const systemPrompt = `You are a defense industry news analyst specializing in counter-drone technology.

Generate a brief news digest covering recent developments in the specified topics.
Focus on:
- Recent contracts and funding announcements
- Technology breakthroughs
- Regulatory changes
- Market trends
- Notable incidents or deployments

Be factual and cite general knowledge. If you're unsure about recent events, indicate the information may not be current.`;

    const userPrompt = `Generate a news digest for the following topics: ${selectedTopics.join(", ")}

${userRoles?.length ? `Focus on content relevant to these roles: ${userRoles.join(", ")}` : ""}

Format as a brief digest with 3-5 key items.`;

    const digest = await generateCompletion(systemPrompt, userPrompt, {
      temperature: 0.5,
      maxTokens: 1000,
    });

    return {
      digest,
      topics: selectedTopics,
      generatedAt: new Date().toISOString(),
      disclaimer:
        "This digest is AI-generated and may not reflect the most recent news. Verify information from primary sources.",
    };
  }
}

/**
 * Singleton instance
 */
export const newsAnalyticsService = new NewsAnalyticsService();
