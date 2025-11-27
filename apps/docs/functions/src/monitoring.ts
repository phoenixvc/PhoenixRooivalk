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
 * Stores metrics in Firestore for dashboard visualization
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import type { AIRequestMetrics } from "./ai-provider";

const db = admin.firestore();

// Monitoring configuration
export const MONITORING_CONFIG = {
  collections: {
    metrics: "ai_metrics",
    dailyStats: "ai_daily_stats",
    errors: "ai_errors",
  },
  alertThresholds: {
    latencyMs: 5000, // Alert if latency > 5s
    errorRate: 0.05, // Alert if error rate > 5%
    tokenUsage: 100000, // Alert if daily tokens > 100K
  },
};

/**
 * Log AI request metrics
 */
export async function logMetrics(
  feature: string,
  metrics: AIRequestMetrics,
  userId?: string,
  additionalData?: Record<string, unknown>
): Promise<void> {
  try {
    await db.collection(MONITORING_CONFIG.collections.metrics).add({
      feature,
      userId: userId || "anonymous",
      ...metrics,
      ...additionalData,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update daily stats
    const today = new Date().toISOString().split("T")[0];
    const dailyRef = db
      .collection(MONITORING_CONFIG.collections.dailyStats)
      .doc(`${today}_${feature}`);

    await dailyRef.set(
      {
        date: today,
        feature,
        totalRequests: admin.firestore.FieldValue.increment(1),
        totalTokens: admin.firestore.FieldValue.increment(metrics.totalTokens),
        totalLatencyMs: admin.firestore.FieldValue.increment(metrics.latencyMs),
        cacheHits: admin.firestore.FieldValue.increment(metrics.cached ? 1 : 0),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    functions.logger.warn("Failed to log metrics:", error);
    // Don't throw - monitoring failures shouldn't break the application
  }
}

/**
 * Log AI errors
 */
export async function logError(
  feature: string,
  error: unknown,
  context?: Record<string, unknown>
): Promise<void> {
  try {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    const errorStack =
      error instanceof Error ? error.stack : undefined;

    await db.collection(MONITORING_CONFIG.collections.errors).add({
      feature,
      error: errorMessage,
      stack: errorStack,
      context,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update daily error count
    const today = new Date().toISOString().split("T")[0];
    const dailyRef = db
      .collection(MONITORING_CONFIG.collections.dailyStats)
      .doc(`${today}_${feature}`);

    await dailyRef.set(
      {
        date: today,
        feature,
        totalErrors: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  } catch (logError) {
    functions.logger.error("Failed to log error:", logError);
  }
}

/**
 * Get daily stats summary
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

export async function getDailyStats(
  date: string,
  feature?: string
): Promise<DailyStatsSummary[]> {
  let query = db
    .collection(MONITORING_CONFIG.collections.dailyStats)
    .where("date", "==", date);

  if (feature) {
    query = query.where("feature", "==", feature);
  }

  const snapshot = await query.get();
  const stats: DailyStatsSummary[] = [];

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    const totalRequests = data.totalRequests || 0;

    stats.push({
      date: data.date,
      feature: data.feature,
      totalRequests,
      totalTokens: data.totalTokens || 0,
      totalErrors: data.totalErrors || 0,
      avgLatencyMs:
        totalRequests > 0
          ? Math.round((data.totalLatencyMs || 0) / totalRequests)
          : 0,
      cacheHitRate:
        totalRequests > 0
          ? Math.round(((data.cacheHits || 0) / totalRequests) * 100) / 100
          : 0,
      errorRate:
        totalRequests > 0
          ? Math.round(((data.totalErrors || 0) / totalRequests) * 100) / 100
          : 0,
    });
  });

  return stats;
}

/**
 * Get weekly stats summary
 */
export async function getWeeklyStats(
  feature?: string
): Promise<{
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

  let query: admin.firestore.Query = db
    .collection(MONITORING_CONFIG.collections.dailyStats)
    .where("date", "in", dates);

  if (feature) {
    query = query.where("feature", "==", feature);
  }

  const snapshot = await query.get();

  let totalRequests = 0;
  let totalTokens = 0;
  let totalLatencyMs = 0;
  let totalCacheHits = 0;
  let totalErrors = 0;
  const dailyBreakdown: DailyStatsSummary[] = [];

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    const requests = data.totalRequests || 0;

    totalRequests += requests;
    totalTokens += data.totalTokens || 0;
    totalLatencyMs += data.totalLatencyMs || 0;
    totalCacheHits += data.cacheHits || 0;
    totalErrors += data.totalErrors || 0;

    dailyBreakdown.push({
      date: data.date,
      feature: data.feature,
      totalRequests: requests,
      totalTokens: data.totalTokens || 0,
      totalErrors: data.totalErrors || 0,
      avgLatencyMs:
        requests > 0
          ? Math.round((data.totalLatencyMs || 0) / requests)
          : 0,
      cacheHitRate:
        requests > 0
          ? Math.round(((data.cacheHits || 0) / requests) * 100) / 100
          : 0,
      errorRate:
        requests > 0
          ? Math.round(((data.totalErrors || 0) / requests) * 100) / 100
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
    dailyBreakdown: dailyBreakdown.sort((a, b) =>
      a.date.localeCompare(b.date)
    ),
  };
}

/**
 * Check for alert conditions
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

  const avgLatency =
    totalRequests > 0 ? totalLatencyMs / totalRequests : 0;
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
 * Cloud function to get AI monitoring stats (admin only)
 */
export const getAIMonitoringStats = functions.https.onCall(
  async (data, context) => {
    if (!context.auth?.token.admin) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Admin access required"
      );
    }

    const period = data.period || "weekly";
    const feature = data.feature;

    if (period === "daily") {
      const date = data.date || new Date().toISOString().split("T")[0];
      const stats = await getDailyStats(date, feature);
      const alerts = await checkAlerts(date);
      return { stats, alerts };
    }

    const stats = await getWeeklyStats(feature);
    const today = new Date().toISOString().split("T")[0];
    const alerts = await checkAlerts(today);

    return { stats, alerts };
  }
);

/**
 * Cloud function to get recent errors (admin only)
 */
export const getAIErrors = functions.https.onCall(async (data, context) => {
  if (!context.auth?.token.admin) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Admin access required"
    );
  }

  const limit = data.limit || 50;
  const feature = data.feature;

  let query: admin.firestore.Query = db
    .collection(MONITORING_CONFIG.collections.errors)
    .orderBy("timestamp", "desc")
    .limit(limit);

  if (feature) {
    query = query.where("feature", "==", feature);
  }

  const snapshot = await query.get();
  const errors = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return { errors };
});

/**
 * Scheduled function to check alerts and notify
 * Runs every hour
 */
export const checkAIAlerts = functions.pubsub
  .schedule("0 * * * *")
  .timeZone("UTC")
  .onRun(async () => {
    const today = new Date().toISOString().split("T")[0];
    const alertStatus = await checkAlerts(today);

    if (alertStatus.hasAlerts) {
      functions.logger.warn("AI Monitoring Alerts:", alertStatus.alerts);

      // Store alert for dashboard
      await db.collection("ai_alerts").add({
        date: today,
        alerts: alertStatus.alerts,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return null;
  });
