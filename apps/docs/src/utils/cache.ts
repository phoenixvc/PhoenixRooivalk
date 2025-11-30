/**
 * Cache Utility
 *
 * Provides in-memory and localStorage caching with TTL support.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Simple in-memory cache with TTL
 */
class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>();

  /**
   * Get an item from cache
   * @returns The cached value or undefined if expired/not found
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return undefined;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.data;
  }

  /**
   * Set an item in cache
   * @param key - Cache key
   * @param data - Data to cache
   * @param ttl - Time-to-live in milliseconds (default: 5 minutes)
   */
  set<T>(key: string, data: T, ttl = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Delete an item from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all items from cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear expired items from cache
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * LocalStorage cache with TTL
 */
class StorageCache {
  private prefix: string;

  constructor(prefix = "cache_") {
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  /**
   * Get an item from localStorage cache
   * @returns The cached value or undefined if expired/not found
   */
  get<T>(key: string): T | undefined {
    if (typeof window === "undefined") return undefined;

    try {
      const item = localStorage.getItem(this.getKey(key));
      if (!item) return undefined;

      const entry: CacheEntry<T> = JSON.parse(item);
      const now = Date.now();

      if (now - entry.timestamp > entry.ttl) {
        localStorage.removeItem(this.getKey(key));
        return undefined;
      }

      return entry.data;
    } catch {
      return undefined;
    }
  }

  /**
   * Set an item in localStorage cache
   * @param key - Cache key
   * @param data - Data to cache
   * @param ttl - Time-to-live in milliseconds (default: 5 minutes)
   */
  set<T>(key: string, data: T, ttl = 5 * 60 * 1000): void {
    if (typeof window === "undefined") return;

    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      localStorage.setItem(this.getKey(key), JSON.stringify(entry));
    } catch {
      // localStorage might be full or disabled
    }
  }

  /**
   * Delete an item from localStorage cache
   */
  delete(key: string): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(this.getKey(key));
  }

  /**
   * Clear all items with this prefix from localStorage
   */
  clear(): void {
    if (typeof window === "undefined") return;

    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  }
}

// Export singleton instances
export const memoryCache = new MemoryCache();
export const storageCache = new StorageCache("phoenix_");

/**
 * Create a cached version of an async function
 * @param fn - The async function to cache
 * @param keyFn - Function to generate cache key from arguments
 * @param ttl - Cache TTL in milliseconds
 * @returns Cached version of the function
 */
export function withCache<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  keyFn: (...args: TArgs) => string,
  ttl = 5 * 60 * 1000,
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    const key = keyFn(...args);

    // Check memory cache first
    const cached = memoryCache.get<TResult>(key);
    if (cached !== undefined) {
      return cached;
    }

    // Fetch and cache
    const result = await fn(...args);
    memoryCache.set(key, result, ttl);

    return result;
  };
}
