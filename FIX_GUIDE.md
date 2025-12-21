# Fix Guide: Cross-Origin-Opener-Policy and Cosmos DB Connection Errors

This guide provides step-by-step instructions to resolve the two critical errors reported in the issue.

## Issue Overview

**Error 1: Cross-Origin-Opener-Policy (COOP) Errors**
```
Cross-Origin-Opener-Policy policy would block the window.closed call.
```

**Error 2: Cosmos DB Connection Failure**
```
POST https://phoenix-rooivalk-functions-cjfde7dng4hsbtfk.southafricanorth-01.azurewebsites.net/api/cosmos/setDocument 500 (Internal Server Error)
Uncaught (in promise) Error: Functions proxy error: Internal Server Error - {"error":"Failed to set document","code":"DB_OPERATION_FAILED"}
```

## Quick Diagnosis

Run the diagnostic script to quickly identify configuration issues:

```bash
# Set your Azure Function App details
export AZURE_FUNCTIONAPP_NAME="phoenix-rooivalk-functions-cjfde7dng4hsbtfk"
export AZURE_RESOURCE_GROUP="<your-resource-group>"

# Run diagnostic
./scripts/diagnose-azure-functions.sh
```

Or provide as arguments:

```bash
./scripts/diagnose-azure-functions.sh phoenix-rooivalk-functions-cjfde7dng4hsbtfk <resource-group>
```

## Fix 1: Cross-Origin-Opener-Policy (COOP) Error

### Problem
OAuth popup windows (Google, GitHub login) cannot communicate with the parent window due to restrictive COOP headers.

### Root Cause
The `staticwebapp.config.json` file contains a `Cross-Origin-Opener-Policy` header that blocks popup communication.

### Solution

**Step 1: Verify Current Configuration**

Check if COOP header exists:
```bash
grep "Cross-Origin-Opener-Policy" apps/docs/staticwebapp.config.json
```

**Step 2: Remove COOP Header**

The header should already be removed (as per previous fix). Verify that `apps/docs/staticwebapp.config.json` looks like this:

```json
{
  "globalHeaders": {
    "Cross-Origin-Embedder-Policy": "unsafe-none"
  },
  "routes": [
    ...
  ]
}
```

✅ **CORRECT**: No `Cross-Origin-Opener-Policy` header
❌ **INCORRECT**: Contains `"Cross-Origin-Opener-Policy": "same-origin-allow-popups"`

**Step 3: Verify Deployment**

If the file is correct but errors persist, the old configuration may be cached:

1. **Clear browser cache**:
   - Chrome: DevTools → Network → "Disable cache"
   - Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)

2. **Check deployed version**:
   ```bash
   curl -I https://docs.phoenixrooivalk.com | grep -i "cross-origin"
   ```
   
   Expected output:
   - ✅ `Cross-Origin-Embedder-Policy: unsafe-none` (present)
   - ✅ No `Cross-Origin-Opener-Policy` header (absent)

**Step 4: Redeploy if Needed**

If the deployed version still has the COOP header:

```bash
cd apps/docs
npm run build
# Follow your deployment process (GitHub Actions, Azure CLI, etc.)
```

### Verification

Test OAuth login:
1. Navigate to https://docs.phoenixrooivalk.com
2. Click "Sign In"
3. Try Google or GitHub OAuth
4. **Expected**: Popup opens, authenticates, closes automatically
5. **Expected**: No COOP errors in browser console

## Fix 2: Cosmos DB Connection Error (500 Internal Server Error)

### Problem
Azure Functions cannot connect to Cosmos DB, causing `/api/cosmos/setDocument` to return 500 errors.

### Root Cause
The `COSMOS_DB_CONNECTION_STRING` environment variable is either:
- Not set in Azure Functions configuration
- Set to an invalid/expired connection string
- Pointing to a Cosmos DB account that doesn't exist or lacks permissions

### Solution

**Step 1: Check Health Endpoint**

Test if Cosmos DB is configured:

```bash
curl https://phoenix-rooivalk-functions-cjfde7dng4hsbtfk.southafricanorth-01.azurewebsites.net/api/health/ready
```

