# PhoenixRooivalk Deployment Sequence

## Overview

This document explains the correct order of operations for deploying the
PhoenixRooivalk platform to Azure. The deployment follows a **three-phase
approach**:

1. **Phase 1**: Deploy Azure Infrastructure
2. **Phase 2**: Populate GitHub Secrets (automated)
3. **Phase 3**: Deploy Applications/Services

## 🚨 Important: Infrastructure-First Deployment

The application deployment workflows (`deploy-marketing-azure.yml`,
`deploy-docs-azure.yml`, `deploy-azure-functions.yml`) **require** Azure
infrastructure to exist before they can run. The workflows will fail with
validation errors if the required secrets are not configured.

### Why This Order Matters

1. **Azure resources must exist** before applications can be deployed to them
2. **Deployment tokens are generated** during infrastructure provisioning
3. **Secrets must be configured** in GitHub for CI/CD workflows to authenticate
4. Only then can application code be deployed successfully

## 🚀 Automated Deployment (Recommended)

The **new automated workflow** handles infrastructure deployment and secrets
configuration in one streamlined process.

### Prerequisites

- [ ] Azure account with active subscription
- [ ] GitHub repository access with appropriate permissions
- [ ] Azure credentials configured as GitHub secrets (one-time setup)

### One-Time Setup: Configure Azure Credentials

Before your first deployment, configure Azure authentication secrets:

#### Option A: Service Principal (Simpler)

```bash
# Create service principal with contributor role
az ad sp create-for-rbac \
  --name "PhoenixRooivalk-GitHub" \
  --role contributor \
  --scopes /subscriptions/<subscription-id> \
  --sdk-auth

# Copy the JSON output and add as GitHub secret
gh secret set AZURE_CREDENTIALS --body '<json-output>'

# Also set subscription ID
az account show --query id -o tsv
gh secret set AZURE_SUBSCRIPTION_ID --body '<subscription-id>'
```

#### Option B: OIDC Workload Identity (Recommended for Production)

```bash
# Follow Azure's OIDC setup guide:
# https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-azure

# Set these secrets:
gh secret set AZURE_CLIENT_ID --body '<client-id>'
gh secret set AZURE_TENANT_ID --body '<tenant-id>'
gh secret set AZURE_SUBSCRIPTION_ID --body '<subscription-id>'
```

#### Optional: Automated Secrets Configuration

For fully automated secrets setup, configure a GitHub Personal Access Token:

```bash
# Create PAT with 'repo' scope at: https://github.com/settings/tokens
gh secret set GH_PAT --body '<your-personal-access-token>'
```

This allows the infrastructure workflow to automatically configure all
deployment secrets.

### Phase 1: Deploy Infrastructure (Automated)

**Using GitHub Actions UI:**

1. Go to your repository on GitHub
2. Navigate to: **Actions** → **Deploy Azure Infrastructure**
3. Click **"Run workflow"**
4. Configure deployment:
   - **Environment**: `dev`, `stg`, or `prd`
   - **Location**: Select your Azure region (e.g., `eastus2`)
   - **Azure OpenAI Endpoint** (optional): Your Azure OpenAI endpoint
   - **Skip secrets setup**: Leave unchecked for automated setup
5. Click **"Run workflow"** button
6. Wait 5-10 minutes for:
   - ✅ Infrastructure deployment
   - ✅ Secrets configuration (if GH_PAT is set)

**Using GitHub CLI:**

```bash
# Deploy to dev environment in eastus2
gh workflow run deploy-infrastructure.yml \
  -f environment=dev \
  -f location=eastus2

# Monitor the workflow
gh run list --workflow=deploy-infrastructure.yml --limit 1
gh run watch
```

**What Happens:**

- Creates Azure resource group
- Deploys all infrastructure (Static Web Apps, Functions, Cosmos DB, Key Vault,
  etc.)
- Extracts deployment tokens
- Configures GitHub secrets automatically (if GH_PAT provided)
- Provides manual setup instructions if automated setup is skipped

### Phase 2: Verify Secrets (Automatic)

If you configured `GH_PAT`, the infrastructure workflow automatically populates:

**Secrets:**

