/**
 * Services Index
 *
 * Central export for all service classes.
 */

export {
  NewsService,
  newsService,
  type UserProfile,
  type NewsRelevance,
  type PersonalizedNewsItem,
  type NewsFeedResult,
} from "./news.service";

export {
  SupportService,
  supportService,
  type ContactFormData,
} from "./support.service";

export { AIService, aiService } from "./ai.service";

export {
  IndexingService,
  indexingService,
  type DocumentChunk,
  type DocumentMetadata,
  type IndexingResult,
} from "./indexing.service";

export {
  NewsAnalyticsService,
  newsAnalyticsService,
  type NewsAnalyticsResult,
} from "./news-analytics.service";
