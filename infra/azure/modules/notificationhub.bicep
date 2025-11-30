/**
 * Azure Notification Hub Module
 *
 * Push notification service that replaces Firebase Cloud Messaging (FCM).
 */

@description('Notification Hub namespace name')
param namespaceName string

@description('Notification Hub name')
param hubName string

@description('Azure region')
param location string

@description('Resource tags')
param tags object = {}

@description('Namespace SKU')
@allowed(['Free', 'Basic', 'Standard'])
param sku string = 'Free'

// Notification Hub Namespace
resource namespace 'Microsoft.NotificationHubs/namespaces@2023-09-01' = {
  name: namespaceName
  location: location
  tags: tags
  sku: {
    name: sku
  }
  properties: {
    namespaceType: 'NotificationHub'
  }
}

// Notification Hub
resource hub 'Microsoft.NotificationHubs/namespaces/notificationHubs@2023-09-01' = {
  parent: namespace
  name: hubName
  location: location
  tags: tags
  properties: {}
}

// Authorization rule for sending notifications
resource sendRule 'Microsoft.NotificationHubs/namespaces/notificationHubs/authorizationRules@2023-09-01' = {
  parent: hub
  name: 'SendRule'
  properties: {
    rights: [
      'Send'
    ]
  }
}

// Authorization rule for managing registrations
resource manageRule 'Microsoft.NotificationHubs/namespaces/notificationHubs/authorizationRules@2023-09-01' = {
  parent: hub
  name: 'ManageRule'
  properties: {
    rights: [
      'Listen'
      'Manage'
      'Send'
    ]
  }
}

@description('Namespace name')
output namespaceName string = namespace.name

@description('Hub name')
output hubName string = hub.name

@description('Namespace ID')
output namespaceId string = namespace.id

@description('Hub ID')
output hubId string = hub.id

@description('Send connection string')
output sendConnectionString string = sendRule.listKeys().primaryConnectionString

@description('Manage connection string')
output connectionString string = manageRule.listKeys().primaryConnectionString
