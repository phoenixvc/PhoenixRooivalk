/**
 * News Ingestion Service
 *
 * Handles fetching news from external APIs (NewsAPI, Bing, RSS).
 * Processes and stores news with AI categorization.
 */

import { generateCompletion, generateEmbeddings } from "../lib/openai";
import { queryDocuments, upsertDocument } from "../lib/cosmos";
import {
  getNewsApiConfig,
  NEWS_SEARCH_QUERIES,
  HIGH_PRIORITY_QUERIES,
  TRUSTED_DOMAINS,
  NEWS_RSS_FEEDS,
} from "../config/news-api";
import {
  NEWS_CATEGORIZATION_PROMPT,
  NEWS_SUMMARY_PROMPT,
  buildUserPrompt,
  getModelConfig,
} from "../prompts";
import { newsRepository, NewsArticle } from "../repositories";

/**
 * Raw news article from external API
 */
interface ExternalNewsArticle {
  title: string;
  description: string;
  content?: string;
  url: string;
  source: string;
  publishedAt: string;
  urlToImage?: string;
}

/**
 * News ingestion result
 */
export interface IngestionResult {
  success: boolean;
  articlesFound: number;
  articlesProcessed: number;
  articlesDuplicate: number;
  articlesFailed: number;
  articleIds: string[];
  errors: string[];
}

/**
 * News Ingestion Service class
 */
export class NewsIngestionService {
  private readonly maxArticlesPerRun = 20;
  private readonly duplicateCheckDays = 7;

  /**
   * Fetch news from NewsAPI.org
   */
  async fetchFromNewsAPI(query: string): Promise<ExternalNewsArticle[]> {
    const config = getNewsApiConfig();

    if (!config.apiKey) {
      console.warn("NewsAPI key not configured");
      return [];
    }

    try {
      const url = new URL(`${config.baseUrl}/everything`);
      url.searchParams.set("q", query);
      url.searchParams.set("language", "en");
      url.searchParams.set("sortBy", "publishedAt");
      url.searchParams.set("pageSize", "10");

      // Filter by trusted domains
      const domains = TRUSTED_DOMAINS.slice(0, 20).join(",");
      url.searchParams.set("domains", domains);

      const response = await fetch(url.toString(), {
        headers: {
          "X-Api-Key": config.apiKey,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("NewsAPI error:", error);
        return [];
      }

      const data = await response.json();

      return (data.articles || []).map((article: {
        title: string;
        description: string;
        content?: string;
        url: string;
        source: { name: string };
        publishedAt: string;
        urlToImage?: string;
      }) => ({
        title: article.title,
        description: article.description,
        content: article.content,
        url: article.url,
        source: article.source?.name || "Unknown",
        publishedAt: article.publishedAt,
        urlToImage: article.urlToImage,
      }));
    } catch (error) {
      console.error("Failed to fetch from NewsAPI:", error);
      return [];
    }
  }

  /**
   * Fetch news from Bing News API
   */
  async fetchFromBingNews(query: string): Promise<ExternalNewsArticle[]> {
    const config = getNewsApiConfig();

    if (config.provider !== "bing" || !config.apiKey) {
      return [];
    }

    try {
      const url = new URL(`${config.baseUrl}/search`);
      url.searchParams.set("q", query);
      url.searchParams.set("count", "10");
      url.searchParams.set("freshness", "Week");
      url.searchParams.set("mkt", "en-US");

      const response = await fetch(url.toString(), {
        headers: {
          "Ocp-Apim-Subscription-Key": config.apiKey,
        },
      });

      if (!response.ok) {
        console.error("Bing News API error:", response.status);
        return [];
      }

      const data = await response.json();

      return (data.value || []).map((article: {
        name: string;
        description: string;
        url: string;
        provider: Array<{ name: string }>;
        datePublished: string;
        image?: { thumbnail?: { contentUrl: string } };
      }) => ({
        title: article.name,
        description: article.description,
        content: article.description,
        url: article.url,
        source: article.provider?.[0]?.name || "Unknown",
        publishedAt: article.datePublished,
        urlToImage: article.image?.thumbnail?.contentUrl,
      }));
    } catch (error) {
      console.error("Failed to fetch from Bing News:", error);
      return [];
    }
  }

  /**
   * Check if article already exists
   */
  async isDuplicate(title: string): Promise<boolean> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.duplicateCheckDays);

    const existing = await queryDocuments<{ id: string }>(
      "news_articles",
      "SELECT c.id FROM c WHERE c.title = @title AND c.createdAt >= @cutoff",
      [
        { name: "@title", value: title },
        { name: "@cutoff", value: cutoffDate.toISOString() },
      ],
    );

    return existing.length > 0;
  }

