// Cosmos DB Module for phoenixrooivalk project
@description('Name of the Cosmos DB account')
param cosmosDbAccountName string = 'phoenixrooivalk-cosmos'

@description('Location for the resource')
param location string = resourceGroup().location

@description('Database name')
param databaseName string = 'PhoenixRooivalkDb'

@description('Enable serverless mode')
param serverless bool = true

// Cosmos DB Account
resource cosmosDbAccount 'Microsoft.DocumentDB/databaseAccounts@2024-05-15' = {
  name: cosmosDbAccountName
  location: location
  kind: 'GlobalDocumentDB'
  properties: {
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
    }
    locations: [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: false
      }
    ]
    databaseAccountOfferType: 'Standard'
    enableAutomaticFailover: false
    enableMultipleWriteLocations: false
    capabilities: serverless ? [
      {
        name: 'EnableServerless'
      }
    ] : []
  }
}

// Cosmos DB Database
resource cosmosDatabase 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2024-05-15' = {
  parent: cosmosDbAccount
  name: databaseName
  dependsOn: [
    cosmosDbAccount
  ]
  properties: {
    resource: {
      id: databaseName
    }
  }
}

// Projects Container
resource projectsContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2024-05-15' = {
  parent: cosmosDatabase
  name: 'Projects'
  dependsOn: [
    cosmosDatabase
  ]
  properties: {
    resource: {
      id: 'Projects'
      partitionKey: {
        paths: ['/id']
        kind: 'Hash'
      }
      indexingPolicy: {
        indexingMode: 'consistent'
        includedPaths: [
          {
            path: '/*'
          }
        ]
      }
    }
  }
}

// Users Container
resource usersContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2024-05-15' = {
  parent: cosmosDatabase
  name: 'Users'
  dependsOn: [
    cosmosDatabase
  ]
  properties: {
    resource: {
      id: 'Users'
      partitionKey: {
        paths: ['/id']
        kind: 'Hash'
      }
      indexingPolicy: {
        indexingMode: 'consistent'
        includedPaths: [
          {
            path: '/*'
          }
        ]
      }
    }
  }
}

// Comments Container
resource commentsContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2024-05-15' = {
  parent: cosmosDatabase
  name: 'Comments'
  dependsOn: [
    cosmosDatabase
  ]
  properties: {
    resource: {
      id: 'Comments'
      partitionKey: {
        paths: ['/projectId']
        kind: 'Hash'
      }
      indexingPolicy: {
        indexingMode: 'consistent'
        includedPaths: [
          {
            path: '/*'
          }
        ]
      }
    }
  }
}

// Analytics Container
resource analyticsContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2024-05-15' = {
  parent: cosmosDatabase
  name: 'Analytics'
  dependsOn: [
    cosmosDatabase
  ]
  properties: {
    resource: {
      id: 'Analytics'
      partitionKey: {
        paths: ['/id']
        kind: 'Hash'
      }
      indexingPolicy: {
        indexingMode: 'consistent'
        includedPaths: [
          {
            path: '/*'
          }
        ]
      }
    }
  }
}

output cosmosDbAccountName string = cosmosDbAccount.name
output cosmosDbAccountId string = cosmosDbAccount.id
output cosmosDbConnectionString string = listConnectionStrings(cosmosDbAccount.id, cosmosDbAccount.apiVersion).connectionStrings[0].connectionString
output cosmosDbEndpoint string = cosmosDbAccount.properties.documentEndpoint
output databaseName string = cosmosDatabase.name