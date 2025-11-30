/**
 * Notifications Service
 *
 * Handles news subscriptions, push notifications, and email digests.
 */

import { queryDocuments, upsertDocument, getContainer } from "../lib/cosmos";
import { newsRepository, NewsArticle } from "../repositories";
import { generateId } from "../lib/utils/ids";
import { createLogger, Logger } from "../lib/logger";
import { sendEmail, EmailTemplates, EmailMessage } from "../lib/email";
import {
  sendPushNotification,
  sendTaggedNotification,
  registerDevice,
  DeviceRegistration,
  PushNotification,
} from "../lib/push-notifications";

// Module-level logger
const logger: Logger = createLogger({ feature: "notifications-service" });

/**
 * News subscription
 */
export interface NewsSubscription {
  id: string;
  userId: string;
  email?: string;
  categories: string[];
  pushEnabled: boolean;
  emailEnabled: boolean;
  pushToken?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Email notification in queue
 */
interface EmailNotification {
  id: string;
  type: "email";
  to: string;
  subject: string;
  template: string;
  data: Record<string, unknown>;
  status: "pending" | "sent" | "failed";
  createdAt: string;
  sentAt?: string;
  error?: string;
}

/**
 * Base URL for article links
 */
const BASE_URL =
  process.env.BASE_URL || "https://docs-phoenixrooivalk.netlify.app";

/**
 * Notifications Service class
 */
export class NotificationsService {
  private readonly subscriptionsContainer = "news_subscriptions";
  private readonly notificationQueueContainer = "notification_queue";

  /**
   * Subscribe to breaking news
   */
  async subscribe(
    userId: string,
    options: {
      email?: string;
      categories?: string[];
      pushEnabled?: boolean;
      emailEnabled?: boolean;
      pushToken?: string;
    },
  ): Promise<{ subscriptionId: string }> {
    const now = new Date().toISOString();

    const subscription: NewsSubscription = {
      id: userId,
      userId,
      email: options.email,
      categories: options.categories || [],
      pushEnabled: options.pushEnabled ?? true,
      emailEnabled: options.emailEnabled ?? false,
      pushToken: options.pushToken,
      createdAt: now,
      updatedAt: now,
    };

    // Check if exists
    const existing = await this.getSubscription(userId);
    if (existing) {
      subscription.createdAt = existing.createdAt;
    }

    await upsertDocument(this.subscriptionsContainer, subscription);

    return { subscriptionId: userId };
  }

  /**
   * Unsubscribe from notifications
   */
  async unsubscribe(userId: string): Promise<void> {
    try {
      const container = getContainer(this.subscriptionsContainer);
      await container.item(userId, userId).delete();
    } catch (error) {
      // Log but don't throw - subscription may not exist
      logger.warn("Unsubscribe failed (may not exist)", {
        operation: "unsubscribe",
        userId,
      });
    }
  }

  /**
   * Get user subscription
   */
  async getSubscription(userId: string): Promise<NewsSubscription | null> {
    try {
      const container = getContainer(this.subscriptionsContainer);
      const { resource } = await container
        .item(userId, userId)
        .read<NewsSubscription>();
      return resource || null;
    } catch (error) {
      // Expected for non-existent subscriptions
      if ((error as { code?: number })?.code !== 404) {
        logger.warn("Failed to get subscription", {
          operation: "getSubscription",
          userId,
        });
      }
      return null;
    }
  }

