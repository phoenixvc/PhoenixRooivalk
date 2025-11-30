/**
 * Cloud Service Provider
 *
 * Factory for creating and managing cloud service instances.
 * Supports switching between Firebase and Azure implementations.
 * Falls back gracefully: Primary -> Secondary -> Offline
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { IAuthService } from './interfaces/auth';
import { IDatabaseService } from './interfaces/database';
import { IAnalyticsService } from './interfaces/analytics';
import { IMessagingService } from './interfaces/messaging';
import { IAIFunctionsService } from './interfaces/functions';
import { CloudServiceConfig } from './interfaces/types';

// Firebase implementations
import { FirebaseAuthService } from './firebase/auth';
import { FirebaseDatabaseService } from './firebase/database';
import { FirebaseAnalyticsService } from './firebase/analytics';
import { FirebaseMessagingService } from './firebase/messaging';
import { FirebaseFunctionsService } from './firebase/functions';

// Azure implementations
import { AzureAuthService, AzureAuthConfig } from './azure/auth';
import { AzureDatabaseService, AzureCosmosConfig } from './azure/database';
import { AzureAnalyticsService, AzureAnalyticsConfig } from './azure/analytics';
import { AzureMessagingService, AzureMessagingConfig } from './azure/messaging';
import { AzureFunctionsService, AzureFunctionsConfig } from './azure/functions';

// Offline fallback implementations
import {
  OfflineAuthService,
  OfflineDatabaseService,
  OfflineAnalyticsService,
  OfflineMessagingService,
  OfflineAIFunctionsService,
} from './offline';

/**
 * Cloud provider type
 */
export type CloudProvider = 'firebase' | 'azure' | 'offline';

/**
 * Cloud services collection
 */
export interface CloudServices {
  auth: IAuthService;
  database: IDatabaseService;
  analytics: IAnalyticsService;
  messaging: IMessagingService;
  functions: IAIFunctionsService;
  provider: CloudProvider;
  isConfigured: boolean;
}

/**
 * Firebase configuration from environment/Docusaurus
 */
function getFirebaseConfig() {
  if (typeof window === 'undefined') return null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const docusaurusData = (window as any).__DOCUSAURUS__;
    const config = docusaurusData?.siteConfig?.customFields?.firebaseConfig;
    if (config?.apiKey && config?.projectId) {
      return config;
    }
  } catch {
    // Ignore
  }

  return null;
}

/**
 * Azure configuration from environment/Docusaurus
 */
function getAzureConfig() {
  if (typeof window === 'undefined') return null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const docusaurusData = (window as any).__DOCUSAURUS__;
    const config = docusaurusData?.siteConfig?.customFields?.azureConfig;
    if (config?.tenantId && config?.clientId) {
      return config;
    }
  } catch {
    // Ignore
  }

  return null;
}

/**
 * Detect which cloud provider to use based on configuration
 */
function detectProvider(): CloudProvider {
  // Check for explicit provider setting
  if (typeof window !== 'undefined') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const docusaurusData = (window as any).__DOCUSAURUS__;
      const explicitProvider = docusaurusData?.siteConfig?.customFields?.cloudProvider;
      if (explicitProvider === 'azure' || explicitProvider === 'firebase') {
        return explicitProvider;
      }
    } catch {
      // Ignore
    }

    // Check localStorage for user preference
    const savedProvider = localStorage.getItem('phoenix-cloud-provider');
    if (savedProvider === 'azure' || savedProvider === 'firebase') {
      return savedProvider;
    }
  }

  // Default to Firebase if configured, otherwise Azure
  const firebaseConfig = getFirebaseConfig();
  if (firebaseConfig) {
    return 'firebase';
  }

  const azureConfig = getAzureConfig();
  if (azureConfig) {
    return 'azure';
  }

  // Default to Firebase
  return 'firebase';
}

/**
 * Singleton instance of cloud services
 */
let cloudServicesInstance: CloudServices | null = null;
let firebaseApp: FirebaseApp | null = null;

/**
 * Initialize Firebase app if not already initialized
 */
function getFirebaseApp(): FirebaseApp | null {
  if (firebaseApp) return firebaseApp;

  const config = getFirebaseConfig();
  if (!config) return null;

  try {
    if (getApps().length === 0) {
      firebaseApp = initializeApp(config);
    } else {
      firebaseApp = getApps()[0];
    }
    return firebaseApp;
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    return null;
  }
}

/**
 * Create Firebase services
 */
function createFirebaseServices(): CloudServices {
  const app = getFirebaseApp();

  return {
    auth: new FirebaseAuthService(app),
    database: new FirebaseDatabaseService(app),
    analytics: new FirebaseAnalyticsService(app),
    messaging: new FirebaseMessagingService(app),
    functions: new FirebaseFunctionsService(app),
    provider: 'firebase',
    isConfigured: app !== null,
  };
}

/**
 * Create Azure services
 */
