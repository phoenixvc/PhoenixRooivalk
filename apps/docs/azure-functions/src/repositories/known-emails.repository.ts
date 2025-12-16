/**
 * Known Emails Repository
 *
 * Data access layer for managing known internal user email mappings.
 * These emails are automatically recognized as internal team members during login.
 */

import {
  BaseRepository,
  BaseEntity,
  PaginationOptions,
  PaginatedResult,
} from "./base.repository";

/**
 * Known email entity
 */
export interface KnownEmail extends BaseEntity {
  email: string;
  profileKey: string;
  displayName: string;
  addedBy?: string;
  notes?: string;
  isActive: boolean;
}

/**
 * Known email query filters
 */
export interface KnownEmailFilters {
  profileKey?: string;
  isActive?: boolean;
  search?: string;
}

/**
 * Known emails repository
 */
export class KnownEmailsRepository extends BaseRepository<KnownEmail> {
  constructor() {
    super("known_emails");
  }

  /**
   * Find by email address (case-insensitive)
   */
  async findByEmail(email: string): Promise<KnownEmail | null> {
    const normalizedEmail = email.toLowerCase().trim();
    const query =
      "SELECT * FROM c WHERE c.email = @email AND c.isActive = true";
    const items = await this.query(query, [
      { name: "@email", value: normalizedEmail },
    ]);
    return items[0] || null;
  }

  /**
   * Find all emails for a profile key
   */
  async findByProfileKey(profileKey: string): Promise<KnownEmail[]> {
    const query =
      "SELECT * FROM c WHERE c.profileKey = @profileKey AND c.isActive = true ORDER BY c.createdAt DESC";
    return this.query(query, [{ name: "@profileKey", value: profileKey }]);
  }

  /**
   * Find emails with filters
   */
  async findWithFilters(
    filters: KnownEmailFilters = {},
    options: PaginationOptions = {},
  ): Promise<PaginatedResult<KnownEmail>> {
    const { limit = 50, offset = 0 } = options;
    const conditions: string[] = [];
    const parameters: Array<{ name: string; value: string | boolean }> = [];

    if (filters.profileKey) {
      conditions.push("c.profileKey = @profileKey");
      parameters.push({ name: "@profileKey", value: filters.profileKey });
    }

    if (filters.isActive !== undefined) {
      conditions.push("c.isActive = @isActive");
      parameters.push({ name: "@isActive", value: filters.isActive });
    }

    if (filters.search) {
      conditions.push(
        "(CONTAINS(LOWER(c.email), @search) OR CONTAINS(LOWER(c.displayName), @search))",
      );
      parameters.push({ name: "@search", value: filters.search.toLowerCase() });
    }

    let query = "SELECT * FROM c";
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }
    query += ` ORDER BY c.createdAt DESC OFFSET ${offset} LIMIT ${limit + 1}`;

    const items = await this.query(query, parameters);
    const hasMore = items.length > limit;

    return {
      items: hasMore ? items.slice(0, limit) : items,
      hasMore,
    };
  }

  /**
   * Get all active emails as a map (for caching)
   */
  async getAllActiveEmailsMap(): Promise<Map<string, string>> {
    const query = "SELECT c.email, c.profileKey FROM c WHERE c.isActive = true";
    const items = await this.query(query);
    const map = new Map<string, string>();
    for (const item of items) {
      map.set(item.email.toLowerCase(), item.profileKey);
    }
    return map;
  }

  /**
   * Add a known email
   */
  async addEmail(
    email: string,
    profileKey: string,
    displayName: string,
    addedBy?: string,
    notes?: string,
  ): Promise<KnownEmail> {
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists
    const existing = await this.findByEmail(normalizedEmail);
    if (existing) {
      throw new Error(`Email ${normalizedEmail} already exists`);
    }

    const id = `email_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const knownEmail: KnownEmail = {
      id,
      email: normalizedEmail,
      profileKey,
      displayName,
      addedBy,
      notes,
      isActive: true,
    };

    return this.save(knownEmail);
  }

  /**
   * Update a known email
   */
  async updateEmail(
    id: string,
    updates: Partial<
      Pick<KnownEmail, "profileKey" | "displayName" | "notes" | "isActive">
    >,
  ): Promise<KnownEmail | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated: KnownEmail = {
      ...existing,
      ...updates,
    };

    return this.save(updated);
  }

  /**
   * Deactivate an email (soft delete)
   */
  async deactivateEmail(id: string): Promise<KnownEmail | null> {
    return this.updateEmail(id, { isActive: false });
  }

  /**
   * Get count of active emails
   */
  async getActiveCount(): Promise<number> {
    const query = "SELECT VALUE COUNT(1) FROM c WHERE c.isActive = true";
    const result = await this.query(query);
    return (result as unknown as number[])[0] || 0;
  }
}

/**
 * Singleton instance
 */
export const knownEmailsRepository = new KnownEmailsRepository();