Expected response (healthy):
```json
{
  "status": "healthy",
  "checks": {
    "cosmos": "ok",
    "openai": "ok"
  }
}
```

If `cosmos: "error"`, proceed with the fix below.

**Step 2: Get Cosmos DB Connection String**

```bash
# Replace with your Cosmos DB account name and resource group
COSMOS_ACCOUNT="<your-cosmos-account>"
RESOURCE_GROUP="<your-resource-group>"

# Get the connection string
COSMOS_CONNECTION=$(az cosmosdb keys list \
  --name "$COSMOS_ACCOUNT" \
  --resource-group "$RESOURCE_GROUP" \
  --type connection-strings \
  --query "connectionStrings[0].connectionString" \
  --output tsv)

echo "Connection string retrieved"
```

**Step 3: Set Connection String in Azure Functions**

```bash
FUNCTION_APP="phoenix-rooivalk-functions-cjfde7dng4hsbtfk"
RESOURCE_GROUP="<your-resource-group>"

# Set the connection string
az functionapp config appsettings set \
  --name "$FUNCTION_APP" \
  --resource-group "$RESOURCE_GROUP" \
  --settings "COSMOS_DB_CONNECTION_STRING=$COSMOS_CONNECTION"

echo "✅ Connection string configured"
```

**Step 4: Verify Database Name**

Ensure the database name is set correctly:

```bash
az functionapp config appsettings set \
  --name "$FUNCTION_APP" \
  --resource-group "$RESOURCE_GROUP" \
  --settings "COSMOS_DB_DATABASE=phoenix-docs"
```

**Step 5: Restart Function App**

Restart to apply the new configuration:

```bash
az functionapp restart \
  --name "$FUNCTION_APP" \
  --resource-group "$RESOURCE_GROUP"

echo "✅ Function App restarted"
```

**Step 6: Verify the Fix**

Wait 30 seconds for the restart to complete, then test:

```bash
# Test health endpoint
curl https://phoenix-rooivalk-functions-cjfde7dng4hsbtfk.southafricanorth-01.azurewebsites.net/api/health/ready

# Expected output:
# {
#   "status": "healthy",
#   "checks": {
#     "cosmos": "ok"
#   }
# }
```

### Additional Checks

**Check Cosmos DB Containers Exist**

Ensure the required containers are created:

```bash
# List containers
az cosmosdb sql container list \
  --account-name "$COSMOS_ACCOUNT" \
  --database-name phoenix-docs \
  --resource-group "$RESOURCE_GROUP"
```

Required containers:
- `userProgress`
- `userProfiles`
- `knownEmails`
- `accessApplications`
- `news`
- `comments`

If containers are missing, create them:

```bash
# Example: Create userProgress container
az cosmosdb sql container create \
  --account-name "$COSMOS_ACCOUNT" \
  --database-name phoenix-docs \
  --name userProgress \
  --partition-key-path "/id" \
  --resource-group "$RESOURCE_GROUP"
```

**Verify Firewall Rules**

Ensure Azure Functions can access Cosmos DB:

```bash
# Check current firewall rules
az cosmosdb show \
  --name "$COSMOS_ACCOUNT" \
  --resource-group "$RESOURCE_GROUP" \
  --query "ipRules"

# If needed, allow Azure services
az cosmosdb update \
  --name "$COSMOS_ACCOUNT" \
  --resource-group "$RESOURCE_GROUP" \
  --enable-virtual-network true
```

### Verification

Test the full auth + database flow:

1. Navigate to https://docs.phoenixrooivalk.com
2. Clear browser cache (Ctrl+Shift+R)
3. Open browser DevTools Console
4. Click "Sign In"
5. Complete OAuth authentication
6. **Expected**: No 500 errors
7. **Expected**: `[AuthContext] User signed in, syncing progress...`
8. **Expected**: No "DB_OPERATION_FAILED" errors
9. **Expected**: User progress syncs successfully

## Automated Validation

Before deployment, validate configuration:

```bash
# In GitHub Actions (automatic)
./scripts/validate-deployment-config.sh

# Locally (set environment variables first)
export AZURE_FUNCTIONAPP_NAME="phoenix-rooivalk-functions-cjfde7dng4hsbtfk"
export AZURE_RESOURCE_GROUP="<your-resource-group>"
export COSMOS_DB_CONNECTION_STRING="<connection-string>"
export AZURE_AI_ENDPOINT="<openai-endpoint>"
export AZURE_AI_API_KEY="<openai-key>"

./scripts/validate-deployment-config.sh
```

## Troubleshooting

### Issue Persists After Fix

**Clear all caches**:
1. Browser cache (hard refresh)
2. CDN cache (wait 5-10 minutes or purge manually)
3. Service worker cache (unregister in DevTools)

**Check logs**:
```bash
# Stream Function App logs
az functionapp log tail \
  --name "$FUNCTION_APP" \
  --resource-group "$RESOURCE_GROUP"
```

Look for:
- ✅ `[Cosmos] Client initialized successfully`
- ❌ `COSMOS_DB_CONNECTION_STRING not configured`
- ❌ `Failed to initialize Cosmos DB client`

**Verify in Azure Portal**:
1. Navigate to Function App → Configuration → Application settings
2. Find `COSMOS_DB_CONNECTION_STRING`
3. Verify it's set and not expired
4. Click "Save" and "Restart"

### Authentication Still Failing

Check Azure AD B2C configuration:

```bash
# Verify B2C settings
az functionapp config appsettings list \
  --name "$FUNCTION_APP" \
  --resource-group "$RESOURCE_GROUP" \
  --query "[?starts_with(name, 'AZURE_AD_B2C')]"
```

Required settings:
- `AZURE_AD_B2C_TENANT`
- `AZURE_AD_B2C_CLIENT_ID`
- `AZURE_AD_B2C_POLICY`

### CORS Errors

Configure CORS if not already set:

```bash
# Add CORS origins
az functionapp cors add \
  --name "$FUNCTION_APP" \
  --resource-group "$RESOURCE_GROUP" \
  --allowed-origins \
    "https://docs.phoenixrooivalk.com" \
    "https://phoenixrooivalk.com" \
    "http://localhost:3000" \
    "http://localhost:3001"

# Enable credentials
az functionapp cors credentials \
  --name "$FUNCTION_APP" \
  --resource-group "$RESOURCE_GROUP" \
  --enable true
```

## Deployment Checklist

Before deploying to production:

- [ ] Run `./scripts/validate-deployment-config.sh`
- [ ] Verify COOP header is removed from `staticwebapp.config.json`
- [ ] Confirm `COSMOS_DB_CONNECTION_STRING` is set in Azure Functions
- [ ] Test health endpoint returns `cosmos: "ok"`
- [ ] Verify CORS origins are configured
- [ ] Test OAuth login flow (no COOP errors)
- [ ] Test user progress sync (no 500 errors)
- [ ] Monitor logs for 15 minutes post-deployment
- [ ] Clear browser cache and test in incognito mode

## Getting Help

If issues persist after following this guide:

1. **Run diagnostics**:
   ```bash
   ./scripts/diagnose-azure-functions.sh <function-app> <resource-group> > diagnostics.txt
   ```

2. **Check documentation**:
   - `apps/docs/azure-functions/TROUBLESHOOTING.md` - Detailed troubleshooting
   - `apps/docs/azure-functions/DEPLOYMENT_GUIDE.md` - Deployment procedures
   - `CORS_LOGIN_FIX.md` - CORS/COOP fix history

3. **Review logs**:
   - Azure Portal → Function App → Monitoring → Log stream
   - Application Insights (if configured)
   - Browser DevTools Console

4. **Create GitHub issue**:
   - Include diagnostics output
   - Include health endpoint response
   - Include browser console errors
   - Include Azure Functions logs

## Summary

**COOP Error Fix**: Remove `Cross-Origin-Opener-Policy` header from `staticwebapp.config.json`

**Cosmos DB Error Fix**: Set `COSMOS_DB_CONNECTION_STRING` in Azure Functions configuration

Both fixes are straightforward and can be validated using the provided diagnostic tools.