  /**
   * Process article with AI categorization
   */
  async processArticle(article: ExternalNewsArticle): Promise<NewsArticle | null> {
    try {
      const content = article.content || article.description;

      // Categorize with AI
      const categorizationPrompt = buildUserPrompt(NEWS_CATEGORIZATION_PROMPT, {
        title: article.title,
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
          category: "defense-tech",
          targetRoles: [],
          targetInterests: [],
          keywords: [],
          isGeneral: true,
          sentiment: "neutral",
        };
      }

      // Generate summary
      const summaryPrompt = buildUserPrompt(NEWS_SUMMARY_PROMPT, {
        title: article.title,
        content,
      });
      const summary = await generateCompletion(
        NEWS_SUMMARY_PROMPT.system.base,
        summaryPrompt,
        { temperature: 0.3, maxTokens: 200 },
      );

      // Generate embedding
      const embedding = await generateEmbeddings(
        `${article.title}. ${summary}. ${content.substring(0, 500)}`,
      );

      const now = new Date().toISOString();
      const articleId = `news_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      return {
        id: articleId,
        title: article.title,
        summary,
        content,
        category: categorization.category,
        type: categorization.isGeneral ? "general" : "specialized",
        source: article.source,
        sourceUrl: article.url,
        publishedAt: article.publishedAt || now,
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
      console.error("Failed to process article:", error);
      return null;
    }
  }

  /**
   * Run news ingestion from external APIs
   */
  async runIngestion(options: {
    queries?: string[];
    maxArticles?: number;
    provider?: "newsapi" | "bing";
  } = {}): Promise<IngestionResult> {
    const queries = options.queries || NEWS_SEARCH_QUERIES.slice(0, 5);
    const maxArticles = Math.min(
      options.maxArticles || this.maxArticlesPerRun,
      this.maxArticlesPerRun,
    );

    const result: IngestionResult = {
      success: true,
      articlesFound: 0,
      articlesProcessed: 0,
      articlesDuplicate: 0,
      articlesFailed: 0,
      articleIds: [],
      errors: [],
    };

    const allArticles: ExternalNewsArticle[] = [];

    // Fetch from APIs
    for (const query of queries) {
      try {
        const articles =
          options.provider === "bing"
            ? await this.fetchFromBingNews(query)
            : await this.fetchFromNewsAPI(query);

        allArticles.push(...articles);

        // Rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        result.errors.push(`Failed to fetch for query "${query}": ${error}`);
      }
    }

    result.articlesFound = allArticles.length;

    // Deduplicate by URL
    const uniqueArticles = Array.from(
      new Map(allArticles.map((a) => [a.url, a])).values(),
    ).slice(0, maxArticles);

    // Process articles
    for (const article of uniqueArticles) {
      try {
        // Check for duplicates
        if (await this.isDuplicate(article.title)) {
          result.articlesDuplicate++;
          continue;
        }

        // Process with AI
        const processed = await this.processArticle(article);

        if (processed) {
          await newsRepository.save(processed);
          result.articleIds.push(processed.id);
          result.articlesProcessed++;
        } else {
          result.articlesFailed++;
        }

        // Rate limiting for AI calls
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (error) {
        result.articlesFailed++;
        result.errors.push(`Failed to process "${article.title}": ${error}`);
      }
    }

    // Log ingestion run
    await upsertDocument("news_ingestion_log", {
      id: `ingestion_${Date.now()}`,
      timestamp: new Date().toISOString(),
      queriesUsed: queries,
      provider: options.provider || "newsapi",
      ...result,
    });

    return result;
  }

  /**
   * Fetch breaking news (high priority queries)
   */
  async fetchBreakingNews(): Promise<IngestionResult> {
    return this.runIngestion({
      queries: HIGH_PRIORITY_QUERIES,
      maxArticles: 10,
    });
  }

  /**
   * Get available RSS feeds
   */
  getRSSFeeds() {
    return NEWS_RSS_FEEDS;
  }

  /**
   * Get search queries
   */
  getSearchQueries() {
    return NEWS_SEARCH_QUERIES;
  }
}

/**
 * Singleton instance
 */
export const newsIngestionService = new NewsIngestionService();
