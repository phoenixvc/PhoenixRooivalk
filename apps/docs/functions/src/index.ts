/**
 * Firebase Cloud Functions for Phoenix Rooivalk Documentation
 *
 * Data Retention Functions:
 * - cleanupOldAnalytics: Removes analytics data older than retention period
 * - cleanupInactiveSessions: Removes sessions with no activity
 * - aggregateDailyStats: Aggregates and archives old daily stats
 *
 * AI Functions (from ./ai.ts):
 * - analyzeCompetitors: Competitor research and analysis
 * - generateSWOT: SWOT analysis generation
 * - getReadingRecommendations: AI-powered reading suggestions
 * - suggestDocumentImprovements: Document improvement suggestions
 * - getMarketInsights: Market analysis and insights
 * - summarizeContent: Content summarization
 * - reviewDocumentImprovement: Admin review of suggestions
 * - getPendingImprovements: Get pending suggestions (admin)
 *
 * RAG Functions (from ./rag/):
 * - indexAllDocumentation: Index all documentation for RAG
 * - reindexDocument: Reindex a single document
 * - deleteFromIndex: Remove document from index
 * - getIndexStats: Get indexing statistics
 * - searchDocs: Semantic search over documentation
 * - askDocumentation: RAG-powered Q&A with source citations
 * - getSuggestedQuestions: Get contextual question suggestions
 */

// Export AI functions
export {
  analyzeCompetitors,
  generateSWOT,
  getReadingRecommendations,
  suggestDocumentImprovements,
  getMarketInsights,
  summarizeContent,
  reviewDocumentImprovement,
  getPendingImprovements,
} from "./ai";

// Export RAG functions
export {
  indexAllDocumentation,
  reindexDocument,
  deleteFromIndex,
  getIndexStats,
  searchDocs,
  askDocumentation,
  getSuggestedQuestions,
} from "./rag";

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();

// Retention periods (in days)
const RETENTION_CONFIG = {
  pageViews: 90, // Keep page views for 90 days
  timeOnPage: 90, // Keep time on page for 90 days
  conversions: 365, // Keep conversions for 1 year
  sessions: 30, // Keep sessions for 30 days
  dailyStats: 365, // Keep daily stats for 1 year
};

// Batch size for Firestore operations
const BATCH_SIZE = 500;

/**
 * Helper to get date N days ago
 */
function getDateDaysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

/**
 * Delete documents older than specified date from a collection
 */
async function deleteOldDocuments(
  collectionName: string,
  timestampField: string,
  cutoffDate: Date
): Promise<number> {
  let deletedCount = 0;

  const query = db
    .collection(collectionName)
    .where(timestampField, "<", admin.firestore.Timestamp.fromDate(cutoffDate))
    .limit(BATCH_SIZE);

  let snapshot = await query.get();

  while (!snapshot.empty) {
    const batch = db.batch();

    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
      deletedCount++;
    });

    await batch.commit();
    functions.logger.info(
      `Deleted ${snapshot.size} documents from ${collectionName}`
    );

    // Get next batch
    snapshot = await query.get();
  }

  return deletedCount;
}

/**
 * Scheduled function to clean up old analytics data
 * Runs daily at 3:00 AM UTC
 */
export const cleanupOldAnalytics = functions.pubsub
  .schedule("0 3 * * *")
  .timeZone("UTC")
  .onRun(async () => {
    functions.logger.info("Starting analytics data cleanup");

    const results: Record<string, number> = {};

    // Clean up page views
    const pageViewsCutoff = getDateDaysAgo(RETENTION_CONFIG.pageViews);
    results.pageViews = await deleteOldDocuments(
      "analytics_pageviews",
      "timestamp",
      pageViewsCutoff
    );

    // Clean up time on page
    const timeOnPageCutoff = getDateDaysAgo(RETENTION_CONFIG.timeOnPage);
    results.timeOnPage = await deleteOldDocuments(
      "analytics_timeonpage",
      "timestamp",
      timeOnPageCutoff
    );

    // Clean up conversions (longer retention)
    const conversionsCutoff = getDateDaysAgo(RETENTION_CONFIG.conversions);
    results.conversions = await deleteOldDocuments(
      "analytics_conversions",
      "timestamp",
      conversionsCutoff
    );

    functions.logger.info("Analytics cleanup complete", results);
    return null;
  });

