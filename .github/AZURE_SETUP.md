# Azure GitHub Actions Setup Guide

This document explains the correct environment variables and secrets required
for Azure deployments in the PhoenixRooivalk project.

## Overview

The project uses two Azure-focused deployment workflows:

1. **`deploy-azure-functions.yml`** - Deploys Azure Functions (primary Functions
   deployment)
2. **`deploy-docs-azure.yml`** - Deploys documentation to Azure Static Web Apps
   (with optional Functions deployment)

## ✅ Correct Variable Names

### GitHub Variables (Repository Settings → Variables)

Variables are **non-sensitive configuration values** stored as GitHub Variables
(not Secrets):

| Variable Name              | Type     | Description                          | Example                 |
| -------------------------- | -------- | ------------------------------------ | ----------------------- |
| `AZURE_FUNCTIONAPP_NAME`   | Variable | Azure Function App name              | `func-phoenix-rooivalk` |
| `AZURE_AI_DEPLOYMENT_NAME` | Variable | Azure OpenAI chat model deployment   | `gpt-4`                 |
| `CONFIGURE_APP_SETTINGS`   | Variable | Enable automatic app settings config | `true` or `false`       |

**How to set:**

```bash
# Using GitHub CLI
gh variable set AZURE_FUNCTIONAPP_NAME --body "func-phoenix-rooivalk"
gh variable set AZURE_AI_DEPLOYMENT_NAME --body "gpt-4"

# Or via GitHub UI:
# Settings → Secrets and variables → Actions → Variables tab → New repository variable
```

### GitHub Secrets (Repository Settings → Secrets)

Secrets are **sensitive values** that should never be exposed:

| Secret Name                             | Type   | Description                          | How to Get                                        |
| --------------------------------------- | ------ | ------------------------------------ | ------------------------------------------------- |
| `AZURE_FUNCTIONAPP_PUBLISH_PROFILE`     | Secret | Function App publish profile (XML)   | Azure Portal → Function App → Get publish profile |
| `AZURE_FUNCTIONS_BASE_URL`              | Secret | Function App URL for API calls       | `https://{function-app-name}.azurewebsites.net`   |
| `AZURE_STATIC_WEB_APPS_API_TOKEN`       | Secret | Static Web App deployment token      | `az staticwebapp secrets list`                    |
| `COSMOS_DB_CONNECTION_STRING`           | Secret | Cosmos DB connection string          | Azure Portal → Cosmos DB → Keys                   |
| `AZURE_AI_ENDPOINT`                     | Secret | Azure OpenAI endpoint URL            | Azure Portal → Azure OpenAI → Keys and Endpoint   |
| `AZURE_AI_API_KEY`                      | Secret | Azure OpenAI API key                 | Azure Portal → Azure OpenAI → Keys and Endpoint   |
| `AZURE_CREDENTIALS`                     | Secret | Service principal credentials (JSON) | `az ad sp create-for-rbac --sdk-auth`             |
| `APPLICATIONINSIGHTS_CONNECTION_STRING` | Secret | App Insights connection string       | Azure Portal → App Insights → Connection String   |
| `AZURE_ENTRA_TENANT_ID`                 | Secret | Entra ID tenant ID                   | Azure Portal → Entra ID → Overview                |
| `AZURE_ENTRA_CLIENT_ID`                 | Secret | Entra ID application client ID       | Azure Portal → Entra ID → App registrations       |

**How to set:**

```bash
# Using GitHub CLI
gh secret set AZURE_FUNCTIONAPP_PUBLISH_PROFILE --body "$(cat publish-profile.xml)"
gh secret set AZURE_FUNCTIONS_BASE_URL --body "https://func-phoenix-rooivalk.azurewebsites.net"

# Or via GitHub UI:
# Settings → Secrets and variables → Actions → Secrets tab → New repository secret
```

## ❌ Deprecated/Incorrect Variable Names

These variable names were used inconsistently and have been **standardized**. Do
NOT use:

| ❌ Old Name                       | ✅ Correct Name                     | Notes                              |
| --------------------------------- | ----------------------------------- | ---------------------------------- |
| `AZURE_FUNCTIONS_APP_NAME`        | `AZURE_FUNCTIONAPP_NAME`            | Should be a Variable, not a Secret |
| `AZURE_FUNCTIONS_PUBLISH_PROFILE` | `AZURE_FUNCTIONAPP_PUBLISH_PROFILE` | Standardized naming                |

## Automated Setup Scripts

The repository includes scripts to help you configure everything:

### Option 1: Complete Setup (Recommended)

```bash
# Deploy all Azure infrastructure and generate configuration
cd infra/azure
./scripts/setup-all.sh dev eastus

# This creates:
# - output/.env.dev - Environment variables for local development
# - output/github-secrets.dev.sh - Script to set GitHub secrets
```

### Option 2: Generate from Existing Resources

```bash
# Generate configuration from already-deployed Azure resources
cd infra/azure/scripts
node generate-env.js --resource-group phoenix-rooivalk-prod --env prod

# Then run the generated script:
bash ../output/github-secrets.prod.sh
```

## Manual Setup

If you prefer to set up secrets manually:

### 1. Get Function App Publish Profile

```bash
az functionapp deployment list-publishing-profiles \
  --name func-phoenix-rooivalk \
  --resource-group rg-phoenix-rooivalk \
  --xml > publish-profile.xml

gh secret set AZURE_FUNCTIONAPP_PUBLISH_PROFILE --body "$(cat publish-profile.xml)"
```

### 2. Get Cosmos DB Connection String

