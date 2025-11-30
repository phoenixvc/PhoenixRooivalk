/**
 * AI Monitoring for Phoenix Rooivalk Documentation
 *
 * Tracks:
 * - Query latency
 * - Token usage
 * - Error rates
 * - Cache hit rates
 * - Provider performance
 *
 * Uses Cosmos DB for metric storage
 */

import { getContainer, queryDocuments, upsertDocument } from "./cosmos";

// Monitoring configuration
export const MONITORING_CONFIG = {
  containers: {
    metrics: "ai_metrics",
    dailyStats: "ai_daily_stats",
    errors: "ai_errors",
    alerts: "ai_alerts",
  },
  alertThresholds: {
    latencyMs: 5000, // Alert if latency > 5s
    errorRate: 0.05, // Alert if error rate > 5%
    tokenUsage: 100000, // Alert if daily tokens > 100K
  },
};

/**
 * AI request metrics interface
 */
export interface AIRequestMetrics {
  totalTokens: number;
  latencyMs: number;
  cached?: boolean;
  model?: string;
  provider?: string;
}

/**
 * Log AI request metrics
 */
export async function logMetrics(
  feature: string,
  metrics: Partial<AIRequestMetrics> | Record<string, unknown>,
  userId?: string,
  additionalData?: Record<string, unknown>,
): Promise<void> {
  try {
    const now = new Date();
    const id = `${feature}_${now.getTime()}_${Math.random().toString(36).slice(2, 8)}`;

    await upsertDocument(MONITORING_CONFIG.containers.metrics, {
      id,
      feature,
      userId: userId || "anonymous",
      ...metrics,
      ...additionalData,
      timestamp: now.toISOString(),
    });

    // Update daily stats (only if relevant fields are present)
    const today = now.toISOString().split("T")[0];
    const dailyId = `${today}_${feature}`;

    const totalTokens = (metrics as Record<string, unknown>).totalTokens;
    const latencyMs = (metrics as Record<string, unknown>).latencyMs;
    const cached = (metrics as Record<string, unknown>).cached;

    // Get existing daily stats
    const container = getContainer(MONITORING_CONFIG.containers.dailyStats);
    let existingStats: Record<string, unknown> = {};

    try {
      const { resource } = await container.item(dailyId, dailyId).read();
      if (resource) {
        existingStats = resource;
      }
    } catch (error) {
      // Expected for first request of the day - no existing stats
      if ((error as { code?: number })?.code !== 404) {
        console.warn("Failed to read existing daily stats:", error);
      }
    }

    await upsertDocument(MONITORING_CONFIG.containers.dailyStats, {
      id: dailyId,
      date: today,
      feature,
      totalRequests: ((existingStats.totalRequests as number) || 0) + 1,
      totalTokens:
        ((existingStats.totalTokens as number) || 0) +
        (typeof totalTokens === "number" ? totalTokens : 0),
      totalLatencyMs:
        ((existingStats.totalLatencyMs as number) || 0) +
        (typeof latencyMs === "number" ? latencyMs : 0),
      cacheHits:
        ((existingStats.cacheHits as number) || 0) + (cached ? 1 : 0),
      totalErrors: (existingStats.totalErrors as number) || 0,
      updatedAt: now.toISOString(),
    });
  } catch (error) {
    console.warn("Failed to log metrics:", error);
    // Don't throw - monitoring failures shouldn't break the application
  }
}

/**
 * Log AI errors
 */
export async function logError(
  feature: string,
  error: unknown,
  context?: Record<string, unknown>,
): Promise<void> {
  try {
    const now = new Date();
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    const id = `${feature}_error_${now.getTime()}_${Math.random().toString(36).slice(2, 8)}`;

    await upsertDocument(MONITORING_CONFIG.containers.errors, {
      id,
      feature,
      error: errorMessage,
      stack: errorStack,
      context,
      timestamp: now.toISOString(),
    });

    // Update daily error count
    const today = now.toISOString().split("T")[0];
    const dailyId = `${today}_${feature}`;

    const container = getContainer(MONITORING_CONFIG.containers.dailyStats);
    let existingStats: Record<string, unknown> = {};

    try {
      const { resource } = await container.item(dailyId, dailyId).read();
      if (resource) {
        existingStats = resource;
      }
    } catch (error) {
      // Expected for first error of the day - no existing stats
      if ((error as { code?: number })?.code !== 404) {
        console.warn("Failed to read existing daily stats for error logging:", error);
      }
    }

    await upsertDocument(MONITORING_CONFIG.containers.dailyStats, {
      id: dailyId,
      date: today,
      feature,
      totalRequests: (existingStats.totalRequests as number) || 0,
      totalTokens: (existingStats.totalTokens as number) || 0,
      totalLatencyMs: (existingStats.totalLatencyMs as number) || 0,
      cacheHits: (existingStats.cacheHits as number) || 0,
      totalErrors: ((existingStats.totalErrors as number) || 0) + 1,
      updatedAt: now.toISOString(),
    });
  } catch (logError) {
    console.error("Failed to log error:", logError);
  }
}

