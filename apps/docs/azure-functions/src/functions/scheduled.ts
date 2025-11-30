/**
 * Scheduled Timer Trigger Functions
 *
 * Azure Functions Timer Triggers for scheduled background jobs.
 * Replaces Firebase scheduled functions.
 */

import { app, InvocationContext, Timer } from "@azure/functions";
import { newsIngestionService } from "../services/news-ingestion.service";
import { notificationsService } from "../services/notifications.service";
import { newsAnalyticsService } from "../services/news-analytics.service";
import { cleanupExpiredCache } from "../lib/cache";
import { checkAndStoreAlerts } from "../lib/monitoring";
import { createLogger, Logger } from "../lib/logger";

// Module-level logger
const logger: Logger = createLogger({ feature: "scheduled-jobs" });

/**
 * Fetch news from external APIs
 * Runs every 6 hours
 * Cron: 0 0 *\/6 * * *
 */
async function fetchNewsJob(timer: Timer, context: InvocationContext): Promise<void> {
  const jobLogger = logger.child({ operation: "fetchNewsJob" });

  jobLogger.info("Starting scheduled news fetch", { scheduledTime: timer.scheduledTime?.toISOString() });

  try {
    // Fetch from NewsAPI
    const newsApiResult = await newsIngestionService.fetchFromNewsAPI({
      query: "counter-drone OR anti-drone OR UAS defense",
      pageSize: 20,
    });

    // Fetch from Bing News
    const bingResult = await newsIngestionService.fetchFromBingNews({
      query: "drone defense technology",
      count: 20,
    });

    jobLogger.info("News fetch completed", {
      newsApiArticles: newsApiResult.length,
      bingArticles: bingResult.length,
    });
  } catch (error) {
    jobLogger.error("News fetch failed", error, {});
  }
}

app.timer("fetchNewsScheduled", {
  // Run every 6 hours at minute 0
  schedule: "0 0 */6 * * *",
  handler: fetchNewsJob,
});

/**
 * Process email notification queue
 * Runs every 5 minutes
 * Cron: 0 *\/5 * * * *
 */
async function processEmailQueueJob(timer: Timer, context: InvocationContext): Promise<void> {
  const jobLogger = logger.child({ operation: "processEmailQueueJob" });

  jobLogger.info("Processing email queue", { scheduledTime: timer.scheduledTime?.toISOString() });

  try {
    // TODO: Pass actual email sending function when SendGrid is configured
    const result = await notificationsService.processEmailQueue();

    jobLogger.info("Email queue processed", {
      processed: result.processed,
      failed: result.failed,
    });
  } catch (error) {
    jobLogger.error("Email queue processing failed", error, {});
  }
}

app.timer("processEmailQueueScheduled", {
  // Run every 5 minutes
  schedule: "0 */5 * * * *",
  handler: processEmailQueueJob,
});

/**
 * Send daily news digest
 * Runs daily at 8 AM UTC
 * Cron: 0 0 8 * * *
 */
async function sendDailyDigestJob(timer: Timer, context: InvocationContext): Promise<void> {
  const jobLogger = logger.child({ operation: "sendDailyDigestJob" });

  jobLogger.info("Sending daily digest", { scheduledTime: timer.scheduledTime?.toISOString() });

  try {
    const result = await notificationsService.sendDigest("daily");

    jobLogger.info("Daily digest sent", {
      emailsQueued: result.emailsQueued,
    });
  } catch (error) {
    jobLogger.error("Daily digest failed", error, {});
  }
}

app.timer("sendDailyDigestScheduled", {
  // Run daily at 8 AM UTC
  schedule: "0 0 8 * * *",
  handler: sendDailyDigestJob,
});

/**
 * Send weekly news digest
 * Runs every Monday at 8 AM UTC
 * Cron: 0 0 8 * * 1
 */
async function sendWeeklyDigestJob(timer: Timer, context: InvocationContext): Promise<void> {
  const jobLogger = logger.child({ operation: "sendWeeklyDigestJob" });

  jobLogger.info("Sending weekly digest", { scheduledTime: timer.scheduledTime?.toISOString() });

  try {
    const result = await notificationsService.sendDigest("weekly");

    jobLogger.info("Weekly digest sent", {
      emailsQueued: result.emailsQueued,
    });
  } catch (error) {
    jobLogger.error("Weekly digest failed", error, {});
  }
}

app.timer("sendWeeklyDigestScheduled", {
  // Run every Monday at 8 AM UTC
  schedule: "0 0 8 * * 1",
  handler: sendWeeklyDigestJob,
});

/**
 * Cleanup expired cache entries
 * Runs every hour
 * Cron: 0 0 * * * *
 */
async function cacheCleanupJob(timer: Timer, context: InvocationContext): Promise<void> {
  const jobLogger = logger.child({ operation: "cacheCleanupJob" });

  jobLogger.info("Starting cache cleanup", { scheduledTime: timer.scheduledTime?.toISOString() });

  try {
    const deleted = await cleanupExpiredCache();

    jobLogger.info("Cache cleanup completed", {
      deletedEntries: deleted,
    });
  } catch (error) {
    jobLogger.error("Cache cleanup failed", error, {});
  }
}

app.timer("cacheCleanupScheduled", {
  // Run every hour at minute 0
  schedule: "0 0 * * * *",
  handler: cacheCleanupJob,
});

/**
 * Check monitoring alerts
 * Runs every 15 minutes
 * Cron: 0 *\/15 * * * *
 */
async function monitoringAlertsJob(timer: Timer, context: InvocationContext): Promise<void> {
  const jobLogger = logger.child({ operation: "monitoringAlertsJob" });

  jobLogger.info("Checking monitoring alerts", { scheduledTime: timer.scheduledTime?.toISOString() });

  try {
    const alertStatus = await checkAndStoreAlerts();

    if (alertStatus.hasAlerts) {
      jobLogger.warn("Alerts detected", {
        alertCount: alertStatus.alerts.length,
        alerts: alertStatus.alerts.map((a) => a.type),
      });
    } else {
      jobLogger.info("No alerts detected");
    }
  } catch (error) {
    jobLogger.error("Alert check failed", error, {});
  }
}

app.timer("monitoringAlertsScheduled", {
  // Run every 15 minutes
  schedule: "0 */15 * * * *",
  handler: monitoringAlertsJob,
});

/**
 * Generate AI news digest
 * Runs twice daily at 6 AM and 6 PM UTC
 * Cron: 0 0 6,18 * * *
 */
async function aiNewsDigestJob(timer: Timer, context: InvocationContext): Promise<void> {
  const jobLogger = logger.child({ operation: "aiNewsDigestJob" });

  jobLogger.info("Generating AI news digest", { scheduledTime: timer.scheduledTime?.toISOString() });

  try {
    const result = await newsAnalyticsService.generateAIDigest();

    jobLogger.info("AI news digest generated", {
      articleCount: result.articleCount,
      digestLength: result.digest?.length || 0,
    });
  } catch (error) {
    jobLogger.error("AI news digest generation failed", error, {});
  }
}

app.timer("aiNewsDigestScheduled", {
  // Run twice daily at 6 AM and 6 PM UTC
  schedule: "0 0 6,18 * * *",
  handler: aiNewsDigestJob,
});
