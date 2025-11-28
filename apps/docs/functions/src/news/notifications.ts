/**
 * News Notification Cloud Functions
 *
 * Handles breaking news notifications via push and email.
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

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
        updatedAt: admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp,
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
      throw new functions.https.HttpsError(
        "internal",
        "Failed to subscribe",
      );
    }
  },
);

/**
 * Unsubscribe from breaking news notifications
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
      throw new functions.https.HttpsError(
        "internal",
        "Failed to unsubscribe",
      );
    }
  },
);

/**
 * Get user's notification subscription status
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
 * Sends notifications to all subscribed users
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
        clickAction: `/news?article=${articleId}`,
      },
      webpush: {
        fcmOptions: {
          link: `/news?article=${articleId}`,
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
        articleUrl: `https://docs-phoenixrooivalk.netlify.app/news?article=${articleId}`,
      },
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    functions.logger.error("Failed to queue email notification:", error);
  }
}

/**
 * Process email notification queue (scheduled function)
 * Runs every 5 minutes to batch process email notifications
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
        functions.logger.error(`Failed to send email to ${emailData.to}:`, error);
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
 * Mark article as breaking news (admin only)
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