/**
 * Daily stats summary interface
 */
export interface DailyStatsSummary {
  date: string;
  feature: string;
  totalRequests: number;
  totalTokens: number;
  totalErrors: number;
  avgLatencyMs: number;
  cacheHitRate: number;
  errorRate: number;
}

/**
 * Get daily stats summary
 */
export async function getDailyStats(
  date: string,
  feature?: string,
): Promise<DailyStatsSummary[]> {
  let query = "SELECT * FROM c WHERE c.date = @date";
  const parameters = [{ name: "@date", value: date }];

  if (feature) {
    query += " AND c.feature = @feature";
    parameters.push({ name: "@feature", value: feature });
  }

  const items = await queryDocuments<Record<string, unknown>>(
    MONITORING_CONFIG.containers.dailyStats,
    query,
    parameters,
  );

  return items.map((data) => {
    const totalRequests = (data.totalRequests as number) || 0;
    return {
      date: data.date as string,
      feature: data.feature as string,
      totalRequests,
      totalTokens: (data.totalTokens as number) || 0,
      totalErrors: (data.totalErrors as number) || 0,
      avgLatencyMs:
        totalRequests > 0
          ? Math.round(
              ((data.totalLatencyMs as number) || 0) / totalRequests,
            )
          : 0,
      cacheHitRate:
        totalRequests > 0
          ? Math.round((((data.cacheHits as number) || 0) / totalRequests) * 100) /
            100
          : 0,
      errorRate:
        totalRequests > 0
          ? Math.round(
              (((data.totalErrors as number) || 0) / totalRequests) * 100,
            ) / 100
          : 0,
    };
  });
}

/**
 * Get weekly stats summary
 */
export async function getWeeklyStats(feature?: string): Promise<{
  totalRequests: number;
  totalTokens: number;
  avgLatencyMs: number;
  cacheHitRate: number;
  errorRate: number;
  dailyBreakdown: DailyStatsSummary[];
}> {
  const now = new Date();
  const dates: string[] = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split("T")[0]);
  }

  // Build query with date list
  let query = `SELECT * FROM c WHERE c.date IN (${dates.map((_, i) => `@date${i}`).join(", ")})`;
  const parameters = dates.map((d, i) => ({ name: `@date${i}`, value: d }));

  if (feature) {
    query += " AND c.feature = @feature";
    parameters.push({ name: "@feature", value: feature });
  }

  const items = await queryDocuments<Record<string, unknown>>(
    MONITORING_CONFIG.containers.dailyStats,
    query,
    parameters,
  );

  let totalRequests = 0;
  let totalTokens = 0;
  let totalLatencyMs = 0;
  let totalCacheHits = 0;
  let totalErrors = 0;
  const dailyBreakdown: DailyStatsSummary[] = [];

  items.forEach((data) => {
    const requests = (data.totalRequests as number) || 0;

    totalRequests += requests;
    totalTokens += (data.totalTokens as number) || 0;
    totalLatencyMs += (data.totalLatencyMs as number) || 0;
    totalCacheHits += (data.cacheHits as number) || 0;
    totalErrors += (data.totalErrors as number) || 0;

    dailyBreakdown.push({
      date: data.date as string,
      feature: data.feature as string,
      totalRequests: requests,
      totalTokens: (data.totalTokens as number) || 0,
      totalErrors: (data.totalErrors as number) || 0,
      avgLatencyMs:
        requests > 0
          ? Math.round(((data.totalLatencyMs as number) || 0) / requests)
          : 0,
      cacheHitRate:
        requests > 0
          ? Math.round((((data.cacheHits as number) || 0) / requests) * 100) /
            100
          : 0,
      errorRate:
        requests > 0
          ? Math.round((((data.totalErrors as number) || 0) / requests) * 100) /
            100
          : 0,
    });
  });

  return {
    totalRequests,
    totalTokens,
    avgLatencyMs:
      totalRequests > 0 ? Math.round(totalLatencyMs / totalRequests) : 0,
    cacheHitRate:
      totalRequests > 0
        ? Math.round((totalCacheHits / totalRequests) * 100) / 100
        : 0,
    errorRate:
      totalRequests > 0
        ? Math.round((totalErrors / totalRequests) * 100) / 100
        : 0,
    dailyBreakdown: dailyBreakdown.sort((a, b) => a.date.localeCompare(b.date)),
  };
}

