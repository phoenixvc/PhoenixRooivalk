# Azure Functions Infrastructure Setup

This document describes the required Azure infrastructure for deploying the
Phoenix Rooivalk Azure Functions.

## Quick Start

If you already have a Cosmos DB account created, use the automated setup script:

**PowerShell:**

```powershell
.\scripts\Setup-CosmosContainers.ps1 -ResourceGroup "your-rg-name" -CosmosAccountName "your-cosmos-name"
```

**Bash:**

```bash
./scripts/setup-cosmos-containers.sh your-rg-name your-cosmos-name
```

This will create the database and all required containers automatically.

## Prerequisites

- Azure subscription
- Azure CLI installed (`az --version`)
- Node.js 20+
- pnpm

## Important: Resource Naming

**Note:** The examples below use placeholder names like `rg-phoenix-rooivalk`
and `cosmos-phoenix-rooivalk`. **Replace these with your actual Azure resource
names** when running commands.

To find your existing resources:

```bash
# List all resource groups
az group list --output table

# List Cosmos DB accounts in a resource group
az cosmosdb list --resource-group YOUR_RESOURCE_GROUP_NAME --output table

# List Function Apps in a resource group
az functionapp list --resource-group YOUR_RESOURCE_GROUP_NAME --output table
```

## Required Azure Resources

### 1. Azure Function App

```bash
# Create resource group
az group create --name rg-phoenix-rooivalk --location eastus

# Create storage account (required for Functions)
az storage account create \
  --name stphoenixrooivalk \
  --resource-group rg-phoenix-rooivalk \
  --location eastus \
  --sku Standard_LRS

# Create Function App
az functionapp create \
  --name func-phoenix-rooivalk \
  --resource-group rg-phoenix-rooivalk \
  --storage-account stphoenixrooivalk \
  --consumption-plan-location eastus \
  --runtime node \
  --runtime-version 20 \
  --functions-version 4
```

### 2. Azure Cosmos DB

#### Option A: Automated Setup (Recommended)

Use the provided setup scripts to automatically create the database and all
containers:

**PowerShell:**

```powershell
# From repository root
.\scripts\Setup-CosmosContainers.ps1 -ResourceGroup "rg-phoenix-rooivalk" -CosmosAccountName "cosmos-phoenix-rooivalk"
```

**Bash:**

```bash
# From repository root
./scripts/setup-cosmos-containers.sh rg-phoenix-rooivalk cosmos-phoenix-rooivalk
```

The scripts will:

- Create the `phoenix-docs` database
- Create all 10 required containers with correct partition keys
- Verify each step and provide detailed output
- Skip existing resources automatically

#### Option B: Manual Setup

```bash
# Create Cosmos DB account
az cosmosdb create \
  --name cosmos-phoenix-rooivalk \
  --resource-group rg-phoenix-rooivalk \
  --kind GlobalDocumentDB \
  --default-consistency-level Session

# Create database
az cosmosdb sql database create \
  --account-name cosmos-phoenix-rooivalk \
  --resource-group rg-phoenix-rooivalk \
  --name phoenix-docs

# Create containers (note: user_news_preferences uses /userId)
az cosmosdb sql container create \
  --account-name cosmos-phoenix-rooivalk \
  --resource-group rg-phoenix-rooivalk \
  --database-name phoenix-docs \
  --name news_articles \
  --partition-key-path "/id"

az cosmosdb sql container create \
  --account-name cosmos-phoenix-rooivalk \
  --resource-group rg-phoenix-rooivalk \
  --database-name phoenix-docs \
  --name user_news_preferences \
  --partition-key-path "/userId"

# Continue for remaining containers...
# See scripts/setup-cosmos-containers.sh for complete list
```

### 3. Azure OpenAI

