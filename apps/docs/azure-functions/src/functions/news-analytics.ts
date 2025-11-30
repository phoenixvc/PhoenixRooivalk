/**
 * News Analytics HTTP Endpoints
 *
 * Analytics, ingestion, and digest endpoints for news.
 */

import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { validateAuthHeader, requireAuth } from "../lib/auth";
import { Errors, successResponse } from "../lib/utils";
import { newsAnalyticsService } from "../services";

/**
 * Get news analytics handler (admin only)
 */
async function getNewsAnalyticsHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const authResult = await validateAuthHeader(
    request.headers.get("authorization"),
  );

  if (!authResult.valid || !authResult.isAdmin) {
    return Errors.forbidden();
  }

  try {
    const { dateRange } = Object.fromEntries(request.query.entries()) as {
      dateRange?: "7d" | "30d" | "90d";
    };

    const analytics = await newsAnalyticsService.getAnalytics(dateRange);

    return successResponse(analytics);
  } catch (error) {
    context.error("Error getting news analytics:", error);
    return Errors.internal("Failed to get analytics");
  }
}

/**
 * Get news ingestion stats handler (admin only)
 */
async function getNewsIngestionStatsHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const authResult = await validateAuthHeader(
    request.headers.get("authorization"),
  );

  if (!authResult.valid || !authResult.isAdmin) {
    return Errors.forbidden();
  }

  try {
    const stats = await newsAnalyticsService.getIngestionStats();
    return successResponse(stats);
  } catch (error) {
    context.error("Error getting ingestion stats:", error);
    return Errors.internal("Failed to get ingestion stats");
  }
}

/**
 * Import news articles handler (admin only)
 */
async function importNewsArticlesHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const authResult = await validateAuthHeader(
    request.headers.get("authorization"),
  );

  if (!authResult.valid || !authResult.isAdmin) {
    return Errors.forbidden();
  }

  try {
    const { articles } = (await request.json()) as {
      articles: Array<{
        title: string;
        content: string;
        source: string;
        sourceUrl?: string;
        publishedAt?: string;
      }>;
    };

    if (!articles || !Array.isArray(articles)) {
      return Errors.badRequest("articles array is required");
    }

    const result = await newsAnalyticsService.importArticles(articles);

    return successResponse({
      success: true,
      ...result,
    });
  } catch (error) {
    context.error("Error importing articles:", error);
    return Errors.internal("Failed to import articles");
  }
}

/**
 * Generate AI news digest handler
 */
async function generateNewsDigestHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const auth = requireAuth(request);
  if (!auth.authenticated) {
    return Errors.unauthenticated();
  }

  try {
    const { topics, userRoles } = (await request.json()) as {
      topics?: string[];
      userRoles?: string[];
    };

    const digest = await newsAnalyticsService.generateNewsDigest(
      topics,
      userRoles,
    );

    return successResponse(digest);
  } catch (error) {
    context.error("Error generating news digest:", error);
    return Errors.internal("Failed to generate news digest");
  }
}

// Register endpoints
app.http("getNewsAnalytics", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "news/analytics",
  handler: getNewsAnalyticsHandler,
});

app.http("getNewsIngestionStats", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "news/ingestion/stats",
  handler: getNewsIngestionStatsHandler,
});

app.http("importNewsArticles", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "news/import",
  handler: importNewsArticlesHandler,
});

app.http("generateNewsDigest", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "news/digest",
  handler: generateNewsDigestHandler,
});
