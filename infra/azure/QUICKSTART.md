# Phoenix Rooivalk - Azure Quick Start Guide

Get your documentation site running on Azure in 15 minutes.

## Prerequisites

```bash
# Install Azure CLI (if not installed)
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Login to Azure
az login
az account set --subscription "Your Subscription Name"

# Verify login
az account show --query name -o tsv
```

## Step 1: Deploy Everything (5 minutes)

```bash
cd infra/azure

# Deploy to development environment
./scripts/setup-all.sh dev eastus

# OR deploy to production
./scripts/setup-all.sh prod westeurope
```

This creates:
- Azure Static Web Apps (hosting)
- Azure Functions (backend APIs)
- Cosmos DB (database)
- Application Insights (monitoring)
- Key Vault (secrets)

## Step 2: Configure Authentication (5 minutes)

```bash
# Run the B2C setup guide
./scripts/setup-b2c.sh phoenixrooivalkb2c
```

Follow the on-screen instructions to set up Azure AD B2C in the Azure Portal.

**Quick B2C Setup:**
1. Go to Azure Portal → Create Azure AD B2C tenant
2. Create an app registration for your web app
3. Create user flows (Sign up/Sign in)
4. (Optional) Add Google/GitHub identity providers

## Step 3: Configure GitHub Secrets (2 minutes)

```bash
# Generate config and secrets script
node scripts/generate-env.js --resource-group phoenix-rooivalk-dev --env dev

# Run the generated script (requires gh CLI)
bash output/github-secrets.dev.sh

# Add B2C secrets manually
gh secret set AZURE_AD_B2C_TENANT_ID --body "yourtenant.onmicrosoft.com"
gh secret set AZURE_AD_B2C_CLIENT_ID --body "your-client-id"
gh secret set AZURE_AD_B2C_AUTHORITY --body "https://yourtenant.b2clogin.com/yourtenant.onmicrosoft.com/B2C_1_SignUpSignIn"
```

## Step 4: Deploy! (2 minutes)

```bash
# Push to main branch
git push origin main

# GitHub Actions will automatically deploy to Azure
```

## Verify Deployment

```bash
# Check Static Web App
az staticwebapp show --name swa-phoenix-rooivalk-dev --query "defaultHostname" -o tsv

# Check Functions
az functionapp function list --name func-phoenix-rooivalk-dev --resource-group phoenix-rooivalk-dev -o table
```

## Local Development

```bash
# Copy generated environment variables
cp infra/azure/output/.env.dev apps/docs/.env.local

# Edit to add your B2C config
nano apps/docs/.env.local

# Start development server
cd apps/docs
pnpm dev
```

## Directory Structure

```
infra/azure/
├── main.bicep              # Main infrastructure template
├── parameters.dev.json     # Dev environment config
├── parameters.prod.json    # Prod environment config
├── modules/                # Individual resource templates
├── scripts/
│   ├── setup-all.sh        # One-command setup
│   ├── deploy.sh           # Infrastructure deployment
│   ├── deploy-functions.sh # Functions deployment
│   ├── setup-b2c.sh        # B2C setup guide
│   └── generate-env.js     # Environment generator
└── output/                 # Generated configs (gitignored)
```

## Cost Estimate

Using free/consumption tiers:

| Service | Tier | Cost |
|---------|------|------|
| Static Web Apps | Free | $0/month |
| Cosmos DB | Serverless | ~$0-5/month |
| Functions | Consumption | ~$0-2/month |
| AD B2C | 50K MAU free | $0/month |
| App Insights | 5GB free | $0/month |

**Total: $0-10/month** for typical usage

## Troubleshooting

### "az: command not found"
```bash
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

### "Not logged in"
```bash
az login
```

### "Deployment failed"
```bash
# Check deployment logs
az deployment group list --resource-group phoenix-rooivalk-dev -o table
az deployment group show --resource-group phoenix-rooivalk-dev --name phoenix-rooivalk
```

### "Functions not working"
```bash
# Check function logs
az functionapp log tail --name func-phoenix-rooivalk-dev --resource-group phoenix-rooivalk-dev
```

## Next Steps

1. Set up custom domain
2. Configure CI/CD for staging environment
3. Set up monitoring alerts
4. Enable WAF (if needed)

For detailed documentation, see [README.md](./README.md).
