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

@description('OpenAI API Key for AI features')
@secure()
param openAiApiKey string = ''

@description('Azure AD B2C Tenant Name (e.g., phoenixrooivalkb2c)')
param b2cTenantName string = ''

// ============================================================================
// Variables
// ============================================================================

var resourcePrefix = '${projectName}-${environment}'
var tags = {
  project: projectName
  environment: environment
  managedBy: 'bicep'
}

// ============================================================================
// Modules
// ============================================================================

// Key Vault for secrets management
module keyVault 'modules/keyvault.bicep' = {
  name: 'keyVault'
  params: {
    name: '${resourcePrefix}-kv'
    location: location
    tags: tags
  }
}

// Storage Account for Functions and assets
module storage 'modules/storage.bicep' = {
  name: 'storage'
  params: {
    name: replace('${resourcePrefix}stor', '-', '')
    location: location
    tags: tags
  }
}

// Application Insights for monitoring and analytics
module appInsights 'modules/appinsights.bicep' = {
  name: 'appInsights'
  params: {
    name: '${resourcePrefix}-insights'
    location: location
    tags: tags
  }
}

// Cosmos DB for database (replaces Firestore)
module cosmosDb 'modules/cosmosdb.bicep' = {
  name: 'cosmosDb'
  params: {
    name: '${resourcePrefix}-cosmos'
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
    namespaceName: '${resourcePrefix}-nhns'
    hubName: '${resourcePrefix}-nh'
    location: location
    tags: tags
  }
}

// Azure Functions for serverless compute (replaces Cloud Functions)
module functions 'modules/functions.bicep' = {
  name: 'functions'
  params: {
    name: '${resourcePrefix}-func'
    location: location
    tags: tags
    storageAccountName: storage.outputs.name
    appInsightsInstrumentationKey: appInsights.outputs.instrumentationKey
    appInsightsConnectionString: appInsights.outputs.connectionString
    cosmosDbConnectionString: cosmosDb.outputs.connectionString
    keyVaultName: keyVault.outputs.name
  }
}

// Static Web App for hosting (replaces Netlify)
module staticWebApp 'modules/staticwebapp.bicep' = {
  name: 'staticWebApp'
  params: {
    name: '${resourcePrefix}-swa'
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

// Store OpenAI API key if provided
module openAiSecret 'modules/keyvault-secret.bicep' = if (!empty(openAiApiKey)) {
  name: 'openAiSecret'
  params: {
    keyVaultName: keyVault.outputs.name
    secretName: 'OpenAiApiKey'
    secretValue: openAiApiKey
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
