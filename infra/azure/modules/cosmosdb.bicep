/**
 * Azure Cosmos DB Module
 *
 * NoSQL database that replaces Firebase Firestore.
 * Uses the Core (SQL) API for maximum flexibility.
 */

@description('Cosmos DB account name')
param name string

@description('Azure region')
param location string

@description('Resource tags')
param tags object = {}

@description('Throughput in RU/s (ignored if serverless)')
param throughput int = 400

@description('Use serverless capacity mode')
param useServerless bool = true

@description('Database name')
param databaseName string = 'phoenix-docs'

// Cosmos DB Account
resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2023-11-15' = {
  name: name
  location: location
  tags: tags
  kind: 'GlobalDocumentDB'
  properties: {
    databaseAccountOfferType: 'Standard'
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
    capabilities: useServerless ? [
      {
        name: 'EnableServerless'
      }
    ] : []
    enableFreeTier: !useServerless
    enableAutomaticFailover: false
    enableMultipleWriteLocations: false
    publicNetworkAccess: 'Enabled'
    cors: [
      {
        allowedOrigins: '*'
      }
    ]
  }
}

// Database
resource database 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2023-11-15' = {
  parent: cosmosAccount
  name: databaseName
  properties: {
    resource: {
      id: databaseName
    }
    options: useServerless ? {} : {
      throughput: throughput
    }
  }
}

// Container: userProgress (replaces Firestore userProgress collection)
resource userProgressContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-11-15' = {
  parent: database
  name: 'userProgress'
  properties: {
    resource: {
      id: 'userProgress'
      partitionKey: {
        paths: ['/id']
        kind: 'Hash'
      }
      indexingPolicy: {
        indexingMode: 'consistent'
        automatic: true
        includedPaths: [
          { path: '/*' }
        ]
        excludedPaths: [
          { path: '/"_etag"/?' }
        ]
      }
    }
  }
}

// Container: userProfiles
resource userProfilesContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-11-15' = {
  parent: database
  name: 'userProfiles'
  properties: {
    resource: {
      id: 'userProfiles'
      partitionKey: {
        paths: ['/id']
        kind: 'Hash'
      }
    }
  }
}

// Container: comments
resource commentsContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-11-15' = {
  parent: database
  name: 'comments'
  properties: {
    resource: {
      id: 'comments'
      partitionKey: {
        paths: ['/pageId']
        kind: 'Hash'
      }
      indexingPolicy: {
        indexingMode: 'consistent'
        automatic: true
        includedPaths: [
          { path: '/*' }
        ]
        compositeIndexes: [
          [
            { path: '/pageId', order: 'ascending' }
            { path: '/createdAt', order: 'descending' }
          ]
          [
            { path: '/status', order: 'ascending' }
            { path: '/createdAt', order: 'ascending' }
          ]
        ]
      }
    }
  }
}

// Container: analytics_pageviews
resource pageviewsContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-11-15' = {
  parent: database
  name: 'analytics_pageviews'
  properties: {
    resource: {
      id: 'analytics_pageviews'
      partitionKey: {
        paths: ['/sessionId']
        kind: 'Hash'
      }
      defaultTtl: 7776000 // 90 days
    }
  }
}

// Container: analytics_sessions
resource sessionsContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-11-15' = {
  parent: database
  name: 'analytics_sessions'
  properties: {
    resource: {
      id: 'analytics_sessions'
      partitionKey: {
        paths: ['/sessionId']
        kind: 'Hash'
      }
      defaultTtl: 2592000 // 30 days
    }
  }
}

// Container: notifications
resource notificationsContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-11-15' = {
  parent: database
  name: 'notifications'
  properties: {
    resource: {
      id: 'notifications'
      partitionKey: {
        paths: ['/userId']
        kind: 'Hash'
      }
    }
  }
}

// Container: news_articles
resource newsContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-11-15' = {
  parent: database
  name: 'news_articles'
  properties: {
    resource: {
      id: 'news_articles'
      partitionKey: {
        paths: ['/category']
        kind: 'Hash'
      }
      indexingPolicy: {
        indexingMode: 'consistent'
        automatic: true
        includedPaths: [
          { path: '/*' }
        ]
        compositeIndexes: [
          [
            { path: '/category', order: 'ascending' }
            { path: '/publishedAt', order: 'descending' }
          ]
        ]
      }
    }
  }
}

// Container: doc_embeddings (for RAG/vector search)
resource embeddingsContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-11-15' = {
  parent: database
  name: 'doc_embeddings'
  properties: {
    resource: {
      id: 'doc_embeddings'
      partitionKey: {
        paths: ['/docId']
        kind: 'Hash'
      }
    }
  }
}

// Container: ai_cache
resource aiCacheContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-11-15' = {
  parent: database
  name: 'ai_cache'
  properties: {
    resource: {
      id: 'ai_cache'
      partitionKey: {
        paths: ['/cacheKey']
        kind: 'Hash'
      }
      defaultTtl: 86400 // 24 hours
    }
  }
}

// Container: weekly_reports (for AI-generated weekly reports)
resource weeklyReportsContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-11-15' = {
  parent: database
  name: 'weekly_reports'
  properties: {
    resource: {
      id: 'weekly_reports'
      partitionKey: {
        paths: ['/id']
        kind: 'Hash'
      }
      indexingPolicy: {
        indexingMode: 'consistent'
        automatic: true
        includedPaths: [
          { path: '/*' }
        ]
        compositeIndexes: [
          [
            { path: '/status', order: 'ascending' }
            { path: '/weekStartDate', order: 'descending' }
          ]
        ]
      }
    }
  }
}

// Container: known_emails (for internal user email mappings)
resource knownEmailsContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-11-15' = {
  parent: database
  name: 'known_emails'
  properties: {
    resource: {
      id: 'known_emails'
      partitionKey: {
        paths: ['/id']
        kind: 'Hash'
      }
      indexingPolicy: {
        indexingMode: 'consistent'
        automatic: true
        includedPaths: [
          { path: '/*' }
        ]
        compositeIndexes: [
          [
            { path: '/profileKey', order: 'ascending' }
            { path: '/createdAt', order: 'descending' }
          ]
        ]
      }
    }
  }
}

// Container: access_applications (for team member access applications)
resource accessApplicationsContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-11-15' = {
  parent: database
  name: 'access_applications'
  properties: {
    resource: {
      id: 'access_applications'
      partitionKey: {
        paths: ['/userId']
        kind: 'Hash'
      }
      indexingPolicy: {
        indexingMode: 'consistent'
        automatic: true
        includedPaths: [
          { path: '/*' }
        ]
        compositeIndexes: [
          [
            { path: '/status', order: 'ascending' }
            { path: '/createdAt', order: 'descending' }
          ]
          [
            { path: '/userId', order: 'ascending' }
            { path: '/createdAt', order: 'descending' }
          ]
        ]
      }
    }
  }
}

@description('Cosmos DB account name')
output name string = cosmosAccount.name

@description('Cosmos DB account ID')
output id string = cosmosAccount.id

@description('Cosmos DB endpoint')
output endpoint string = cosmosAccount.properties.documentEndpoint

@description('Cosmos DB connection string')
output connectionString string = cosmosAccount.listConnectionStrings().connectionStrings[0].connectionString

@description('Cosmos DB primary key')
output primaryKey string = cosmosAccount.listKeys().primaryMasterKey

@description('Database name')
output databaseName string = database.name
