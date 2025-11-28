/**
 * News Notification Cloud Functions
 *
 * Handles breaking news notifications via push and email.
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * Base URL for article links in notifications.
 * Configurable via Firebase Functions config or environment variable.
 * Falls back to production URL if not configured.
 */
const BASE_URL = (
  functions.config().app?.base_url ||
  process.env.BASE_URL ||
  "https://docs-phoenixrooivalk.netlify.app"
).trim();

const COLLECTIONS = {
  NEWS: "news_articles",
  NEWS_SUBSCRIPTIONS: "news_subscriptions",
  NOTIFICATION_QUEUE: "notification_queue",
};

interface NewsSubscription {
  userId: string;
  email?: string;
  categories: string[];
  pushEnabled: boolean;
  emailEnabled: boolean;
  fcmToken?: string;
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
}

/**
 * Subscribe to breaking news notifications
 *
 * Registers a user for breaking news alerts via push notifications and/or email.
 *
 * @param data - Subscription configuration
 * @param data.categories - Optional array of news categories to subscribe to
 * @param data.pushEnabled - Enable push notifications (default: true)
 * @param data.emailEnabled - Enable email notifications (default: false)
 * @param data.fcmToken - Firebase Cloud Messaging token for push notifications
 * @param context - Firebase callable context
 * @returns Promise resolving to { success: boolean, subscriptionId: string }
 * @throws {HttpsError} unauthenticated - If user is not signed in
 * @throws {HttpsError} internal - If subscription fails
 */
export const subscribeToBreakingNews = functions.https.onCall(
  async (
    data: {
      categories?: string[];
      pushEnabled?: boolean;
      emailEnabled?: boolean;
      fcmToken?: string;
    },
    context,
  ) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be signed in to subscribe",
      );
    }

    const userId = context.auth.uid;
    const userEmail = context.auth.token.email;

    const {
      categories = [],
      pushEnabled = true,
      emailEnabled = false,
      fcmToken,
    } = data;

    try {
      const subscriptionRef = db
        .collection(COLLECTIONS.NEWS_SUBSCRIPTIONS)
        .doc(userId);

      const subscriptionData: Partial<NewsSubscription> = {
        userId,
        email: userEmail,
        categories,
        pushEnabled,
        emailEnabled,
        updatedAt:
          admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp,
      };

      if (fcmToken) {
        subscriptionData.fcmToken = fcmToken;
      }

      await subscriptionRef.set(
        {
          ...subscriptionData,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      functions.logger.info(`User ${userId} subscribed to breaking news`);

      return {
        success: true,
        subscriptionId: userId,
      };
    } catch (error) {
      functions.logger.error("Error subscribing to breaking news:", error);
      throw new functions.https.HttpsError("internal", "Failed to subscribe");
    }
  },
);

/**
 * Unsubscribe from breaking news notifications
 *
 * Removes a user's subscription to breaking news alerts.
 *
 * @param _data - No parameters expected
 * @param context - Firebase callable context
 * @returns Promise resolving to { success: boolean }
 * @throws {HttpsError} unauthenticated - If user is not signed in
 * @throws {HttpsError} internal - If unsubscription fails
 */
export const unsubscribeFromBreakingNews = functions.https.onCall(
  async (_data: Record<string, never>, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be signed in",
      );
    }

    const userId = context.auth.uid;

    try {
      await db.collection(COLLECTIONS.NEWS_SUBSCRIPTIONS).doc(userId).delete();

      functions.logger.info(`User ${userId} unsubscribed from breaking news`);

      return { success: true };
    } catch (error) {
      functions.logger.error("Error unsubscribing:", error);
      throw new functions.https.HttpsError("internal", "Failed to unsubscribe");
    }
  },
);

/**
 * Get user's notification subscription status
 *
 * Retrieves the current notification subscription settings for the authenticated user.
 *
 * @param _data - No parameters expected
 * @param context - Firebase callable context
 * @returns Promise resolving to { isSubscribed: boolean, subscription: object | null }
 * @throws {HttpsError} unauthenticated - If user is not signed in
 * @throws {HttpsError} internal - If retrieval fails
 */
export const getNotificationSubscription = functions.https.onCall(
  async (_data: Record<string, never>, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be signed in",
      );
    }

    const userId = context.auth.uid;

    try {
      const doc = await db
        .collection(COLLECTIONS.NEWS_SUBSCRIPTIONS)
        .doc(userId)
        .get();

      if (!doc.exists) {
        return {
          isSubscribed: false,
          subscription: null,
        };
      }

      const subscription = doc.data() as NewsSubscription;
      return {
        isSubscribed: true,
        subscription: {
          categories: subscription.categories,
          pushEnabled: subscription.pushEnabled,
          emailEnabled: subscription.emailEnabled,
        },
      };
    } catch (error) {
      functions.logger.error("Error getting subscription:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to get subscription status",
      );
    }
  },
);

