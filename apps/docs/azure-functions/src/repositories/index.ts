/**
 * Repositories Index
 *
 * Central export for all repository classes.
 */

export {
  BaseRepository,
  type BaseEntity,
  type PaginationOptions,
  type PaginatedResult,
} from "./base.repository";

export {
  NewsRepository,
  newsRepository,
  type NewsArticle,
  type NewsQueryFilters,
} from "./news.repository";

export {
  UserPreferencesRepository,
  userPreferencesRepository,
  type UserNewsPreferences,
} from "./user-preferences.repository";

export {
  SupportRepository,
  supportRepository,
  type SupportTicket,
  type SupportTicketFilters,
} from "./support.repository";

export {
  ConfigurationRepository,
  configurationRepository,
  type ConfigItem,
  type ConfigType,
  type CategoryConfig,
  type RoleConfig,
  type InterestConfig,
  type PromptConfig,
  type TopicConfig,
  type DomainConfig,
  type ConfigVersion,
} from "./configuration.repository";
