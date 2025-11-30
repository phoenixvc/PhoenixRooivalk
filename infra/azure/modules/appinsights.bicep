/**
 * Azure Application Insights Module
 *
 * Provides monitoring, analytics, and diagnostics.
 * Replaces Firebase Analytics.
 */

@description('Application Insights name')
param name string

@description('Azure region')
param location string

@description('Resource tags')
param tags object = {}

@description('Log Analytics workspace name (created if not exists)')
param workspaceName string = '${name}-workspace'

// Log Analytics Workspace (required for Application Insights)
resource workspace 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: workspaceName
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
  }
}

// Application Insights
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: name
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: workspace.id
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

@description('Application Insights name')
output name string = appInsights.name

@description('Application Insights ID')
output id string = appInsights.id

@description('Instrumentation Key')
output instrumentationKey string = appInsights.properties.InstrumentationKey

@description('Connection String')
output connectionString string = appInsights.properties.ConnectionString

@description('Log Analytics Workspace ID')
output workspaceId string = workspace.id