/**
 * Alert status interface
 */
export interface AlertStatus {
  hasAlerts: boolean;
  alerts: Array<{
    type: "latency" | "errorRate" | "tokenUsage";
    message: string;
    value: number;
    threshold: number;
  }>;
}

/**
 * Check for alert conditions
 */
export async function checkAlerts(date: string): Promise<AlertStatus> {
  const stats = await getDailyStats(date);
  const alerts: AlertStatus["alerts"] = [];

  // Aggregate all features
  let totalRequests = 0;
  let totalLatencyMs = 0;
  let totalErrors = 0;
  let totalTokens = 0;

  stats.forEach((s) => {
    totalRequests += s.totalRequests;
    totalLatencyMs += s.avgLatencyMs * s.totalRequests;
    totalErrors += s.totalErrors;
    totalTokens += s.totalTokens;
  });

  const avgLatency = totalRequests > 0 ? totalLatencyMs / totalRequests : 0;
  const errorRate = totalRequests > 0 ? totalErrors / totalRequests : 0;

  // Check latency
  if (avgLatency > MONITORING_CONFIG.alertThresholds.latencyMs) {
    alerts.push({
      type: "latency",
      message: `Average latency (${Math.round(avgLatency)}ms) exceeds threshold`,
      value: avgLatency,
      threshold: MONITORING_CONFIG.alertThresholds.latencyMs,
    });
  }

  // Check error rate
  if (errorRate > MONITORING_CONFIG.alertThresholds.errorRate) {
    alerts.push({
      type: "errorRate",
      message: `Error rate (${(errorRate * 100).toFixed(1)}%) exceeds threshold`,
      value: errorRate,
      threshold: MONITORING_CONFIG.alertThresholds.errorRate,
    });
  }

  // Check token usage
  if (totalTokens > MONITORING_CONFIG.alertThresholds.tokenUsage) {
    alerts.push({
      type: "tokenUsage",
      message: `Token usage (${totalTokens}) exceeds daily limit`,
      value: totalTokens,
      threshold: MONITORING_CONFIG.alertThresholds.tokenUsage,
    });
  }

  return {
    hasAlerts: alerts.length > 0,
    alerts,
  };
}

/**
 * Check and store alerts (can be called from timer trigger)
 */
export async function checkAndStoreAlerts(): Promise<AlertStatus> {
  const today = new Date().toISOString().split("T")[0];
  const alertStatus = await checkAlerts(today);

  if (alertStatus.hasAlerts) {
    console.warn("AI Monitoring Alerts:", alertStatus.alerts);

    const id = `alert_${today}_${Date.now()}`;
    await upsertDocument(MONITORING_CONFIG.containers.alerts, {
      id,
      date: today,
      alerts: alertStatus.alerts,
      timestamp: new Date().toISOString(),
    });
  }

  return alertStatus;
}

/**
 * Get recent errors
 */
export async function getRecentErrors(
  limit: number = 50,
  feature?: string,
): Promise<Array<{ id: string; [key: string]: unknown }>> {
  let query = "SELECT * FROM c ORDER BY c.timestamp DESC";
  const parameters: Array<{ name: string; value: string | number }> = [];

  if (feature) {
    query = "SELECT * FROM c WHERE c.feature = @feature ORDER BY c.timestamp DESC";
    parameters.push({ name: "@feature", value: feature });
  }

  // Add OFFSET 0 LIMIT
  query += ` OFFSET 0 LIMIT ${limit}`;

  return queryDocuments<{ id: string; [key: string]: unknown }>(
    MONITORING_CONFIG.containers.errors,
    query,
    parameters,
  );
}
