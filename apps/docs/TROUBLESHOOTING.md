# Troubleshooting Guide

This guide helps you diagnose and fix common issues with the Phoenix Rooivalk
documentation site.

## Table of Contents

- [AI Functions Not Available](#ai-functions-not-available)
- [Authentication Issues](#authentication-issues)
- [Build Failures](#build-failures)
- [Azure Functions Deployment](#azure-functions-deployment)

---

## AI Functions Not Available

**Symptom**: You see the error message "⚠️ AI Functions not available. Please
check your network connection and Azure Functions configuration."

### Root Causes

#### 1. AZURE_FUNCTIONS_BASE_URL Not Set or Misconfigured

**The most common cause** - The frontend can't find the Azure Functions URL.

**Check**:

1. Go to your repository: Settings → Secrets and variables → Actions → Variables
   tab
2. Verify `AZURE_FUNCTIONS_BASE_URL` exists and is set correctly
3. Example correct value: `https://phoenix-rooivalk-functions.azurewebsites.net`

**Fix**:

```bash
# The value should be in this format (without /api at the end):
AZURE_FUNCTIONS_BASE_URL=https://your-function-app-name.azurewebsites.net
```

**Important Notes**:

- This must be a **Variable** (not a Secret) OR a Secret - the workflow now
  supports both
- It must be available with scope "All scopes" or "Builds" selected
- The URL should NOT include `/api` at the end
- After changing, you must trigger a new deployment (push to main or re-run
  workflow)

#### 2. Variable vs Secret Configuration

The GitHub workflow now supports `AZURE_FUNCTIONS_BASE_URL` as either:

- **Variable** (recommended for non-sensitive URLs) -
  `vars.AZURE_FUNCTIONS_BASE_URL`
- **Secret** (for additional security) - `secrets.AZURE_FUNCTIONS_BASE_URL`

Variables take precedence if both are set.

**To check which you have**:

1. Settings → Secrets and variables → Actions
2. Check both "Secrets" and "Variables" tabs
3. Delete any duplicates (keep only one)

#### 3. Azure Functions Not Deployed or Unhealthy

The frontend can reach the URL, but the Azure Functions aren't responding.

**Check Azure Functions Health**:

```bash
# Replace with your actual function app name
curl https://your-function-app-name.azurewebsites.net/api/health

# Expected response:
# {"status":"healthy","timestamp":"...","uptime":123}
```

**Common Issues**:

- Function app is stopped in Azure Portal
- Recent deployment failed
- OpenAI configuration is missing in Function App settings

**Fix**:

1. Go to Azure Portal → Function Apps → Your app
2. Check Overview → Status should be "Running"
3. Check Configuration → Application settings:
   - `AZURE_AI_ENDPOINT` or `AZURE_OPENAI_ENDPOINT`
   - `AZURE_AI_API_KEY` or `AZURE_OPENAI_API_KEY`
   - `AZURE_AI_DEPLOYMENT_NAME` (e.g., `gpt-5.1`, `gpt-4o`, `gpt-4`)
   - `COSMOS_DB_CONNECTION_STRING`
4. Check Deployment Center → Logs for deployment errors

#### 4. Azure AI Configuration Missing

Azure Functions are deployed but Azure OpenAI settings are incorrect.

**Required GitHub Secrets**:

- `AZURE_AI_ENDPOINT` or `AZURE_OPENAI_ENDPOINT`
- `AZURE_AI_API_KEY` or `AZURE_OPENAI_API_KEY`

**Required GitHub Variables**:

- `AZURE_AI_DEPLOYMENT_NAME` (e.g., `gpt-5.1`, `gpt-4o`, `gpt-4`,
  `gpt-35-turbo`)

**Check in Azure Portal**:

1. Azure Portal → Your Function App → Configuration → Application settings
2. Verify these settings exist and have correct values
3. Test endpoint: `https://your-function-app.azurewebsites.net/api/health/ready`

**Fix**:

1. Set the missing secrets/variables in GitHub
2. Set `CONFIGURE_APP_SETTINGS=true` as a repository variable
3. Re-run the Azure Functions deployment workflow
4. This will automatically push the settings to your Function App

#### 5. CORS Issues

The browser blocks requests due to CORS policy.

**Check Browser Console** (F12):

```
Access to fetch at 'https://...' from origin 'https://...' has been blocked by CORS policy
```

**Fix** (in Azure Portal):

1. Function App → CORS
2. Add your Static Web App URL (e.g., `https://your-site.azurestaticapps.net`)
3. Or add `*` for testing (not recommended for production)

---

## Authentication Issues

### "Sign in failed" or Redirect Errors

**Symptom**: Clicking "Sign in" fails or redirects to an error page.

**Check**:

1. GitHub Secrets are set:
   - `AZURE_ENTRA_TENANT_ID`
   - `AZURE_ENTRA_CLIENT_ID`
   - `AZURE_ENTRA_AUTHORITY`
   - `AZURE_ENTRA_REDIRECT_URI`
   - `AZURE_ENTRA_POST_LOGOUT_REDIRECT_URI`

2. Azure Entra ID App Registration:
   - Redirect URIs include your site URL
   - Implicit grant flow is enabled if needed
   - API permissions are granted

**Fix**:

```bash
# Redirect URI should match your deployed site
AZURE_ENTRA_REDIRECT_URI=https://your-site.azurestaticapps.net/callback
AZURE_ENTRA_POST_LOGOUT_REDIRECT_URI=https://your-site.azurestaticapps.net
```

---

## Build Failures

### Environment Variables Not Available at Build Time

**Symptom**: Build succeeds but features don't work at runtime.

**Cause**: Docusaurus needs environment variables at **build time** to embed
them in the static site.

**Fix**:

1. Ensure variables/secrets are set in GitHub (not just Azure Portal)
2. Check workflow file passes them to the build step
3. Verify scope is "All scopes" or "Builds" (not just "Runtime")

### Deployment Validation Fails

**Symptom**: GitHub Action fails with "Infrastructure Validation Failed"

**Check the Action logs** for specific missing items:

```
Required secrets are missing:
  - AZURE_STATIC_WEB_APPS_API_TOKEN
  - COSMOS_DB_CONNECTION_STRING
```

**Fix**: Add each missing secret/variable following the instructions in
`.github/AZURE_SETUP.md`

---

## Azure Functions Deployment

### CONFIGURE_APP_SETTINGS Variable

The Azure Functions deployment uses `CONFIGURE_APP_SETTINGS` to determine
whether to update Function App settings automatically.

**Set this as a repository variable**:

```
CONFIGURE_APP_SETTINGS=true
```

When enabled, the workflow will:

1. Login to Azure using `AZURE_CREDENTIALS`
2. Push all required app settings to the Function App
3. Including: AI endpoint, API key, deployment name, Cosmos DB connection, etc.

**If you prefer manual configuration**:

- Set `CONFIGURE_APP_SETTINGS=false` or don't set it
- Manually configure settings in Azure Portal → Function App → Configuration

---

## Diagnostic Commands

### Check Documentation Site Configuration

Visit your deployed site and open browser console (F12), then run:

```javascript
// Check if Docusaurus config loaded
window.__DOCUSAURUS__?.siteConfig?.customFields?.azureConfig

// Expected output:
{
  tenantId: "...",
  clientId: "...",
  functionsBaseUrl: "https://...",  // This should NOT be empty!
  appInsightsConnectionString: "..."
}
```

If `functionsBaseUrl` is `""` or missing → `AZURE_FUNCTIONS_BASE_URL` wasn't
available at build time.

### Check Azure Functions Logs

```bash
# Using Azure CLI
az functionapp log tail --name your-function-app --resource-group your-resource-group

# Or use Azure Portal → Function App → Log stream
```

### Test Azure Functions Directly

```bash
# Health check (anonymous)
curl https://your-function-app.azurewebsites.net/api/health

# Readiness check (anonymous) - shows OpenAI config status
curl https://your-function-app.azurewebsites.net/api/health/ready

# Test AI endpoint (requires auth token)
curl -X POST https://your-function-app.azurewebsites.net/api/askDocumentation \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"question":"What is Phoenix Rooivalk?"}'
```

---

## Quick Checklist

When AI features aren't working, verify:

- [ ] `AZURE_FUNCTIONS_BASE_URL` is set as a GitHub Variable or Secret
- [ ] Value is correct: `https://your-app.azurewebsites.net` (no /api)
- [ ] Scope is "All scopes" or "Builds"
- [ ] Azure Function App is running (check Azure Portal)
- [ ] Function App has all required settings (AI endpoint, key, deployment name)
- [ ] Recent deployment succeeded (check GitHub Actions)
- [ ] Health endpoint returns 200: `/api/health`
- [ ] Readiness endpoint shows OpenAI as "ok": `/api/health/ready`
- [ ] Browser console shows `functionsBaseUrl` in config
- [ ] No CORS errors in browser console

---

## Still Having Issues?

1. **Check the GitHub Action logs** for specific error messages
2. **Check Azure Function App logs** in Azure Portal
3. **Check browser console** (F12) for frontend errors
4. **Review** `.github/workflows/deploy-docs-azure.yml` to understand the
   deployment flow
5. **Review** `apps/docs/CONFIGURATION.md` for detailed setup instructions
6. **Open an issue** with:
   - Error message screenshot
   - GitHub Action log excerpt
   - Output of diagnostic commands above
   - Browser console errors

---

## Deployment Flow Diagram

```
┌─────────────────────────────────────────┐
│     GitHub Secrets & Variables          │
│  - AZURE_FUNCTIONS_BASE_URL (var/sec)  │
│  - AZURE_ENTRA_* (secrets)              │
│  - AZURE_AI_* (secrets & vars)          │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│      GitHub Action: Build Docs          │
│  - Reads env vars at BUILD TIME         │
│  - Embeds in docusaurus.config.ts       │
│  - Creates static build/                │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│   Azure Static Web Apps Deployment      │
│  - Deploys static files                 │
│  - Config embedded in JS bundles        │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│        User Visits Site                 │
│  - JS loads with embedded config        │
│  - Reads functionsBaseUrl               │
│  - Makes API calls to Azure Functions   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│       Azure Functions API               │
│  - Receives requests                    │
│  - Uses AZURE_AI_* settings             │
│  - Calls Azure OpenAI                   │
│  - Returns AI responses                 │
└─────────────────────────────────────────┘
```

**Key Point**: `AZURE_FUNCTIONS_BASE_URL` must be available **during the build
step** so it gets embedded into the static site. Setting it only in Azure Portal
won't work because the static site has already been built without it.
