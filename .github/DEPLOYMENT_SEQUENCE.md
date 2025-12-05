# PhoenixRooivalk Deployment Sequence

## Overview

This document explains the correct order of operations for deploying the PhoenixRooivalk platform to Azure. The workflows **cannot succeed** until Azure infrastructure is deployed and secrets are configured.

## 🚨 Important: Infrastructure Must Be Deployed First

The GitHub Actions workflows (`deploy-marketing-azure.yml` and `deploy-docs-azure.yml`) **require** Azure infrastructure to exist before they can run. The workflows will fail with validation errors if the required secrets are not configured.

### Why This Order Matters

1. **Azure Static Web Apps** generate deployment tokens when created
2. These tokens must be added to GitHub repository secrets
3. Only then can the CI/CD workflows deploy successfully

## 📋 Complete Deployment Checklist

### Phase 1: Azure Infrastructure Setup (One-Time)

This phase creates all Azure resources and generates the deployment tokens needed for CI/CD.

#### Prerequisites

- [ ] Azure account with active subscription
- [ ] Azure CLI installed: `az --version`
- [ ] Logged in to Azure: `az login`
- [ ] GitHub CLI installed (optional, for automated secret setup): `gh --version`
- [ ] Appropriate permissions to create resources in Azure

#### Steps

1. **Choose your environment and location**

   ```bash
   # For development
   ENVIRONMENT="dev"
   LOCATION="eastus"  # or your preferred Azure region
   
   # For production
   # ENVIRONMENT="prd"
   # LOCATION="westeurope"
   ```

2. **Deploy Azure infrastructure**

   Navigate to the infrastructure directory and run the setup script:

   ```bash
   cd infra/azure
   ./scripts/setup-all.sh $ENVIRONMENT $LOCATION
   ```

   This script will:
   - Create a resource group: `{env}-{region}-rg-rooivalk`
   - Deploy all Azure resources (Static Web Apps, Functions, Cosmos DB, etc.)
   - Generate configuration files in `infra/azure/output/`
   - Take approximately 5-10 minutes to complete

3. **Review the deployment outputs**

   After successful deployment, you'll see a summary with:
   - Resource names and URLs
   - Configuration files location
   - Next steps

   Key files created:
   - `.env.{environment}` - Environment variables for local development
   - `github-secrets.{environment}.sh` - Script to configure GitHub secrets
   - `deployment-info.{environment}.json` - Deployment metadata

### Phase 2: Extract Deployment Tokens

The deployment tokens are required for GitHub Actions to deploy to Azure Static Web Apps.

#### For Documentation Site

```bash
# Get the Static Web App name from deployment
SWA_DOCS_NAME=$(az staticwebapp list \
  --resource-group dev-eus-rg-rooivalk \
  --query "[?contains(name, 'swa-rooivalk')].name | [0]" \
  -o tsv)

# Extract deployment token
DOCS_TOKEN=$(az staticwebapp secrets list \
  --name "$SWA_DOCS_NAME" \
  --query "properties.apiKey" \
  -o tsv)

echo "Documentation site deployment token:"
echo "$DOCS_TOKEN"
```

#### For Marketing Site

```bash
# Get the Marketing Static Web App name
SWA_MARKETING_NAME=$(az staticwebapp list \
  --resource-group dev-eus-rg-rooivalk \
  --query "[?contains(name, 'marketing')].name | [0]" \
  -o tsv)

# Extract deployment token
MARKETING_TOKEN=$(az staticwebapp secrets list \
  --name "$SWA_MARKETING_NAME" \
  --query "properties.apiKey" \
  -o tsv)

echo "Marketing site deployment token:"
echo "$MARKETING_TOKEN"
```

### Phase 3: Configure GitHub Repository Secrets

Now that you have the deployment tokens, add them to your GitHub repository.

#### Option A: Automated Setup (Recommended)

The `setup-all.sh` script generates a shell script to configure all secrets automatically:

```bash
# Review the generated script
cat infra/azure/output/github-secrets.dev.sh

# Run it to configure GitHub secrets
./infra/azure/output/github-secrets.dev.sh
```

#### Option B: Manual Setup via GitHub CLI

```bash
# Documentation site token
gh secret set AZURE_STATIC_WEB_APPS_API_TOKEN --body "$DOCS_TOKEN"

# Marketing site token
gh secret set AZURE_STATIC_WEB_APPS_MARKETING_API_TOKEN --body "$MARKETING_TOKEN"

# Other required secrets (from deployment outputs)
gh secret set AZURE_FUNCTIONS_BASE_URL --body "https://dev-eus-func-rooivalk.azurewebsites.net"
gh secret set AZURE_APP_INSIGHTS_CONNECTION_STRING --body "<connection-string>"

# Set the function app name as a VARIABLE (not secret)
gh variable set AZURE_FUNCTIONAPP_NAME --body "dev-eus-func-rooivalk"
```

#### Option C: Manual Setup via GitHub Web UI

1. Go to your repository on GitHub
2. Navigate to: **Settings** → **Secrets and variables** → **Actions**
3. Click **Secrets** tab → **New repository secret**
4. Add each secret:
   - Name: `AZURE_STATIC_WEB_APPS_API_TOKEN`
   - Value: (paste the docs token from above)
