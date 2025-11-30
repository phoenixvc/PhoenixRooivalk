/**
 * Cloud Service Provider
 *
 * Factory for creating and managing cloud service instances.
 * Supports switching between Firebase and Azure implementations.
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

/**
 * Cloud provider type
 */
export type CloudProvider = 'firebase' | 'azure';

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

  const authConfig: AzureAuthConfig | undefined = config
    ? {
        tenantId: config.tenantId,
        clientId: config.clientId,
        authority: config.authority,
        redirectUri: config.redirectUri,
        scopes: config.scopes,
      }
    : undefined;

  const cosmosConfig: AzureCosmosConfig | undefined = config
    ? {
        endpoint: config.cosmosEndpoint,
        key: config.cosmosKey,
        databaseId: config.cosmosDatabase || 'phoenix-docs',
        functionsBaseUrl: config.functionsBaseUrl,
      }
    : undefined;

  const analyticsConfig: AzureAnalyticsConfig | undefined = config?.appInsightsConnectionString
    ? { connectionString: config.appInsightsConnectionString }
    : undefined;

  const messagingConfig: AzureMessagingConfig | undefined = config?.functionsBaseUrl
    ? { functionsBaseUrl: config.functionsBaseUrl }
    : undefined;

  const functionsConfig: AzureFunctionsConfig | undefined = config?.functionsBaseUrl
    ? {
        baseUrl: config.functionsBaseUrl,
        apiKey: config.functionsApiKey,
      }
    : undefined;

  return {
    auth: new AzureAuthService(authConfig),
    database: new AzureDatabaseService(cosmosConfig),
    analytics: new AzureAnalyticsService(analyticsConfig),
    messaging: new AzureMessagingService(messagingConfig),
    functions: new AzureFunctionsService(functionsConfig),
    provider: 'azure',
    isConfigured: config !== null,
  };
}

/**
 * Get or create cloud services instance
 */
export function getCloudServices(forceProvider?: CloudProvider): CloudServices {
  const provider = forceProvider || detectProvider();

  // Return cached instance if provider matches
  if (cloudServicesInstance && cloudServicesInstance.provider === provider) {
    return cloudServicesInstance;
  }

  // Create new instance
  if (provider === 'azure') {
    cloudServicesInstance = createAzureServices();
  } else {
    cloudServicesInstance = createFirebaseServices();
  }

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