```bash
CONNECTION_STRING=$(az cosmosdb keys list \
  --name cosmos-phoenix-rooivalk \
  --resource-group rg-phoenix-rooivalk \
  --type connection-strings \
  --query "connectionStrings[0].connectionString" \
  --output tsv)

gh secret set COSMOS_DB_CONNECTION_STRING --body "$CONNECTION_STRING"
```

### 3. Get Azure OpenAI Credentials

```bash
ENDPOINT=$(az cognitiveservices account show \
  --name aoai-phoenix-rooivalk \
  --resource-group rg-phoenix-rooivalk \
  --query "properties.endpoint" \
  --output tsv)

API_KEY=$(az cognitiveservices account keys list \
  --name aoai-phoenix-rooivalk \
  --resource-group rg-phoenix-rooivalk \
  --query "key1" \
  --output tsv)

gh secret set AZURE_AI_ENDPOINT --body "$ENDPOINT"
gh secret set AZURE_AI_API_KEY --body "$API_KEY"
```

### 4. Set Function App Name (Variable, not Secret)

```bash
gh variable set AZURE_FUNCTIONAPP_NAME --body "func-phoenix-rooivalk"
```

## Workflow Usage

### `deploy-azure-functions.yml`

Uses these variables for dedicated Functions deployment:

- `vars.AZURE_FUNCTIONAPP_NAME` ✅ (GitHub Variable)
- `secrets.AZURE_FUNCTIONAPP_PUBLISH_PROFILE` ✅ (GitHub Secret)
- `secrets.COSMOS_DB_CONNECTION_STRING`
- `secrets.AZURE_AI_ENDPOINT`
- `secrets.AZURE_AI_API_KEY`

### `deploy-docs-azure.yml`

Uses these variables for docs + optional Functions:

- `vars.AZURE_FUNCTIONAPP_NAME` ✅ (GitHub Variable)
- `secrets.AZURE_FUNCTIONAPP_PUBLISH_PROFILE` ✅ (GitHub Secret)
- `secrets.AZURE_FUNCTIONS_BASE_URL`
- `secrets.AZURE_STATIC_WEB_APPS_API_TOKEN`
- `secrets.AZURE_ENTRA_TENANT_ID`
- `secrets.AZURE_ENTRA_CLIENT_ID`

## Verification

To verify your configuration:

```bash
# Check that variables are set (should return the value)
gh variable get AZURE_FUNCTIONAPP_NAME

# Check that secrets are set (should confirm existence)
gh secret list | grep AZURE

# Test deployment
gh workflow run deploy-azure-functions.yml
```

## Troubleshooting

For detailed troubleshooting of deployment issues, including 401 Unauthorized errors, see [AZURE_TROUBLESHOOTING.md](AZURE_TROUBLESHOOTING.md).

### Missing Variables/Secrets

The workflows include validation steps that check for missing configuration and
provide clear error messages with setup instructions.

### Deployment Fails

1. Check the workflow run summary for specific missing items
2. Verify Azure resources exist:
   `az resource list --resource-group rg-phoenix-rooivalk`
3. Test connectivity:
   `az functionapp show --name func-phoenix-rooivalk --resource-group rg-phoenix-rooivalk`
4. See [AZURE_TROUBLESHOOTING.md](AZURE_TROUBLESHOOTING.md) for common deployment issues and solutions

### Wrong Variable Type

- If you accidentally set `AZURE_FUNCTIONAPP_NAME` as a Secret instead of a
  Variable:

  ```bash
  # Delete the secret
  gh secret delete AZURE_FUNCTIONAPP_NAME

  # Set it as a variable
  gh variable set AZURE_FUNCTIONAPP_NAME --body "func-phoenix-rooivalk"
  ```

## Related Documentation

- [Azure Functions Infrastructure Setup](../apps/docs/azure-functions/INFRASTRUCTURE.md) -
  Detailed Azure resource setup
- [Azure Infrastructure README](../infra/azure/README.md) - Complete
  infrastructure overview
- [Azure Quickstart](../infra/azure/QUICKSTART.md) - Quick start guide for Azure
  Entra ID setup

## Summary: The Three Key Variables

To answer the original question about which variables are correct:

**For Azure Functions deployments, use these standardized names:**

1. ✅ `AZURE_FUNCTIONAPP_NAME` (GitHub **Variable**) - The Function App resource
   name
2. ✅ `AZURE_FUNCTIONAPP_PUBLISH_PROFILE` (GitHub **Secret**) - Deployment
   credentials
3. ✅ `AZURE_FUNCTIONS_BASE_URL` (GitHub **Secret**) - API endpoint URL for
   client apps

**Do NOT use these deprecated names:**

- ❌ `AZURE_FUNCTIONS_APP_NAME`
- ❌ `AZURE_FUNCTIONS_PUBLISH_PROFILE`

All workflows and scripts have been updated to use the correct, standardized
names.

## Troubleshooting

If you're experiencing issues with Azure Functions deployment being skipped or failing:

1. **Check Secret/Variable Configuration**: Ensure all required items are set as the correct type (Secret vs Variable)
2. **Verify Secret Content**: Ensure `AZURE_FUNCTIONAPP_PUBLISH_PROFILE` contains the complete XML (not empty)
3. **Check for Typos**: Variable names must match exactly (no extra prefixes like 'v')
4. **Review Workflow Logs**: The workflows now include detailed diagnostic output showing what's missing

See [AZURE_TROUBLESHOOTING.md](AZURE_TROUBLESHOOTING.md) for detailed troubleshooting steps, including:
- "Azure Functions secrets not configured" despite secrets being set
- Variables set as secrets instead of variables
- Common typos and unusual values
- Step-by-step fix instructions
