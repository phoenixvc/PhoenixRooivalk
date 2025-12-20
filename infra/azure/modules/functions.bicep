/**
 * Azure Functions Module
 *
 * Serverless compute that replaces Firebase Cloud Functions.
 * Hosts all AI, RAG, news, and utility functions.
 */

@description('Function App name')
param name string

@description('Azure region')
param location string

@description('Resource tags')
param tags object = {}

@description('Storage account name for Functions')
param storageAccountName string

@description('Application Insights instrumentation key')
param appInsightsInstrumentationKey string

@description('Application Insights connection string')
param appInsightsConnectionString string

@description('Cosmos DB connection string')
@secure()
param cosmosDbConnectionString string

@description('Key Vault name for secrets')
param keyVaultName string

@description('Function App SKU')
@allowed(['Y1', 'EP1', 'EP2', 'EP3'])
param sku string = 'Y1'  // Consumption plan (serverless)

@description('Azure OpenAI endpoint URL')
param azureOpenAIEndpoint string = ''

@description('Azure OpenAI chat deployment name')
param azureOpenAIChatDeployment string = 'gpt-4'

@description('Azure OpenAI embedding deployment name')
param azureOpenAIEmbeddingDeployment string = 'text-embedding-3-small'

@description('Azure AD B2C tenant name (without .onmicrosoft.com)')
param azureAdB2cTenant string = ''

@description('Azure AD B2C client ID for token validation')
param azureAdB2cClientId string = ''

@description('Azure AD B2C user flow/policy name')
param azureAdB2cPolicy string = 'B2C_1_signupsignin'

// Reference existing storage account
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' existing = {
  name: storageAccountName
}

// App Service Plan (Consumption)
resource appServicePlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: '${name}-plan'
  location: location
  tags: tags
  sku: {
    name: sku
    tier: sku == 'Y1' ? 'Dynamic' : 'ElasticPremium'
  }
  properties: {
    reserved: true  // Linux
  }
}

// Function App
resource functionApp 'Microsoft.Web/sites@2023-01-01' = {
  name: name
  location: location
  tags: tags
  kind: 'functionapp,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    publicNetworkAccess: 'Enabled'
    siteConfig: {
      linuxFxVersion: 'Node|20'
      appSettings: [
        {
          name: 'AzureWebJobsStorage'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};EndpointSuffix=${environment().suffixes.storage};AccountKey=${storageAccount.listKeys().keys[0].value}'
        }
        {
          name: 'WEBSITE_CONTENTAZUREFILECONNECTIONSTRING'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};EndpointSuffix=${environment().suffixes.storage};AccountKey=${storageAccount.listKeys().keys[0].value}'
        }
        {
          name: 'WEBSITE_CONTENTSHARE'
          value: toLower(name)
        }
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'node'
        }
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '~20'
        }
        {
          name: 'APPINSIGHTS_INSTRUMENTATIONKEY'
          value: appInsightsInstrumentationKey
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsightsConnectionString
        }
        {
          name: 'COSMOS_DB_CONNECTION_STRING'
          value: cosmosDbConnectionString
        }
        {
          name: 'COSMOS_DB_DATABASE'
          value: 'phoenix-docs'
        }
        {
          name: 'KEY_VAULT_NAME'
          value: keyVaultName
        }
        // Azure OpenAI (AI Foundry) configuration
        {
          name: 'AZURE_OPENAI_ENDPOINT'
          value: azureOpenAIEndpoint
        }
        {
          name: 'AZURE_OPENAI_API_KEY'
          value: '@Microsoft.KeyVault(VaultName=${keyVaultName};SecretName=AzureOpenAiApiKey)'
        }
        {
          name: 'AZURE_OPENAI_API_VERSION'
          value: '2024-10-21'
        }
        {
          name: 'AZURE_OPENAI_CHAT_DEPLOYMENT'
          value: azureOpenAIChatDeployment
        }
        {
          name: 'AZURE_OPENAI_EMBEDDING_DEPLOYMENT'
          value: azureOpenAIEmbeddingDeployment
        }
        // Azure AD B2C configuration for token validation
        {
          name: 'AZURE_AD_B2C_TENANT'
          value: azureAdB2cTenant
        }
        {
          name: 'AZURE_AD_B2C_CLIENT_ID'
          value: azureAdB2cClientId
        }
        {
          name: 'AZURE_AD_B2C_POLICY'
          value: azureAdB2cPolicy
        }
      ]
      cors: {
        allowedOrigins: [
          'http://localhost:3000'
          'http://localhost:3001'
          'https://*.azurestaticapps.net'
          'https://phoenixrooivalk.com'
          'https://docs.phoenixrooivalk.com'
          'https://www.phoenixrooivalk.com'
        ]
        supportCredentials: true
      }
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
    }
  }
}

// Key Vault access policy for Function App
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: keyVaultName
}

resource keyVaultAccessPolicy 'Microsoft.KeyVault/vaults/accessPolicies@2023-07-01' = {
  parent: keyVault
  name: 'add'
  properties: {
    accessPolicies: [
      {
        tenantId: subscription().tenantId
        objectId: functionApp.identity.principalId
        permissions: {
          secrets: [
            'get'
            'list'
          ]
        }
      }
    ]
  }
}

@description('Function App name')
output name string = functionApp.name

@description('Function App ID')
output id string = functionApp.id

@description('Function App URL')
output url string = 'https://${functionApp.properties.defaultHostName}'

@description('Function App default hostname')
output defaultHostname string = functionApp.properties.defaultHostName

@description('Function App principal ID')
output principalId string = functionApp.identity.principalId
