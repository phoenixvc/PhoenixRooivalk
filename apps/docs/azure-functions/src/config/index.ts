/**
 * Configuration Exports
 *
 * Centralized configuration for the Azure Functions.
 */

export {
  DEFAULT_NEWS_CATEGORIES,
  TARGET_ROLES,
  TARGET_INTERESTS,
  EXPERIENCE_LEVELS,
  getCategoryConfig,
  getCategoryIds,
  isValidCategory,
  getCategoriesForPrompt,
  getRolesForPrompt,
  getInterestsForPrompt,
  type NewsCategoryConfig,
  type NewsCategory,
  type TargetRole,
  type TargetInterest,
  type ExperienceLevel,
} from "./news";

export {
  getNewsApiConfig,
  NEWS_SEARCH_QUERIES,
  HIGH_PRIORITY_QUERIES,
  TRUSTED_DOMAINS,
  NEWS_RSS_FEEDS,
  NEWS_TOPICS,
  type NewsApiProvider,
  type NewsApiConfig,
} from "./news-api";
