/**
 * Key Vault Secret Module
 *
 * Adds a secret to an existing Key Vault.
 */

@description('Key Vault name')
param keyVaultName string

@description('Secret name')
param secretName string

@description('Secret value')
@secure()
param secretValue string

@description('Secret content type')
param contentType string = 'text/plain'

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: keyVaultName
}

resource secret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: secretName
  properties: {
    value: secretValue
    contentType: contentType
  }
}

@description('Secret URI')
output secretUri string = secret.properties.secretUri

@description('Secret URI with version')
output secretUriWithVersion string = secret.properties.secretUriWithVersion
