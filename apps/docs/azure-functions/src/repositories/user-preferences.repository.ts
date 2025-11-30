/**
 * User Preferences Repository
 *
 * Data access layer for user news preferences.
 */

import { BaseRepository, BaseEntity } from "./base.repository";

/**
 * User news preferences entity
 */
export interface UserNewsPreferences extends BaseEntity {
  userId: string;
  readArticleIds: string[];
  savedArticleIds: string[];
  preferredCategories: string[];
  hiddenCategories: string[];
  followedKeywords: string[];
  excludedKeywords: string[];
  emailDigest: "none" | "daily" | "weekly";
  pushNotifications: boolean;
}

/**
 * User preferences repository
 */
export class UserPreferencesRepository extends BaseRepository<UserNewsPreferences> {
  constructor() {
    super("user_news_preferences");
  }

  /**
   * Find by user ID
   */
  async findByUserId(userId: string): Promise<UserNewsPreferences | null> {
    return this.findById(userId);
  }

  /**
   * Get or create default preferences for user
   */
  async getOrCreateForUser(userId: string): Promise<UserNewsPreferences> {
    const existing = await this.findByUserId(userId);
    if (existing) return existing;

    const defaultPrefs: UserNewsPreferences = {
      id: userId,
      userId,
      readArticleIds: [],
      savedArticleIds: [],
      preferredCategories: [],
      hiddenCategories: [],
      followedKeywords: [],
      excludedKeywords: [],
      emailDigest: "none",
      pushNotifications: false,
    };

    return this.save(defaultPrefs);
  }

  /**
   * Mark article as read
   */
  async markArticleRead(userId: string, articleId: string): Promise<void> {
    const prefs = await this.getOrCreateForUser(userId);
    if (!prefs.readArticleIds.includes(articleId)) {
      prefs.readArticleIds.push(articleId);
      await this.save(prefs);
    }
  }

  /**
   * Toggle saved article
   */
  async toggleSavedArticle(
    userId: string,
    articleId: string,
    save: boolean,
  ): Promise<void> {
    const prefs = await this.getOrCreateForUser(userId);

    if (save && !prefs.savedArticleIds.includes(articleId)) {
      prefs.savedArticleIds.push(articleId);
    } else if (!save) {
      prefs.savedArticleIds = prefs.savedArticleIds.filter(
        (id) => id !== articleId,
      );
    }

    await this.save(prefs);
  }

  /**
   * Get saved article IDs for user
   */
  async getSavedArticleIds(userId: string): Promise<string[]> {
    const prefs = await this.findByUserId(userId);
    return prefs?.savedArticleIds || [];
  }

  /**
   * Get read article IDs for user
   */
  async getReadArticleIds(userId: string): Promise<string[]> {
    const prefs = await this.findByUserId(userId);
    return prefs?.readArticleIds || [];
  }
}

/**
 * Singleton instance
 */
export const userPreferencesRepository = new UserPreferencesRepository();
