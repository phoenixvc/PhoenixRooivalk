/**
 * Configuration Repository
 *
 * Data access layer for dynamic configuration stored in Cosmos DB.
 * Supports categories, roles, interests, prompts, topics, and settings.
 */

import {
  BaseRepository,
  BaseEntity,
  PaginationOptions,
} from "./base.repository";
import { queryDocuments, upsertDocument } from "../lib/cosmos";

/**
 * Configuration types
 */
export type ConfigType =
  | "category" // News categories
  | "role" // Target roles
  | "interest" // Target interests
  | "prompt" // AI prompts
  | "topic" // News topics
  | "domain" // Trusted domains
  | "setting"; // General settings

/**
 * Base configuration item
 */
export interface ConfigItem extends BaseEntity {
  type: ConfigType;
  name: string;
  description: string;
  metadata: Record<string, unknown>;
  isActive: boolean;
  version: number;
  createdBy?: string;
  updatedBy?: string;
  order?: number;
}

/**
 * Category configuration
 */
export interface CategoryConfig extends ConfigItem {
  type: "category";
  metadata: {
    icon?: string;
    color?: string;
    parentId?: string;
  };
}

/**
 * Role configuration
 */
export interface RoleConfig extends ConfigItem {
  type: "role";
  metadata: {
    department?: string;
    level?: "junior" | "mid" | "senior" | "executive";
  };
}

/**
 * Interest configuration
 */
export interface InterestConfig extends ConfigItem {
  type: "interest";
  metadata: {
    category?: string;
    relatedInterests?: string[];
  };
}

/**
 * Prompt configuration
 */
export interface PromptConfig extends ConfigItem {
  type: "prompt";
  metadata: {
    category:
      | "analysis"
      | "generation"
      | "retrieval"
      | "research"
      | "recommendation";
    systemPrompt: string;
    userTemplate: string;
    requiredVariables: string[];
    optionalVariables: Record<string, string>;
    recommendedModel: "chat" | "chatFast" | "chatAdvanced";
    maxTokens: number;
    temperature: number;
    outputFormat: "text" | "json" | "markdown";
    tags: string[];
    // Analytics
    usageCount?: number;
    avgLatencyMs?: number;
    successRate?: number;
    lastUsedAt?: string;
  };
}

/**
 * Topic configuration (for news ingestion)
 */
export interface TopicConfig extends ConfigItem {
  type: "topic";
  metadata: {
    priority: number;
    searchQueries: string[];
    relatedCategories: string[];
  };
}

/**
 * Domain configuration (trusted news sources)
 */
export interface DomainConfig extends ConfigItem {
  type: "domain";
  metadata: {
    url: string;
    trustLevel: "high" | "medium" | "low";
    category?: string;
  };
}

/**
 * Configuration version history
 */
export interface ConfigVersion {
  id: string;
  configId: string;
  version: number;
  data: ConfigItem;
  changedBy: string;
  changedAt: string;
  changeReason?: string;
}

/**
 * Configuration repository
 */
export class ConfigurationRepository extends BaseRepository<ConfigItem> {
  private readonly historyContainer = "config_history";

  constructor() {
    super("configuration");
  }

  /**
   * Get all config items of a type
   */
  async getByType(type: ConfigType): Promise<ConfigItem[]> {
    return this.query(
      "SELECT * FROM c WHERE c.type = @type ORDER BY c.order ASC, c.name ASC",
      [{ name: "@type", value: type }],
    );
  }

  /**
   * Get active config items of a type
   */
  async getActive(type: ConfigType): Promise<ConfigItem[]> {
    return this.query(
      "SELECT * FROM c WHERE c.type = @type AND c.isActive = true ORDER BY c.order ASC, c.name ASC",
      [{ name: "@type", value: type }],
    );
  }

  /**
   * Get config item by type and name
   */
  async getByName(type: ConfigType, name: string): Promise<ConfigItem | null> {
    const results = await this.query(
      "SELECT * FROM c WHERE c.type = @type AND c.name = @name",
      [
        { name: "@type", value: type },
        { name: "@name", value: name },
      ],
    );
    return results[0] || null;
  }

  /**
   * Create new config item
   */
  async create(
    item: Omit<ConfigItem, "id" | "version" | "createdAt" | "updatedAt">,
    userId?: string,
  ): Promise<ConfigItem> {
    const now = new Date().toISOString();
    const id = `${item.type}:${item.name.toLowerCase().replace(/\s+/g, "-")}`;

    const newItem: ConfigItem = {
      ...item,
      id,
      version: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      updatedBy: userId,
    };

    await this.save(newItem);

    // Save initial version to history
    await this.saveVersion(newItem, userId);

    return newItem;
  }

