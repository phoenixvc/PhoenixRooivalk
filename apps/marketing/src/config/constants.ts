/**
 * Application configuration constants
 */

/**
 * API base URL
 * Uses NEXT_PUBLIC_API_URL environment variable if set, otherwise falls back to localhost
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
