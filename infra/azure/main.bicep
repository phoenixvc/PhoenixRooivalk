/**
 * Phoenix Rooivalk - Azure Infrastructure
 *
 * This Bicep template deploys all Azure resources needed for the Phoenix Rooivalk
 * documentation and marketing sites, replacing Firebase/Netlify services.
 *
 * Resources deployed:
 * - Azure Static Web Apps (hosting for docs and marketing)
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

@description('Environment name (dev, stg, prd, prv for preview)')
@allowed(['dev', 'stg', 'prd', 'prv'])
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

// Naming Convention v2.1: [org]-[env]-[project]-[type]-[region]
// See: docs/azure-naming-conventions.md
// Org codes: nl (NeuralLiquid), pvc (Phoenix VC), tws (Twines & Straps), mys (Mystira)
var org = 'nl'  // NeuralLiquid owns Rooivalk
var project = 'rooivalk'

// Environment mapping (internal to standard)
var envMap = {
  dev: 'dev'
  stg: 'staging'
  prd: 'prod'
  prv: 'dev'  // preview maps to dev
}
var envStandard = contains(envMap, environment) ? envMap[environment] : environment

// Region short codes per naming convention v2.1
var locationShortMap = {
  eastus: 'eus'
  eastus2: 'eus2'
  westus: 'wus'
  westus2: 'wus2'
  centralus: 'cus'
  westeurope: 'euw'
  northeurope: 'eun'
  uksouth: 'uks'
  ukwest: 'ukw'
  eastasia: 'eas'
  southeastasia: 'seas'
  southafricanorth: 'san'
  southafricawest: 'saf'
  swedencentral: 'swe'
  australiaeast: 'aue'
}
var locationShort = contains(locationShortMap, location) ? locationShortMap[location] : take(location, 4)

// Base naming prefix: [org]-[env]-[project]
var baseName = '${org}-${envStandard}-${project}'

// Tags for cost management and organization
var tags = {
  org: org
  project: project
  environment: envStandard
  managedBy: 'bicep'
  costCenter: 'phoenix-${envStandard}'
  owner: 'JustAGhosT'
}

// Key Vault for secrets management
// Pattern: [org]-[env]-[project]-[type]-[region]
module keyVault 'modules/keyvault.bicep' = {
  name: 'keyVault'
  params: {
    name: '${baseName}-kv-${locationShort}'
    location: location
    tags: tags
  }
}

// Storage Account for Functions and assets
// Pattern: [org][env][project]st[region] (no hyphens, max 24 chars)
module storage 'modules/storage.bicep' = {
  name: 'storage'
  params: {
    name: '${org}${envStandard}${project}st${locationShort}'
    location: location
    tags: tags
  }
}

// Application Insights for monitoring and analytics
// Pattern: [org]-[env]-[project]-[type]-[region]
module appInsights 'modules/appinsights.bicep' = {
  name: 'appInsights'
  params: {
    name: '${baseName}-appi-${locationShort}'
    location: location
    tags: tags
  }
}

// Cosmos DB for database (replaces Firestore)
// Pattern: [org]-[env]-[project]-[type]-[region]
module cosmosDb 'modules/cosmosdb.bicep' = {
  name: 'cosmosDb'
  params: {
    name: '${baseName}-cosmos-${locationShort}'
    location: location
    tags: tags
    throughput: cosmosDbThroughput
    useServerless: useServerlessCosmosDb
  }
}

// Notification Hub for push notifications (replaces FCM)
// Pattern: [org]-[env]-[project]-[type]-[region]
module notificationHub 'modules/notificationhub.bicep' = {
  name: 'notificationHub'
  params: {
    namespaceName: '${baseName}-nhns-${locationShort}'
    hubName: '${baseName}-nh-${locationShort}'
    location: location
    tags: tags
  }
}

// Azure Functions for serverless compute (replaces Cloud Functions)
// Pattern: [org]-[env]-[project]-[type]-[region]
module functions 'modules/functions.bicep' = {
  name: 'functions'
  params: {
    name: '${baseName}-func-${locationShort}'
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

// Static Web App for documentation site (replaces Netlify)
// Pattern: [org]-[env]-[project]-[type]-[region]
module staticWebAppDocs 'modules/staticwebapp.bicep' = {
  name: 'staticWebAppDocs'
  params: {
    name: '${baseName}-swa-${locationShort}'
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

// Static Web App for marketing site (replaces Netlify)
// Pattern: [org]-[env]-[project]-marketing-[type]-[region]
module staticWebAppMarketing 'modules/staticwebapp.bicep' = {
  name: 'staticWebAppMarketing'
  params: {
    name: '${baseName}-marketing-swa-${locationShort}'
    location: location
    tags: tags
    sku: staticWebAppSku
    repositoryUrl: repositoryUrl
    branch: branch
    appLocation: 'apps/marketing'
    outputLocation: 'out'
    apiLocation: ''  // Marketing site doesn't use Functions
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

@description('Documentation Static Web App URL')
output staticWebAppDocsUrl string = staticWebAppDocs.outputs.url

@description('Documentation Static Web App default hostname')
output staticWebAppDocsHostname string = staticWebAppDocs.outputs.defaultHostname

@description('Marketing Static Web App URL')
output staticWebAppMarketingUrl string = staticWebAppMarketing.outputs.url

@description('Marketing Static Web App default hostname')
output staticWebAppMarketingHostname string = staticWebAppMarketing.outputs.defaultHostname

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
