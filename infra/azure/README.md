# Phoenix Rooivalk - Azure Infrastructure

This directory contains the Azure infrastructure as code (Bicep) and deployment scripts for the Phoenix Rooivalk documentation platform.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Azure Static Web Apps                     │
│                    (Docusaurus documentation site)               │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Azure Functions                          │
│   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │
│   │ AI/RAG APIs │ │ Cosmos Proxy│ │  Utilities  │              │
│   └─────────────┘ └─────────────┘ └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Azure OpenAI  │  │  Cosmos DB      │  │  Key Vault      │
│    (via API)    │  │  (Serverless)   │  │  (Secrets)      │
└─────────────────┘  └─────────────────┘  └─────────────────┘
                                                   │
         ┌────────────────────────────────────────┘
         ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ App Insights    │  │ Notification    │  │ Azure AD B2C    │
│ (Analytics)     │  │ Hubs (Push)     │  │ (Auth)          │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

## Services Deployed

| Service | Purpose | Replaces |
|---------|---------|----------|
| Azure Static Web Apps | Documentation hosting | Netlify |
| Azure Cosmos DB | NoSQL database | Firebase Firestore |
| Azure Functions | Serverless compute | Firebase Cloud Functions |
| Azure AD B2C | Authentication | Firebase Auth |
| Azure Notification Hubs | Push notifications | Firebase Cloud Messaging |
| Application Insights | Analytics & monitoring | Firebase Analytics |
| Key Vault | Secrets management | Firebase config |

## Prerequisites

1. **Azure CLI** - [Install Azure CLI](https://docs.microsoft.com/cli/azure/install-azure-cli)
2. **Bicep CLI** - Installed automatically with Azure CLI
3. **Azure Subscription** - With permissions to create resources
4. **OpenAI API Key** - For AI features

## Quick Start

### 1. Login to Azure

```bash
az login
az account set --subscription "Your Subscription Name"
```

### 2. Deploy Infrastructure

```bash
# Development environment
./scripts/deploy.sh dev phoenix-rooivalk-dev eastus

# Production environment
./scripts/deploy.sh prod phoenix-rooivalk-prod westeurope
```

### 3. Set up Azure AD B2C (Authentication)

```bash
./scripts/setup-b2c.sh phoenixrooivalkb2c
```

Follow the printed instructions to complete B2C setup in the Azure Portal.

### 4. Deploy Azure Functions

```bash
./scripts/deploy-functions.sh dev phoenix-rooivalk-dev
```

## Directory Structure

```
infra/azure/
├── main.bicep                 # Main deployment template
├── parameters.dev.json        # Dev environment parameters
├── parameters.prod.json       # Prod environment parameters
├── modules/
│   ├── appinsights.bicep      # Application Insights
│   ├── cosmosdb.bicep         # Cosmos DB
│   ├── functions.bicep        # Azure Functions
│   ├── keyvault.bicep         # Key Vault
│   ├── keyvault-secret.bicep  # Key Vault secrets
│   ├── notificationhub.bicep  # Notification Hubs
│   ├── staticwebapp.bicep     # Static Web Apps
│   └── storage.bicep          # Storage Account
├── scripts/
│   ├── deploy.sh              # Main deployment script
│   ├── deploy-functions.sh    # Functions deployment
│   └── setup-b2c.sh           # B2C setup guide
└── README.md                  # This file
```

## Environment Variables

After deployment, you'll receive output values. Add these to your app:

```env
# Azure Cloud Provider
CLOUD_PROVIDER=azure

# Azure Functions
AZURE_FUNCTIONS_BASE_URL=https://your-func.azurewebsites.net

# Azure AD B2C
AZURE_AD_B2C_TENANT_ID=yourtenant.onmicrosoft.com
AZURE_AD_B2C_CLIENT_ID=your-client-id
AZURE_AD_B2C_AUTHORITY=https://yourtenant.b2clogin.com/yourtenant.onmicrosoft.com/B2C_1_SignUpSignIn

# Azure Application Insights
AZURE_APP_INSIGHTS_CONNECTION_STRING=InstrumentationKey=...

# Azure Cosmos DB (server-side only)
AZURE_COSMOS_ENDPOINT=https://your-cosmos.documents.azure.com
```

## Cost Estimation

Using free tier and serverless options:

| Service | Tier | Estimated Cost |
|---------|------|----------------|
| Static Web Apps | Free | $0/month |
| Cosmos DB | Serverless | ~$0-5/month (based on usage) |
| Functions | Consumption | ~$0-2/month (first 1M free) |
| AD B2C | First 50K MAU free | $0/month |
| Notification Hubs | Free | $0/month |
| Application Insights | First 5GB free | ~$0/month |
| Key Vault | Standard | ~$0.03/10K operations |

**Estimated total: $0-10/month** for low-traffic sites

## GitHub Actions Integration

After deployment, add these secrets to your GitHub repository:

```bash
# Get the deployment token
az staticwebapp secrets list --name your-swa-name --query "properties.apiKey" -o tsv

# Add to GitHub
gh secret set AZURE_STATIC_WEB_APPS_API_TOKEN --body "your-token"
```

## Switching from Firebase

The cloud service abstraction layer allows gradual migration:

1. **Deploy Azure infrastructure** (this guide)
2. **Keep Firebase running** for existing users
3. **Set `cloudProvider: 'azure'`** in your config
4. **Test thoroughly** in staging
5. **Switch production** when ready

## Troubleshooting

### Deployment Fails

```bash
# Check deployment status
az deployment group show --resource-group your-rg --name your-deployment

# View deployment logs
az deployment group list --resource-group your-rg --output table
```

### Functions Not Working

```bash
# Check function logs
az functionapp log tail --name your-func --resource-group your-rg

# View in Application Insights
az monitor app-insights query --app your-insights --analytics-query "traces | take 50"
```

### Cosmos DB Issues

```bash
# Test connection
az cosmosdb show --name your-cosmos --resource-group your-rg

# Check databases
az cosmosdb sql database list --account-name your-cosmos --resource-group your-rg
```

## Support

- [Azure Documentation](https://docs.microsoft.com/azure)
- [Bicep Documentation](https://docs.microsoft.com/azure/azure-resource-manager/bicep)
- [Static Web Apps Docs](https://docs.microsoft.com/azure/static-web-apps)
