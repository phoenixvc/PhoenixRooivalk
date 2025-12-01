/**
 * Rate Limiting Utilities
 *
 * DRY rate limiting for Azure Functions with both in-memory
 * and Cosmos DB persistence options.
 *
 * Set RATE_LIMIT_DISTRIBUTED=true to use Cosmos DB for distributed rate limiting
 * across multiple function instances.
 */

import { HttpRequest } from "@azure/functions";
import { Errors } from "./responses";
import type { HttpResponseInit } from "@azure/functions";
import { getContainer } from "../../lib/cosmos";
import { createLogger, Logger } from "../../lib/logger";

const logger: Logger = createLogger({ feature: "rate-limit" });

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
}

/**
 * Default rate limit configurations for different features
 */
export const RateLimits = {
  /** Standard API endpoint */
  standard: { maxRequests: 60, windowMs: 60000 } as RateLimitConfig,
  /** Search/query endpoints */
  search: { maxRequests: 30, windowMs: 60000 } as RateLimitConfig,
  /** AI/expensive operations */
  ai: { maxRequests: 20, windowMs: 60000 } as RateLimitConfig,
  /** Form submissions */
  form: { maxRequests: 5, windowMs: 60000 } as RateLimitConfig,
  /** Admin operations */
  admin: { maxRequests: 100, windowMs: 60000 } as RateLimitConfig,
};

/**
 * Cosmos DB container for distributed rate limiting
 */
const RATE_LIMIT_CONTAINER = "rate_limits";

/**
 * Rate limit document stored in Cosmos DB
 */
interface RateLimitDocument {
  id: string;
  count: number;
  resetAt: number;
  ttl: number; // Cosmos DB TTL in seconds
}

/**
 * Check if distributed rate limiting is enabled
 */
function isDistributedEnabled(): boolean {
  return process.env.RATE_LIMIT_DISTRIBUTED === "true";
}

/**
 * In-memory rate limit storage (fallback)
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Clean up expired entries periodically (in-memory only)
 */
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 60000; // 1 minute

function cleanupExpired(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  lastCleanup = now;
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Check rate limit using in-memory storage
 */
function checkRateLimitInMemory(key: string, config: RateLimitConfig): boolean {
  cleanupExpired();

  const now = Date.now();
  const existing = rateLimitStore.get(key);

  if (!existing || now > existing.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return true;
  }

  if (existing.count >= config.maxRequests) {
    return false;
  }

  existing.count++;
  return true;
}

/**
 * Check rate limit using Cosmos DB (distributed)
 */
async function checkRateLimitDistributed(
  key: string,
  config: RateLimitConfig,
): Promise<boolean> {
  const now = Date.now();
  const container = getContainer(RATE_LIMIT_CONTAINER);

  try {
    // Try to read existing rate limit
    const { resource: existing } = await container
      .item(key, key)
      .read<RateLimitDocument>();

    if (!existing || now > existing.resetAt) {
      // Create new rate limit window
      const ttlSeconds = Math.ceil(config.windowMs / 1000) + 60; // Add buffer
      const doc: RateLimitDocument = {
        id: key,
        count: 1,
        resetAt: now + config.windowMs,
        ttl: ttlSeconds,
      };
      await container.items.upsert(doc);
      return true;
    }

    if (existing.count >= config.maxRequests) {
      return false;
    }

    // Increment count atomically
    const updatedDoc: RateLimitDocument = {
      ...existing,
      count: existing.count + 1,
    };
    await container.items.upsert(updatedDoc);
    return true;
  } catch (error) {
    // If Cosmos fails, fall back to in-memory
    logger.warn("Distributed rate limit failed, using in-memory fallback", {
      operation: "checkRateLimitDistributed",
      key,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return checkRateLimitInMemory(key, config);
  }
}

/**
 * Check if request is within rate limit (sync version for backwards compatibility)
 *
 * @param key - Unique identifier (e.g., userId, IP address)
 * @param config - Rate limit configuration
 * @returns true if within limit, false if exceeded
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig = RateLimits.standard,
): boolean {
  // Sync version always uses in-memory
  return checkRateLimitInMemory(key, config);
}

/**
 * Check if request is within rate limit (async version with distributed support)
 *
 * @param key - Unique identifier (e.g., userId, IP address)
 * @param config - Rate limit configuration
 * @returns Promise<true> if within limit, Promise<false> if exceeded
 */
export async function checkRateLimitAsync(
  key: string,
  config: RateLimitConfig = RateLimits.standard,
): Promise<boolean> {
  if (isDistributedEnabled()) {
    return checkRateLimitDistributed(key, config);
  }
  return checkRateLimitInMemory(key, config);
}

/**
 * Get rate limit key from request
 *
 * Uses userId if available, otherwise falls back to IP address
 */
export function getRateLimitKey(
  request: HttpRequest,
  prefix: string,
  userId?: string,
): string {
  const identifier =
    userId ||
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    "anonymous";
  return `${prefix}:${identifier}`;
}

/**
 * Rate limit middleware result
 */
export interface RateLimitResult {
  allowed: boolean;
  response?: HttpResponseInit;
}

/**
 * Apply rate limiting to request
 *
 * @param request - HTTP request
 * @param prefix - Key prefix (e.g., "news", "search")
 * @param config - Rate limit configuration
 * @param userId - Optional authenticated user ID
 * @returns Result indicating if request is allowed
 */
export function applyRateLimit(
  request: HttpRequest,
  prefix: string,
  config: RateLimitConfig = RateLimits.standard,
  userId?: string,
): RateLimitResult {
  const key = getRateLimitKey(request, prefix, userId);

  if (!checkRateLimit(key, config)) {
    return {
      allowed: false,
      response: Errors.rateLimited(),
    };
  }

  return { allowed: true };
}

/**
 * Apply rate limiting to request (async version with distributed support)
 *
 * @param request - HTTP request
 * @param prefix - Key prefix (e.g., "news", "search")
 * @param config - Rate limit configuration
 * @param userId - Optional authenticated user ID
 * @returns Promise<Result> indicating if request is allowed
 */
export async function applyRateLimitAsync(
  request: HttpRequest,
  prefix: string,
  config: RateLimitConfig = RateLimits.standard,
  userId?: string,
): Promise<RateLimitResult> {
  const key = getRateLimitKey(request, prefix, userId);

  if (!(await checkRateLimitAsync(key, config))) {
    return {
      allowed: false,
      response: Errors.rateLimited(),
    };
  }

  return { allowed: true };
}

/**
 * Get rate limit info for a key (useful for headers)
 */
export async function getRateLimitInfo(
  key: string,
  config: RateLimitConfig = RateLimits.standard,
): Promise<{ remaining: number; resetAt: number } | null> {
  if (!isDistributedEnabled()) {
    const existing = rateLimitStore.get(key);
    if (!existing) return null;
    return {
      remaining: Math.max(0, config.maxRequests - existing.count),
      resetAt: existing.resetAt,
    };
  }

  try {
    const container = getContainer(RATE_LIMIT_CONTAINER);
    const { resource } = await container
      .item(key, key)
      .read<RateLimitDocument>();

    if (!resource) return null;

    return {
      remaining: Math.max(0, config.maxRequests - resource.count),
      resetAt: resource.resetAt,
    };
  } catch (error) {
    logger.debug("Failed to get rate limit info", {
      operation: "getRateLimitInfo",
      key,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return null;
  }
}