/**
 * Scheduled function to clean up inactive sessions
 * Runs daily at 4:00 AM UTC
 */
export const cleanupInactiveSessions = functions.pubsub
  .schedule("0 4 * * *")
  .timeZone("UTC")
  .onRun(async () => {
    functions.logger.info("Starting inactive sessions cleanup");

    const cutoffDate = getDateDaysAgo(RETENTION_CONFIG.sessions);
    const deletedCount = await deleteOldDocuments(
      "analytics_sessions",
      "lastActivity",
      cutoffDate
    );

    functions.logger.info(`Cleaned up ${deletedCount} inactive sessions`);
    return null;
  });

/**
 * Scheduled function to archive old daily stats
 * Runs weekly on Sunday at 5:00 AM UTC
 */
export const archiveDailyStats = functions.pubsub
  .schedule("0 5 * * 0")
  .timeZone("UTC")
  .onRun(async () => {
    functions.logger.info("Starting daily stats archival");

    const cutoffDate = getDateDaysAgo(RETENTION_CONFIG.dailyStats);
    const cutoffDateStr = cutoffDate.toISOString().split("T")[0];

    // Query old daily stats
    const snapshot = await db
      .collection("analytics_daily")
      .where("date", "<", cutoffDateStr)
      .limit(BATCH_SIZE)
      .get();

    if (snapshot.empty) {
      functions.logger.info("No old daily stats to archive");
      return null;
    }

    const batch = db.batch();
    let archivedCount = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();

      // Move to archive collection
      const archiveRef = db.collection("analytics_daily_archive").doc(doc.id);
      batch.set(archiveRef, {
        ...data,
        archivedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Delete from main collection
      batch.delete(doc.ref);
      archivedCount++;
    }

    await batch.commit();
    functions.logger.info(`Archived ${archivedCount} daily stats documents`);

    return null;
  });

/**
 * HTTP function to manually trigger cleanup (admin only)
 * Requires Firebase Auth admin token
 */
export const manualCleanup = functions.https.onCall(async (data, context) => {
  // Check if caller is admin
  if (!context.auth?.token.admin) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only admins can trigger manual cleanup"
    );
  }

  const collection = data.collection as string;
  const days = data.days as number;

  if (!collection || !days || days < 1) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Collection name and days (> 0) required"
    );
  }

  const validCollections = [
    "analytics_pageviews",
    "analytics_timeonpage",
    "analytics_conversions",
    "analytics_sessions",
  ];

  if (!validCollections.includes(collection)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      `Invalid collection. Must be one of: ${validCollections.join(", ")}`
    );
  }

  const cutoffDate = getDateDaysAgo(days);
  const timestampField =
    collection === "analytics_sessions" ? "lastActivity" : "timestamp";

  const deletedCount = await deleteOldDocuments(
    collection,
    timestampField,
    cutoffDate
  );

  functions.logger.info(
    `Manual cleanup: deleted ${deletedCount} from ${collection}`
  );

  return { deleted: deletedCount, collection, cutoffDays: days };
});

/**
 * Firestore trigger to clean up user data on account deletion
 */
export const onUserDeleted = functions.auth.user().onDelete(async (user) => {
  functions.logger.info(`Cleaning up data for deleted user: ${user.uid}`);

  const batch = db.batch();

  // Delete user progress
  const progressRef = db.collection("userProgress").doc(user.uid);
  batch.delete(progressRef);

  // Note: We don't delete analytics data as it's anonymized
  // But we could update it to remove any user-identifiable info

  await batch.commit();
  functions.logger.info(`Cleaned up data for user: ${user.uid}`);
});