function createAzureServices(): CloudServices {
  const config = getAzureConfig();

  // Auth config - uses Azure AD B2C via MSAL
  const authConfig: AzureAuthConfig | undefined = config?.clientId
    ? {
        tenantId: config.tenantId,
        clientId: config.clientId,
        authority: config.authority || undefined,
        // redirectUri defaults to window.location.origin in the auth service
      }
    : undefined;

  // Database config - uses Azure Functions as proxy (browser-safe)
  const cosmosConfig: AzureCosmosConfig | undefined = config?.functionsBaseUrl
    ? {
        endpoint: '', // Not used in browser - proxy handles this
        key: '', // Not used in browser - proxy handles this
        databaseId: 'phoenix-docs',
        functionsBaseUrl: config.functionsBaseUrl,
      }
    : undefined;

  // Analytics config - uses Application Insights
  const analyticsConfig: AzureAnalyticsConfig | undefined = config?.appInsightsConnectionString
    ? { connectionString: config.appInsightsConnectionString }
    : undefined;

  // Messaging config - uses Azure Functions for push registration
  const messagingConfig: AzureMessagingConfig | undefined = config?.functionsBaseUrl
    ? { functionsBaseUrl: config.functionsBaseUrl }
    : undefined;

  // AI Functions config
  const functionsConfig: AzureFunctionsConfig | undefined = config?.functionsBaseUrl
    ? {
        baseUrl: config.functionsBaseUrl,
      }
    : undefined;

  const isConfigured = Boolean(config?.clientId || config?.functionsBaseUrl);

  return {
    auth: new AzureAuthService(authConfig),
    database: new AzureDatabaseService(cosmosConfig),
    analytics: new AzureAnalyticsService(analyticsConfig),
    messaging: new AzureMessagingService(messagingConfig),
    functions: new AzureFunctionsService(functionsConfig),
    provider: 'azure',
    isConfigured,
  };
}

/**
 * Create offline fallback services
 */
function createOfflineServices(): CloudServices {
  console.warn('Using offline mode - data will be stored locally');

  return {
    auth: new OfflineAuthService(),
    database: new OfflineDatabaseService(),
    analytics: new OfflineAnalyticsService(),
    messaging: new OfflineMessagingService(),
    functions: new OfflineAIFunctionsService(),
    provider: 'offline',
    isConfigured: true,
  };
}

/**
 * Get or create cloud services instance with fallback
 *
 * Fallback order:
 * 1. Requested provider (if configured)
 * 2. Alternative cloud provider (if configured)
 * 3. Offline mode (always available)
 */
export function getCloudServices(forceProvider?: CloudProvider): CloudServices {
  const requestedProvider = forceProvider || detectProvider();

  // Return cached instance if provider matches
  if (cloudServicesInstance && cloudServicesInstance.provider === requestedProvider) {
    return cloudServicesInstance;
  }

  // If forcing offline, return offline services
  if (requestedProvider === 'offline') {
    cloudServicesInstance = createOfflineServices();
    return cloudServicesInstance;
  }

  // Try requested provider first
  if (requestedProvider === 'azure') {
    const azureServices = createAzureServices();
    if (azureServices.isConfigured) {
      cloudServicesInstance = azureServices;
      return cloudServicesInstance;
    }
    console.warn('Azure not configured, trying Firebase...');
  }

  if (requestedProvider === 'firebase') {
    const firebaseServices = createFirebaseServices();
    if (firebaseServices.isConfigured) {
      cloudServicesInstance = firebaseServices;
      return cloudServicesInstance;
    }
    console.warn('Firebase not configured, trying Azure...');
  }

  // Fallback to alternative provider
  const azureConfig = getAzureConfig();
  const firebaseConfig = getFirebaseConfig();

  if (azureConfig) {
    const azureServices = createAzureServices();
    if (azureServices.isConfigured) {
      cloudServicesInstance = azureServices;
      return cloudServicesInstance;
    }
  }

  if (firebaseConfig) {
    const firebaseServices = createFirebaseServices();
    if (firebaseServices.isConfigured) {
      cloudServicesInstance = firebaseServices;
      return cloudServicesInstance;
    }
  }

  // Final fallback: offline mode
  console.warn('No cloud provider configured, falling back to offline mode');
  cloudServicesInstance = createOfflineServices();
  return cloudServicesInstance;
}

/**
 * Switch cloud provider
 * Note: This requires a page reload to take effect properly
 */
export function switchProvider(provider: CloudProvider): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('phoenix-cloud-provider', provider);
  }
  cloudServicesInstance = null;
}

/**
 * Get fallback chain status
 * Useful for debugging provider configuration
 */
export function getProviderStatus(): {
  active: CloudProvider;
  available: CloudProvider[];
  configured: { firebase: boolean; azure: boolean };
} {
  const firebaseConfigured = getFirebaseConfig() !== null;
  const azureConfigured = getAzureConfig() !== null;
  const available: CloudProvider[] = ['offline'];

  if (firebaseConfigured) available.unshift('firebase');
  if (azureConfigured) available.unshift('azure');

  return {
    active: cloudServicesInstance?.provider || detectProvider(),
    available,
    configured: { firebase: firebaseConfigured, azure: azureConfigured },
  };
}

/**
 * Get current cloud provider
 */
export function getCurrentProvider(): CloudProvider {
  return cloudServicesInstance?.provider || detectProvider();
}

/**
 * Check if cloud services are configured
 */
export function isCloudConfigured(): boolean {
  const services = getCloudServices();
  return services.isConfigured;
}

/**
 * Reset cloud services (for testing)
 */
export function resetCloudServices(): void {
  cloudServicesInstance = null;
  firebaseApp = null;
}

// ============================================================================
// Convenience exports for direct service access
// ============================================================================

/**
 * Get auth service
 */
export function getAuthService(): IAuthService {
  return getCloudServices().auth;
}

/**
 * Get database service
 */
export function getDatabaseService(): IDatabaseService {
  return getCloudServices().database;
}

/**
 * Get analytics service
 */
export function getAnalyticsService(): IAnalyticsService {
  return getCloudServices().analytics;
}

/**
 * Get messaging service
 */
export function getMessagingService(): IMessagingService {
  return getCloudServices().messaging;
}

/**
 * Get functions service
 */
export function getFunctionsService(): IAIFunctionsService {
  return getCloudServices().functions;
}