```bash
# Create Azure OpenAI resource
az cognitiveservices account create \
  --name aoai-phoenix-rooivalk \
  --resource-group rg-phoenix-rooivalk \
  --kind OpenAI \
  --sku S0 \
  --location eastus

# Deploy GPT-4 model
az cognitiveservices account deployment create \
  --name aoai-phoenix-rooivalk \
  --resource-group rg-phoenix-rooivalk \
  --deployment-name gpt-4 \
  --model-name gpt-4 \
  --model-version "0613" \
  --model-format OpenAI \
  --sku-capacity 10 \
  --sku-name Standard

# Deploy embedding model
az cognitiveservices account deployment create \
  --name aoai-phoenix-rooivalk \
  --resource-group rg-phoenix-rooivalk \
  --deployment-name text-embedding-3-small \
  --model-name text-embedding-3-small \
  --model-version "1" \
  --model-format OpenAI \
  --sku-capacity 10 \
  --sku-name Standard
```

### 4. Application Insights (Optional but Recommended)

```bash
# Create Application Insights
az monitor app-insights component create \
  --app appi-phoenix-rooivalk \
  --resource-group rg-phoenix-rooivalk \
  --location eastus \
  --kind web
```

### 5. Azure Notification Hubs (For Push Notifications)

```bash
# Create Notification Hub namespace
az notification-hub namespace create \
  --name nh-phoenix-rooivalk-ns \
  --resource-group rg-phoenix-rooivalk \
  --location eastus \
  --sku Free

# Create Notification Hub
az notification-hub create \
  --name nh-phoenix-rooivalk \
  --namespace-name nh-phoenix-rooivalk-ns \
  --resource-group rg-phoenix-rooivalk
```

## GitHub Secrets Configuration

Add these secrets to your GitHub repository:

### Required Secrets

| Secret Name                         | Description                  | How to Get                                        |
| ----------------------------------- | ---------------------------- | ------------------------------------------------- |
| `AZURE_FUNCTIONAPP_PUBLISH_PROFILE` | Function App publish profile | Azure Portal → Function App → Get publish profile |
| `COSMOS_DB_CONNECTION_STRING`       | Cosmos DB connection string  | Azure Portal → Cosmos DB → Keys                   |
| `AZURE_AI_ENDPOINT`                 | Azure OpenAI endpoint URL    | Azure Portal → Azure OpenAI → Keys and Endpoint   |
| `AZURE_AI_API_KEY`                  | Azure OpenAI API key         | Azure Portal → Azure OpenAI → Keys and Endpoint   |

### Optional Secrets

| Secret Name                                | Description                    | How to Get                                        |
| ------------------------------------------ | ------------------------------ | ------------------------------------------------- |
| `AZURE_CREDENTIALS`                        | Service principal credentials  | `az ad sp create-for-rbac --sdk-auth`             |
| `APPLICATIONINSIGHTS_CONNECTION_STRING`    | App Insights connection string | Azure Portal → App Insights → Connection String   |
| `SENDGRID_API_KEY`                         | SendGrid API key for emails    | SendGrid Dashboard                                |
| `AZURE_NOTIFICATION_HUB_CONNECTION_STRING` | Notification Hub connection    | Azure Portal → Notification Hub → Access Policies |

### GitHub Variables

| Variable Name              | Description            | Example                 |
| -------------------------- | ---------------------- | ----------------------- |
| `AZURE_FUNCTIONAPP_NAME`   | Function App name      | `func-phoenix-rooivalk` |
| `AZURE_AI_DEPLOYMENT_NAME` | OpenAI chat deployment | `gpt-4`                 |

## Get Connection Strings

```bash
# Cosmos DB connection string
az cosmosdb keys list \
  --name cosmos-phoenix-rooivalk \
  --resource-group rg-phoenix-rooivalk \
  --type connection-strings \
  --query "connectionStrings[0].connectionString" \
  --output tsv

# Azure OpenAI endpoint and key
az cognitiveservices account show \
  --name aoai-phoenix-rooivalk \
  --resource-group rg-phoenix-rooivalk \
  --query "properties.endpoint" \
  --output tsv

az cognitiveservices account keys list \
  --name aoai-phoenix-rooivalk \
  --resource-group rg-phoenix-rooivalk \
  --query "key1" \
  --output tsv

# Application Insights connection string
az monitor app-insights component show \
  --app appi-phoenix-rooivalk \
  --resource-group rg-phoenix-rooivalk \
  --query "connectionString" \
  --output tsv

# Function App publish profile
az functionapp deployment list-publishing-profiles \
  --name func-phoenix-rooivalk \
  --resource-group rg-phoenix-rooivalk \
  --xml
```

