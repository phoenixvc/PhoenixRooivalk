/**
 * Query Cache for Phoenix Rooivalk Documentation AI
 *
 * Implements caching for:
 * - Embeddings (hash-based, long TTL)
 * - RAG query results (short TTL)
 * - Suggested questions (per page, medium TTL)
 *
 * Uses Firestore as cache storage with automatic TTL cleanup
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as crypto from "crypto";

const db = admin.firestore();

// Cache configuration
export const CACHE_CONFIG = {
  collections: {
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
  key: string;
  value: T;
  createdAt: admin.firestore.Timestamp;
  expiresAt: admin.firestore.Timestamp;
  hitCount: number;
  lastAccessedAt: admin.firestore.Timestamp;
}

/**
 * Get from cache
 */
export async function getFromCache<T>(
  collection: keyof typeof CACHE_CONFIG.collections,
  key: string
): Promise<T | null> {
  try {
    const collectionName = CACHE_CONFIG.collections[collection];
    const doc = await db.collection(collectionName).doc(key).get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data() as CacheEntry<T>;

    // Check if expired
    const now = admin.firestore.Timestamp.now();
    if (data.expiresAt.toMillis() < now.toMillis()) {
      // Delete expired entry
      await doc.ref.delete();
      return null;
    }

    // Update hit count and last accessed (non-blocking)
    doc.ref
      .update({
        hitCount: admin.firestore.FieldValue.increment(1),
        lastAccessedAt: now,
      })
      .catch(() => {
        /* ignore update errors */
      });

    return data.value;
  } catch (error) {
    functions.logger.warn("Cache get error:", error);
    return null;
  }
}

/**
 * Set in cache
 */
export async function setInCache<T>(
  collection: keyof typeof CACHE_CONFIG.collections,
  key: string,
  value: T,
  ttlOverride?: number
): Promise<void> {
  try {
    const collectionName = CACHE_CONFIG.collections[collection];
    const ttl = ttlOverride || CACHE_CONFIG.ttl[collection];
    const now = admin.firestore.Timestamp.now();
    const expiresAt = admin.firestore.Timestamp.fromMillis(
      now.toMillis() + ttl
    );

    const entry: CacheEntry<T> = {
      key,
      value,
      createdAt: now,
      expiresAt,
      hitCount: 0,
      lastAccessedAt: now,
    };

    await db.collection(collectionName).doc(key).set(entry);
  } catch (error) {
    functions.logger.warn("Cache set error:", error);
    // Don't throw - cache failures shouldn't break the application
  }
}

/**
 * Delete from cache
 */
export async function deleteFromCache(
  collection: keyof typeof CACHE_CONFIG.collections,
  key: string
): Promise<void> {
  try {
    const collectionName = CACHE_CONFIG.collections[collection];
    await db.collection(collectionName).doc(key).delete();
  } catch (error) {
    functions.logger.warn("Cache delete error:", error);
  }
}

/**
 * Clear all cache for a collection
 */
export async function clearCache(
  collection: keyof typeof CACHE_CONFIG.collections
): Promise<number> {
  const collectionName = CACHE_CONFIG.collections[collection];
  const snapshot = await db.collection(collectionName).get();

  let deletedCount = 0;
  const batchSize = 500;

  for (let i = 0; i < snapshot.docs.length; i += batchSize) {
    const batch = db.batch();
    snapshot.docs.slice(i, i + batchSize).forEach((doc) => {
      batch.delete(doc.ref);
      deletedCount++;
    });
    await batch.commit();
  }

  return deletedCount;
}

/**
 * Cached embedding lookup
 */
export async function getCachedEmbedding(
  text: string
): Promise<number[] | null> {
  const key = generateCacheKey(text, "emb");
  return getFromCache<number[]>("embeddings", key);
}

/**
 * Cache embedding
 */
export async function cacheEmbedding(
  text: string,
  embedding: number[]
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
  category?: string
): Promise<CachedQueryResult | null> {
  const key = generateCacheKey(
    `${question}_${category || "all"}`,
    "query"
  );
  return getFromCache<CachedQueryResult>("queries", key);
}

/**
 * Cache query result
 */
export async function cacheQueryResult(
  question: string,
  category: string | undefined,
  result: CachedQueryResult
): Promise<void> {
  const key = generateCacheKey(
    `${question}_${category || "all"}`,
    "query"
  );
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
  const stats: Record<
    string,
    { count: number; avgHits: number }
  > = {};

  for (const [key, collectionName] of Object.entries(CACHE_CONFIG.collections)) {
    const snapshot = await db.collection(collectionName).get();
    let totalHits = 0;

    snapshot.docs.forEach((doc) => {
      totalHits += doc.data().hitCount || 0;
    });

    stats[key] = {
      count: snapshot.size,
      avgHits: snapshot.size > 0 ? totalHits / snapshot.size : 0,
    };
  }

  return stats as {
    embeddings: { count: number; avgHits: number };
    queries: { count: number; avgHits: number };
    suggestions: { count: number; avgHits: number };
  };
}

/**
 * Scheduled function to clean up expired cache entries
 * Runs daily at 2:00 AM UTC
 */
export const cleanupExpiredCache = functions.pubsub
  .schedule("0 2 * * *")
  .timeZone("UTC")
  .onRun(async () => {
    functions.logger.info("Starting cache cleanup");

    const now = admin.firestore.Timestamp.now();
    let totalDeleted = 0;

    for (const collectionName of Object.values(CACHE_CONFIG.collections)) {
      const snapshot = await db
        .collection(collectionName)
        .where("expiresAt", "<", now)
        .limit(500)
        .get();

      if (!snapshot.empty) {
        const batch = db.batch();
        snapshot.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
        totalDeleted += snapshot.size;
      }
    }

    functions.logger.info(`Cache cleanup complete: ${totalDeleted} entries removed`);
    return null;
  });

/**
 * Cloud function to get cache stats (admin only)
 */
export const getAICacheStats = functions.https.onCall(async (_data, context) => {
  if (!context.auth?.token.admin) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Admin access required"
    );
  }

  return getCacheStats();
});

/**
 * Cloud function to clear cache (admin only)
 */
export const clearAICache = functions.https.onCall(async (data, context) => {
  if (!context.auth?.token.admin) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Admin access required"
    );
  }

  const collection = data.collection as keyof typeof CACHE_CONFIG.collections;

  if (!collection || !CACHE_CONFIG.collections[collection]) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Valid collection required: embeddings, queries, or suggestions"
    );
  }

  const deleted = await clearCache(collection);
  return { deleted, collection };
});