  /**
   * Update config item with versioning
   */
  async update(
    id: string,
    updates: Partial<ConfigItem>,
    userId?: string,
    changeReason?: string,
  ): Promise<ConfigItem | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const updatedItem: ConfigItem = {
      ...existing,
      ...updates,
      id: existing.id, // Prevent ID change
      type: existing.type, // Prevent type change
      version: existing.version + 1,
      updatedAt: now,
      updatedBy: userId,
    };

    await this.save(updatedItem);

    // Save version to history
    await this.saveVersion(updatedItem, userId, changeReason);

    return updatedItem;
  }

  /**
   * Deactivate config item (soft delete)
   */
  async deactivate(id: string, userId?: string): Promise<void> {
    await this.update(id, { isActive: false }, userId, "Deactivated");
  }

  /**
   * Save version to history
   */
  private async saveVersion(
    item: ConfigItem,
    userId?: string,
    changeReason?: string,
  ): Promise<void> {
    const version: ConfigVersion = {
      id: `${item.id}:v${item.version}`,
      configId: item.id,
      version: item.version,
      data: item,
      changedBy: userId || "system",
      changedAt: new Date().toISOString(),
      changeReason,
    };

    await upsertDocument(this.historyContainer, version);
  }

  /**
   * Get version history for config item
   */
  async getHistory(configId: string): Promise<ConfigVersion[]> {
    return queryDocuments<ConfigVersion>(
      this.historyContainer,
      "SELECT * FROM c WHERE c.configId = @configId ORDER BY c.version DESC",
      [{ name: "@configId", value: configId }],
    );
  }

  /**
   * Get specific version
   */
  async getVersion(
    configId: string,
    version: number,
  ): Promise<ConfigVersion | null> {
    const results = await queryDocuments<ConfigVersion>(
      this.historyContainer,
      "SELECT * FROM c WHERE c.configId = @configId AND c.version = @version",
      [
        { name: "@configId", value: configId },
        { name: "@version", value: version },
      ],
    );
    return results[0] || null;
  }

  /**
   * Revert to specific version
   */
  async revert(
    configId: string,
    version: number,
    userId?: string,
  ): Promise<ConfigItem | null> {
    const historyVersion = await this.getVersion(configId, version);
    if (!historyVersion) return null;

    const current = await this.findById(configId);
    if (!current) return null;

    return this.update(
      configId,
      {
        ...historyVersion.data,
        version: current.version, // Will be incremented by update
      },
      userId,
      `Reverted to version ${version}`,
    );
  }

  /**
   * Bulk import configuration
   */
  async importConfig(
    items: Array<
      Omit<ConfigItem, "id" | "version" | "createdAt" | "updatedAt">
    >,
    userId?: string,
  ): Promise<{ imported: number; skipped: number; errors: string[] }> {
    const result = { imported: 0, skipped: 0, errors: [] as string[] };

    for (const item of items) {
      try {
        const existing = await this.getByName(item.type, item.name);
        if (existing) {
          result.skipped++;
          continue;
        }

        await this.create(item, userId);
        result.imported++;
      } catch (error) {
        result.errors.push(`${item.type}:${item.name}: ${error}`);
      }
    }

    return result;
  }

  /**
   * Export all configuration
   */
  async exportConfig(type?: ConfigType): Promise<ConfigItem[]> {
    if (type) {
      return this.getByType(type);
    }
    return this.query("SELECT * FROM c ORDER BY c.type, c.order, c.name");
  }

  /**
   * Search configuration
   */
  async search(query: string, type?: ConfigType): Promise<ConfigItem[]> {
    const searchQuery = `%${query.toLowerCase()}%`;
    let sql =
      "SELECT * FROM c WHERE (LOWER(c.name) LIKE @query OR LOWER(c.description) LIKE @query)";
    const params: Array<{ name: string; value: string }> = [
      { name: "@query", value: searchQuery },
    ];

    if (type) {
      sql += " AND c.type = @type";
      params.push({ name: "@type", value: type });
    }

    sql += " ORDER BY c.type, c.name";

    return this.query(sql, params);
  }
}

/**
 * Singleton instance
 */
export const configurationRepository = new ConfigurationRepository();
