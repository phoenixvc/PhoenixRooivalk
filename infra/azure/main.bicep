/**
 * Phoenix Rooivalk - Azure Infrastructure
 *
 * This Bicep template deploys all Azure resources needed for the Phoenix Rooivalk
 * documentation site, replacing Firebase/Netlify services.
 *
 * Resources deployed:
 * - Azure Static Web Apps (hosting)
 * - Azure Cosmos DB (database - replaces Firestore)
 * - Azure Application Insights (analytics)
 * - Azure Notification Hub (push notifications - replaces FCM)
 * - Azure Functions (serverless - replaces Cloud Functions)
 * - Azure AD B2C (authentication - replaces Firebase Auth)
 * - Azure Key Vault (secrets management)
 * - Azure Storage (for Functions and static assets)
 */

// ============================================================================
// Parameters
// ============================================================================

@description('Environment name (dev, staging, prod)')
@allowed(['dev', 'staging', 'prod'])
param environment string = 'dev'

@description('Azure region for resources')
param location string = resourceGroup().location

@description('Project name used for resource naming')
param projectName string = 'phoenixrooivalk'

@description('GitHub repository URL for Static Web App')
param repositoryUrl string = 'https://github.com/JustAGhosT/PhoenixRooivalk'

@description('GitHub branch to deploy from')
param branch string = 'main'

@description('Static Web App SKU')
@allowed(['Free', 'Standard'])
param staticWebAppSku string = 'Free'

@description('Cosmos DB throughput (RU/s) - use 400 for free tier')
@minValue(400)
@maxValue(10000)
param cosmosDbThroughput int = 400

@description('Enable serverless Cosmos DB (recommended for variable workloads)')
param useServerlessCosmosDb bool = true

@description('Azure OpenAI API Key for AI features')
@secure()
param azureOpenAiApiKey string = ''

@description('Azure OpenAI endpoint URL (e.g., https://your-resource.openai.azure.com/)')
param azureOpenAiEndpoint string = ''

@description('Azure OpenAI chat deployment name')
param azureOpenAiChatDeployment string = 'gpt-4'

@description('Azure OpenAI embedding deployment name')
param azureOpenAiEmbeddingDeployment string = 'text-embedding-3-small'

@description('Azure AD B2C Tenant Name (e.g., phoenixrooivalkb2c)')
param b2cTenantName string = ''

// ============================================================================
// Variables
// ============================================================================

// Naming: {env}-{type}-{project} e.g., dev-kv-phoenixrooivalk
var resourcePrefix = '${environment}-phoenixrooivalk'
var tags = {
  project: projectName
  environment: environment
  managedBy: 'bicep'
}

// ============================================================================
// Modules
// ============================================================================

// Naming: {env}-{region}-{type}-{project} e.g., dev-eus2-kv-rooivalk
var locationShort = location == 'eastus2' ? 'eus2' : location == 'westeurope' ? 'weu' : location == 'eastasia' ? 'eas' : take(location, 4)

// Key Vault for secrets management
module keyVault 'modules/keyvault.bicep' = {
  name: 'keyVault'
  params: {
    name: '${environment}-${locationShort}-kv-rooivalk'
    location: location
    tags: tags
  }
}

// Storage Account for Functions and assets
module storage 'modules/storage.bicep' = {
  name: 'storage'
  params: {
    name: '${environment}${locationShort}strooivalk'  // Storage accounts can't have hyphens, max 24 chars
    location: location
    tags: tags
  }
}

// Application Insights for monitoring and analytics
module appInsights 'modules/appinsights.bicep' = {
  name: 'appInsights'
  params: {
    name: '${environment}-${locationShort}-appi-rooivalk'
    location: location
    tags: tags
  }
}

// Cosmos DB for database (replaces Firestore)
module cosmosDb 'modules/cosmosdb.bicep' = {
  name: 'cosmosDb'
  params: {
    name: '${environment}-${locationShort}-cosmos-rooivalk'
    location: location
    tags: tags
    throughput: cosmosDbThroughput
    useServerless: useServerlessCosmosDb
  }
}

