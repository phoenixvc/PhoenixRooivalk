/**
 * Monitoring Functions for Azure
 *
 * Provides monitoring statistics and cache management endpoints.
 * Ported from Firebase Cloud Functions to Azure Functions.
 */

import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { validateAuthHeader } from "../lib/auth";
import {
  getDailyStats,
  getWeeklyStats,
  checkAlerts,
  getRecentErrors,
} from "../lib/monitoring";
import { getCacheStats, clearCache, cleanupExpiredCache } from "../lib/cache";

/**
 * Get AI monitoring stats handler (admin only)
 */
async function getAIMonitoringStatsHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const authResult = await validateAuthHeader(
    request.headers.get("authorization"),
  );

  if (!authResult.valid || !authResult.isAdmin) {
    return {
      status: 403,
      jsonBody: { error: "Admin access required", code: "permission-denied" },
    };
  }

  try {
    const {
      period = "weekly",
      feature,
      date,
    } = Object.fromEntries(request.query.entries());

    if (period === "daily") {
      const targetDate = date || new Date().toISOString().split("T")[0];
      const stats = await getDailyStats(targetDate, feature);
      const alerts = await checkAlerts(targetDate);
      return { status: 200, jsonBody: { stats, alerts } };
    }

    const stats = await getWeeklyStats(feature);
    const today = new Date().toISOString().split("T")[0];
    const alerts = await checkAlerts(today);

    return { status: 200, jsonBody: { stats, alerts } };
  } catch (error) {
    context.error("Error getting monitoring stats:", error);
    return {
      status: 500,
      jsonBody: { error: "Failed to get monitoring stats", code: "internal" },
    };
  }
}

/**
 * Get AI errors handler (admin only)
 */
async function getAIErrorsHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const authResult = await validateAuthHeader(
    request.headers.get("authorization"),
  );

  if (!authResult.valid || !authResult.isAdmin) {
    return {
      status: 403,
      jsonBody: { error: "Admin access required", code: "permission-denied" },
    };
  }

  try {
    const { limit = "50", feature } = Object.fromEntries(
      request.query.entries(),
    );

    const errors = await getRecentErrors(parseInt(limit, 10), feature);

    return { status: 200, jsonBody: { errors } };
  } catch (error) {
    context.error("Error getting AI errors:", error);
    return {
      status: 500,
      jsonBody: { error: "Failed to get AI errors", code: "internal" },
    };
  }
}

/**
 * Get cache stats handler (admin only)
 */
async function getCacheStatsHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const authResult = await validateAuthHeader(
    request.headers.get("authorization"),
  );

  if (!authResult.valid || !authResult.isAdmin) {
    return {
      status: 403,
      jsonBody: { error: "Admin access required", code: "permission-denied" },
    };
  }

  try {
    const stats = await getCacheStats();
    return { status: 200, jsonBody: stats };
  } catch (error) {
    context.error("Error getting cache stats:", error);
    return {
      status: 500,
      jsonBody: { error: "Failed to get cache stats", code: "internal" },
    };
  }
}

/**
 * Clear cache handler (admin only)
 */
async function clearCacheHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const authResult = await validateAuthHeader(
    request.headers.get("authorization"),
  );

  if (!authResult.valid || !authResult.isAdmin) {
    return {
      status: 403,
      jsonBody: { error: "Admin access required", code: "permission-denied" },
    };
  }

  try {
    const { collection } = (await request.json()) as {
      collection: "embeddings" | "queries" | "suggestions";
    };

    if (
      !collection ||
      !["embeddings", "queries", "suggestions"].includes(collection)
    ) {
      return {
        status: 400,
        jsonBody: {
          error:
            "Valid collection required: embeddings, queries, or suggestions",
          code: "invalid-argument",
        },
      };
    }

    const deleted = await clearCache(collection);

    return { status: 200, jsonBody: { deleted, collection } };
  } catch (error) {
    context.error("Error clearing cache:", error);
    return {
      status: 500,
      jsonBody: { error: "Failed to clear cache", code: "internal" },
    };
  }
}

/**
 * Cleanup expired cache (timer-triggered or manual)
 */
async function cleanupCacheHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const authResult = await validateAuthHeader(
    request.headers.get("authorization"),
  );

  if (!authResult.valid || !authResult.isAdmin) {
    return {
      status: 403,
      jsonBody: { error: "Admin access required", code: "permission-denied" },
    };
  }

  try {
    const deleted = await cleanupExpiredCache();
    return {
      status: 200,
      jsonBody: {
        deleted,
        message: `Cleaned up ${deleted} expired cache entries`,
      },
    };
  } catch (error) {
    context.error("Error cleaning up cache:", error);
    return {
      status: 500,
      jsonBody: { error: "Failed to cleanup cache", code: "internal" },
    };
  }
}

// Register endpoints
app.http("getAIMonitoringStats", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "admin/monitoring/stats",
  handler: getAIMonitoringStatsHandler,
});

app.http("getAIErrors", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "admin/monitoring/errors",
  handler: getAIErrorsHandler,
});

app.http("getCacheStats", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "admin/cache/stats",
  handler: getCacheStatsHandler,
});

app.http("clearCache", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "admin/cache/clear",
  handler: clearCacheHandler,
});

app.http("cleanupCache", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "admin/cache/cleanup",
  handler: cleanupCacheHandler,
});
