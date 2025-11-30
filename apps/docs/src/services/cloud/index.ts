/**
 * Cloud Services Module
 *
 * Provides a unified interface for cloud services that can switch between
 * Firebase and Azure implementations.
 *
 * Usage:
 * ```typescript
 * import { getCloudServices, getAuthService, getDatabaseService } from './services/cloud';
 *
 * // Get all services
 * const services = getCloudServices();
 * const user = await services.auth.signInWithGoogle();
 *
 * // Or get individual services
 * const auth = getAuthService();
 * const db = getDatabaseService();
 * ```
 */

// Export interfaces
export * from "./interfaces";

// Export provider and service accessors
export {
  getCloudServices,
  switchProvider,
  getCurrentProvider,
  isCloudConfigured,
  resetCloudServices,
  getAuthService,
  getDatabaseService,
  getAnalyticsService,
  getMessagingService,
  getFunctionsService,
  type CloudProvider,
  type CloudServices,
} from "./provider";

// Export Firebase implementations (for direct use if needed)
export {
  FirebaseAuthService,
  FirebaseDatabaseService,
  FirebaseAnalyticsService,
  FirebaseMessagingService,
  FirebaseFunctionsService,
} from "./firebase";

// Export Azure implementations (for direct use if needed)
export {
  AzureAuthService,
  AzureDatabaseService,
  AzureAnalyticsService,
  AzureMessagingService,
  AzureFunctionsService,
  type AzureAuthConfig,
  type AzureCosmosConfig,
  type AzureAnalyticsConfig,
  type AzureMessagingConfig,
  type AzureFunctionsConfig,
} from "./azure";

// Export React hooks
export {
  useCloudServices,
  useCloudProvider,
  useCloudAuth,
  useUserProgress,
  useCloudAnalytics,
} from "./hooks";