5. Repeat for `AZURE_STATIC_WEB_APPS_MARKETING_API_TOKEN`
6. Click **Variables** tab → **New repository variable**
7. Add:
   - Name: `AZURE_FUNCTIONAPP_NAME`
   - Value: `dev-eus-func-rooivalk` (or your function app name)

### Phase 4: Verify Deployment Workflows

Once secrets are configured, the workflows should pass validation.

#### Test the workflows

1. **Manual trigger** (to test without pushing code):

   ```bash
   # Test documentation deployment
   gh workflow run deploy-docs-azure.yml
   
   # Test marketing deployment
   gh workflow run deploy-marketing-azure.yml
   ```

2. **Monitor the workflow runs**:

   ```bash
   gh run list --limit 5
   gh run view <run-id>
   ```

3. **Verify deployment success**:
   - Check the workflow logs for "✅ All required secrets are configured"
   - Verify the "Build and Deploy" job completes successfully
   - Visit your Static Web App URLs to confirm deployment

#### Expected Workflow Behavior

**Before configuration:**
```
❌ Validate Secrets → FAILED
   Required secrets are missing:
   - AZURE_STATIC_WEB_APPS_MARKETING_API_TOKEN
   
⏭️  Build and Deploy → SKIPPED
```

**After configuration:**
```
✅ Validate Secrets → SUCCESS
   All required secrets are configured
   
✅ Build and Deploy → SUCCESS
   Deployment complete!
```

## 🔄 Updating Secrets

If you need to rotate deployment tokens or update configuration:

1. **Get new tokens from Azure:**

   ```bash
   az staticwebapp secrets reset --name <app-name>
   az staticwebapp secrets list --name <app-name> --query "properties.apiKey" -o tsv
   ```

2. **Update GitHub secrets:**

   ```bash
   gh secret set AZURE_STATIC_WEB_APPS_API_TOKEN --body "<new-token>"
   ```

## 🖥️ Desktop App / WASM Deployment

The `threat-simulator-desktop` app is a Leptos + Tauri application that builds to WASM and native desktop binaries.

### Current Status

The desktop app is **built as part of the marketing site deployment** workflow (`deploy-marketing-azure.yml`). The workflow includes:

```yaml
- name: Build WASM (threat-simulator-desktop)
  run: |
    cd apps/threat-simulator-desktop
    trunk build --release
```

The WASM output is then incorporated into the marketing site build.

### Standalone Desktop App Releases

For distributing native desktop applications, a dedicated release workflow is now available at `.github/workflows/release-desktop.yml`.

#### Creating a Desktop Release

**Option 1: Tag-based Release (Recommended)**

Push a version tag to automatically trigger the release:

```bash
# Update version in apps/threat-simulator-desktop/src-tauri/tauri.conf.json
git add apps/threat-simulator-desktop/src-tauri/tauri.conf.json
git commit -m "Bump desktop app version to 0.2.0"
git push

# Create and push release tag
git tag desktop-v0.2.0
git push origin desktop-v0.2.0
```

**Option 2: Manual Workflow Dispatch**

Trigger a release manually via GitHub Actions:
1. Go to Actions → "Release Desktop App"
2. Click "Run workflow"
3. Enter version (e.g., `0.2.0`)
4. Click "Run workflow"

#### Release Artifacts

The workflow builds native installers for all platforms:

- **Windows**: MSI installer (`phoenix-rooivalk-threat-simulator_{version}_x64.msi`)
- **macOS Intel**: DMG disk image (`phoenix-rooivalk-threat-simulator_{version}_x64-intel.dmg`)
- **macOS Apple Silicon**: DMG disk image (`phoenix-rooivalk-threat-simulator_{version}_arm64.dmg`)
- **Linux**: AppImage portable (`phoenix-rooivalk-threat-simulator_{version}_amd64.AppImage`)
- **Linux**: DEB package (`phoenix-rooivalk-threat-simulator_{version}_amd64.deb`)

#### Setup Requirements

Before creating your first release:

1. **Configure icons** (optional but recommended):
   ```bash
   cd apps/threat-simulator-desktop
   cargo tauri icon path/to/source-icon.png
   ```
   - Source icon should be at least 1024×1024 pixels
   - PNG format with transparent background

2. **Test local build**:
   ```bash
   cd apps/threat-simulator-desktop
   trunk build --release
   cargo tauri build
   ```

3. **Create changelog**: Add release notes to `apps/threat-simulator-desktop/CHANGELOG.md`

See `apps/threat-simulator-desktop/RELEASE.md` for complete release documentation.

**Note:** The desktop app is also deployed as a web application (WASM) embedded in the marketing site for online demos. The release workflow is for distributing native installers.

## 📚 Required Secrets Reference

### Documentation Site (`deploy-docs-azure.yml`)

