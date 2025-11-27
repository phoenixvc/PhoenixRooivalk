/**
 * Rate Limiting for AI Features
 *
 * Prevents abuse by limiting requests per user per feature per time window.
 */

import * as admin from "firebase-admin";

const db = admin.firestore();

// Rate limit configuration per feature
export const RATE_LIMITS: Record<
  string,
  { maxRequests: number; windowMs: number }
> = {
  competitor: { maxRequests: 10, windowMs: 60 * 60 * 1000 }, // 10/hour
  swot: { maxRequests: 15, windowMs: 60 * 60 * 1000 }, // 15/hour
  recommendations: { maxRequests: 30, windowMs: 60 * 60 * 1000 }, // 30/hour
  improvement: { maxRequests: 10, windowMs: 60 * 60 * 1000 }, // 10/hour
  market: { maxRequests: 10, windowMs: 60 * 60 * 1000 }, // 10/hour
  summary: { maxRequests: 20, windowMs: 60 * 60 * 1000 }, // 20/hour
  research: { maxRequests: 20, windowMs: 60 * 60 * 1000 }, // 20/hour
  ask: { maxRequests: 50, windowMs: 60 * 60 * 1000 }, // 50/hour for RAG
};

/**
 * Check if user has exceeded rate limit for a feature
 * Uses Firestore transaction to prevent race conditions.
 * @returns true if request can proceed, false if rate limited
 */
export async function checkRateLimit(
  userId: string,
  feature: string,
): Promise<boolean> {
  const config = RATE_LIMITS[feature] || {
    maxRequests: 20,
    windowMs: 60 * 60 * 1000,
  };
  const { maxRequests, windowMs } = config;

  const rateLimitRef = db
    .collection("ai_rate_limits")
    .doc(`${userId}_${feature}`);

  return db.runTransaction(async (transaction) => {
    const doc = await transaction.get(rateLimitRef);
    const now = Date.now();

    if (doc.exists) {
      const data = doc.data();
      const windowStart = data?.windowStart || 0;
      const count = data?.count || 0;

      if (now - windowStart < windowMs) {
        if (count >= maxRequests) {
          return false; // Rate limited
        }
        transaction.update(rateLimitRef, { count: count + 1 });
      } else {
        // New window - reset windowStart and count
        transaction.set(rateLimitRef, { windowStart: now, count: 1 });
      }
    } else {
      // Document doesn't exist - create it
      transaction.set(rateLimitRef, { windowStart: now, count: 1 });
    }

    return true;
  });
}

/**
 * Log AI usage for analytics and billing tracking
 */
export async function logUsage(
  userId: string,
  feature: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await db.collection("ai_usage").add({
    userId,
    feature,
    ...metadata,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
}
