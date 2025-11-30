/**
 * ID Generation Utilities
 *
 * Provides secure, collision-resistant ID generation.
 */

import { v4 as uuidv4 } from "uuid";
import * as crypto from "crypto";

/**
 * Generate a unique ID with optional prefix
 */
export function generateId(prefix?: string): string {
  const id = uuidv4();
  return prefix ? `${prefix}_${id}` : id;
}

/**
 * Generate a short ID (configurable length, default 8 characters)
 */
export function generateShortId(length: number = 8): string {
  const bytes = Math.ceil(length / 2);
  return crypto.randomBytes(bytes).toString("hex").slice(0, length);
}

/**
 * Generate a numeric ID of specified length
 */
export function generateNumericId(length: number = 6): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 10).toString();
  }
  return result;
}

/**
 * Generate a document ID from path
 */
export function generateDocId(path: string): string {
  return crypto.createHash("sha256").update(path).digest("hex").slice(0, 16);
}

/**
 * Generate a content hash for deduplication
 */
export function generateContentHash(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

/**
 * Generate a timestamped ID with prefix
 */
export function generateTimestampedId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(4).toString("hex");
  return `${prefix}_${timestamp}_${random}`;
}
