/**
 * News Ingestion Functions
 *
 * AI-powered news discovery, processing, and storage.
 * Uses web search and LLM to find, categorize, and summarize
 * relevant industry news.
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { chatCompletion, generateEmbedding } from "../ai-provider";
import { NEWS_CATEGORIZATION_PROMPT } from "../prompts/templates";
import {
  NEWS_TOPICS,
  NEWS_SOURCES,
  getHighPriorityQueries,
  getTrustedDomains,
} from "./config";

const db = admin.firestore();
const COLLECTIONS = {
  NEWS: "news_articles",
  INGESTION_LOG: "news_ingestion_log",
  NEWS_SOURCES: "news_sources",
};

// Rate limiting - max articles per ingestion run
const MAX_ARTICLES_PER_RUN = 20;
const DUPLICATE_CHECK_DAYS = 7;

interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  publishedDate?: string;
}

interface ProcessedArticle {
  title: string;
  summary: string;
  content: string;
  category: string;
  type: "general" | "specialized";
  source: string;
  sourceUrl: string;
  publishedAt: admin.firestore.Timestamp;
  targetRoles: string[];
  targetInterests: string[];
  targetFocusAreas: string[];
  keywords: string[];
  sentiment: "positive" | "neutral" | "negative";
  embedding?: number[];
}

/**
 * Simulate web search for news (in production, use a real search API)
 * This would integrate with:
 * - Google Custom Search API
 * - Bing News Search API
 * - NewsAPI.org
 * - Or direct RSS feed parsing
 */
async function searchWebForNews(
  query: string,
  _trustedDomains: string[],
): Promise<WebSearchResult[]> {
  // In production, this would call a real search API
  // For now, we'll use the AI to generate relevant news topics
  // that an admin can then manually verify and add

  functions.logger.info(`Searching for: ${query}`);

  // This is a placeholder - in production you'd use:
  // const response = await fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&apiKey=${API_KEY}`);

  return [];
}

/**
 * Use AI to process and categorize a news article
 */
async function processArticleWithAI(
  title: string,
  content: string,
  source: string,
): Promise<ProcessedArticle | null> {
  try {
    // Categorize the article
    const categorizationPrompt = NEWS_CATEGORIZATION_PROMPT.user.template
      .replace("{{title}}", title)
      .replace("{{content}}", content.substring(0, 3000));

    const { content: categorizationResult } = await chatCompletion(
      [
        { role: "system", content: NEWS_CATEGORIZATION_PROMPT.system.base },
        { role: "user", content: categorizationPrompt },
      ],
      { model: "chatFast", maxTokens: 500, temperature: 0.1 },
    );

    let categorization: {
      category: string;
      targetRoles: string[];
      targetInterests: string[];
      keywords: string[];
      isGeneral: boolean;
      sentiment: "positive" | "neutral" | "negative";
    };
    
    try {
      categorization = JSON.parse(categorizationResult);
    } catch (parseError) {
      functions.logger.warn("Failed to parse categorization JSON, using defaults", { parseError, categorizationResult });
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
    const { content: summary } = await chatCompletion(
      [
        {
          role: "system",
          content:
            "Summarize the following news article in 2-3 sentences, focusing on key facts and implications for the counter-drone industry.",
        },
        { role: "user", content: `${title}\n\n${content}` },
      ],
      { model: "chatFast", maxTokens: 200, temperature: 0.3 },
    );

    // Generate embedding for semantic search
    const { embeddings } = await generateEmbedding(
      `${title}. ${summary}. ${content.substring(0, 500)}`,
    );

    return {
      title,
      summary,
      content,
      category: categorization.category,
      type: categorization.isGeneral ? "general" : "specialized",
      source,
      sourceUrl: "",
      publishedAt: admin.firestore.Timestamp.now(),
      targetRoles: categorization.targetRoles,
      targetInterests: categorization.targetInterests,
      targetFocusAreas: [],
      keywords: categorization.keywords,
      sentiment: categorization.sentiment,
      embedding: embeddings[0],
    };
  } catch (error) {
    functions.logger.error("Error processing article with AI:", error);
    return null;
  }
}

/**
 * Check if article already exists (deduplication)
 */
async function isDuplicateArticle(title: string): Promise<boolean> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - DUPLICATE_CHECK_DAYS);

  const snapshot = await db
    .collection(COLLECTIONS.NEWS)
    .where("title", "==", title)
    .where("createdAt", ">", admin.firestore.Timestamp.fromDate(cutoffDate))
    .limit(1)
    .get();

  return !snapshot.empty;
}

