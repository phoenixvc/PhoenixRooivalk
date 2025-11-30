/**
 * Base Repository
 *
 * Abstract base class for Cosmos DB repositories with common operations.
 */

import { SqlParameter } from "@azure/cosmos";
import {
  getContainer,
  getDocument,
  upsertDocument,
  deleteDocument,
  queryDocuments,
} from "../lib/cosmos";

/**
 * Base entity interface
 */
export interface BaseEntity {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: "ASC" | "DESC";
}

/**
 * Paginated result
 */
export interface PaginatedResult<T> {
  items: T[];
  total?: number;
  hasMore: boolean;
}

/**
 * Abstract base repository with common CRUD operations
 */
export abstract class BaseRepository<T extends BaseEntity> {
  constructor(protected readonly containerName: string) {}

  /**
   * Get entity by ID
   */
  async findById(id: string): Promise<T | null> {
    return getDocument<T>(this.containerName, id);
  }

  /**
   * Create or update entity
   */
  async save(entity: T): Promise<T> {
    const now = new Date().toISOString();
    const entityToSave = {
      ...entity,
      updatedAt: now,
      createdAt: entity.createdAt || now,
    };
    return upsertDocument(this.containerName, entityToSave);
  }

  /**
   * Delete entity by ID
   */
  async delete(id: string): Promise<void> {
    return deleteDocument(this.containerName, id);
  }

  /**
   * Query entities
   */
  async query(query: string, parameters?: SqlParameter[]): Promise<T[]> {
    return queryDocuments<T>(this.containerName, query, parameters);
  }

  /**
   * Find all with pagination
   */
  async findAll(options: PaginationOptions = {}): Promise<PaginatedResult<T>> {
    const {
      limit = 20,
      offset = 0,
      orderBy = "createdAt",
      orderDirection = "DESC",
    } = options;

    // Fetch one extra to check hasMore
    const query = `SELECT * FROM c ORDER BY c.${orderBy} ${orderDirection} OFFSET ${offset} LIMIT ${limit + 1}`;
    const items = await this.query(query);

    const hasMore = items.length > limit;
    return {
      items: hasMore ? items.slice(0, limit) : items,
      hasMore,
    };
  }

  /**
   * Count all entities
   */
  async count(): Promise<number> {
    const result = await this.query("SELECT VALUE COUNT(1) FROM c");
    return (result as unknown as number[])[0] || 0;
  }

  /**
   * Check if entity exists
   */
  async exists(id: string): Promise<boolean> {
    const entity = await this.findById(id);
    return entity !== null;
  }

  /**
   * Get container reference for advanced operations
   */
  protected getContainerRef() {
    return getContainer(this.containerName);
  }
}
