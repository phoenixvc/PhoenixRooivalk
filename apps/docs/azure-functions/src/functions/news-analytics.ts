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
import { validateAuthHeader, requireAuthAsync } from "../lib/auth";
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
    return Errors.forbidden("Admin access required", request);
  }

  try {
    const { dateRange } = Object.fromEntries(request.query.entries()) as {
      dateRange?: "7d" | "30d" | "90d";
    };

    const analytics = await newsAnalyticsService.getAnalytics(dateRange);

    return successResponse(analytics, 200, request);
  } catch (error) {
    context.error("Error getting news analytics:", error);
    return Errors.internal("Failed to get analytics", request);
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
    return Errors.forbidden("Admin access required", request);
  }

  try {
    const stats = await newsAnalyticsService.getIngestionStats();
    return successResponse(stats, 200, request);
  } catch (error) {
    context.error("Error getting ingestion stats:", error);
    return Errors.internal("Failed to get ingestion stats", request);
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
    return Errors.forbidden("Admin access required", request);
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
      return Errors.badRequest("articles array is required", request);
    }

    const result = await newsAnalyticsService.importArticles(articles);

    return successResponse({
      success: true,
      ...result,
    }, 200, request);
  } catch (error) {
    context.error("Error importing articles:", error);
    return Errors.internal("Failed to import articles", request);
  }
}

/**
 * Generate AI news digest handler
 */
async function generateNewsDigestHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const auth = await requireAuthAsync(request);
  if (!auth.authenticated) {
    return auth.error!;
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

    return successResponse(digest, 200, request);
  } catch (error) {
    context.error("Error generating news digest:", error);
    return Errors.internal("Failed to generate news digest", request);
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
