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

export {
  NewsIngestionService,
  newsIngestionService,
  type IngestionResult,
} from "./news-ingestion.service";

export {
  NotificationsService,
  notificationsService,
  type NewsSubscription,
} from "./notifications.service";

export {
  ConfigurationService,
  configurationService,
  type ConfigOptimization,
} from "./configuration.service";

export {
  hybridSearch,
  weightedHybridSearch,
  searchWithRerank,
  type SearchResult,
  type HybridSearchOptions,
} from "./hybrid-search.service";

export {
  runAgent,
  runAgentStreaming,
  createAgent,
  tools as agentTools,
  type AgentTool,
  type AgentStep,
  type AgentResult,
  type AgentOptions,
} from "./agent.service";

export {
  accessApplicationsService,
  type SubmitApplicationData,
  type SubmitApplicationResult,
} from "./access-applications.service";
