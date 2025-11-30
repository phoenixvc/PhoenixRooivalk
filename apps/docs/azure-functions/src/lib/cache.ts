/**
 * Query Cache for Phoenix Rooivalk Documentation AI
 *
 * Implements caching for:
 * - Embeddings (hash-based, long TTL)
 * - RAG query results (short TTL)
 * - Suggested questions (per page, medium TTL)
 *
 * Uses Cosmos DB as cache storage with automatic TTL cleanup
 */

import * as crypto from "crypto";
import { getContainer, queryDocuments, upsertDocument } from "./cosmos";
import { createLogger, Logger } from "./logger";

// Module-level logger
const logger: Logger = createLogger({ feature: "cache" });

// Cache configuration
export const CACHE_CONFIG = {
  containers: {
    embeddings: "cache_embeddings",
    queries: "cache_queries",
    suggestions: "cache_suggestions",
  },
  ttl: {
    embeddings: 7 * 24 * 60 * 60 * 1000, // 7 days (embeddings rarely change)
    queries: 1 * 60 * 60 * 1000, // 1 hour (query results)
    suggestions: 24 * 60 * 60 * 1000, // 24 hours (suggested questions)
  },
  maxCacheSize: 10000, // Maximum entries per collection
};

/**
 * Generate cache key from input
 */
export function generateCacheKey(input: string, prefix?: string): string {
  const hash = crypto.createHash("sha256").update(input).digest("hex");
  return prefix ? `${prefix}_${hash.slice(0, 16)}` : hash.slice(0, 16);
}

/**
 * Cache entry interface
 */
interface CacheEntry<T> {
  id: string;
  key: string;
  value: T;
  createdAt: string;
  expiresAt: string;
  hitCount: number;
  lastAccessedAt: string;
}

/**
 * Get from cache
 */
export async function getFromCache<T>(
  collection: keyof typeof CACHE_CONFIG.containers,
  key: string,
): Promise<T | null> {
  try {
    const containerName = CACHE_CONFIG.containers[collection];
    const container = getContainer(containerName);

    const { resource } = await container.item(key, key).read<CacheEntry<T>>();

    if (!resource) {
      return null;
    }

    // Check if expired
    const now = Date.now();
    if (new Date(resource.expiresAt).getTime() < now) {
      // Delete expired entry
      await container.item(key, key).delete();
      return null;
    }

    // Update hit count and last accessed (non-blocking)
    const updatedEntry: CacheEntry<T> = {
      ...resource,
      hitCount: resource.hitCount + 1,
      lastAccessedAt: new Date().toISOString(),
    };
    container.items.upsert(updatedEntry).catch(() => {
      /* ignore update errors */
    });

    return resource.value;
  } catch (error: unknown) {
    if ((error as { code?: number })?.code === 404) return null;
    logger.warn("Cache get error", {
      operation: "getFromCache",
      collection,
      key,
    });
    return null;
  }
}

/**
 * Set in cache
 */
export async function setInCache<T>(
  collection: keyof typeof CACHE_CONFIG.containers,
  key: string,
  value: T,
  ttlOverride?: number,
): Promise<void> {
  try {
    const containerName = CACHE_CONFIG.containers[collection];
    const ttl = ttlOverride || CACHE_CONFIG.ttl[collection];
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttl);

    const entry: CacheEntry<T> = {
      id: key,
      key,
      value,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      hitCount: 0,
      lastAccessedAt: now.toISOString(),
    };

    await upsertDocument(containerName, entry);
  } catch (error) {
    logger.warn("Cache set error", {
      operation: "setInCache",
      collection,
      key,
    });
    // Don't throw - cache failures shouldn't break the application
  }
}

/**
 * Delete from cache
 */
export async function deleteFromCache(
  collection: keyof typeof CACHE_CONFIG.containers,
  key: string,
): Promise<void> {
  try {
    const containerName = CACHE_CONFIG.containers[collection];
    const container = getContainer(containerName);
    await container.item(key, key).delete();
  } catch (error) {
    logger.warn("Cache delete error", {
      operation: "deleteFromCache",
      collection,
      key,
    });
  }
}

