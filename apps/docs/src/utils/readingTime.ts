/**
 * Reading Time Utility
 *
 * Calculates estimated reading time for articles based on word count.
 */

/** Average words per minute for reading */
const WORDS_PER_MINUTE = 200;

/**
 * Calculate estimated reading time in minutes
 * @param content - The article content (string or HTML)
 * @returns Reading time in minutes (minimum 1)
 */
export function calculateReadingTime(content: string): number {
  if (!content) return 1;

  // Strip HTML tags for accurate word count, replacing recursively
  let prev;
  let text = content;
  do {
    prev = text;
    text = text.replace(/<[^>]*>/g, "");
  } while (text !== prev);
  text = text.trim();

  // Count words (split by whitespace)
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  // Calculate minutes, minimum 1
  const minutes = Math.ceil(wordCount / WORDS_PER_MINUTE);

  return Math.max(1, minutes);
}

/**
 * Format reading time for display
 * @param content - The article content
 * @returns Formatted string like "3 min read"
 */
export function formatReadingTime(content: string): string {
  const minutes = calculateReadingTime(content);
  return `${minutes} min read`;
}

/**
 * Calculate reading time from word count directly
 * @param wordCount - Number of words
 * @returns Reading time in minutes
 */
export function readingTimeFromWordCount(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
}
