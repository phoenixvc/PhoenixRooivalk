# 🚀 Quick Reference: Deployment Sequence

## First-Time Setup (5 minutes)

### 1. Configure Azure Credentials

```bash
# Get subscription ID
az account show --query id -o tsv

# Create service principal and copy output
az ad sp create-for-rbac \
  --name "PhoenixRooivalk-GitHub" \
  --role contributor \
  --scopes /subscriptions/<subscription-id> \
  --sdk-auth

# Set GitHub secrets
gh secret set AZURE_SUBSCRIPTION_ID --body "<subscription-id>"
gh secret set AZURE_CREDENTIALS --body '<service-principal-json>'

# Optional: Enable automated secrets configuration
# Create PAT with 'repo' scope: https://github.com/settings/tokens
gh secret set GH_PAT --body "<your-github-token>"
```

## Deploy Infrastructure (10 minutes)

### Via GitHub UI

1. Go to **Actions** → **Deploy Azure Infrastructure**
2. Click **Run workflow**
3. Select `environment`: `dev`, `stg`, or `prd`
4. Select `location`: `eastus2` (or your preferred region)
5. Click **Run workflow** button
6. ☕ Wait ~10 minutes

### Via CLI

```bash
gh workflow run deploy-infrastructure.yml \
  -f environment=dev \
  -f location=eastus2

gh run watch  # Monitor progress
```

## Deploy Applications (5-10 minutes)

### Automatic (on push)

```bash
git push origin main
```

### Manual

```bash
# Deploy all
gh workflow run deploy-marketing-azure.yml
gh workflow run deploy-docs-azure.yml
gh workflow run deploy-azure-functions.yml

# Or via UI:
# Actions → Select workflow → Run workflow
```

## Verify Deployment

```bash
# Check secrets
gh secret list | grep AZURE

# Check variables
gh variable list | grep AZURE

# Check recent runs
gh run list --limit 5

# View specific run
gh run view <run-id> --log
```

## Common Issues

### ❌ "Missing required Azure credentials"

```bash
# Fix: Configure Azure secrets
gh secret set AZURE_SUBSCRIPTION_ID --body "<subscription-id>"
gh secret set AZURE_CREDENTIALS --body '<service-principal-json>'
```

### ❌ "Required secrets are missing" (app deployment)

```bash
# Fix: Run infrastructure workflow first
gh workflow run deploy-infrastructure.yml \
  -f environment=dev \
  -f location=eastus2
```

### ❌ "Could not retrieve deployment tokens"

```bash
# Fix: Wait 2-3 minutes for resources to provision
sleep 120

# Check deployment status
az deployment group show \
  --resource-group dev-eus2-rg-rooivalk \
  --name main \
  --query properties.provisioningState
```

## Resource Naming Convention

Resources follow the pattern: `{env}-{region}-{type}-rooivalk`

| Environment | Code | Example |
|-------------|------|---------|
| Development | dev  | `dev-eus2-rg-rooivalk` |
| Staging     | stg  | `stg-eus2-rg-rooivalk` |
| Production  | prd  | `prd-weu-rg-rooivalk` |

| Location | Code | Full Name |
|----------|------|-----------|
| East US 2 | eus2 | eastus2 |
| West Europe | weu | westeurope |
| South Africa North | san | southafricanorth |

## Key Secrets & Variables

### Secrets (Sensitive)
- `AZURE_SUBSCRIPTION_ID` - Your Azure subscription
- `AZURE_CREDENTIALS` - Service principal JSON
- `AZURE_STATIC_WEB_APPS_API_TOKEN` - Docs site deployment
- `AZURE_STATIC_WEB_APPS_MARKETING_API_TOKEN` - Marketing site
- `AZURE_FUNCTIONAPP_PUBLISH_PROFILE` - Functions deployment
- `COSMOS_DB_CONNECTION_STRING` - Database connection
- `APPLICATIONINSIGHTS_CONNECTION_STRING` - Monitoring
- `GH_PAT` - GitHub token (optional, for auto-secrets)

### Variables (Public)
- `AZURE_FUNCTIONAPP_NAME` - Functions app name
- `AZURE_FUNCTIONS_BASE_URL` - Functions endpoint

## Workflow Dependencies

```
┌─────────────────────────────────────┐
│  deploy-infrastructure.yml          │  ← Run this FIRST
│  • Creates Azure resources          │
│  • Generates deployment tokens      │
│  • Configures GitHub secrets        │
└─────────────────────────────────────┘
                 │
                 │ Populates secrets
                 ▼
┌─────────────────────────────────────┐
│  Application Deployments            │  ← Run these AFTER
│  • deploy-marketing-azure.yml       │
│  • deploy-docs-azure.yml            │
│  • deploy-azure-functions.yml       │
└─────────────────────────────────────┘
```

## Emergency Rollback

If deployment fails:

```bash
# Option 1: Redeploy infrastructure
gh workflow run deploy-infrastructure.yml \
  -f environment=dev \
  -f location=eastus2

# Option 2: Manual recovery
cd infra/azure
./scripts/setup-all.sh dev eastus2
./output/github-secrets.dev.sh

# Option 3: Delete and recreate (nuclear option)
az group delete --name dev-eus2-rg-rooivalk --yes
gh workflow run deploy-infrastructure.yml \
  -f environment=dev \
  -f location=eastus2
```

## Documentation Links

- 📖 **Full Guide**: [DEPLOYMENT_WORKFLOW_GUIDE.md](./DEPLOYMENT_WORKFLOW_GUIDE.md)
- 📋 **Detailed Sequence**: [DEPLOYMENT_SEQUENCE.md](./DEPLOYMENT_SEQUENCE.md)
- 🔧 **Azure Setup**: [AZURE_SETUP.md](./AZURE_SETUP.md)
- 🐛 **Troubleshooting**: [AZURE_TROUBLESHOOTING.md](./AZURE_TROUBLESHOOTING.md)
- 🏗️ **Infrastructure**: [../infra/azure/README.md](../infra/azure/README.md)

## Cheat Sheet

| Task | Command |
|------|---------|
| Deploy infrastructure | `gh workflow run deploy-infrastructure.yml -f environment=dev -f location=eastus2` |
| Deploy marketing site | `gh workflow run deploy-marketing-azure.yml` |
| Deploy docs site | `gh workflow run deploy-docs-azure.yml` |
| Deploy functions | `gh workflow run deploy-azure-functions.yml` |
| List recent runs | `gh run list --limit 10` |
| Watch current run | `gh run watch` |
| View run logs | `gh run view <run-id> --log` |
| List secrets | `gh secret list` |
| List variables | `gh variable list` |
| Check Azure resources | `az group show --name dev-eus2-rg-rooivalk` |
| List all resources | `az resource list --resource-group dev-eus2-rg-rooivalk -o table` |

---

**Need help?** See [DEPLOYMENT_WORKFLOW_GUIDE.md](./DEPLOYMENT_WORKFLOW_GUIDE.md) for detailed instructions.