- `AZURE_STATIC_WEB_APPS_API_TOKEN`
- `AZURE_STATIC_WEB_APPS_MARKETING_API_TOKEN`
- `AZURE_FUNCTIONAPP_PUBLISH_PROFILE`
- `COSMOS_DB_CONNECTION_STRING`
- `APPLICATIONINSIGHTS_CONNECTION_STRING`
- `CLOUD_PROVIDER`

**Variables:**

- `AZURE_FUNCTIONAPP_NAME`
- `AZURE_FUNCTIONS_BASE_URL`

Verify secrets were configured:

```bash
gh secret list | grep AZURE
gh variable list | grep AZURE
```

### Phase 3: Deploy Applications

Once infrastructure and secrets are configured, deploy your applications:

**Option 1: Automatic on Push**

Push to `main` branch triggers automatic deployment:

```bash
git push origin main
```

**Option 2: Manual Workflow Trigger**

```bash
# Deploy marketing site
gh workflow run deploy-marketing-azure.yml

# Deploy documentation site
gh workflow run deploy-docs-azure.yml

# Deploy Azure Functions
gh workflow run deploy-azure-functions.yml
```

**Expected Results:**

- ✅ Validation passes
- ✅ Applications build successfully
- ✅ Deployments complete
- ✅ Sites are accessible at their URLs

## 📋 Manual Deployment (Advanced)

For those who prefer CLI-based deployment or need more control.

### Phase 1: Azure Infrastructure Setup

This phase creates all Azure resources and generates the deployment tokens
needed for CI/CD.

#### Prerequisites

- [ ] Azure account with active subscription
- [ ] Azure CLI installed: `az --version`
- [ ] Logged in to Azure: `az login`
- [ ] GitHub CLI installed (optional, for automated secret setup):
      `gh --version`
- [ ] Appropriate permissions to create resources in Azure

#### Steps

1. **Choose your environment and location**

   ```bash
   # For development
   ENVIRONMENT="dev"
   LOCATION="eastus2"  # or your preferred Azure region

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

### Phase 2: Populate GitHub Secrets

### Phase 2: Populate GitHub Secrets

After infrastructure deployment, configure GitHub secrets to enable CI/CD
workflows.

#### Option A: Automated Setup (Recommended)

The `setup-all.sh` script generates a shell script to configure all secrets
automatically:

```bash
# Review the generated script
cat infra/azure/output/github-secrets.dev.sh

# Run it to configure GitHub secrets (requires gh CLI)
./infra/azure/output/github-secrets.dev.sh
```

#### Option B: Manual Setup via Commands

If you prefer to run commands individually:

```bash
# Get resource names from deployment
RESOURCE_GROUP="dev-eus2-rg-rooivalk"  # Adjust for your environment
SWA_NAME="dev-eus2-swa-rooivalk"
FUNC_NAME="dev-eus2-func-rooivalk"
COSMOS_NAME="dev-eus2-cosmos-rooivalk"

# Extract deployment tokens
SWA_TOKEN=$(az staticwebapp secrets list \
  --name "$SWA_NAME" \
  --query "properties.apiKey" -o tsv)

