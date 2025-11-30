/**
 * Notifications Service
 *
 * Handles news subscriptions, push notifications, and email digests.
 */

import { queryDocuments, upsertDocument, getContainer } from "../lib/cosmos";
import { newsRepository, NewsArticle } from "../repositories";

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
    } catch {
      // Ignore if not found
    }
  }

  /**
   * Get user subscription
   */
  async getSubscription(userId: string): Promise<NewsSubscription | null> {
    try {
      const container = getContainer(this.subscriptionsContainer);
      const { resource } = await container.item(userId, userId).read<NewsSubscription>();
      return resource || null;
    } catch {
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
      id: `email_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
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
   * Process pending email queue
   */
  async processEmailQueue(
    sendEmailFn?: (
      to: string,
      subject: string,
      template: string,
      data: Record<string, unknown>,
    ) => Promise<void>,
  ): Promise<{ processed: number; failed: number }> {
    const pending = await queryDocuments<EmailNotification>(
      this.notificationQueueContainer,
      "SELECT * FROM c WHERE c.type = 'email' AND c.status = 'pending' OFFSET 0 LIMIT 50",
    );

    let processed = 0;
    let failed = 0;

    for (const notification of pending) {
      try {
        if (sendEmailFn) {
          await sendEmailFn(
            notification.to,
            notification.subject,
            notification.template,
            notification.data,
          );
        }

        // Mark as sent
        await upsertDocument(this.notificationQueueContainer, {
          ...notification,
          status: "sent",
          sentAt: new Date().toISOString(),
        });

        processed++;
      } catch (error) {
        await upsertDocument(this.notificationQueueContainer, {
          ...notification,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
        failed++;
      }
    }

    return { processed, failed };
  }

  /**
   * Notify subscribers of breaking news
   */
  async notifyBreakingNews(
    articleId: string,
    title: string,
    summary: string,
    category: string,
  ): Promise<{ notificationsSent: number }> {
    // Get subscribers for this category
    const subscribers = await queryDocuments<NewsSubscription>(
      this.subscriptionsContainer,
      "SELECT * FROM c WHERE c.pushEnabled = true OR c.emailEnabled = true",
    );

    let notificationsSent = 0;

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
        notificationsSent++;
      }

      // Push notification would be sent here
      // In production, integrate with Azure Notification Hubs or similar
      if (subscriber.pushEnabled && subscriber.pushToken) {
        // await sendPushNotification(subscriber.pushToken, title, summary, articleId);
        notificationsSent++;
      }
    }

    return { notificationsSent };
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
