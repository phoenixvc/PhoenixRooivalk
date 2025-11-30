# Phoenix Rooivalk - Azure Quick Start Guide

Get your documentation site running on Azure with Entra ID authentication in 15
minutes.

## Prerequisites

```bash
# Install Azure CLI (if not installed)
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Login to Azure
az login
az account set --subscription "Your Subscription Name"

# Verify login
az account show --query name -o tsv

# Install GitHub CLI (optional, for automated secret management)
# Ubuntu/Debian:
sudo apt install gh
# macOS:
brew install gh

# Login to GitHub
gh auth login
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

## Step 2: Configure Azure Entra ID Authentication (10 minutes)

### **2.1 Create App Registration**

**Option A: Azure Portal (Visual)**

1. Go to **Azure Portal** → **Microsoft Entra ID** → **App registrations**
2. Click **"New registration"**
3. Fill in:
   - **Name:** `Phoenix Rooivalk`
   - **Supported account types:** "Accounts in this organizational directory
     only (Single tenant)"
   - **Redirect URI:**
     - Platform: `Single-page application (SPA)`
     - URI: `http://localhost:3000/callback`
4. Click **"Register"**

**Option B: Azure CLI (Automated)**

```bash
# Create app registration
az ad app create \
  --display-name "Phoenix Rooivalk" \
  --sign-in-audience AzureADMyOrg \
  --web-redirect-uris "http://localhost:3000/callback" \
  --enable-id-token-issuance false \
  --enable-access-token-issuance false

# Get the app ID (client ID)
APP_ID=$(az ad app list --display-name "Phoenix Rooivalk" --query "[0].appId" -o tsv)
echo "AZURE_ENTRA_CLIENT_ID=$APP_ID"

# Get tenant ID
TENANT_ID=$(az account show --query "tenantId" -o tsv)
echo "AZURE_ENTRA_TENANT_ID=$TENANT_ID"
```

### **2.2 Copy Your Credentials**

After registration, you'll see:

```
Application (client) ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Directory (tenant) ID:   xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Object ID:               xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**Save these values:**

```bash
AZURE_ENTRA_CLIENT_ID=<Application (client) ID>
AZURE_ENTRA_TENANT_ID=<Directory (tenant) ID>
AZURE_ENTRA_AUTHORITY=https://login.microsoftonline.com/<Directory (tenant) ID>
```

### **2.3 Configure Authentication Settings**

**Navigate:** App registration → **Authentication**

#### **Add Redirect URIs:**

**Development:**

```
http://localhost:3000
http://localhost:3000/callback
http://localhost:3000/auth/callback
```

**Production (add when deploying):**

```
https://<your-app>.azurestaticapps.net
https://<your-app>.azurestaticapps.net/callback
https://docs.phoenixrooivalk.com
https://docs.phoenixrooivalk.com/callback
```

#### **Configure Token Settings:**

- **Platform type:** Single-page application
- **Implicit grant:** Both unchecked (use PKCE instead)
- **Allow public client flows:** No

**Front-channel logout URL:**

```
http://localhost:3000
```

### **2.4 Set API Permissions**

**Navigate:** App registration → **API permissions**

Click **"Add a permission"** → **Microsoft Graph** → **Delegated permissions**

**Select:**

- `openid` (Sign users in)
- `profile` (View users' basic profile)
- `email` (View users' email address)
- `User.Read` (Read user profile)
- `offline_access` (Maintain access to data - optional)

Click **"Add permissions"** → **"Grant admin consent for [Your Org]"**

### **2.5 Create Client Secret**

**Navigate:** App registration → **Certificates & secrets**

1. Click **"New client secret"**
2. **Description:** `Phoenix Rooivalk Production`
3. **Expires:** 12 months (recommended for production)
4. Click **"Add"**
5. **IMMEDIATELY COPY THE VALUE** - you can't see it again!

```bash
AZURE_ENTRA_CLIENT_SECRET=<paste the Value here>
```

### **2.6 Optional: Add Token Claims**

**Navigate:** App registration → **Token configuration**

**Add optional claims for ID token:**

- `email`
- `family_name`
- `given_name`
- `upn` (User Principal Name)

## Step 3: Configure Secrets (3 methods)

### **Method A: GitHub Secrets via CLI (Recommended - Fastest)**

```bash
# Navigate to your repository
cd /path/to/phoenix-rooivalk

