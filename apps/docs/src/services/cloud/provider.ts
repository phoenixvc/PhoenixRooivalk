/**
 * Cloud Service Provider
 *
 * Factory for creating and managing cloud service instances.
 * Supports Azure implementations with offline fallback.
 */

import { IAuthService } from "./interfaces/auth";
import { IDatabaseService } from "./interfaces/database";
import { IAnalyticsService } from "./interfaces/analytics";
import { IMessagingService } from "./interfaces/messaging";
import { IAIFunctionsService } from "./interfaces/functions";

// Azure implementations
import { AzureAuthService, AzureAuthConfig } from "./azure/auth";
import { AzureDatabaseService, AzureCosmosConfig } from "./azure/database";
import { AzureAnalyticsService, AzureAnalyticsConfig } from "./azure/analytics";
import { AzureMessagingService, AzureMessagingConfig } from "./azure/messaging";
import { AzureFunctionsService, AzureFunctionsConfig } from "./azure/functions";

// Offline fallback implementations
import {
  OfflineAuthService,
  OfflineDatabaseService,
  OfflineAnalyticsService,
  OfflineMessagingService,
  OfflineAIFunctionsService,
} from "./offline";

/**
 * Cloud provider type
 */
export type CloudProvider = "azure" | "offline";

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
 * Azure configuration from environment/Docusaurus
 */
function getAzureConfig() {
  if (typeof window === "undefined") return null;

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
  if (typeof window !== "undefined") {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const docusaurusData = (window as any).__DOCUSAURUS__;
      const explicitProvider =
        docusaurusData?.siteConfig?.customFields?.cloudProvider;
      if (explicitProvider === "azure") {
        return "azure";
      }
    } catch {
      // Ignore
    }

    // Check localStorage for user preference
    const savedProvider = localStorage.getItem("phoenix-cloud-provider");
    if (savedProvider === "azure") {
      return savedProvider;
    }
  }

  // Default to Azure if configured
  const azureConfig = getAzureConfig();
  if (azureConfig) {
    return "azure";
  }

  // Default to offline
  return "offline";
}

/**
 * Singleton instance of cloud services
 */
let cloudServicesInstance: CloudServices | null = null;

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
        endpoint: "", // Not used in browser - proxy handles this
        key: "", // Not used in browser - proxy handles this
        databaseId: "phoenix-docs",
        functionsBaseUrl: config.functionsBaseUrl,
      }
    : undefined;

  // Analytics config - uses Application Insights
  const analyticsConfig: AzureAnalyticsConfig | undefined =
    config?.appInsightsConnectionString
      ? { connectionString: config.appInsightsConnectionString }
      : undefined;

  // Messaging config - uses Azure Functions for push registration
  const messagingConfig: AzureMessagingConfig | undefined =
    config?.functionsBaseUrl
      ? { functionsBaseUrl: config.functionsBaseUrl }
      : undefined;

  // AI Functions config
  const functionsConfig: AzureFunctionsConfig | undefined =
    config?.functionsBaseUrl
      ? {
          baseUrl: config.functionsBaseUrl,
        }
      : undefined;

  // Check if functions are configured
  if (!config?.functionsBaseUrl) {
    console.warn(
      "Azure Functions base URL not configured. AI features will not be available.",
      "Set AZURE_FUNCTIONS_BASE_URL or configure functionsBaseUrl in Docusaurus config.",
    );
  }

  const isConfigured = Boolean(config?.clientId || config?.functionsBaseUrl);

  return {
    auth: new AzureAuthService(authConfig),
    database: new AzureDatabaseService(cosmosConfig),
    analytics: new AzureAnalyticsService(analyticsConfig),
    messaging: new AzureMessagingService(messagingConfig),
    functions: new AzureFunctionsService(functionsConfig),
    provider: "azure",
    isConfigured,
  };
}

/**
 * Create offline fallback services
 */
function createOfflineServices(): CloudServices {
  console.warn("Using offline mode - data will be stored locally");

  return {
    auth: new OfflineAuthService(),
    database: new OfflineDatabaseService(),
    analytics: new OfflineAnalyticsService(),
    messaging: new OfflineMessagingService(),
    functions: new OfflineAIFunctionsService(),
    provider: "offline",
    isConfigured: true,
  };
}

/**
 * Get or create cloud services instance with fallback
 *
 * Fallback order:
 * 1. Azure (if configured)
 * 2. Offline mode (always available)
 */
export function getCloudServices(forceProvider?: CloudProvider): CloudServices {
  const requestedProvider = forceProvider || detectProvider();

  // Return cached instance if provider matches
  if (
    cloudServicesInstance &&
    cloudServicesInstance.provider === requestedProvider
  ) {
    return cloudServicesInstance;
  }

  // If forcing offline, return offline services
  if (requestedProvider === "offline") {
    cloudServicesInstance = createOfflineServices();
    return cloudServicesInstance;
  }

  // Try Azure
  if (requestedProvider === "azure") {
    const azureServices = createAzureServices();
    if (azureServices.isConfigured) {
      cloudServicesInstance = azureServices;
      return cloudServicesInstance;
    }
    console.warn("Azure not configured, falling back to offline mode...");
  }

  // Final fallback: offline mode
  console.warn("No cloud provider configured, falling back to offline mode");
  cloudServicesInstance = createOfflineServices();
  return cloudServicesInstance;
}

/**
 * Switch cloud provider
 * Note: This requires a page reload to take effect properly
 */
export function switchProvider(provider: CloudProvider): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("phoenix-cloud-provider", provider);
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
  configured: { azure: boolean };
} {
  const azureConfigured = getAzureConfig() !== null;
  const available: CloudProvider[] = ["offline"];

  if (azureConfigured) available.unshift("azure");

  return {
    active: cloudServicesInstance?.provider || detectProvider(),
    available,
    configured: { azure: azureConfigured },
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
