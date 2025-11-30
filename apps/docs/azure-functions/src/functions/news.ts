/**
 * News HTTP Endpoints
 *
 * Thin HTTP handler layer that delegates to NewsService.
 * Uses shared utilities for error handling and rate limiting.
 */

import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { validateAuthHeader } from "../lib/auth";
import {
  Errors,
  successResponse,
  applyRateLimit,
  RateLimits,
} from "../lib/utils";
import { newsService, UserProfile } from "../services";
import { getCategoryIds } from "../config";

/**
 * Get news feed handler
 */
async function getNewsFeedHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  // Rate limiting
  const rateLimit = applyRateLimit(request, "news-feed", RateLimits.standard);
  if (!rateLimit.allowed) return rateLimit.response!;

  try {
    const body = (await request.json()) as {
      userProfile?: UserProfile;
      limit?: number;
      categories?: string[];
    };

    const authResult = await validateAuthHeader(
      request.headers.get("authorization"),
    );

    // Validate categories
    if (body.categories && body.categories.length > 10) {
      return Errors.badRequest("Cannot filter by more than 10 categories");
    }

    const result = await newsService.getNewsFeed({
      userProfile: body.userProfile,
      userId: authResult.valid ? authResult.userId : undefined,
      categories: body.categories,
      limit: body.limit,
    });

    return successResponse(result);
  } catch (error) {
    context.error("Error fetching news feed:", error);
    return Errors.internal("Failed to fetch news feed");
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
    return Errors.forbidden();
  }

  // Rate limiting for admin
  const rateLimit = applyRateLimit(
    request,
    "news-add",
    RateLimits.admin,
    authResult.userId,
  );
  if (!rateLimit.allowed) return rateLimit.response!;

  try {
    const body = (await request.json()) as {
      title: string;
      content: string;
      source: string;
      sourceUrl?: string;
      category?: string;
    };

    if (!body.title || !body.content || !body.source) {
      return Errors.badRequest("Title, content, and source are required");
    }

    const article = await newsService.addArticle(body);

    context.log(`Added news article: ${article.id}`);

    return successResponse({
      success: true,
      articleId: article.id,
      category: article.category,
      type: article.type,
    });
  } catch (error) {
    context.error("Error adding news article:", error);
    return Errors.internal("Failed to add news article");
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
    return Errors.unauthenticated();
  }

  try {
    const { articleId } = (await request.json()) as { articleId: string };

    if (!articleId) {
      return Errors.badRequest("articleId is required");
    }

    await newsService.markArticleRead(authResult.userId!, articleId);

    return successResponse({ success: true });
  } catch (error) {
    context.error("Error marking article as read:", error);
    return Errors.internal("Failed to mark article as read");
  }
}

/**
 * Save/unsave article handler
 */
async function saveArticleHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const authResult = await validateAuthHeader(
    request.headers.get("authorization"),
  );

  if (!authResult.valid) {
    return Errors.unauthenticated();
  }

  try {
    const { articleId, save } = (await request.json()) as {
      articleId: string;
      save: boolean;
    };

    if (!articleId || typeof save !== "boolean") {
      return Errors.badRequest("articleId and save (boolean) are required");
    }

    await newsService.toggleSaveArticle(authResult.userId!, articleId, save);

    return successResponse({ success: true, saved: save });
  } catch (error) {
    context.error("Error saving article:", error);
    return Errors.internal("Failed to save article");
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
    return Errors.unauthenticated();
  }

  try {
    const articles = await newsService.getSavedArticles(authResult.userId!);
    return successResponse({ articles });
  } catch (error) {
    context.error("Error getting saved articles:", error);
    return Errors.internal("Failed to get saved articles");
  }
}

/**
 * Search news handler
 */
async function searchNewsHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  // Rate limiting for search (AI-intensive)
  const rateLimit = applyRateLimit(request, "news-search", RateLimits.search);
  if (!rateLimit.allowed) return rateLimit.response!;

  try {
    const { query, categories, limit } = (await request.json()) as {
      query: string;
      categories?: string[];
      limit?: number;
    };

    if (!query) {
      return Errors.badRequest("Query is required");
    }

    // Validate categories
    if (categories && categories.length > 10) {
      return Errors.badRequest("Cannot filter by more than 10 categories");
    }

    const validCategoryIds = getCategoryIds();
    if (categories) {
      const invalidCats = categories.filter(
        (c) => !validCategoryIds.includes(c),
      );
      if (invalidCats.length > 0) {
        return Errors.badRequest(
          `Invalid categories: ${invalidCats.join(", ")}`,
        );
      }
    }

    const results = await newsService.searchNews(query, { categories, limit });

    return successResponse({
      results,
      totalFound: results.length,
    });
  } catch (error) {
    context.error("Error searching news:", error);
    return Errors.internal("Failed to search news");
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