/**
 * Trigger when a breaking news article is added
 *
 * Firestore trigger that sends notifications to all subscribed users
 * when a new article is marked as breaking news.
 *
 * @param snap - Firestore document snapshot
 * @param context - Event context containing article ID
 * @returns null after processing notifications
 */
export const onBreakingNewsCreated = functions.firestore
  .document(`${COLLECTIONS.NEWS}/{articleId}`)
  .onCreate(async (snap, context) => {
    const article = snap.data();
    const articleId = context.params.articleId;

    // Only process breaking news articles
    if (!article.isBreaking) {
      return null;
    }

    functions.logger.info(`Processing breaking news: ${articleId}`);

    try {
      // Get all subscribed users
      const subscriptionsSnapshot = await db
        .collection(COLLECTIONS.NEWS_SUBSCRIPTIONS)
        .where("pushEnabled", "==", true)
        .get();

      const notifications: Promise<void>[] = [];

      for (const doc of subscriptionsSnapshot.docs) {
        const subscription = doc.data() as NewsSubscription;

        // Check if user is subscribed to this category
        if (
          subscription.categories.length === 0 ||
          subscription.categories.includes(article.category)
        ) {
          // Queue push notification
          if (subscription.fcmToken && subscription.pushEnabled) {
            notifications.push(
              sendPushNotification(
                subscription.fcmToken,
                article.title,
                article.summary || "Breaking news alert!",
                articleId,
              ),
            );
          }

          // Queue email notification
          if (subscription.email && subscription.emailEnabled) {
            notifications.push(
              queueEmailNotification(
                subscription.email,
                article.title,
                article.summary,
                articleId,
              ),
            );
          }
        }
      }

      await Promise.allSettled(notifications);

      functions.logger.info(
        `Sent ${notifications.length} notifications for breaking news`,
      );

      return null;
    } catch (error) {
      functions.logger.error("Error processing breaking news:", error);
      return null;
    }
  });

/**
 * Send push notification via FCM
 */
async function sendPushNotification(
  fcmToken: string,
  title: string,
  body: string,
  articleId: string,
): Promise<void> {
  try {
    await admin.messaging().send({
      token: fcmToken,
      notification: {
        title: `Breaking: ${title}`,
        body,
      },
      data: {
        type: "breaking_news",
        articleId,
        clickAction: `${BASE_URL}/news?article=${articleId}`,
      },
      webpush: {
        fcmOptions: {
          link: `${BASE_URL}/news?article=${articleId}`,
        },
        notification: {
          icon: "/img/logo.svg",
          badge: "/img/badge.png",
          tag: `news-${articleId}`,
          requireInteraction: true,
        },
      },
    });
  } catch (error) {
    functions.logger.error("Failed to send push notification:", error);
  }
}

/**
 * Queue email notification for later processing
 */
