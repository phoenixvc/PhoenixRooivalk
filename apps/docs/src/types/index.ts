/**
 * Types Index
 *
 * Central export point for all TypeScript types.
 */

// Documentation frontmatter types
export type { DocFrontmatter } from "./frontmatter";
export { DIFFICULTY_CONFIG } from "./frontmatter";

// News types
export type {
  NewsArticle,
  PersonalizedNewsItem,
  NewsRelevance,
  UserNewsPreferences,
  NewsCategory,
  NewsFeedResponse,
  NewsSearchParams,
} from "./news";
export { NEWS_CATEGORY_CONFIG } from "./news";
