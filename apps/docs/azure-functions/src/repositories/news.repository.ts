/**
 * News Repository
 *
 * Data access layer for news articles.
 */

import {
  BaseRepository,
  BaseEntity,
  PaginationOptions,
  PaginatedResult,
} from "./base.repository";
import { NewsCategory } from "../config";

/**
 * News article entity
 */
export interface NewsArticle extends BaseEntity {
  title: string;
  summary: string;
  content: string;
  category: NewsCategory;
  type: "general" | "specialized";
  source: string;
  sourceUrl?: string;
  publishedAt: string;
  targetRoles: string[];
  targetInterests: string[];
  targetFocusAreas: string[];
  viewCount: number;
  keywords: string[];
  sentiment?: "positive" | "neutral" | "negative";
  embedding?: number[];
}

/**
 * News query filters
 */
export interface NewsQueryFilters {
  categories?: string[];
  type?: "general" | "specialized";
  since?: string;
}

/**
 * News repository
 */
export class NewsRepository extends BaseRepository<NewsArticle> {
  constructor() {
    super("news_articles");
  }

  /**
   * Find news articles with filters
   */
  async findWithFilters(
    filters: NewsQueryFilters = {},
    options: PaginationOptions = {},
  ): Promise<PaginatedResult<NewsArticle>> {
    const { limit = 20, offset = 0 } = options;
    const conditions: string[] = [];
    const parameters: Array<{ name: string; value: string }> = [];

    if (filters.categories && filters.categories.length > 0) {
      const placeholders = filters.categories
        .map((_, i) => `@cat${i}`)
        .join(", ");
      conditions.push(`c.category IN (${placeholders})`);
      filters.categories.forEach((cat, i) => {
        parameters.push({ name: `@cat${i}`, value: cat });
      });
    }

    if (filters.type) {
      conditions.push("c.type = @type");
      parameters.push({ name: "@type", value: filters.type });
    }

    if (filters.since) {
      conditions.push("c.publishedAt >= @since");
      parameters.push({ name: "@since", value: filters.since });
    }

    let query = "SELECT * FROM c";
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }
    query += ` ORDER BY c.publishedAt DESC OFFSET ${offset} LIMIT ${limit + 1}`;

    const items = await this.query(query, parameters);
    const hasMore = items.length > limit;

    return {
      items: hasMore ? items.slice(0, limit) : items,
      hasMore,
    };
  }

  /**
   * Find articles by IDs
   */
  async findByIds(ids: string[]): Promise<NewsArticle[]> {
    if (ids.length === 0) return [];

    const placeholders = ids.map((_, i) => `@id${i}`).join(", ");
    const parameters = ids.map((id, i) => ({ name: `@id${i}`, value: id }));

    return this.query(
      `SELECT * FROM c WHERE c.id IN (${placeholders})`,
      parameters,
    );
  }

  /**
   * Increment view count
   */
  async incrementViewCount(id: string): Promise<void> {
    const article = await this.findById(id);
    if (article) {
      await this.save({
        ...article,
        viewCount: (article.viewCount || 0) + 1,
      });
    }
  }

  /**
   * Find articles with embeddings for semantic search
   */
  async findWithEmbeddings(
    filters: NewsQueryFilters = {},
    limit: number = 100,
  ): Promise<NewsArticle[]> {
    const conditions = ["c.embedding != null"];
    const parameters: Array<{ name: string; value: string }> = [];

    if (filters.categories && filters.categories.length > 0) {
      const placeholders = filters.categories
        .map((_, i) => `@cat${i}`)
        .join(", ");
      conditions.push(`c.category IN (${placeholders})`);
      filters.categories.forEach((cat, i) => {
        parameters.push({ name: `@cat${i}`, value: cat });
      });
    }

    const query = `SELECT * FROM c WHERE ${conditions.join(" AND ")} ORDER BY c.publishedAt DESC OFFSET 0 LIMIT ${limit}`;

    return this.query(query, parameters);
  }
}

/**
 * Singleton instance
 */
export const newsRepository = new NewsRepository();
