/**
 * Offline Articles Hook
 *
 * Provides functionality to cache articles for offline reading.
 * Features:
 * - Download articles for offline access
 * - Track cached articles
 * - Sync when back online
 * - Storage usage info
 * - AI-powered semantic bundles (Wave 2)
 */

import { useState, useEffect, useCallback } from "react";
import { aiService } from "../services/aiService";

export interface CachedArticle {
  id: string;
  title: string;
  url?: string;
  imageUrl?: string;
  cachedAt: number;
  size?: number;
}

/**
 * Result of downloading a semantic bundle
 */
export interface BundleDownloadResult {
  primaryArticle: CachedArticle;
  relatedArticles: CachedArticle[];
  totalCached: number;
  failedCount: number;
}

interface UseOfflineArticlesReturn {
  cachedArticles: CachedArticle[];
  isCaching: boolean;
  isSupported: boolean;
  cacheArticle: (article: CachedArticle) => Promise<boolean>;
  uncacheArticle: (articleId: string) => Promise<boolean>;
  isArticleCached: (articleId: string) => boolean;
  getCacheSize: () => Promise<{ used: number; quota: number } | null>;
  clearAllCached: () => Promise<void>;
  // AI-powered semantic bundles (Wave 2)
  downloadRelatedBundle: (
    article: CachedArticle,
    limit?: number,
  ) => Promise<BundleDownloadResult>;
  isDownloadingBundle: boolean;
}

/**
 * Check if service workers are supported
 */
function isServiceWorkerSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "caches" in window
  );
}

/**
 * Get the active service worker
 */
async function getServiceWorker(): Promise<ServiceWorker | null> {
  if (!isServiceWorkerSupported()) return null;

  try {
    const registration = await navigator.serviceWorker.ready;
    return registration.active;
  } catch {
    return null;
  }
}

/**
 * Offline Articles Hook
 */
export function useOfflineArticles(): UseOfflineArticlesReturn {
  const [cachedArticles, setCachedArticles] = useState<CachedArticle[]>([]);
  const [isCaching, setIsCaching] = useState(false);
  const [isDownloadingBundle, setIsDownloadingBundle] = useState(false);
  const isSupported = isServiceWorkerSupported();

  // Load cached articles on mount
  useEffect(() => {
    if (!isSupported) return;

    loadCachedArticles();

    // Listen for cache updates from service worker
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "ARTICLE_CACHED") {
        loadCachedArticles();
      }
      if (event.data?.type === "ARTICLE_UNCACHED") {
        loadCachedArticles();
      }
    };

    navigator.serviceWorker.addEventListener("message", handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener("message", handleMessage);
    };
  }, [isSupported]);

  // Load cached articles from cache storage
  const loadCachedArticles = useCallback(async () => {
    if (!isSupported) return;

    try {
      const cache = await caches.open("phoenix-articles-v1");
      const keys = await cache.keys();

      const articles: CachedArticle[] = [];
      for (const request of keys) {
        if (
          request.url.includes("/offline/articles/") &&
          request.url.includes("/metadata")
        ) {
          const response = await cache.match(request);
          if (response) {
            const article = await response.json();
            articles.push(article);
          }
        }
      }

      setCachedArticles(articles.sort((a, b) => b.cachedAt - a.cachedAt));
    } catch (error) {
      console.error("Failed to load cached articles:", error);
    }
  }, [isSupported]);

  // Cache an article
  const cacheArticle = useCallback(
    async (article: CachedArticle): Promise<boolean> => {
      if (!isSupported) return false;

      setIsCaching(true);

      try {
        const sw = await getServiceWorker();
        if (!sw) {
          throw new Error("Service worker not available");
        }

        // Add caching timestamp
        const articleWithTimestamp = {
          ...article,
          cachedAt: Date.now(),
        };

        sw.postMessage({
          type: "CACHE_ARTICLE",
          article: articleWithTimestamp,
        });

        // Optimistically update local state
        setCachedArticles((prev) => {
          const filtered = prev.filter((a) => a.id !== article.id);
          return [articleWithTimestamp, ...filtered];
        });

        setIsCaching(false);
        return true;
      } catch (error) {
        console.error("Failed to cache article:", error);
        setIsCaching(false);
        return false;
      }
    },
    [isSupported],
  );

  // Remove article from cache
  const uncacheArticle = useCallback(
    async (articleId: string): Promise<boolean> => {
      if (!isSupported) return false;

      try {
        const sw = await getServiceWorker();
        if (!sw) {
          throw new Error("Service worker not available");
        }

        sw.postMessage({
          type: "UNCACHE_ARTICLE",
          articleId,
        });

        // Optimistically update local state
        setCachedArticles((prev) => prev.filter((a) => a.id !== articleId));

        return true;
      } catch (error) {
        console.error("Failed to uncache article:", error);
        return false;
      }
    },
    [isSupported],
  );

  // Check if article is cached
  const isArticleCached = useCallback(
    (articleId: string): boolean => {
      return cachedArticles.some((a) => a.id === articleId);
    },
    [cachedArticles],
  );

  // Get cache storage usage
  const getCacheSize = useCallback(async (): Promise<{
    used: number;
    quota: number;
  } | null> => {
    if (!isSupported || !navigator.storage?.estimate) return null;

    try {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0,
      };
    } catch {
      return null;
    }
  }, [isSupported]);

  // Clear all cached articles
  const clearAllCached = useCallback(async (): Promise<void> => {
    if (!isSupported) return;

    try {
      await caches.delete("phoenix-articles-v1");
      setCachedArticles([]);
    } catch (error) {
      console.error("Failed to clear cache:", error);
    }
  }, [isSupported]);

  /**
   * AI-powered: Download article with semantically related articles
   * Uses vector search to find related content for a complete offline bundle
   */
  const downloadRelatedBundle = useCallback(
    async (
      article: CachedArticle,
      limit: number = 5,
    ): Promise<BundleDownloadResult> => {
      setIsDownloadingBundle(true);

      const result: BundleDownloadResult = {
        primaryArticle: article,
        relatedArticles: [],
        totalCached: 0,
        failedCount: 0,
      };

      try {
        // First, cache the primary article
        const primaryCached = await cacheArticle(article);
        if (primaryCached) {
          result.totalCached++;
        } else {
          result.failedCount++;
        }

        // Use AI to find semantically related articles
        const recommendations = await aiService.getReadingRecommendations(
          article.id,
        );

        if (recommendations.recommendations?.length > 0) {
          // Cache related articles
          const relatedPromises = recommendations.recommendations
            .slice(0, limit)
            .map(async (rec) => {
              const relatedArticle: CachedArticle = {
                id: rec.docId,
                title: rec.reason || rec.docId,
                cachedAt: Date.now(),
              };

              const cached = await cacheArticle(relatedArticle);
              if (cached) {
                result.relatedArticles.push(relatedArticle);
                result.totalCached++;
              } else {
                result.failedCount++;
              }
              return cached;
            });

          await Promise.all(relatedPromises);
        }
      } catch (error) {
        console.error("Failed to download related bundle:", error);
      } finally {
        setIsDownloadingBundle(false);
      }

      return result;
    },
    [cacheArticle],
  );

  return {
    cachedArticles,
    isCaching,
    isSupported,
    cacheArticle,
    uncacheArticle,
    isArticleCached,
    getCacheSize,
    clearAllCached,
    // AI-powered semantic bundles
    downloadRelatedBundle,
    isDownloadingBundle,
  };
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default useOfflineArticles;
