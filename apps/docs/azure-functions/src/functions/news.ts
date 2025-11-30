/**
 * News Functions for Azure
 *
 * Provides news retrieval, personalization, and management functions.
 * Ported from Firebase Cloud Functions to Azure Functions.
 */

import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { getContainer, queryDocuments, upsertDocument } from "../lib/cosmos";
import { validateAuthHeader } from "../lib/auth";
import { generateEmbeddings, generateCompletion } from "../lib/openai";

// Types
type NewsCategory =
  | "counter-uas"
  | "defense-tech"
  | "drone-industry"
  | "regulatory"
  | "market-analysis"
  | "product-updates"
  | "company-news"
  | "research"
  | "partnerships";

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: NewsCategory;
  type: "general" | "specialized";
  source: string;
  sourceUrl?: string;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  targetRoles: string[];
  targetInterests: string[];
  targetFocusAreas: string[];
  viewCount: number;
  keywords: string[];
  sentiment?: "positive" | "neutral" | "negative";
  embedding?: number[];
}

interface UserProfile {
  roles: string[];
  interests: string[];
  focusAreas: string[];
  experienceLevel: "beginner" | "intermediate" | "advanced";
}

interface NewsRelevance {
  score: number;
  matchedRoles: string[];
  matchedInterests: string[];
  matchedFocusAreas: string[];
  reason: string;
}

// Collection names
const COLLECTIONS = {
  NEWS: "news_articles",
  USER_NEWS_PREFS: "user_news_preferences",
  NEWS_ANALYTICS: "news_analytics",
};

/**
 * Calculate relevance score between article and user profile
 */