  /**
   * Queue email notification
   */
  async queueEmail(
    to: string,
    subject: string,
    template: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    const notification: EmailNotification = {
      id: generateId("email"),
      type: "email",
      to,
      subject,
      template,
      data,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    await upsertDocument(this.notificationQueueContainer, notification);
  }

  /**
   * Process pending email queue - sends emails using configured provider
   */
  async processEmailQueue(): Promise<{ processed: number; failed: number }> {
    const pending = await queryDocuments<EmailNotification>(
      this.notificationQueueContainer,
      "SELECT * FROM c WHERE c.type = 'email' AND c.status = 'pending' OFFSET 0 LIMIT 50",
    );

    let processed = 0;
    let failed = 0;

    for (const notification of pending) {
      try {
        // Build email message from template data
        const emailMessage: EmailMessage = {
          to: notification.to,
          subject: notification.subject,
          html: this.renderEmailTemplate(
            notification.template,
            notification.data,
          ),
        };

        const result = await sendEmail(emailMessage);

        if (result.success) {
          // Mark as sent
          await upsertDocument(this.notificationQueueContainer, {
            ...notification,
            status: "sent",
            sentAt: new Date().toISOString(),
            messageId: result.messageId,
          });
          processed++;
        } else {
          // Mark as failed
          await upsertDocument(this.notificationQueueContainer, {
            ...notification,
            status: "failed",
            error: result.error,
          });
          failed++;
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        logger.error("Failed to process email notification", {
          operation: "processEmailQueue",
          notificationId: notification.id,
          error: errorMessage,
        });
        await upsertDocument(this.notificationQueueContainer, {
          ...notification,
          status: "failed",
          error: errorMessage,
        });
        failed++;
      }
    }

    logger.info("Email queue processed", { processed, failed });
    return { processed, failed };
  }

  /**
   * Render email template with data
   */
  private renderEmailTemplate(
    template: string,
    data: Record<string, unknown>,
  ): string {
    switch (template) {
      case "breaking_news":
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #f97316;">🚨 Breaking News</h1>
            <h2>${data.title}</h2>
            <p>${data.summary}</p>
            <a href="${data.articleUrl}" style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
              Read Full Article
            </a>
            <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />
            <p style="color: #666; font-size: 12px;">
              You received this email because you subscribed to breaking news alerts.
              <a href="${BASE_URL}/unsubscribe">Unsubscribe</a>
            </p>
          </div>
        `;

      case "news_digest":
        const articles = (data.articles || []) as Array<{
          title: string;
          summary: string;
          url: string;
        }>;
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #f97316;">📰 ${data.frequency === "daily" ? "Daily" : "Weekly"} Digest</h1>
            <p>Here are ${data.articleCount} recent stories:</p>
            ${articles
              .map(
                (article) => `
              <div style="margin: 16px 0; padding: 16px; border: 1px solid #eee; border-radius: 8px;">
                <h3 style="margin: 0 0 8px 0;">${article.title}</h3>
                <p style="margin: 0 0 12px 0; color: #666;">${article.summary}</p>
                <a href="${article.url}" style="color: #f97316;">Read more →</a>
              </div>
            `,
              )
              .join("")}
            <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />
            <p style="color: #666; font-size: 12px;">
              <a href="${data.managePreferencesUrl}">Manage Preferences</a> | 
              <a href="${BASE_URL}/unsubscribe">Unsubscribe</a>
            </p>
          </div>
        `;

      default:
        // Generic template
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #f97316;">Phoenix Rooivalk</h1>
            <p>${JSON.stringify(data)}</p>
          </div>
        `;
    }
  }

  /**
   * Notify subscribers of breaking news
   */
  async notifyBreakingNews(
    articleId: string,
    title: string,
    summary: string,
    category: string,
  ): Promise<{
    notificationsSent: number;
    pushSent: number;
    emailQueued: number;
  }> {
    // Get subscribers for this category
    const subscribers = await queryDocuments<NewsSubscription>(
      this.subscriptionsContainer,
      "SELECT * FROM c WHERE c.pushEnabled = true OR c.emailEnabled = true",
    );

    let pushSent = 0;
    let emailQueued = 0;

    for (const subscriber of subscribers) {
      // Check category match
      if (
        subscriber.categories.length > 0 &&
        !subscriber.categories.includes(category)
      ) {
        continue;
      }

      // Queue email notification
      if (subscriber.emailEnabled && subscriber.email) {
        await this.queueEmail(
          subscriber.email,
          `[Phoenix Rooivalk] Breaking News: ${title}`,
          "breaking_news",
          {
            title,
            summary,
            articleId,
            articleUrl: `${BASE_URL}/news?article=${articleId}`,
          },
        );
        emailQueued++;
      }

      // Send push notification via Azure Notification Hubs
      if (subscriber.pushEnabled && subscriber.pushToken) {
        const pushNotification: PushNotification = {
          title: "🚨 Breaking News",
          body: title,
          data: {
            articleId,
            category,
            type: "breaking_news",
          },
        };

        // Detect platform from token format (simplified heuristic)
        const platform = this.detectPlatform(subscriber.pushToken);

        const result = await sendPushNotification(
          subscriber.pushToken,
          platform,
          pushNotification,
        );

        if (result.success) {
          pushSent++;
        } else {
          logger.warn("Failed to send push notification", {
            operation: "notifyBreakingNews",
            subscriberId: subscriber.id,
            error: result.error,
          });
        }
      }
    }

    const notificationsSent = pushSent + emailQueued;
    logger.info("Breaking news notifications sent", {
      articleId,
      category,
      pushSent,
      emailQueued,
      total: notificationsSent,
    });

    return { notificationsSent, pushSent, emailQueued };
  }

  /**
   * Detect push notification platform from token format
   */
  private detectPlatform(pushToken: string): "fcm" | "apns" | "wns" {
    // FCM tokens are typically longer and contain alphanumeric characters
    // APNS tokens are 64 hex characters
    // WNS tokens are URLs
    if (pushToken.startsWith("https://")) {
      return "wns";
    }
    if (/^[a-f0-9]{64}$/i.test(pushToken)) {
      return "apns";
    }
    return "fcm"; // Default to FCM
  }

  /**
   * Register device for push notifications
   */
  async registerPushDevice(
    userId: string,
    pushToken: string,
    platform: "fcm" | "apns" | "wns",
    tags?: string[],
  ): Promise<{ registrationId: string } | null> {
    const registration: DeviceRegistration = {
      platform,
      pushToken,
      userId,
      tags: tags || [],
    };

    const result = await registerDevice(registration);

    if (result) {
      // Update subscription with registration ID
      const subscription = await this.getSubscription(userId);
      if (subscription) {
        await upsertDocument(this.subscriptionsContainer, {
          ...subscription,
          pushToken,
          pushRegistrationId: result.registrationId,
          pushPlatform: platform,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    return result;
  }

  /**
   * Send daily/weekly digest emails
   */
  async sendDigest(
    frequency: "daily" | "weekly",
  ): Promise<{ emailsQueued: number }> {
    const daysBack = frequency === "daily" ? 1 : 7;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    // Get subscribers for this frequency
    const subscribers = await queryDocuments<{
      id: string;
      email?: string;
      emailDigest?: string;
      preferredCategories?: string[];
      hiddenCategories?: string[];
    }>(
      "user_news_preferences",
      "SELECT * FROM c WHERE c.emailDigest = @frequency",
      [{ name: "@frequency", value: frequency }],
    );

    if (subscribers.length === 0) {
      return { emailsQueued: 0 };
    }

    // Get recent articles
    const articles = await queryDocuments<{
      id: string;
      title: string;
      summary: string;
      category: string;
      source: string;
      publishedAt: string;
    }>(
      "news_articles",
      "SELECT c.id, c.title, c.summary, c.category, c.source, c.publishedAt FROM c WHERE c.publishedAt >= @cutoff ORDER BY c.publishedAt DESC OFFSET 0 LIMIT 20",
      [{ name: "@cutoff", value: cutoffDate.toISOString() }],
    );

    if (articles.length === 0) {
      return { emailsQueued: 0 };
    }

    let emailsQueued = 0;

    for (const subscriber of subscribers) {
      if (!subscriber.email) continue;

      // Filter articles by preferences
      const preferredCategories = subscriber.preferredCategories || [];
      const hiddenCategories = subscriber.hiddenCategories || [];

      const relevantArticles = articles.filter((article) => {
        if (hiddenCategories.includes(article.category)) return false;
        if (preferredCategories.length === 0) return true;
        return preferredCategories.includes(article.category);
      });

      if (relevantArticles.length === 0) continue;

      await this.queueEmail(
        subscriber.email,
        `[Phoenix Rooivalk] Your ${frequency === "daily" ? "Daily" : "Weekly"} News Digest`,
        "news_digest",
        {
          frequency,
          articleCount: relevantArticles.length,
          articles: relevantArticles.slice(0, 5).map((a) => ({
            ...a,
            url: `${BASE_URL}/news?article=${a.id}`,
          })),
          managePreferencesUrl: `${BASE_URL}/profile-settings`,
        },
      );

      emailsQueued++;
    }

    return { emailsQueued };
  }

  /**
   * Mark article as breaking news
   */
  async markAsBreaking(articleId: string, isBreaking: boolean): Promise<void> {
    const article = await newsRepository.findById(articleId);
    if (!article) throw new Error("Article not found");

    await newsRepository.save({
      ...article,
      isBreaking,
      updatedAt: new Date().toISOString(),
    } as NewsArticle & { isBreaking: boolean });

    // If marking as breaking, notify subscribers
    if (isBreaking) {
      await this.notifyBreakingNews(
        articleId,
        article.title,
        article.summary,
        article.category,
      );
    }
  }
}

/**
 * Singleton instance
 */
export const notificationsService = new NotificationsService();
