/**
 * RSS Feed Parser Service
 *
 * Fetches and parses RSS/Atom feeds for news ingestion.
 */

import { createLogger, Logger } from "../lib/logger";
import { generateId } from "../lib/utils/ids";

const logger: Logger = createLogger({ feature: "rss-parser" });

/**
 * RSS feed item
 */
export interface RSSItem {
  id: string;
  title: string;
  link: string;
  description?: string;
  content?: string;
  pubDate?: string;
  author?: string;
  categories?: string[];
  imageUrl?: string;
}

/**
 * RSS feed metadata
 */
export interface RSSFeed {
  title: string;
  link: string;
  description?: string;
  language?: string;
  lastBuildDate?: string;
  items: RSSItem[];
}

/**
 * Parse XML text content
 */
function getTextContent(element: string, xml: string): string | undefined {
  const regex = new RegExp(`<${element}[^>]*>([\\s\\S]*?)<\\/${element}>`, "i");
  const match = xml.match(regex);
  if (!match) return undefined;

  // Remove CDATA wrapper if present
  let content = match[1];
  const cdataMatch = content.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
  if (cdataMatch) {
    content = cdataMatch[1];
  }

  // Decode HTML entities
  return decodeHtmlEntities(content.trim());
}

/**
 * Get attribute value from element
 */
function getAttribute(
  element: string,
  attribute: string,
  xml: string,
): string | undefined {
  const regex = new RegExp(
    `<${element}[^>]*\\s${attribute}=["']([^"']*)["'][^>]*>`,
    "i",
  );
  const match = xml.match(regex);
  return match ? match[1] : undefined;
}

/**
 * Decode common HTML entities
 */
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&apos;": "'",
    "&#39;": "'",
    "&nbsp;": " ",
  };

  let result = text;
  for (const [entity, char] of Object.entries(entities)) {
    result = result.replace(new RegExp(entity, "g"), char);
  }

  // Handle numeric entities
  result = result.replace(/&#(\d+);/g, (_, num) =>
    String.fromCharCode(parseInt(num, 10)),
  );
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16)),
  );

  return result;
}

/**
 * Extract image URL from content
 */
function extractImageUrl(content: string): string | undefined {
  // Try to find image in enclosure
  const enclosureMatch = content.match(
    /<enclosure[^>]+url=["']([^"']+)["'][^>]*type=["']image/i,
  );
  if (enclosureMatch) return enclosureMatch[1];

  // Try to find media:content
  const mediaMatch = content.match(
    /<media:content[^>]+url=["']([^"']+)["'][^>]*>/i,
  );
  if (mediaMatch) return mediaMatch[1];

  // Try to find first img tag
  const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch) return imgMatch[1];

  return undefined;
}

/**
 * Parse RSS 2.0 feed
 */
function parseRSS2(xml: string): RSSFeed {
  const channel = xml.match(/<channel>([\s\S]*?)<\/channel>/i)?.[1] || "";

  const feed: RSSFeed = {
    title: getTextContent("title", channel) || "Unknown Feed",
    link: getTextContent("link", channel) || "",
    description: getTextContent("description", channel),
    language: getTextContent("language", channel),
    lastBuildDate: getTextContent("lastBuildDate", channel),
    items: [],
  };

  // Extract items
  const itemMatches = channel.matchAll(/<item>([\s\S]*?)<\/item>/gi);

  for (const match of itemMatches) {
    const itemXml = match[1];

    const item: RSSItem = {
      id: getTextContent("guid", itemXml) || generateId("rss"),
      title: getTextContent("title", itemXml) || "Untitled",
      link: getTextContent("link", itemXml) || "",
      description: getTextContent("description", itemXml),
      content:
        getTextContent("content:encoded", itemXml) ||
        getTextContent("content", itemXml),
      pubDate: getTextContent("pubDate", itemXml),
      author:
        getTextContent("author", itemXml) ||
        getTextContent("dc:creator", itemXml),
      imageUrl: extractImageUrl(itemXml),
    };

    // Extract categories
    const categoryMatches = itemXml.matchAll(
      /<category[^>]*>([^<]+)<\/category>/gi,
    );
    item.categories = [...categoryMatches].map((m) =>
      decodeHtmlEntities(m[1].trim()),
    );

    feed.items.push(item);
  }

  return feed;
}

/**
 * Parse Atom feed
 */