# Set all secrets at once
gh secret set AZURE_ENTRA_CLIENT_ID --body "your-client-id"
gh secret set AZURE_ENTRA_TENANT_ID --body "your-tenant-id"
gh secret set AZURE_ENTRA_CLIENT_SECRET --body "your-client-secret"
gh secret set AZURE_ENTRA_AUTHORITY --body "https://login.microsoftonline.com/your-tenant-id"
gh secret set AZURE_ENTRA_REDIRECT_URI --body "https://your-app.azurestaticapps.net/callback"
gh secret set AZURE_ENTRA_SCOPES --body "openid profile email User.Read"

# Verify secrets were added
gh secret list
```

**Example with actual values:**

```bash
gh secret set AZURE_ENTRA_CLIENT_ID --body "d9934146-e585-467b-8932-8cec14b332fd"
gh secret set AZURE_ENTRA_TENANT_ID --body "7edf4423-ccb3-4275-bc80-64dae3ef0148"
gh secret set AZURE_ENTRA_CLIENT_SECRET --body "your-secret-value-here"
gh secret set AZURE_ENTRA_AUTHORITY --body "https://login.microsoftonline.com/7edf4423-ccb3-4275-bc80-64dae3ef0148"
```

### **Method B: GitHub Secrets via Web UI (Visual)**

1. **Go to your repository:** `https://github.com/yourusername/phoenix-rooivalk`
2. Click **"Settings"** tab
3. Left sidebar → **"Secrets and variables"** → **"Actions"**
4. Click **"New repository secret"** for each:

| Secret Name                 | Value                                           |
| --------------------------- | ----------------------------------------------- |
| `AZURE_ENTRA_CLIENT_ID`     | Your application (client) ID                    |
| `AZURE_ENTRA_TENANT_ID`     | Your directory (tenant) ID                      |
| `AZURE_ENTRA_CLIENT_SECRET` | Your client secret value                        |
| `AZURE_ENTRA_AUTHORITY`     | `https://login.microsoftonline.com/{tenant-id}` |
| `AZURE_ENTRA_REDIRECT_URI`  | `https://your-app.azurestaticapps.net/callback` |
| `AZURE_ENTRA_SCOPES`        | `openid profile email User.Read`                |

### **Method C: Local Development (.env.local)**

**For local testing only - never commit this file!**

```bash
# Navigate to your docs app
cd apps/docs

# Create .env.local file
cat > .env.local << 'EOF'
# Azure Entra ID Configuration
AZURE_ENTRA_CLIENT_ID=your-client-id-here
AZURE_ENTRA_TENANT_ID=your-tenant-id-here
AZURE_ENTRA_CLIENT_SECRET=your-client-secret-here
AZURE_ENTRA_AUTHORITY=https://login.microsoftonline.com/your-tenant-id-here
AZURE_ENTRA_REDIRECT_URI=http://localhost:3000/callback
AZURE_ENTRA_POST_LOGOUT_REDIRECT_URI=http://localhost:3000
AZURE_ENTRA_SCOPES=openid profile email User.Read offline_access

# Optional Configuration
AZURE_ENTRA_INSTANCE=https://login.microsoftonline.com/
AZURE_ENTRA_VALIDATE_AUTHORITY=true
AZURE_ENTRA_KNOWN_AUTHORITIES=login.microsoftonline.com

# Cloud Provider
CLOUD_PROVIDER=azure
EOF

# Add to .gitignore (IMPORTANT!)
echo ".env.local" >> ../../.gitignore
```

### **Method D: Azure Key Vault (Production Best Practice)**

```bash
# Create Key Vault
az keyvault create \
  --name kv-phoenix-rooivalk \
  --resource-group phoenix-rooivalk-prod \
  --location eastus

# Store secrets
az keyvault secret set \
  --vault-name kv-phoenix-rooivalk \
  --name AZURE-ENTRA-CLIENT-ID \
  --value "your-client-id"

az keyvault secret set \
  --vault-name kv-phoenix-rooivalk \
  --name AZURE-ENTRA-CLIENT-SECRET \
  --value "your-client-secret"

az keyvault secret set \
  --vault-name kv-phoenix-rooivalk \
  --name AZURE-ENTRA-TENANT-ID \
  --value "your-tenant-id"

# Grant access to your app
az keyvault set-policy \
  --name kv-phoenix-rooivalk \
  --object-id <your-app-object-id> \
  --secret-permissions get list

# Retrieve secrets (to verify)
az keyvault secret show \
  --vault-name kv-phoenix-rooivalk \
  --name AZURE-ENTRA-CLIENT-ID \
  --query "value" -o tsv
```

### **Automated Setup Script**

Save as `setup-entra-env.sh`:

```bash
#!/bin/bash

# Configuration
CLIENT_ID="your-client-id"
TENANT_ID="your-tenant-id"
CLIENT_SECRET="your-client-secret"
AUTHORITY="https://login.microsoftonline.com/$TENANT_ID"

echo "Setting up Azure Entra ID environment variables..."

# GitHub Secrets
if command -v gh &> /dev/null; then
    echo "Setting GitHub secrets..."
    gh secret set AZURE_ENTRA_CLIENT_ID --body "$CLIENT_ID"
    gh secret set AZURE_ENTRA_TENANT_ID --body "$TENANT_ID"
    gh secret set AZURE_ENTRA_CLIENT_SECRET --body "$CLIENT_SECRET"
    gh secret set AZURE_ENTRA_AUTHORITY --body "$AUTHORITY"
    gh secret set AZURE_ENTRA_SCOPES --body "openid profile email User.Read"
    echo "GitHub secrets configured"
else
    echo "GitHub CLI not installed. Install: brew install gh"
fi

# Local .env.local
echo ""
echo "Creating .env.local for local development..."
cat > apps/docs/.env.local << EOF
AZURE_ENTRA_CLIENT_ID=$CLIENT_ID
AZURE_ENTRA_TENANT_ID=$TENANT_ID
AZURE_ENTRA_CLIENT_SECRET=$CLIENT_SECRET
AZURE_ENTRA_AUTHORITY=$AUTHORITY
AZURE_ENTRA_REDIRECT_URI=http://localhost:3000/callback
AZURE_ENTRA_POST_LOGOUT_REDIRECT_URI=http://localhost:3000
AZURE_ENTRA_SCOPES=openid profile email User.Read
CLOUD_PROVIDER=azure
EOF

echo ".env.local created"

# Add to .gitignore
if ! grep -q ".env.local" .gitignore; then
    echo ".env.local" >> .gitignore
    echo "Added .env.local to .gitignore"
fi

echo ""
echo "Setup complete!"
echo ""
echo "Next: cd apps/docs && pnpm dev"
```

**Run it:**

```bash
chmod +x setup-entra-env.sh
./setup-entra-env.sh
```

## Step 4: Deploy! (2 minutes)

```bash
# Commit changes
git add .
git commit -m "Configure Azure Entra ID authentication"

# Push to trigger GitHub Actions deployment
git push origin main

# GitHub Actions will automatically deploy to Azure
```

## Verify Deployment

```bash
# Check Static Web App
az staticwebapp show \
  --name swa-phoenix-rooivalk-dev \
  --query "defaultHostname" -o tsv

# Check Functions
az functionapp function list \
  --name func-phoenix-rooivalk-dev \
  --resource-group phoenix-rooivalk-dev \
  -o table

# Verify Entra ID app registration
az ad app show \
  --id $AZURE_ENTRA_CLIENT_ID \
  --query "displayName" -o tsv

# Check redirect URIs
az ad app show \
  --id $AZURE_ENTRA_CLIENT_ID \
  --query "spa.redirectUris"
```

## Local Development & Testing

```bash
# Start development server
cd apps/docs
pnpm dev

# Open browser
open http://localhost:3000

# Test authentication flow
# 1. Click "Sign In"
# 2. Should redirect to Microsoft login
# 3. After login, should redirect back to app
# 4. Check browser console for tokens
```

**Verify tokens in browser console:**

```javascript
// Check localStorage for MSAL tokens
Object.keys(localStorage).filter((key) => key.includes("msal"));

// Should see entries like:
// msal.token.keys.{client-id}
// msal.account.keys
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
│   ├── setup-entra.sh      # Entra ID setup guide
│   └── generate-env.js     # Environment generator
└── output/                 # Generated configs (gitignored)
```

## Cost Estimate

Using free/consumption tiers:

| Service         | Tier        | Cost         |
| --------------- | ----------- | ------------ |
| Static Web Apps | Free        | $0/month     |
| Cosmos DB       | Serverless  | ~$0-5/month  |
| Functions       | Consumption | ~$0-2/month  |
| Entra ID        | Free tier   | $0/month     |
| App Insights    | 5GB free    | $0/month     |
| Key Vault       | Standard    | ~$0.03/month |

**Total: $0-10/month** for typical usage

## Environment Variables Reference

### **Required Variables**

| Variable                    | Description                                   | Example                                         |
| --------------------------- | --------------------------------------------- | ----------------------------------------------- |
| `AZURE_ENTRA_CLIENT_ID`     | Application (client) ID from app registration | `d9934146-e585-467b-8932-8cec14b332fd`          |
| `AZURE_ENTRA_TENANT_ID`     | Directory (tenant) ID                         | `7edf4423-ccb3-4275-bc80-64dae3ef0148`          |
| `AZURE_ENTRA_CLIENT_SECRET` | Client secret value                           | `your-secret-value`                             |
| `AZURE_ENTRA_AUTHORITY`     | Authentication authority URL                  | `https://login.microsoftonline.com/{tenant-id}` |
| `AZURE_ENTRA_REDIRECT_URI`  | Where to redirect after login                 | `http://localhost:3000/callback`                |

