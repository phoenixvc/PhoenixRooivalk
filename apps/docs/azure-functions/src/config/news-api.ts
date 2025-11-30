/**
 * News API Configuration
 *
 * Configuration for external news APIs.
 * Supports NewsAPI, Bing News, and custom RSS feeds.
 */

/**
 * News API provider types
 */
export type NewsApiProvider = "newsapi" | "bing" | "rss";

/**
 * News API configuration
 */
export interface NewsApiConfig {
  provider: NewsApiProvider;
  apiKey?: string;
  baseUrl: string;
  rateLimit: number; // requests per minute
}

/**
 * Get news API configuration from environment
 */
export function getNewsApiConfig(): NewsApiConfig {
  const provider = (process.env.NEWS_API_PROVIDER ||
    "newsapi") as NewsApiProvider;

  switch (provider) {
    case "newsapi":
      return {
        provider: "newsapi",
        apiKey: process.env.NEWS_API_KEY,
        baseUrl: "https://newsapi.org/v2",
        rateLimit: 100, // NewsAPI free tier
      };
    case "bing":
      return {
        provider: "bing",
        apiKey: process.env.BING_NEWS_API_KEY,
        baseUrl: "https://api.bing.microsoft.com/v7.0/news",
        rateLimit: 1000,
      };
    case "rss":
      return {
        provider: "rss",
        baseUrl: "", // RSS feeds are defined in NEWS_RSS_FEEDS
        rateLimit: 60,
      };
    default:
      return {
        provider: "newsapi",
        apiKey: process.env.NEWS_API_KEY,
        baseUrl: "https://newsapi.org/v2",
        rateLimit: 100,
      };
  }
}

/**
 * Default search queries for counter-drone news
 */
export const NEWS_SEARCH_QUERIES = [
  "counter-drone technology",
  "anti-drone defense",
  "drone detection system",
  "UAS threat mitigation",
  "counter-UAS military",
  "drone security airport",
  "drone defense contract",
  "counter sUAS technology",
];

/**
 * High priority queries for breaking news
 */
export const HIGH_PRIORITY_QUERIES = [
  "counter-drone defense contract",
  "anti-drone system deployment",
  "drone threat incident",
  "counter-UAS regulation",
];

/**
 * Trusted news domains for filtering
 */
export const TRUSTED_DOMAINS = [
  "defensenews.com",
  "janes.com",
  "militarytimes.com",
  "c4isrnet.com",
  "defense.gov",
  "reuters.com",
  "bloomberg.com",
  "thedefensepost.com",
  "aviationweek.com",
  "dronelife.com",
  "unmannedairspace.info",
];

/**
 * RSS feed sources for news ingestion
 */
export const NEWS_RSS_FEEDS = [
  {
    name: "Defense News",
    url: "https://www.defensenews.com/rss/",
    category: "defense-tech",
  },
  {
    name: "C4ISRNET",
    url: "https://www.c4isrnet.com/rss/",
    category: "defense-tech",
  },
  {
    name: "The Defense Post",
    url: "https://www.thedefensepost.com/feed/",
    category: "defense-tech",
  },
];

/**
 * News topics for categorization
 */
export const NEWS_TOPICS = [
  { id: "counter-uas", name: "Counter-UAS Technology", priority: 1 },
  { id: "defense-contracts", name: "Defense Contracts", priority: 1 },
  { id: "drone-detection", name: "Drone Detection", priority: 2 },
  { id: "regulations", name: "Drone Regulations", priority: 2 },
  { id: "airport-security", name: "Airport Security", priority: 2 },
  { id: "military-tech", name: "Military Technology", priority: 3 },
  { id: "ai-defense", name: "AI in Defense", priority: 3 },
];