function calculateRelevanceScore(
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
 * Cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
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

/**
 * Get news feed handler
 */
async function getNewsFeedHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const body = (await request.json()) as {
      userProfile?: UserProfile;
      limit?: number;
      cursor?: string;
      categories?: NewsCategory[];
    };

    const { userProfile, limit = 20, cursor, categories } = body;

    const authResult = await validateAuthHeader(
      request.headers.get("authorization"),
    );
    const userId = authResult.valid ? authResult.userId : undefined;

    // Validate categories
    if (categories && categories.length > 10) {
      return {
        status: 400,
        jsonBody: {
          error: "Cannot filter by more than 10 categories at once",
          code: "invalid-argument",
        },
      };
    }

    // Build query
    let query = "SELECT * FROM c ORDER BY c.publishedAt DESC";
    const parameters: Array<{ name: string; value: string }> = [];

    if (categories && categories.length > 0) {
      const categoryPlaceholders = categories
        .map((_, i) => `@cat${i}`)
        .join(", ");
      query = `SELECT * FROM c WHERE c.category IN (${categoryPlaceholders}) ORDER BY c.publishedAt DESC`;
      categories.forEach((cat, i) => {
        parameters.push({ name: `@cat${i}`, value: cat });
      });
    }

    // Add pagination
    query += ` OFFSET 0 LIMIT ${limit * 2}`;

    const articles = await queryDocuments<NewsArticle>(
      COLLECTIONS.NEWS,
      query,
      parameters,
    );

    // Get user read status
    let readArticleIds: string[] = [];
    if (userId) {
      const container = getContainer(COLLECTIONS.USER_NEWS_PREFS);
      try {
        const { resource } = await container.item(userId, userId).read();
        if (resource) {
          readArticleIds = resource.readArticleIds || [];
        }
      } catch {
        // No preferences yet
      }
    }

    // Separate general and specialized news
    const generalNews: NewsArticle[] = [];
    const specializedNews: Array<NewsArticle & { relevance: NewsRelevance; isRead: boolean }> = [];

    for (const article of articles) {
      if (article.type === "general" || !userProfile) {
        generalNews.push(article);
      } else {
        const relevance = calculateRelevanceScore(article, userProfile);

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

    // Limit results
    const finalGeneral = generalNews.slice(0, Math.ceil(limit / 2));
    const finalSpecialized = specializedNews.slice(0, Math.floor(limit / 2));

    return {
      status: 200,
      jsonBody: {
        generalNews: finalGeneral,
        specializedNews: finalSpecialized,
        totalCount: articles.length,
        hasMore: articles.length >= limit * 2,
        nextCursor:
          articles.length > 0 ? articles[articles.length - 1].id : undefined,
      },
    };
  } catch (error) {
    context.error("Error fetching news feed:", error);
    return {
      status: 500,
      jsonBody: { error: "Failed to fetch news feed", code: "internal" },
    };
  }
}

/**
 * Add news article handler (admin only)
 */
async function addNewsArticleHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const authResult = await validateAuthHeader(
    request.headers.get("authorization"),
  );

  if (!authResult.valid || !authResult.isAdmin) {
    return {
      status: 403,
      jsonBody: {
        error: "Only admins can add news articles",
        code: "permission-denied",
      },
    };
  }

  try {
    const { title, content, source, sourceUrl, category } = (await request.json()) as {
      title: string;
      content: string;
      source: string;
      sourceUrl?: string;
      category?: NewsCategory;
    };

    // Use AI to categorize and extract metadata
    const categorizationResult = await generateCompletion(
      `You are a news categorization expert for defense and drone technology news.
Analyze the article and return a JSON object with:
- category: one of "counter-uas", "defense-tech", "drone-industry", "regulatory", "market-analysis", "product-updates", "company-news", "research", "partnerships"
- targetRoles: array of relevant roles (e.g., "Engineer", "Executive", "Military")
- targetInterests: array of relevant topics
- keywords: array of key terms
- isGeneral: boolean (true for general audience, false for specialized)
- sentiment: "positive", "neutral", or "negative"`,
      `Title: ${title}\n\nContent: ${content.substring(0, 2000)}`,
      { temperature: 0.1 },
    );

    let categorization;
    try {
      categorization = JSON.parse(categorizationResult);
    } catch {
      categorization = {
        category: category || "company-news",
        targetRoles: [],
        targetInterests: [],
        keywords: [],
        isGeneral: true,
        sentiment: "neutral",
      };
    }

    // Generate embedding
    const embedding = await generateEmbeddings(`${title}. ${content.substring(0, 1000)}`);

    // Generate summary
    const summary = await generateCompletion(
      "Summarize the following news article in 2-3 sentences.",
      `${title}\n\n${content}`,
      { maxTokens: 200, temperature: 0.3 },
    );

    const now = new Date().toISOString();
    const articleId = `news_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const article: NewsArticle = {
      id: articleId,
      title,
      summary,
      content,
      category: category || categorization.category,
      type: categorization.isGeneral ? "general" : "specialized",
      source,
      sourceUrl,
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
      targetRoles: categorization.targetRoles,
      targetInterests: categorization.targetInterests,
      targetFocusAreas: [],
      viewCount: 0,
      keywords: categorization.keywords,
      sentiment: categorization.sentiment,
      embedding,
    };

    await upsertDocument(COLLECTIONS.NEWS, article);

    context.log(`Added news article: ${articleId}`);

    return {
      status: 200,
      jsonBody: {
        success: true,
        articleId,
        category: article.category,
        type: article.type,
      },
    };
  } catch (error) {
    context.error("Error adding news article:", error);
    return {
      status: 500,
      jsonBody: { error: "Failed to add news article", code: "internal" },
    };
  }
}

/**
 * Mark article as read handler
 */
async function markArticleReadHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const authResult = await validateAuthHeader(
    request.headers.get("authorization"),
  );

  if (!authResult.valid) {
    return {
      status: 401,
      jsonBody: { error: "Must be signed in", code: "unauthenticated" },
    };
  }

  try {
    const { articleId } = (await request.json()) as { articleId: string };
    const userId = authResult.userId!;

    // Get existing preferences
    const container = getContainer(COLLECTIONS.USER_NEWS_PREFS);
    let prefs: Record<string, unknown> = {};

    try {
      const { resource } = await container.item(userId, userId).read();
      if (resource) {
        prefs = resource;
      }
    } catch {
      // No preferences yet
    }

    const readIds = (prefs.readArticleIds as string[]) || [];
    if (!readIds.includes(articleId)) {
      readIds.push(articleId);
    }

    await upsertDocument(COLLECTIONS.USER_NEWS_PREFS, {
      id: userId,
      ...prefs,
      readArticleIds: readIds,
      updatedAt: new Date().toISOString(),
    });

    // Increment view count
    const articlesContainer = getContainer(COLLECTIONS.NEWS);
    try {
      const { resource: article } = await articlesContainer
        .item(articleId, articleId)
        .read<NewsArticle>();
      if (article) {
        await upsertDocument(COLLECTIONS.NEWS, {
          ...article,
          viewCount: (article.viewCount || 0) + 1,
        });
      }
    } catch {
      // Article not found
    }

    // Track analytics
    const analyticsId = `${userId}_${articleId}_${Date.now()}`;
    await upsertDocument(COLLECTIONS.NEWS_ANALYTICS, {
      id: analyticsId,
      articleId,
      userId,
      action: "view",
      timestamp: new Date().toISOString(),
    });

    return {
      status: 200,
      jsonBody: { success: true },
    };
  } catch (error) {
    context.error("Error marking article as read:", error);
    return {
      status: 500,
      jsonBody: { error: "Failed to mark article as read", code: "internal" },
    };
  }
}

/**
 * Save article handler
 */
async function saveArticleHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const authResult = await validateAuthHeader(
    request.headers.get("authorization"),
  );

  if (!authResult.valid) {
    return {
      status: 401,
      jsonBody: { error: "Must be signed in", code: "unauthenticated" },
    };
  }

  try {
    const { articleId, save } = (await request.json()) as {
      articleId: string;
      save: boolean;
    };
    const userId = authResult.userId!;

    // Get existing preferences
    const container = getContainer(COLLECTIONS.USER_NEWS_PREFS);
    let prefs: Record<string, unknown> = {};

    try {
      const { resource } = await container.item(userId, userId).read();
      if (resource) {
        prefs = resource;
      }
    } catch {
      // No preferences yet
    }

    let savedIds = (prefs.savedArticleIds as string[]) || [];
    if (save && !savedIds.includes(articleId)) {
      savedIds.push(articleId);
    } else if (!save) {
      savedIds = savedIds.filter((id) => id !== articleId);
    }

    await upsertDocument(COLLECTIONS.USER_NEWS_PREFS, {
      id: userId,
      ...prefs,
      savedArticleIds: savedIds,
      updatedAt: new Date().toISOString(),
    });

    // Track analytics
    const analyticsId = `${userId}_${articleId}_${save ? "save" : "unsave"}_${Date.now()}`;
    await upsertDocument(COLLECTIONS.NEWS_ANALYTICS, {
      id: analyticsId,
      articleId,
      userId,
      action: save ? "save" : "unsave",
      timestamp: new Date().toISOString(),
    });

    return {
      status: 200,
      jsonBody: { success: true, saved: save },
    };
  } catch (error) {
    context.error("Error saving article:", error);
    return {
      status: 500,
      jsonBody: { error: "Failed to save article", code: "internal" },
    };
  }
}

/**
 * Get saved articles handler
 */
async function getSavedArticlesHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const authResult = await validateAuthHeader(
    request.headers.get("authorization"),
  );

  if (!authResult.valid) {
    return {
      status: 401,
      jsonBody: { error: "Must be signed in", code: "unauthenticated" },
    };
  }

  try {
    const userId = authResult.userId!;

    // Get preferences
    const container = getContainer(COLLECTIONS.USER_NEWS_PREFS);
    let savedIds: string[] = [];

    try {
      const { resource } = await container.item(userId, userId).read();
      if (resource) {
        savedIds = resource.savedArticleIds || [];
      }
    } catch {
      // No preferences
    }

    if (savedIds.length === 0) {
      return { status: 200, jsonBody: { articles: [] } };
    }

    // Fetch saved articles
    const placeholders = savedIds.slice(0, 50).map((_, i) => `@id${i}`).join(", ");
    const parameters = savedIds.slice(0, 50).map((id, i) => ({ name: `@id${i}`, value: id }));

    const articles = await queryDocuments<NewsArticle>(
      COLLECTIONS.NEWS,
      `SELECT * FROM c WHERE c.id IN (${placeholders})`,
      parameters,
    );

    return {
      status: 200,
      jsonBody: { articles },
    };
  } catch (error) {
    context.error("Error getting saved articles:", error);
    return {
      status: 500,
      jsonBody: { error: "Failed to get saved articles", code: "internal" },
    };
  }
}

/**
 * Search news handler
 */
async function searchNewsHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const { query, categories, limit = 20 } = (await request.json()) as {
      query: string;
      categories?: NewsCategory[];
      limit?: number;
    };

    if (!query) {
      return {
        status: 400,
        jsonBody: { error: "Query is required", code: "invalid-argument" },
      };
    }

    // Generate embedding for query
    const queryEmbedding = await generateEmbeddings(query);

    // Fetch articles
    let dbQuery = "SELECT * FROM c ORDER BY c.publishedAt DESC OFFSET 0 LIMIT 100";
    const parameters: Array<{ name: string; value: string }> = [];

    if (categories && categories.length > 0) {
      if (categories.length > 10) {
        return {
          status: 400,
          jsonBody: {
            error: "Cannot filter by more than 10 categories at once",
            code: "invalid-argument",
          },
        };
      }
      const categoryPlaceholders = categories.map((_, i) => `@cat${i}`).join(", ");
      dbQuery = `SELECT * FROM c WHERE c.category IN (${categoryPlaceholders}) ORDER BY c.publishedAt DESC OFFSET 0 LIMIT 100`;
      categories.forEach((cat, i) => {
        parameters.push({ name: `@cat${i}`, value: cat });
      });
    }

    const articles = await queryDocuments<NewsArticle>(
      COLLECTIONS.NEWS,
      dbQuery,
      parameters,
    );

    // Calculate similarity scores
    const scoredArticles = articles
      .filter((a) => a.embedding)
      .map((article) => {
        const similarity = cosineSimilarity(queryEmbedding, article.embedding!);
        // Remove embedding from response
        const { embedding: _, ...rest } = article;
        return { ...rest, similarity };
      })
      .filter((a) => a.similarity > 0.5)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return {
      status: 200,
      jsonBody: {
        results: scoredArticles,
        totalFound: scoredArticles.length,
      },
    };
  } catch (error) {
    context.error("Error searching news:", error);
    return {
      status: 500,
      jsonBody: { error: "Failed to search news", code: "internal" },
    };
  }
}

// Register endpoints
app.http("getNewsFeed", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "news/feed",
  handler: getNewsFeedHandler,
});

app.http("addNewsArticle", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "news/articles",
  handler: addNewsArticleHandler,
});

app.http("markArticleRead", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "news/read",
  handler: markArticleReadHandler,
});

app.http("saveArticle", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "news/save",
  handler: saveArticleHandler,
});

app.http("getSavedArticles", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "news/saved",
  handler: getSavedArticlesHandler,
});

app.http("searchNews", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "news/search",
  handler: searchNewsHandler,
});