// Notification Hub for push notifications (replaces FCM)
module notificationHub 'modules/notificationhub.bicep' = {
  name: 'notificationHub'
  params: {
    namespaceName: '${environment}-${locationShort}-nhns-rooivalk'
    hubName: '${environment}-${locationShort}-nh-rooivalk'
    location: location
    tags: tags
  }
}

// Azure Functions for serverless compute (replaces Cloud Functions)
module functions 'modules/functions.bicep' = {
  name: 'functions'
  params: {
    name: '${environment}-${locationShort}-func-rooivalk'
    location: location
    tags: tags
    storageAccountName: storage.outputs.name
    appInsightsInstrumentationKey: appInsights.outputs.instrumentationKey
    appInsightsConnectionString: appInsights.outputs.connectionString
    cosmosDbConnectionString: cosmosDb.outputs.connectionString
    keyVaultName: keyVault.outputs.name
    azureOpenAIEndpoint: azureOpenAiEndpoint
    azureOpenAIChatDeployment: azureOpenAiChatDeployment
    azureOpenAIEmbeddingDeployment: azureOpenAiEmbeddingDeployment
  }
}

// Static Web App for hosting (replaces Netlify)
module staticWebApp 'modules/staticwebapp.bicep' = {
  name: 'staticWebApp'
  params: {
    name: '${environment}-${locationShort}-swa-rooivalk'
    location: location
    tags: tags
    sku: staticWebAppSku
    repositoryUrl: repositoryUrl
    branch: branch
    appLocation: 'apps/docs'
    outputLocation: 'build'
    apiLocation: ''  // Using separate Azure Functions
  }
}

// ============================================================================
// Secrets in Key Vault
// ============================================================================

// Store Cosmos DB connection string in Key Vault
module cosmosSecret 'modules/keyvault-secret.bicep' = {
  name: 'cosmosSecret'
  params: {
    keyVaultName: keyVault.outputs.name
    secretName: 'CosmosDbConnectionString'
    secretValue: cosmosDb.outputs.connectionString
  }
}

// Store Azure OpenAI API key if provided
module azureOpenAiSecret 'modules/keyvault-secret.bicep' = if (!empty(azureOpenAiApiKey)) {
  name: 'azureOpenAiSecret'
  params: {
    keyVaultName: keyVault.outputs.name
    secretName: 'AzureOpenAiApiKey'
    secretValue: azureOpenAiApiKey
  }
}

// Store Notification Hub connection string
module notificationHubSecret 'modules/keyvault-secret.bicep' = {
  name: 'notificationHubSecret'
  params: {
    keyVaultName: keyVault.outputs.name
    secretName: 'NotificationHubConnectionString'
    secretValue: notificationHub.outputs.connectionString
  }
}

// ============================================================================
// Outputs
// ============================================================================

@description('Static Web App URL')
output staticWebAppUrl string = staticWebApp.outputs.url

@description('Static Web App default hostname')
output staticWebAppHostname string = staticWebApp.outputs.defaultHostname

@description('Functions App URL')
output functionsUrl string = functions.outputs.url

@description('Functions App hostname')
output functionsHostname string = functions.outputs.defaultHostname

@description('Application Insights connection string')
output appInsightsConnectionString string = appInsights.outputs.connectionString

@description('Cosmos DB endpoint')
output cosmosDbEndpoint string = cosmosDb.outputs.endpoint

@description('Key Vault URI')
output keyVaultUri string = keyVault.outputs.uri

@description('Storage Account name')
output storageAccountName string = storage.outputs.name

@description('Notification Hub name')
output notificationHubName string = notificationHub.outputs.hubName

@description('Configuration for client-side app')
output clientConfig object = {
  functionsBaseUrl: functions.outputs.url
  appInsightsConnectionString: appInsights.outputs.connectionString
  cosmosDbEndpoint: cosmosDb.outputs.endpoint
  b2cTenantName: b2cTenantName
}