/**
 * Store processed article in Firestore
 */
async function storeArticle(article: ProcessedArticle): Promise<string> {
  const now = admin.firestore.Timestamp.now();

  const docRef = await db.collection(COLLECTIONS.NEWS).add({
    ...article,
    viewCount: 0,
    createdAt: now,
    updatedAt: now,
  });

  return docRef.id;
}

/**
 * Scheduled function to fetch news from the web
 * Runs every 6 hours
 */
export const fetchNewsFromWeb = functions.pubsub
  .schedule("every 6 hours")
  .timeZone("UTC")
  .onRun(async () => {
    functions.logger.info("Starting scheduled news ingestion");

    const queries = getHighPriorityQueries();
    const trustedDomains = getTrustedDomains();
    const results: WebSearchResult[] = [];

    // Search for news using multiple queries
    for (const query of queries.slice(0, 5)) {
      const searchResults = await searchWebForNews(query, trustedDomains);
      results.push(...searchResults);

      // Rate limiting between searches
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Process and store articles
    let processedCount = 0;
    let duplicateCount = 0;

    for (const result of results.slice(0, MAX_ARTICLES_PER_RUN)) {
      // Check for duplicates
      if (await isDuplicateArticle(result.title)) {
        duplicateCount++;
        continue;
      }

      // Process with AI
      const article = await processArticleWithAI(
        result.title,
        result.snippet,
        result.source,
      );

      if (article) {
        article.sourceUrl = result.url;
        if (result.publishedDate) {
          article.publishedAt = admin.firestore.Timestamp.fromDate(
            new Date(result.publishedDate),
          );
        }

        await storeArticle(article);
        processedCount++;
      }
    }

    // Log ingestion run
    await db.collection(COLLECTIONS.INGESTION_LOG).add({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      queriesUsed: queries.slice(0, 5),
      resultsFound: results.length,
      processedCount,
      duplicateCount,
      status: "completed",
    });

    functions.logger.info(
      `News ingestion complete: ${processedCount} new articles, ${duplicateCount} duplicates skipped`,
    );

    return null;
  });

/**
 * Manual news ingestion trigger (admin only)
 * Allows admins to trigger news fetch on demand
 */
export const triggerNewsIngestion = functions.https.onCall(
  async (data: { queries?: string[]; maxArticles?: number }, context) => {
    // Check admin status
    if (!context.auth?.token.admin) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only admins can trigger news ingestion",
      );
    }

    const queries = data.queries || getHighPriorityQueries().slice(0, 3);
    const maxArticles = Math.min(data.maxArticles || 10, MAX_ARTICLES_PER_RUN);
    const trustedDomains = getTrustedDomains();

    const results: WebSearchResult[] = [];

    for (const query of queries) {
      const searchResults = await searchWebForNews(query, trustedDomains);
      results.push(...searchResults);
    }

    let processedCount = 0;
    const articleIds: string[] = [];

    for (const result of results.slice(0, maxArticles)) {
      if (await isDuplicateArticle(result.title)) continue;

      const article = await processArticleWithAI(
        result.title,
        result.snippet,
        result.source,
      );

      if (article) {
        article.sourceUrl = result.url;
        const id = await storeArticle(article);
        articleIds.push(id);
        processedCount++;
      }
    }

    return {
      success: true,
      processedCount,
      articleIds,
      queriesUsed: queries,
    };
  },
);

/**
 * Generate AI-curated news suggestions
 * Uses AI to identify trending topics and generate news summaries
 */