### **Optional Variables**

| Variable                               | Description                          | Default                              |
| -------------------------------------- | ------------------------------------ | ------------------------------------ |
| `AZURE_ENTRA_SCOPES`                   | OAuth scopes to request              | `openid profile email User.Read`     |
| `AZURE_ENTRA_POST_LOGOUT_REDIRECT_URI` | Where to redirect after logout       | `http://localhost:3000`              |
| `AZURE_ENTRA_INSTANCE`                 | Microsoft identity platform instance | `https://login.microsoftonline.com/` |
| `AZURE_ENTRA_VALIDATE_AUTHORITY`       | Validate authority URL               | `true`                               |
| `AZURE_ENTRA_KNOWN_AUTHORITIES`        | Trusted authorities                  | `login.microsoftonline.com`          |

## Troubleshooting

### **"az: command not found"**

```bash
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

### **"gh: command not found"**

```bash
# Ubuntu/Debian
sudo apt install gh

# macOS
brew install gh

# Then login
gh auth login
```

### **"Not logged in to Azure"**

```bash
az login
az account show
```

### **"Deployment failed"**

```bash
# Check deployment logs
az deployment group list \
  --resource-group phoenix-rooivalk-dev \
  -o table

az deployment group show \
  --resource-group phoenix-rooivalk-dev \
  --name phoenix-rooivalk
```

### **"Functions not working"**

```bash
# Check function logs
az functionapp log tail \
  --name func-phoenix-rooivalk-dev \
  --resource-group phoenix-rooivalk-dev
```

### **"AADSTS50011: Reply URL mismatch"**

**Cause:** Redirect URI doesn't match what's registered

**Solution:**

```bash
# Check registered URIs
az ad app show \
  --id $AZURE_ENTRA_CLIENT_ID \
  --query "spa.redirectUris"

# Add missing URI
az ad app update \
  --id $AZURE_ENTRA_CLIENT_ID \
  --add spa.redirectUris "http://localhost:3000/callback"
```

### **"AADSTS700016: Application not found"**

**Cause:** Wrong client ID or app doesn't exist in tenant

**Solution:**

```bash
# Verify client ID
az ad app show --id $AZURE_ENTRA_CLIENT_ID

# List all apps
az ad app list --display-name "Phoenix Rooivalk"
```

### **"AADSTS65001: User or administrator has not consented"**

**Cause:** API permissions not granted

**Solution:**

- Go to Azure Portal → App registration → API permissions
- Click "Grant admin consent for [Your Org]"

### **"Token missing claims (email, name, etc.)"**

**Cause:** Optional claims not configured

**Solution:**

- Go to Azure Portal → App registration → Token configuration
- Add optional claims: email, family_name, given_name, upn

### **"Cannot read .env.local"**

**Cause:** File not in correct location or not loaded

**Solution:**

```bash
# Verify file exists
ls -la apps/docs/.env.local

# Check Next.js is loading it
cd apps/docs
pnpm dev
# Should see: "Loaded env from /path/to/.env.local"
```

## Security Best Practices

### **1. Never Commit Secrets**

```bash
# Always add to .gitignore
echo ".env.local" >> .gitignore
echo ".env*.local" >> .gitignore
echo "*.secret" >> .gitignore

# Check for accidentally committed secrets
git log -p | grep -i "client_secret"
```

### **2. Rotate Secrets Regularly**

```bash
# Create new client secret
az ad app credential reset --id $AZURE_ENTRA_CLIENT_ID --append

# Update GitHub secret
gh secret set AZURE_ENTRA_CLIENT_SECRET --body "new-secret-value"

# Delete old secret after verifying new one works
```

### **3. Use Key Vault for Production**

- Store all secrets in Azure Key Vault
- Grant managed identity access
- Reference secrets via Key Vault references

### **4. Limit Redirect URIs**

- Only add URIs you actually use
- Use HTTPS in production
- Avoid wildcards

### **5. Enable Conditional Access (Optional)**

- Require MFA for sensitive operations
- Restrict access by location/device
- Monitor sign-in logs

## Next Steps

1. Deploy infrastructure
2. Configure Entra ID app registration
3. Set up secrets (GitHub/local)
4. Test authentication locally
5. Deploy to production
6. Set up custom domain
7. Configure monitoring alerts
8. Index documentation for semantic search
9. Enable WAF (if needed)
10. Set up staging environment

For detailed documentation, see [README.md](./README.md).