| Secret/Variable | Type | Required | Purpose |
|----------------|------|----------|---------|
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | Secret | ✅ Yes | Deployment token for docs Static Web App |
| `AZURE_FUNCTIONAPP_NAME` | Variable | Optional | Function App name (for optional Functions deployment) |
| `AZURE_FUNCTIONAPP_PUBLISH_PROFILE` | Secret | Optional | Function App publish profile (XML) |
| `AZURE_FUNCTIONS_BASE_URL` | Secret | Optional | Functions API endpoint for client |
| `AZURE_ENTRA_TENANT_ID` | Secret | Optional | Entra ID tenant (for auth) |
| `AZURE_ENTRA_CLIENT_ID` | Secret | Optional | Entra ID client (for auth) |

### Marketing Site (`deploy-marketing-azure.yml`)

| Secret/Variable | Type | Required | Purpose |
|----------------|------|----------|---------|
| `AZURE_STATIC_WEB_APPS_MARKETING_API_TOKEN` | Secret | ✅ Yes | Deployment token for marketing Static Web App |

### Common Mistakes

❌ **Setting `AZURE_FUNCTIONAPP_NAME` as a Secret** → Should be a **Variable**
❌ **Using old names** like `AZURE_FUNCTIONS_APP_NAME` → Use `AZURE_FUNCTIONAPP_NAME`
❌ **Empty publish profile** → Ensure the XML file content is complete
❌ **Wrong resource group** → Check that names match your deployment

## 🔧 Troubleshooting

### Workflow fails with "Required secrets are missing"

**Cause:** The Azure infrastructure hasn't been deployed yet, or secrets haven't been added to GitHub.

**Solution:** Follow **Phase 1-3** above to deploy infrastructure and configure secrets.

### Can't extract deployment token

**Error:** `az staticwebapp secrets list` returns empty or fails

**Causes:**
1. Static Web App is still provisioning (wait 2-3 minutes)
2. Insufficient permissions (need Contributor or Static Web Apps Contributor role)
3. Wrong resource name or resource group

**Solution:**
```bash
# List all static web apps in resource group
az staticwebapp list --resource-group dev-eus-rg-rooivalk --output table

# Verify the specific app exists
az staticwebapp show --name dev-eus-swa-rooivalk --resource-group dev-eus-rg-rooivalk

# Wait and retry if app is still provisioning
sleep 60
az staticwebapp secrets list --name dev-eus-swa-rooivalk --query "properties.apiKey" -o tsv
```

### Deployment succeeds but site doesn't update

**Possible causes:**
1. Browser cache - try hard refresh (Ctrl+Shift+R)
2. CDN cache - wait 5-10 minutes for propagation
3. Wrong deployment environment - check if deploying to preview vs production

**Solution:**
```bash
# Check deployment history
az staticwebapp show --name dev-eus-swa-rooivalk \
  --query "properties.{url:defaultHostname,branch:branch}" \
  -o table

# View recent deployments
gh run list --workflow deploy-marketing-azure.yml --limit 5
```

### Infrastructure deployment fails

**Common issues:**
1. **Quota limits** - Check Azure subscription quotas
2. **Name conflicts** - Resource names must be globally unique
3. **Permissions** - Need Owner or Contributor role on subscription

**Solution:**
```bash
# Check deployment errors
az deployment group list --resource-group dev-eus-rg-rooivalk --output table

# Get detailed error
az deployment group show \
  --resource-group dev-eus-rg-rooivalk \
  --name main \
  --query "properties.error"
```

## 📖 Related Documentation

- [AZURE_SETUP.md](./AZURE_SETUP.md) - Detailed guide for setting up Azure secrets and variables
- [AZURE_TROUBLESHOOTING.md](./AZURE_TROUBLESHOOTING.md) - Common issues and solutions
- [../infra/azure/README.md](../infra/azure/README.md) - Infrastructure architecture overview
- [../infra/azure/scripts/setup-all.sh](../infra/azure/scripts/setup-all.sh) - Automated setup script

## 🎯 Quick Reference Commands

```bash
# Deploy infrastructure
cd infra/azure && ./scripts/setup-all.sh dev eastus

# Extract tokens
az staticwebapp secrets list --name <app-name> --query "properties.apiKey" -o tsv

# Configure GitHub secrets (automated)
./infra/azure/output/github-secrets.dev.sh

# Configure GitHub secrets (manual)
gh secret set AZURE_STATIC_WEB_APPS_API_TOKEN --body "<token>"
gh secret set AZURE_STATIC_WEB_APPS_MARKETING_API_TOKEN --body "<token>"

# Test workflows
gh workflow run deploy-docs-azure.yml
gh workflow run deploy-marketing-azure.yml

# Monitor workflow runs
gh run list --limit 5
gh run view <run-id> --log
```

## ✅ Success Indicators

You've completed the setup correctly when:

1. ✅ Azure resource group exists: `az group show --name dev-eus-rg-rooivalk`
2. ✅ Static Web Apps are deployed: `az staticwebapp list --resource-group dev-eus-rg-rooivalk`
3. ✅ GitHub secrets are configured: `gh secret list | grep AZURE`
4. ✅ Workflows pass validation: "✅ All required secrets are configured"
5. ✅ Sites are accessible at their URLs
6. ✅ Deployments succeed on push to main branch
