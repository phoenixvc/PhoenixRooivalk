/**
 * Azure Key Vault Module
 *
 * Stores secrets like connection strings, API keys, etc.
 */

@description('Key Vault name')
param name string

@description('Azure region')
param location string

@description('Resource tags')
param tags object = {}

@description('Enable soft delete')
param enableSoftDelete bool = true

@description('Soft delete retention days')
param softDeleteRetentionInDays int = 7

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: name
  location: location
  tags: tags
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    enabledForDeployment: true
    enabledForTemplateDeployment: true
    enabledForDiskEncryption: false
    enableSoftDelete: enableSoftDelete
    softDeleteRetentionInDays: softDeleteRetentionInDays
    enableRbacAuthorization: true
    publicNetworkAccess: 'Enabled'
  }
}

@description('Key Vault name')
output name string = keyVault.name

@description('Key Vault resource ID')
output id string = keyVault.id

@description('Key Vault URI')
output uri string = keyVault.properties.vaultUri
