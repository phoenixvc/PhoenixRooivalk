/**
 * News Analytics Cloud Functions
 *
 * Provides analytics data for news engagement tracking.
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

const COLLECTIONS = {
  NEWS: "news_articles",
  NEWS_ANALYTICS: "news_analytics",
  USER_NEWS_PREFS: "user_news_preferences",
};

/**
 * Get news engagement analytics (admin only)
 */
export const getNewsAnalytics = functions.https.onCall(
  async (
    data: {
      dateRange?: "7d" | "30d" | "90d";
    },
    context,
  ) => {
    // Check admin status
    if (!context.auth?.token.admin) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only admins can access analytics",
      );
    }

    const { dateRange = "7d" } = data;

    // Calculate date range
    const daysMap = { "7d": 7, "30d": 30, "90d": 90 };
    const days = daysMap[dateRange] || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    try {
      // Get analytics events within date range
      const analyticsSnapshot = await db
        .collection(COLLECTIONS.NEWS_ANALYTICS)
        .where("timestamp", ">=", admin.firestore.Timestamp.fromDate(startDate))
        .get();

      const events = analyticsSnapshot.docs.map((doc) => doc.data());

      // Calculate metrics
      const viewEvents = events.filter((e) => e.action === "view");
      const saveEvents = events.filter((e) => e.action === "save");
      const uniqueUsers = new Set(events.map((e) => e.userId)).size;

      // Group views by article
      const articleViews: Record<string, number> = {};
      const articleSaves: Record<string, number> = {};
      const categoryViews: Record<string, { views: number; saves: number }> = {};

      for (const event of events) {
        const articleId = event.articleId;
        if (event.action === "view") {
          articleViews[articleId] = (articleViews[articleId] || 0) + 1;
        } else if (event.action === "save") {
          articleSaves[articleId] = (articleSaves[articleId] || 0) + 1;
        }
      }

      // Get article details for top articles
      const topArticleIds = Object.entries(articleViews)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([id]) => id);

      const topArticles: Array<{
        id: string;
        title: string;
        views: number;
        saves: number;
      }> = [];

      for (const articleId of topArticleIds) {
        const articleDoc = await db
          .collection(COLLECTIONS.NEWS)
          .doc(articleId)
          .get();

        if (articleDoc.exists) {
          const articleData = articleDoc.data()!;
          topArticles.push({
            id: articleId,
            title: articleData.title,
            views: articleViews[articleId] || 0,
            saves: articleSaves[articleId] || 0,
          });

          // Aggregate by category
          const category = articleData.category || "uncategorized";
          if (!categoryViews[category]) {
            categoryViews[category] = { views: 0, saves: 0 };
          }
          categoryViews[category].views += articleViews[articleId] || 0;
          categoryViews[category].saves += articleSaves[articleId] || 0;
        }
      }

      // Calculate daily views
      const dailyViews: Record<string, number> = {};
      for (const event of viewEvents) {
        const date = event.timestamp.toDate().toISOString().split("T")[0];
        dailyViews[date] = (dailyViews[date] || 0) + 1;
      }

      // Fill in missing days with zeros
      const dailyViewsArray: Array<{ date: string; views: number }> = [];
      const currentDate = new Date(startDate);
      const endDate = new Date();

      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split("T")[0];
        dailyViewsArray.push({
          date: dateStr,
          views: dailyViews[dateStr] || 0,
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Calculate average read time (placeholder - would need actual timing data)
      const avgReadTime = 45; // seconds

      return {
        totalViews: viewEvents.length,
        totalSaves: saveEvents.length,
        uniqueReaders: uniqueUsers,
        avgReadTime,
        topArticles,
        engagementByCategory: categoryViews,
        dailyViews: dailyViewsArray,
      };
    } catch (error) {
      functions.logger.error("Error getting news analytics:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to get analytics",
      );
    }
  },
);

/**
 * Get news ingestion statistics (admin only)
 */
export const getNewsIngestionStats = functions.https.onCall(
  async (_data: Record<string, never>, context) => {
    // Check admin status
    if (!context.auth?.token.admin) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only admins can access ingestion stats",
      );
    }

    try {
      // Get total article count
      const totalSnapshot = await db.collection(COLLECTIONS.NEWS).count().get();
      const totalArticles = totalSnapshot.data().count;

      // Get articles by category
      const articlesSnapshot = await db.collection(COLLECTIONS.NEWS).get();
      const articlesByCategory: Record<string, number> = {};

      let lastIngestionTime: Date | null = null;

      for (const doc of articlesSnapshot.docs) {
        const data = doc.data();
        const category = data.category || "uncategorized";
        articlesByCategory[category] = (articlesByCategory[category] || 0) + 1;

        // Track latest ingestion time
        if (data.createdAt) {
          const createdAt = data.createdAt.toDate();
          if (!lastIngestionTime || createdAt > lastIngestionTime) {
            lastIngestionTime = createdAt;
          }
        }
      }

      // Count articles from last 24 hours
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const last24hSnapshot = await db
        .collection(COLLECTIONS.NEWS)
        .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(yesterday))
        .count()
        .get();
      const articlesLast24h = last24hSnapshot.data().count;

      // Count articles from last 7 days
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      const last7dSnapshot = await db
        .collection(COLLECTIONS.NEWS)
        .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(lastWeek))
        .count()
        .get();
      const articlesLast7d = last7dSnapshot.data().count;

      return {
        totalArticles,
        lastIngestionTime: lastIngestionTime?.toISOString() || null,
        articlesByCategory,
        articlesLast24h,
        articlesLast7d,
      };
    } catch (error) {
      functions.logger.error("Error getting ingestion stats:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to get ingestion stats",
      );
    }
  },
);
