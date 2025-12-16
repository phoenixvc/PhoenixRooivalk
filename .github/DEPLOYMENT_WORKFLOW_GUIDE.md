# Deployment Workflow Guide

## Quick Start: Deploy in 3 Steps

### ⚡ TL;DR

```bash
# Step 1: Configure Azure credentials (one-time)
gh secret set AZURE_SUBSCRIPTION_ID --body "<your-subscription-id>"
gh secret set AZURE_CREDENTIALS --body "<your-service-principal-json>"
gh secret set GH_PAT --body "<your-github-pat>"  # Optional for auto-secrets

# Step 2: Deploy infrastructure via GitHub Actions
# Go to: Actions → "Deploy Azure Infrastructure" → Run workflow

# Step 3: Deploy applications (automatic on push or manual)
git push origin main
# OR trigger manually:
# Actions → "Deploy Marketing" / "Deploy Docs" / "Deploy Functions" → Run workflow
```

## What Changed?

### Before (Manual Process)

1. ❌ Run CLI commands on local machine
2. ❌ Manually copy/paste tokens
3. ❌ Configure secrets one by one
4. ❌ Hope everything works
5. ⏱️ 20-30 minutes, error-prone

### After (Automated Workflow)

1. ✅ Click "Run workflow" in GitHub
2. ✅ Infrastructure deployed automatically
3. ✅ Secrets configured automatically
4. ✅ Ready to deploy apps
5. ⏱️ 10 minutes, reliable

## New Workflow: Deploy Azure Infrastructure

**Location**: `.github/workflows/deploy-infrastructure.yml`

**Purpose**: Deploy all Azure infrastructure (Static Web Apps, Functions, Cosmos
DB, Key Vault, etc.) and automatically configure GitHub secrets.

### Features

- ✅ **One-Click Deployment**: Run from GitHub Actions UI
- ✅ **Multiple Environments**: Dev, Staging, Production
- ✅ **Region Selection**: Choose any Azure region
- ✅ **Automated Secrets**: Optionally populates GitHub secrets (with GH_PAT)
- ✅ **Manual Fallback**: Provides detailed instructions if automation skipped
- ✅ **Reusable**: Can be called by other workflows

### When to Use

Run this workflow when:

- 🆕 **First-time setup**: Deploying infrastructure for the first time
- 🔄 **Infrastructure changes**: Updating Bicep templates
- 🌍 **New environments**: Setting up dev/staging/prod
- 🔐 **Rotating secrets**: Need to regenerate deployment tokens
- 🏗️ **Resource recreation**: Rebuilding after resource deletion

### How to Run

#### Option 1: GitHub Actions UI (Recommended)

1. Go to your repository on GitHub
2. Click **Actions** tab
3. Select **"Deploy Azure Infrastructure"** from the workflow list
4. Click **"Run workflow"** button
5. Configure:
   - **Environment**: `dev`, `stg`, or `prd`
   - **Location**: `eastus2`, `westeurope`, etc.
   - **Azure OpenAI Endpoint** (optional)
   - **Skip secrets setup**: Leave unchecked for automation
6. Click **"Run workflow"**
7. Wait ~10 minutes for completion

#### Option 2: GitHub CLI

```bash
gh workflow run deploy-infrastructure.yml \
  -f environment=dev \
  -f location=eastus2

# Monitor progress
gh run watch
```

#### Option 3: Workflow Call (from another workflow)

```yaml
jobs:
  deploy-infra:
    uses: ./.github/workflows/deploy-infrastructure.yml
    with:
      environment: dev
      location: eastus2
    secrets: inherit
```

## Prerequisites (One-Time Setup)

Before running the infrastructure workflow, configure Azure credentials:

### Required Secrets

#### 1. Azure Subscription ID

```bash
az account show --query id -o tsv
gh secret set AZURE_SUBSCRIPTION_ID --body "<subscription-id>"
```

#### 2. Azure Credentials

**Option A: Service Principal** (Simpler)

```bash
az ad sp create-for-rbac \
  --name "PhoenixRooivalk-GitHub" \
  --role contributor \
  --scopes /subscriptions/<subscription-id> \
  --sdk-auth

gh secret set AZURE_CREDENTIALS --body '<json-output>'
```

**Option B: OIDC Workload Identity** (More Secure)

