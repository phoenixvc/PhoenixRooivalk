/**
 * Rate Limiting Utilities
 *
 * DRY rate limiting for Azure Functions with both in-memory
 * and Cosmos DB persistence options.
 */

import { HttpRequest } from "@azure/functions";
import { Errors } from "./responses";
import type { HttpResponseInit } from "@azure/functions";

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
 * In-memory rate limit storage
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Clean up expired entries periodically
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
 * Check if request is within rate limit
 *
 * @param key - Unique identifier (e.g., userId, IP address)
 * @param config - Rate limit configuration
 * @returns true if within limit, false if exceeded
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig = RateLimits.standard,
): boolean {
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