export const generateAINewsDigest = functions.https.onCall(
  async (
    data: { topics?: string[]; userRoles?: string[] },
    context,
  ) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be signed in",
      );
    }

    const topics = data.topics || NEWS_TOPICS.map((t) => t.name).slice(0, 5);

    try {
      // Ask AI to generate a news digest based on topics
      const { content: digest } = await chatCompletion(
        [
          {
            role: "system",
            content: `You are a defense industry news analyst specializing in counter-drone technology.

Generate a brief news digest covering recent developments in the specified topics.
Focus on:
- Recent contracts and funding announcements
- Technology breakthroughs
- Regulatory changes
- Market trends
- Notable incidents or deployments

Be factual and cite general knowledge. If you're unsure about recent events, indicate the information may not be current.`,
          },
          {
            role: "user",
            content: `Generate a news digest for the following topics: ${topics.join(", ")}

${data.userRoles?.length ? `Focus on content relevant to these roles: ${data.userRoles.join(", ")}` : ""}

Format as a brief digest with 3-5 key items.`,
          },
        ],
        { model: "chat", maxTokens: 1000, temperature: 0.5 },
      );

      return {
        digest,
        topics,
        generatedAt: new Date().toISOString(),
        disclaimer:
          "This digest is AI-generated and may not reflect the most recent news. Verify information from primary sources.",
      };
    } catch (error) {
      functions.logger.error("Error generating AI news digest:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to generate news digest",
      );
    }
  },
);

/**
 * Import news from external source (admin only)
 * Allows bulk import of news articles
 */
export const importNewsArticles = functions.https.onCall(
  async (
    data: {
      articles: Array<{
        title: string;
        content: string;
        source: string;
        sourceUrl?: string;
        publishedAt?: string;
      }>;
    },
    context,
  ) => {
    if (!context.auth?.token.admin) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only admins can import articles",
      );
    }

    const { articles } = data;
    const results: Array<{ title: string; id?: string; error?: string }> = [];

    for (const article of articles.slice(0, 50)) {
      try {
        // Check for duplicates
        if (await isDuplicateArticle(article.title)) {
          results.push({ title: article.title, error: "Duplicate" });
          continue;
        }

        // Process with AI
        const processed = await processArticleWithAI(
          article.title,
          article.content,
          article.source,
        );

        if (processed) {
          processed.sourceUrl = article.sourceUrl || "";
          if (article.publishedAt) {
            processed.publishedAt = admin.firestore.Timestamp.fromDate(
              new Date(article.publishedAt),
            );
          }

          const id = await storeArticle(processed);
          results.push({ title: article.title, id });
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
      success: true,
      total: articles.length,
      imported: results.filter((r) => r.id).length,
      failed: results.filter((r) => r.error).length,
      results,
    };
  },
);

/**
 * Get news ingestion statistics (admin only)
 */
export const getNewsIngestionStats = functions.https.onCall(
  async (_data: Record<string, never>, context) => {
    if (!context.auth?.token.admin) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only admins can view ingestion stats",
      );
    }

    // Get article counts by category
    const articlesSnapshot = await db.collection(COLLECTIONS.NEWS).get();
    const categoryCount: Record<string, number> = {};
    const typeCount: Record<string, number> = { general: 0, specialized: 0 };

    articlesSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      categoryCount[data.category] = (categoryCount[data.category] || 0) + 1;
      typeCount[data.type] = (typeCount[data.type] || 0) + 1;
    });

    // Get recent ingestion logs
    const logsSnapshot = await db
      .collection(COLLECTIONS.INGESTION_LOG)
      .orderBy("timestamp", "desc")
      .limit(10)
      .get();

    const recentLogs = logsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      totalArticles: articlesSnapshot.size,
      byCategory: categoryCount,
      byType: typeCount,
      recentIngestions: recentLogs,
      configuredTopics: NEWS_TOPICS.length,
      configuredSources: NEWS_SOURCES.length,
    };
  },
);