Follow
[GitHub's OIDC guide](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-azure),
then:

```bash
gh secret set AZURE_CLIENT_ID --body "<client-id>"
gh secret set AZURE_TENANT_ID --body "<tenant-id>"
gh secret set AZURE_SUBSCRIPTION_ID --body "<subscription-id>"
```

### Optional Secret (Recommended)

#### 3. GitHub Personal Access Token

For automated secrets configuration:

```bash
# Create PAT with 'repo' scope at: https://github.com/settings/tokens
gh secret set GH_PAT --body "<your-personal-access-token>"
```

**Why?** Allows the infrastructure workflow to automatically configure
deployment secrets. Without this, you'll need to manually configure secrets
after infrastructure deployment.

## Updated Application Workflows

All application deployment workflows now include:

### ✨ Enhanced Validation

- Clear messaging about infrastructure prerequisites
- Helpful error messages with step-by-step resolution
- Links to automated workflow for easy infrastructure deployment

### 📋 Better Guidance

When workflows fail due to missing infrastructure:

```
🚨 DEPLOYMENT BLOCKED: Azure Infrastructure Not Yet Configured

📖 DEPLOYMENT SEQUENCE: .github/DEPLOYMENT_SEQUENCE.md

🚀 RECOMMENDED: Use the automated infrastructure deployment workflow

  Option A: GitHub Actions (Automated - RECOMMENDED)
  ────────────────────────────────────────────────────
  1️⃣  Go to Actions → 'Deploy Azure Infrastructure'
  2️⃣  Click 'Run workflow'
  3️⃣  Select environment (dev/stg/prd) and location
  4️⃣  Click 'Run workflow' button
  5️⃣  Wait for infrastructure deployment and secrets configuration
  6️⃣  Re-run this workflow - it will now succeed!
```

## Deployment Sequence

### Phase 1: Infrastructure (NEW!)

**Automated via workflow** ⭐

- Run `deploy-infrastructure.yml` workflow
- Infrastructure deployed
- Secrets populated automatically (if GH_PAT configured)

**Manual (legacy)**

- Run `infra/azure/scripts/setup-all.sh`
- Extract tokens manually
- Configure secrets manually

### Phase 2: Secrets (AUTOMATED!)

**If GH_PAT configured:**

- ✅ Secrets populated automatically by infrastructure workflow
- ✅ Variables configured automatically
- ✅ Ready to deploy applications immediately

**If GH_PAT not configured:**

- 📋 Manual instructions provided in workflow summary
- 🔧 Run commands to configure secrets
- ✅ Ready to deploy applications

### Phase 3: Applications (UNCHANGED)

Deploy applications as before:

- Push to `main` branch (automatic)
- Manual workflow trigger
- No changes needed in application code

## Troubleshooting

### "Missing required Azure credentials"

**Problem**: Infrastructure workflow fails at prerequisites check.

**Solution**:

```bash
# Check what's configured
gh secret list | grep AZURE

# Set missing secrets
gh secret set AZURE_SUBSCRIPTION_ID --body "<subscription-id>"
gh secret set AZURE_CREDENTIALS --body "<service-principal-json>"
```

### "Could not retrieve deployment tokens"

**Problem**: Resources are still provisioning.

**Solution**: Wait 2-3 minutes and check deployment status:

```bash
az deployment group show \
  --resource-group dev-eus2-rg-rooivalk \
  --name main \
  --query properties.provisioningState
```

### "Secrets not configured automatically"

**Problem**: GH_PAT not provided or insufficient permissions.

**Solution**:

1. Check if GH_PAT is configured: `gh secret list | grep GH_PAT`
2. If not configured, follow manual instructions in workflow summary
3. Or configure GH_PAT and re-run workflow

### "Application deployment still fails"

**Problem**: Infrastructure deployed but application workflow still fails.

**Solution**:

1. Verify secrets are configured: `gh secret list | grep AZURE`
2. Check for typos in resource names
3. Ensure resources are in "Succeeded" state in Azure Portal
4. Re-run infrastructure workflow if needed

## Migration Guide

### For Existing Deployments

If you already have infrastructure deployed via CLI:

1. ✅ **Nothing breaks**: Your existing infrastructure continues to work
2. ✅ **Secrets remain**: No need to reconfigure existing secrets
3. ✅ **Optional migration**: You can continue using CLI or switch to workflow
4. ✅ **Gradual adoption**: Use workflow for new environments

### Switching to Automated Workflow

To switch from manual CLI to automated workflow:

1. Configure one-time secrets (Azure credentials, GH_PAT)
2. Run infrastructure workflow for a test environment (e.g., dev)
3. Verify deployment succeeds and secrets are configured
4. Use workflow for future deployments and updates

### Keeping Manual Process

To continue using manual CLI:

1. ✅ No changes required
2. ✅ Scripts remain functional
3. ✅ Documentation preserved in DEPLOYMENT_SEQUENCE.md (legacy section)

## Benefits

### For Developers

- 🚀 Faster onboarding: No CLI setup required
- 🎯 Consistent deployment: Same process every time
- 🔄 Self-service: Deploy infrastructure without ops team
- 📱 Mobile-friendly: Can deploy from GitHub mobile app

### For Teams

- 📊 Audit trail: All deployments logged in GitHub Actions
- 🔐 Secure: Secrets managed centrally
- 🌍 Multi-region: Easy to deploy to multiple regions
- 🔄 Repeatable: Identical environments guaranteed

### For Operations

- 🤖 Automated: Less manual work
- 🔍 Visible: All deployments in Actions history
- 📝 Documented: Workflow is self-documenting
- 🛡️ Safe: Validation before deployment

## Best Practices

### 1. Use Separate Environments

```bash
# Development
gh workflow run deploy-infrastructure.yml -f environment=dev -f location=eastus2

# Production
gh workflow run deploy-infrastructure.yml -f environment=prd -f location=westeurope
```

### 2. Enable Automated Secrets

Configure GH_PAT once for fully automated deployments:

```bash
gh secret set GH_PAT --body "<token-with-repo-scope>"
```

### 3. Monitor Deployments

Use GitHub Actions UI to monitor progress and troubleshoot issues:

```bash
gh run list --workflow=deploy-infrastructure.yml
gh run view <run-id> --log
```

### 4. Document Custom Changes

If you customize infrastructure:

- Update Bicep templates in `infra/azure/`
- Test changes in dev environment first
- Document changes in ADRs if significant

## Next Steps

1. ✅ Configure Azure credentials (one-time)
2. ✅ Run infrastructure workflow
3. ✅ Verify secrets are configured
4. ✅ Deploy applications
5. 🎉 Enjoy automated deployments!

## Resources

- **Main Documentation**: [DEPLOYMENT_SEQUENCE.md](./DEPLOYMENT_SEQUENCE.md)
- **Infrastructure Details**:
  [../infra/azure/README.md](../infra/azure/README.md)
- **Secrets Setup**: [AZURE_SETUP.md](./AZURE_SETUP.md)
- **Troubleshooting**: [AZURE_TROUBLESHOOTING.md](./AZURE_TROUBLESHOOTING.md)
- **GitHub Actions**:
  [Deploy Infrastructure](./.github/workflows/deploy-infrastructure.yml)