/**
 * Clear all cache for a collection
 */
export async function clearCache(
  collection: keyof typeof CACHE_CONFIG.containers,
): Promise<number> {
  const containerName = CACHE_CONFIG.containers[collection];
  const items = await queryDocuments<{ id: string }>(
    containerName,
    "SELECT c.id FROM c",
  );

  const container = getContainer(containerName);
  let deletedCount = 0;

  for (const item of items) {
    try {
      await container.item(item.id, item.id).delete();
      deletedCount++;
    } catch (error) {
      logger.warn("Failed to delete cache item", {
        operation: "clearCache",
        itemId: item.id,
      });
    }
  }

  return deletedCount;
}

/**
 * Cached embedding lookup
 */
export async function getCachedEmbedding(
  text: string,
): Promise<number[] | null> {
  const key = generateCacheKey(text, "emb");
  return getFromCache<number[]>("embeddings", key);
}

/**
 * Cache embedding
 */
export async function cacheEmbedding(
  text: string,
  embedding: number[],
): Promise<void> {
  const key = generateCacheKey(text, "emb");
  await setInCache("embeddings", key, embedding);
}

/**
 * Cached query result lookup
 */
export interface CachedQueryResult {
  answer: string;
  sources: Array<{
    docId: string;
    title: string;
    section: string;
    relevance: number;
  }>;
  confidence: "high" | "medium" | "low";
}

export async function getCachedQuery(
  question: string,
  category?: string,
): Promise<CachedQueryResult | null> {
  const key = generateCacheKey(`${question}_${category || "all"}`, "query");
  return getFromCache<CachedQueryResult>("queries", key);
}

/**
 * Cache query result
 */
export async function cacheQueryResult(
  question: string,
  category: string | undefined,
  result: CachedQueryResult,
): Promise<void> {
  const key = generateCacheKey(`${question}_${category || "all"}`, "query");
  await setInCache("queries", key, result);
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  embeddings: { count: number; avgHits: number };
  queries: { count: number; avgHits: number };
  suggestions: { count: number; avgHits: number };
}> {
  const stats: Record<string, { count: number; avgHits: number }> = {};

  for (const [key, containerName] of Object.entries(CACHE_CONFIG.containers)) {
    try {
      const items = await queryDocuments<{ hitCount: number }>(
        containerName,
        "SELECT c.hitCount FROM c",
      );

      let totalHits = 0;
      items.forEach((item) => {
        totalHits += item.hitCount || 0;
      });

      stats[key] = {
        count: items.length,
        avgHits: items.length > 0 ? totalHits / items.length : 0,
      };
    } catch (error) {
      logger.warn("Failed to get cache stats", {
        operation: "getCacheStats",
        collection: key,
      });
      stats[key] = { count: 0, avgHits: 0 };
    }
  }

  return stats as {
    embeddings: { count: number; avgHits: number };
    queries: { count: number; avgHits: number };
    suggestions: { count: number; avgHits: number };
  };
}

/**
 * Cleanup expired cache entries
 * Can be called from a timer trigger or manually
 */
export async function cleanupExpiredCache(): Promise<number> {
  const now = new Date().toISOString();
  let totalDeleted = 0;

  for (const containerName of Object.values(CACHE_CONFIG.containers)) {
    try {
      const expiredItems = await queryDocuments<{ id: string }>(
        containerName,
        "SELECT c.id FROM c WHERE c.expiresAt < @now",
        [{ name: "@now", value: now }],
      );

      const container = getContainer(containerName);
      for (const item of expiredItems) {
        try {
          await container.item(item.id, item.id).delete();
          totalDeleted++;
        } catch (error) {
          logger.warn("Failed to delete expired cache item", {
            operation: "cleanupExpiredCache",
            itemId: item.id,
          });
        }
      }
    } catch (error) {
      logger.warn("Failed to cleanup cache", {
        operation: "cleanupExpiredCache",
        containerName,
      });
    }
  }

  logger.info("Cache cleanup complete", {
    operation: "cleanupExpiredCache",
    totalDeleted,
  });
  return totalDeleted;
}