## Local Development

1. Copy `local.settings.json.example` to `local.settings.json`
2. Fill in the values from your Azure resources
3. Run `pnpm start` to start the local Functions runtime

## Environment Variables Reference

| Variable                                   | Required | Description                                                              |
| ------------------------------------------ | -------- | ------------------------------------------------------------------------ |
| `COSMOS_DB_CONNECTION_STRING`              | ✅       | Cosmos DB connection                                                     |
| `COSMOS_DB_DATABASE`                       | ❌       | Database name (default: `phoenix-docs`)                                  |
| `AZURE_AI_ENDPOINT`                        | ✅       | Azure OpenAI endpoint                                                    |
| `AZURE_AI_API_KEY`                         | ✅\*     | Azure OpenAI API key                                                     |
| `AZURE_ENTRA_AUTHORITY`                    | ✅\*     | For managed identity auth                                                |
| `AZURE_AI_DEPLOYMENT_NAME`                 | ❌       | Chat model deployment (default: `gpt-4`)                                 |
| `AZURE_AI_EMBEDDING_DEPLOYMENT`            | ❌       | Embedding model (default: `text-embedding-3-small`)                      |
| `APPLICATIONINSIGHTS_CONNECTION_STRING`    | ❌       | For monitoring                                                           |
| `SENDGRID_API_KEY`                         | ❌       | For email sending                                                        |
| `SENDGRID_FROM_EMAIL`                      | ❌       | Sender email address                                                     |
| `AZURE_NOTIFICATION_HUB_CONNECTION_STRING` | ❌       | For push notifications                                                   |
| `AZURE_NOTIFICATION_HUB_NAME`              | ❌       | Notification hub name                                                    |
| `NEWS_API_KEY`                             | ❌       | NewsAPI.org API key                                                      |
| `BING_SEARCH_API_KEY`                      | ❌       | Bing News Search API key                                                 |
| `BASE_URL`                                 | ❌       | Base URL for links (should match your docs site URL)                    |

\*Either `AZURE_AI_API_KEY` or `AZURE_ENTRA_AUTHORITY` is required for
authentication.

## Cosmos DB Containers

| Container               | Partition Key | Purpose                     |
| ----------------------- | ------------- | --------------------------- |
| `news_articles`         | `/id`         | News articles storage       |
| `user_news_preferences` | `/userId`     | User preferences            |
| `documents`             | `/id`         | Document embeddings for RAG |
| `support_tickets`       | `/id`         | Support tickets             |
| `news_subscriptions`    | `/id`         | Push/email subscriptions    |
| `notification_queue`    | `/id`         | Email/notification queue    |
| `embeddings`            | `/id`         | Vector embeddings cache     |
| `configuration`         | `/type`       | Dynamic configuration       |
| `monitoring_logs`       | `/id`         | Monitoring and metrics      |
| `cache`                 | `/id`         | General caching             |

## Troubleshooting

### Deployment Fails with Missing Secrets

The CI/CD pipeline validates infrastructure before deployment. If it fails:

1. Check the GitHub Actions summary for missing secrets/variables
2. Add the missing items in GitHub Settings → Secrets and Variables
3. Re-run the workflow

### Function App Not Responding

1. Check Application Insights for errors
2. Verify environment variables are set correctly
3. Check the Function App logs:
   `az functionapp log tail --name func-phoenix-rooivalk --resource-group rg-phoenix-rooivalk`

### Cosmos DB Connection Issues

1. Verify the connection string is correct
2. Check firewall rules allow Azure services
3. Verify the database and containers exist

### Azure OpenAI Quota Issues

1. Check your quota in Azure Portal
2. Request quota increase if needed
3. Verify deployment names match configuration