async function queueEmailNotification(
  email: string,
  title: string,
  summary: string,
  articleId: string,
): Promise<void> {
  try {
    await db.collection(COLLECTIONS.NOTIFICATION_QUEUE).add({
      type: "email",
      to: email,
      subject: `[Phoenix Rooivalk] Breaking News: ${title}`,
      template: "breaking_news",
      data: {
        title,
        summary,
        articleId,
        articleUrl: `${BASE_URL}/news?article=${articleId}`,
      },
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    functions.logger.error("Failed to queue email notification:", error);
  }
}

/**
 * Process email notification queue
 *
 * Scheduled function that runs every 5 minutes to batch process
 * pending email notifications from the queue.
 *
 * @returns null after processing pending emails
 */
export const processEmailQueue = functions.pubsub
  .schedule("*/5 * * * *")
  .timeZone("UTC")
  .onRun(async () => {
    const pendingEmails = await db
      .collection(COLLECTIONS.NOTIFICATION_QUEUE)
      .where("type", "==", "email")
      .where("status", "==", "pending")
      .limit(50)
      .get();

    if (pendingEmails.empty) {
      return null;
    }

    functions.logger.info(`Processing ${pendingEmails.size} pending emails`);

    for (const doc of pendingEmails.docs) {
      const emailData = doc.data();

      try {
        // Here you would integrate with your email service (SendGrid, Mailgun, etc.)
        // For now, we'll just mark as processed
        // await sendEmail(emailData.to, emailData.subject, emailData.template, emailData.data);

        await doc.ref.update({
          status: "sent",
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (error) {
        functions.logger.error(
          `Failed to send email to ${emailData.to}:`,
          error,
        );
        await doc.ref.update({
          status: "failed",
          error: (error as Error).message,
          failedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }

    return null;
  });

/**
 * Send daily email digest
 *
 * Scheduled function that runs every day at 8 AM UTC to send
 * personalized news digests to users who have opted in.
 */
export const sendDailyDigest = functions.pubsub
  .schedule("0 8 * * *") // 8 AM UTC daily
  .timeZone("UTC")
  .onRun(async () => {
    await sendEmailDigest("daily");
    return null;
  });

/**
 * Send weekly email digest
 *
 * Scheduled function that runs every Monday at 8 AM UTC to send
 * personalized news digests to users who have opted in.
 */
export const sendWeeklyDigest = functions.pubsub
  .schedule("0 8 * * 1") // 8 AM UTC every Monday
  .timeZone("UTC")
  .onRun(async () => {
    await sendEmailDigest("weekly");
    return null;
  });

/**
 * Helper function to send email digests
 */
async function sendEmailDigest(frequency: "daily" | "weekly"): Promise<void> {
  const USER_PREFS_COLLECTION = "user_news_preferences";

  functions.logger.info(`Sending ${frequency} email digest`);

  try {
    // Get users subscribed to this frequency
    const subscribersSnapshot = await db
      .collection(USER_PREFS_COLLECTION)
      .where("emailDigest", "==", frequency)
      .get();

    if (subscribersSnapshot.empty) {
      functions.logger.info(`No subscribers for ${frequency} digest`);
      return;
    }

    // Get recent news articles
    const daysBack = frequency === "daily" ? 1 : 7;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const articlesSnapshot = await db
      .collection(COLLECTIONS.NEWS)
      .where("publishedAt", ">=", cutoffDate.toISOString())
      .orderBy("publishedAt", "desc")
      .limit(10)
      .get();

    if (articlesSnapshot.empty) {
      functions.logger.info(`No recent articles for ${frequency} digest`);
      return;
    }

    const articles = articlesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Queue digest emails for each subscriber
    const emailPromises = subscribersSnapshot.docs.map(async (doc) => {
      const userData = doc.data();
      const userEmail = userData.email;

      if (!userEmail) {
        return;
      }

      // Filter articles based on user preferences
      const preferredCategories = userData.preferredCategories || [];
      const hiddenCategories = userData.hiddenCategories || [];
      const followedKeywords = userData.followedKeywords || [];

      interface ArticleData {
        id: string;
        category?: string;
        keywords?: string[];
        title?: string;
        summary?: string;
        content?: string;
        source?: string;
        publishedAt?: string;
      }

      const relevantArticles = articles.filter((article: ArticleData) => {
        // Exclude hidden categories
        if (hiddenCategories.includes(article.category)) {
          return false;
        }

        // Include if matches preferred category or followed keyword
        const matchesCategory =
          preferredCategories.length === 0 ||
          preferredCategories.includes(article.category);

        const matchesKeyword =
          followedKeywords.length === 0 ||
          followedKeywords.some(
            (kw: string) =>
              article.keywords?.includes(kw) ||
              article.title?.toLowerCase().includes(kw.toLowerCase()) ||
              article.content?.toLowerCase().includes(kw.toLowerCase()),
          );

        return matchesCategory || matchesKeyword;
      });

      if (relevantArticles.length === 0) {
        return;
      }

      // Queue the email
      await db.collection(COLLECTIONS.NOTIFICATION_QUEUE).add({
        type: "email",
        to: userEmail,
        subject: `[Phoenix Rooivalk] Your ${frequency === "daily" ? "Daily" : "Weekly"} News Digest`,
        template: "news_digest",
        data: {
          frequency,
          articleCount: relevantArticles.length,
          articles: relevantArticles.slice(0, 5).map((a: ArticleData) => ({
            id: a.id,
            title: a.title,
            summary: a.summary,
            category: a.category,
            source: a.source,
            url: `${BASE_URL}/news?article=${a.id}`,
            publishedAt: a.publishedAt,
          })),
          managePreferencesUrl: `${BASE_URL}/profile-settings`,
        },
        status: "pending",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    await Promise.allSettled(emailPromises);

    functions.logger.info(
      `Queued ${subscribersSnapshot.size} ${frequency} digest emails`,
    );
  } catch (error) {
    functions.logger.error(`Error sending ${frequency} digest:`, error);
  }
}

/**
 * Mark article as breaking news (admin only)
 *
 * Toggles the breaking news status of an article.
 *
 * @param data - Request data
 * @param data.articleId - ID of the article to update
 * @param data.isBreaking - Whether to mark as breaking news
 * @param context - Firebase callable context (requires admin token)
 * @returns Promise resolving to { success: boolean }
 * @throws {HttpsError} permission-denied - If user is not an admin
 * @throws {HttpsError} internal - If update fails
 */
export const markAsBreakingNews = functions.https.onCall(
  async (
    data: {
      articleId: string;
      isBreaking: boolean;
    },
    context,
  ) => {
    if (!context.auth?.token.admin) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only admins can mark breaking news",
      );
    }

    const { articleId, isBreaking } = data;

    try {
      await db.collection(COLLECTIONS.NEWS).doc(articleId).update({
        isBreaking,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      functions.logger.info(
        `Article ${articleId} marked as ${isBreaking ? "breaking" : "normal"} news`,
      );

      return { success: true };
    } catch (error) {
      functions.logger.error("Error marking breaking news:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to update article",
      );
    }
  },
);