function parseAtom(xml: string): RSSFeed {
  const feed: RSSFeed = {
    title: getTextContent("title", xml) || "Unknown Feed",
    link: getAttribute("link", "href", xml) || "",
    description: getTextContent("subtitle", xml),
    lastBuildDate: getTextContent("updated", xml),
    items: [],
  };

  // Extract entries
  const entryMatches = xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi);

  for (const match of entryMatches) {
    const entryXml = match[1];

    const item: RSSItem = {
      id: getTextContent("id", entryXml) || generateId("atom"),
      title: getTextContent("title", entryXml) || "Untitled",
      link: getAttribute("link", "href", entryXml) || "",
      description: getTextContent("summary", entryXml),
      content: getTextContent("content", entryXml),
      pubDate:
        getTextContent("published", entryXml) ||
        getTextContent("updated", entryXml),
      author: getTextContent("name", entryXml),
      imageUrl: extractImageUrl(entryXml),
    };

    // Extract categories
    const categoryMatches = entryXml.matchAll(
      /<category[^>]+term=["']([^"']+)["']/gi,
    );
    item.categories = [...categoryMatches].map((m) => m[1]);

    feed.items.push(item);
  }

  return feed;
}

/**
 * Detect feed type and parse accordingly
 */
function parseFeed(xml: string): RSSFeed {
  // Check for Atom namespace in feed element
  const atomFeedMatch = xml.match(
    /<feed[^>]*xmlns\s*=\s*["']http:\/\/www\.w3\.org\/2005\/Atom["'][^>]*>/i,
  );
  if (atomFeedMatch) {
    return parseAtom(xml);
  }

  // Check for RSS root element
  const rssMatch = xml.match(/<rss[^>]*version\s*=\s*["'][\d.]+["'][^>]*>/i);
  if (rssMatch) {
    return parseRSS2(xml);
  }

  // Check for channel element (RSS 1.0/2.0)
  if (xml.includes("<channel>") || xml.includes("<channel ")) {
    return parseRSS2(xml);
  }

  // Default to RSS parsing
  return parseRSS2(xml);
}

/**
 * Fetch and parse RSS feed
 */
export async function fetchRSSFeed(
  url: string,
  options?: { timeout?: number },
): Promise<RSSFeed> {
  const timeout = options?.timeout || 10000;

  logger.info("Fetching RSS feed", { url });

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      headers: {
        Accept:
          "application/rss+xml, application/atom+xml, application/xml, text/xml",
        "User-Agent": "Phoenix-Rooivalk-Bot/1.0",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const xml = await response.text();
    const feed = parseFeed(xml);

    logger.info("RSS feed parsed", {
      url,
      title: feed.title,
      itemCount: feed.items.length,
    });

    return feed;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error("Failed to fetch RSS feed", { url, error: errorMessage });
    throw new Error(`Failed to fetch RSS feed: ${errorMessage}`);
  }
}

/**
 * Fetch multiple RSS feeds in parallel
 */
export async function fetchMultipleFeeds(
  urls: string[],
  options?: { timeout?: number; concurrency?: number },
): Promise<Map<string, RSSFeed | Error>> {
  const results = new Map<string, RSSFeed | Error>();
  const concurrency = options?.concurrency || 5;

  // Process in batches
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);

    const batchResults = await Promise.allSettled(
      batch.map((url) => fetchRSSFeed(url, options)),
    );

    batchResults.forEach((result, index) => {
      const url = batch[index];
      if (result.status === "fulfilled") {
        results.set(url, result.value);
      } else {
        results.set(url, new Error(result.reason?.message || "Unknown error"));
      }
    });
  }

  return results;
}

/**
 * Convert RSS items to news article format
 */
export function rssItemsToArticles(
  items: RSSItem[],
  feedSource: string,
  defaultCategory?: string,
): Array<{
  id: string;
  title: string;
  content: string;
  summary: string;
  url: string;
  source: string;
  category: string;
  author?: string;
  imageUrl?: string;
  publishedAt: string;
}> {
  return items.map((item) => ({
    id: generateId("news"),
    title: item.title,
    content: item.content || item.description || "",
    summary: item.description || item.content?.substring(0, 200) || "",
    url: item.link,
    source: feedSource,
    category: item.categories?.[0] || defaultCategory || "general",
    author: item.author,
    imageUrl: item.imageUrl,
    publishedAt: item.pubDate
      ? new Date(item.pubDate).toISOString()
      : new Date().toISOString(),
  }));
}