FUNC_PROFILE=$(az functionapp deployment list-publishing-profiles \
  --name "$FUNC_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --xml)

COSMOS_CONN=$(az cosmosdb keys list \
  --name "$COSMOS_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --type connection-strings \
  --query 'connectionStrings[0].connectionString' -o tsv)

# Configure GitHub secrets
echo "$SWA_TOKEN" | gh secret set AZURE_STATIC_WEB_APPS_API_TOKEN
echo "$SWA_TOKEN" | gh secret set AZURE_STATIC_WEB_APPS_MARKETING_API_TOKEN
echo "$FUNC_PROFILE" | gh secret set AZURE_FUNCTIONAPP_PUBLISH_PROFILE
echo "$COSMOS_CONN" | gh secret set COSMOS_DB_CONNECTION_STRING

# Configure GitHub variables
gh variable set AZURE_FUNCTIONAPP_NAME --body "$FUNC_NAME"
gh variable set AZURE_FUNCTIONS_BASE_URL --body "https://${FUNC_NAME}.azurewebsites.net"
```

#### Option C: Manual Setup via GitHub Web UI

1. Go to your repository on GitHub
2. Navigate to: **Settings** → **Secrets and variables** → **Actions**
3. Click **Secrets** tab → **New repository secret**
4. Add each secret (get values from Azure Portal or CLI)
5. Click **Variables** tab → **New repository variable**
6. Add required variables

### Phase 3: Deploy Applications

Once secrets are configured, deploy your applications using the deployment
workflows.

#### Via Git Push (Automatic)

```bash
# Commit and push changes to main branch
git add .
git commit -m "Deploy applications"
git push origin main

# Workflows will trigger automatically for changed paths
```

#### Via Manual Workflow Trigger

```bash
# Deploy marketing site
gh workflow run deploy-marketing-azure.yml

# Deploy documentation site
gh workflow run deploy-docs-azure.yml

# Deploy Azure Functions
gh workflow run deploy-azure-functions.yml

# Monitor workflow runs
gh run list --limit 5
gh run watch
```

## 🔄 Comparison: Automated vs Manual

| Aspect              | Automated Workflow            | Manual CLI                    |
| ------------------- | ----------------------------- | ----------------------------- |
| **Setup Time**      | ~10 minutes                   | ~15-20 minutes                |
| **Complexity**      | Low (few clicks)              | Medium (CLI commands)         |
| **Secrets Config**  | Automatic (if GH_PAT set)     | Manual or scripted            |
| **Repeatability**   | High (same process each time) | Medium (script-based)         |
| **Troubleshooting** | Workflow logs in GitHub UI    | CLI output                    |
| **Best For**        | Teams, production             | Advanced users, custom setups |

## 🔄 Updating/Redeploying Infrastructure

### Automated Update

```bash
# Trigger infrastructure workflow again
gh workflow run deploy-infrastructure.yml \
  -f environment=dev \
  -f location=eastus2

# Secrets will be updated automatically if GH_PAT is configured
```

### Manual Update

```bash
cd infra/azure
./scripts/setup-all.sh dev eastus2

# Secrets remain unchanged unless you re-run the secrets script
./infra/azure/output/github-secrets.dev.sh
```

## 🔄 Legacy Documentation (Pre-Workflow Era)

The following sections document the original manual deployment process for
reference.

<details>
<summary>Click to expand legacy documentation</summary>

### Legacy Phase 2: Extract Deployment Tokens (Manual)

The deployment tokens are required for GitHub Actions to deploy to Azure Static
Web Apps.

#### For Documentation Site

```bash
# Get the Static Web App name from deployment
SWA_DOCS_NAME=$(az staticwebapp list \
  --resource-group dev-eus2-rg-rooivalk \
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
  --resource-group dev-eus2-rg-rooivalk \
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

### Legacy Phase 3: Configure GitHub Repository Secrets

Now that you have the deployment tokens, add them to your GitHub repository.

#### Option A: Automated Setup (Recommended)

The `setup-all.sh` script generates a shell script to configure all secrets
automatically:

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
gh secret set AZURE_FUNCTIONS_BASE_URL --body "https://dev-eus2-func-rooivalk.azurewebsites.net"
gh secret set AZURE_APP_INSIGHTS_CONNECTION_STRING --body "<connection-string>"

# Set the function app name as a VARIABLE (not secret)
gh variable set AZURE_FUNCTIONAPP_NAME --body "dev-eus2-func-rooivalk"
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
   - Value: `dev-eus2-func-rooivalk` (or your function app name)

### Legacy Phase 4: Verify Deployment Workflows

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

</details>

## 🔄 Rotating Secrets

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

The `threat-simulator-desktop` app is a Leptos + Tauri application that builds
to WASM and native desktop binaries.

### Current Status

The desktop app is **built as part of the marketing site deployment** workflow
(`deploy-marketing-azure.yml`). The workflow includes:

```yaml
- name: Build WASM (threat-simulator-desktop)
  run: |
    cd apps/threat-simulator-desktop
    trunk build --release
```

The WASM output is then incorporated into the marketing site build.

### Standalone Desktop App Releases

For distributing native desktop applications, a dedicated release workflow is
now available at `.github/workflows/release-desktop.yml`.

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

- **Windows**: MSI installer
  (`phoenix-rooivalk-threat-simulator_{version}_x64.msi`)
- **macOS Intel**: DMG disk image
  (`phoenix-rooivalk-threat-simulator_{version}_x64-intel.dmg`)
- **macOS Apple Silicon**: DMG disk image
  (`phoenix-rooivalk-threat-simulator_{version}_arm64.dmg`)
- **Linux**: AppImage portable
  (`phoenix-rooivalk-threat-simulator_{version}_amd64.AppImage`)
- **Linux**: DEB package
  (`phoenix-rooivalk-threat-simulator_{version}_amd64.deb`)

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

3. **Create changelog**: Add release notes to
   `apps/threat-simulator-desktop/CHANGELOG.md`

See `apps/threat-simulator-desktop/RELEASE.md` for complete release
documentation.

**Note:** The desktop app is also deployed as a web application (WASM) embedded
in the marketing site for online demos. The release workflow is for distributing
native installers.

## 📚 Required Secrets Reference

### Documentation Site (`deploy-docs-azure.yml`)

| Secret/Variable                     | Type     | Required | Purpose                                               |
| ----------------------------------- | -------- | -------- | ----------------------------------------------------- |
| `AZURE_STATIC_WEB_APPS_API_TOKEN`   | Secret   | ✅ Yes   | Deployment token for docs Static Web App              |
| `AZURE_FUNCTIONAPP_NAME`            | Variable | Optional | Function App name (for optional Functions deployment) |
| `AZURE_FUNCTIONAPP_PUBLISH_PROFILE` | Secret   | Optional | Function App publish profile (XML)                    |
| `AZURE_FUNCTIONS_BASE_URL`          | Secret   | Optional | Functions API endpoint for client                     |
| `AZURE_ENTRA_TENANT_ID`             | Secret   | Optional | Entra ID tenant (for auth)                            |
| `AZURE_ENTRA_CLIENT_ID`             | Secret   | Optional | Entra ID client (for auth)                            |

### Marketing Site (`deploy-marketing-azure.yml`)

| Secret/Variable                             | Type   | Required | Purpose                                       |
| ------------------------------------------- | ------ | -------- | --------------------------------------------- |
| `AZURE_STATIC_WEB_APPS_MARKETING_API_TOKEN` | Secret | ✅ Yes   | Deployment token for marketing Static Web App |

### Common Mistakes

❌ **Setting `AZURE_FUNCTIONAPP_NAME` as a Secret** → Should be a **Variable**
❌ **Using old names** like `AZURE_FUNCTIONS_APP_NAME` → Use
`AZURE_FUNCTIONAPP_NAME` ❌ **Empty publish profile** → Ensure the XML file
content is complete ❌ **Wrong resource group** → Check that names match your
deployment

## 🔧 Troubleshooting

### Workflow fails with "Required secrets are missing"

**Cause:** The Azure infrastructure hasn't been deployed yet, or secrets haven't
been added to GitHub.

**Solution:** Follow **Phase 1-3** above to deploy infrastructure and configure
secrets.

### Can't extract deployment token

**Error:** `az staticwebapp secrets list` returns empty or fails

**Causes:**

1. Static Web App is still provisioning (wait 2-3 minutes)
2. Insufficient permissions (need Contributor or Static Web Apps Contributor
   role)
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

- [AZURE_SETUP.md](./AZURE_SETUP.md) - Detailed guide for setting up Azure
  secrets and variables
- [AZURE_TROUBLESHOOTING.md](./AZURE_TROUBLESHOOTING.md) - Common issues and
  solutions
- [../infra/azure/README.md](../infra/azure/README.md) - Infrastructure
  architecture overview
- [../infra/azure/scripts/setup-all.sh](../infra/azure/scripts/setup-all.sh) -
  Automated setup script

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
2. ✅ Static Web Apps are deployed:
   `az staticwebapp list --resource-group dev-eus-rg-rooivalk`
3. ✅ GitHub secrets are configured: `gh secret list | grep AZURE`
4. ✅ Workflows pass validation: "✅ All required secrets are configured"
5. ✅ Sites are accessible at their URLs
6. ✅ Deployments succeed on push to main branch
