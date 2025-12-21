# Azure Functions Troubleshooting Guide

This guide helps diagnose and fix common issues with the Phoenix Rooivalk
Azure Functions deployment.

## Common Issues

### 1. Cross-Origin-Opener-Policy (COOP) Errors

**Symptom:**

```text
Cross-Origin-Opener-Policy policy would block the window.closed call.
```

**Cause:** OAuth popup windows cannot communicate with the parent window due
to restrictive COOP headers.

**Solution:**

1. **Check `apps/docs/staticwebapp.config.json`** - ensure COOP header is
   NOT set:

   ```json
   {
     "globalHeaders": {
       "Cross-Origin-Embedder-Policy": "unsafe-none"
     }
   }
   ```

   ✅ COOP header should be absent (not set to any value)

2. **Verify deployment** - if the config is correct but errors persist:

   ```bash
   # Redeploy the docs site
   cd apps/docs
   pnpm run build
   ```

3. **Clear browser cache** - old headers may be cached:
   - Chrome: DevTools → Network → "Disable cache" checkbox
   - Firefox: Settings → Privacy → Clear Data
   - Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)

### 2. 500 Internal Server Error from `/api/cosmos/setDocument`

**Symptom:**

```text
Failed to load resource: the server responded with a status of 500
(Internal Server Error)
Uncaught (in promise) Error: Functions proxy error: Internal Server
Error - {"error":"Failed to set document"}
```

**Cause:** Azure Functions cannot connect to Cosmos DB or missing
environment variables.

**Diagnosis Steps:**

1. **Check health endpoint:**
   ```bash
   curl https://YOUR-FUNCTION-APP.azurewebsites.net/api/health/ready
   ```

   Expected response:
   ```json
   {
     "status": "healthy",
     "checks": {
       "cosmos": "ok",
       "openai": "ok"
     }
   }
   ```

   If `cosmos: "error"`, see solution below.

2. **Check Azure Functions logs:**
   ```bash
   # Stream live logs
   az functionapp log tail \
     --name YOUR-FUNCTION-APP \
     --resource-group YOUR-RESOURCE-GROUP

   # Or view in Azure Portal:
   # Navigate to Function App → Monitoring → Log stream
   ```

   Look for errors like:
   - `COSMOS_DB_CONNECTION_STRING not configured`
   - `Failed to initialize Cosmos DB client`
   - `Cosmos DB: connection timeout`

**Solution:**

1. **Verify environment variable is set:**
   ```bash
   # Check if COSMOS_DB_CONNECTION_STRING exists
   az functionapp config appsettings list \
     --name YOUR-FUNCTION-APP \
     --resource-group YOUR-RESOURCE-GROUP \
     --query "[?name=='COSMOS_DB_CONNECTION_STRING']"
   ```

2. **Set the connection string if missing:**
   ```bash
   # Get Cosmos DB connection string
   COSMOS_CONNECTION_STRING=$(az cosmosdb keys list \
     --name YOUR-COSMOS-ACCOUNT \
     --resource-group YOUR-RESOURCE-GROUP \
     --type connection-strings \
     --query "connectionStrings[0].connectionString" \
     --output tsv)

   # Set in Function App
   az functionapp config appsettings set \
     --name YOUR-FUNCTION-APP \
     --resource-group YOUR-RESOURCE-GROUP \
     --settings "COSMOS_DB_CONNECTION_STRING=$COSMOS_CONNECTION_STRING"
   ```

3. **Restart the Function App:**
   ```bash
   az functionapp restart \
     --name YOUR-FUNCTION-APP \
     --resource-group YOUR-RESOURCE-GROUP
   ```

4. **Verify the fix:**
   ```bash
   # Check health endpoint again
   curl https://YOUR-FUNCTION-APP.azurewebsites.net/api/health/ready
   ```

### 3. CORS Errors

**Symptom:**

```text
Access to fetch at 'https://...' from origin
'https://docs.phoenixrooivalk.com' has been blocked by CORS policy
```

**Solution:**

1. **Verify CORS is configured in Azure:**
   ```bash
   # List current CORS origins
   az functionapp cors show \
     --name YOUR-FUNCTION-APP \
     --resource-group YOUR-RESOURCE-GROUP

   # Add missing origins
   az functionapp cors add \
     --name YOUR-FUNCTION-APP \
     --resource-group YOUR-RESOURCE-GROUP \
     --allowed-origins \
       "https://docs.phoenixrooivalk.com" \
       "https://phoenixrooivalk.com" \
       "http://localhost:3000" \
       "http://localhost:3001"

   # Enable credentials
   az functionapp cors credentials \
     --name YOUR-FUNCTION-APP \
     --resource-group YOUR-RESOURCE-GROUP \
     --enable true
   ```

2. **Verify in Azure Portal:**
   - Navigate to Function App → Settings → CORS
   - Ensure allowed origins are listed
   - Ensure "Enable Access-Control-Allow-Credentials" is checked

### 4. Authentication Errors

**Symptom:**
```
[AuthContext] Auth state changed
[AuthContext] User signed in, syncing progress...
Uncaught (in promise) Error: Functions proxy error: Internal Server Error
```

**Cause:** User is authenticated but Functions cannot validate the token or access the database.

**Solution:**

1. **Check Azure AD B2C configuration:**
   ```bash
   # Verify B2C environment variables
   az functionapp config appsettings list \
     --name YOUR-FUNCTION-APP \
     --resource-group YOUR-RESOURCE-GROUP \
     --query "[?starts_with(name, 'AZURE_AD_B2C')]"
   ```

   Required settings:
   - `AZURE_AD_B2C_TENANT`
   - `AZURE_AD_B2C_CLIENT_ID`
   - `AZURE_AD_B2C_POLICY` (default: `B2C_1_signupsignin`)

2. **Check token validation:**
   - Ensure the Functions app has the correct B2C client ID
   - Verify the policy name matches your B2C configuration
   - Check that the tenant name is correct

3. **Temporarily skip token validation for debugging (NOT for production):**
   ```bash
   az functionapp config appsettings set \
     --name YOUR-FUNCTION-APP \
     --resource-group YOUR-RESOURCE-GROUP \
     --settings "SKIP_TOKEN_VALIDATION=true"
   ```

   ⚠️ **WARNING:** Remove this setting after debugging!

### 5. Database Container Not Found

**Symptom:**
```
Error: Container 'userProgress' does not exist
```

**Solution:**

1. **Check if containers exist:**
   ```bash
   # List containers in the database
   az cosmosdb sql container list \
     --account-name YOUR-COSMOS-ACCOUNT \
     --database-name phoenix-docs \
     --resource-group YOUR-RESOURCE-GROUP
   ```

2. **Create missing containers:**
   ```bash
   # Use the automated setup script
   cd /home/runner/work/PhoenixRooivalk/PhoenixRooivalk
   ./scripts/setup-cosmos-containers.sh YOUR-RESOURCE-GROUP YOUR-COSMOS-ACCOUNT
   ```

   Or manually:

   ```bash
   # Create userProgress container
   az cosmosdb sql container create \
     --account-name YOUR-COSMOS-ACCOUNT \
     --database-name phoenix-docs \
     --name userProgress \
     --partition-key-path "/id" \
     --resource-group YOUR-RESOURCE-GROUP
   ```

## Debugging Tools

### 1. Function App Diagnostics

**Azure Portal:**
- Navigate to Function App → Diagnose and solve problems
- Run "Availability and Performance" diagnostic
- Check "Configuration and Management" diagnostic

### 2. Application Insights

If Application Insights is configured:

```bash
# Query recent errors
az monitor app-insights query \
  --app YOUR-APP-INSIGHTS \
  --analytics-query "traces | where severityLevel > 2 | take 50"
```

### 3. Local Testing

Test Functions locally before deploying:

```bash
cd apps/docs/azure-functions

# Copy local settings
cp local.settings.json.example local.settings.json

# Edit local.settings.json with your connection strings
nano local.settings.json

# Install dependencies
pnpm install

# Build
pnpm run build

# Start Functions runtime
func start
```

Then test endpoints:
```bash
# Test health
curl http://localhost:7071/api/health

# Test with authentication
curl -X POST http://localhost:7071/api/cosmos/setDocument \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "collection": "userProgress",
    "documentId": "test-user-123",
    "data": {"test": true}
  }'
```

## Environment Variable Checklist

Required for Cosmos DB operations:

- ✅ `COSMOS_DB_CONNECTION_STRING` - Cosmos DB connection
- ✅ `COSMOS_DB_DATABASE` - Database name (default: `phoenix-docs`)

Required for Authentication:

- ✅ `AZURE_AD_B2C_TENANT` - B2C tenant name
- ✅ `AZURE_AD_B2C_CLIENT_ID` - Application client ID
- ✅ `AZURE_AD_B2C_POLICY` - Sign-up/sign-in policy name

Optional but recommended:

- 📋 `APPLICATIONINSIGHTS_CONNECTION_STRING` - Application Insights
- 📋 `AZURE_AI_ENDPOINT` - Azure OpenAI endpoint
- 📋 `AZURE_AI_API_KEY` - Azure OpenAI key
- 📋 `AZURE_AI_DEPLOYMENT_NAME` - Chat model deployment

## Getting Help

If issues persist:

1. **Check Azure Functions logs:**
   - Azure Portal → Function App → Monitoring → Log stream
   - Look for detailed error messages with stack traces

2. **Enable verbose logging temporarily:**
   ```bash
   az functionapp config appsettings set \
     --name YOUR-FUNCTION-APP \
     --resource-group YOUR-RESOURCE-GROUP \
     --settings "NODE_ENV=development"
   ```

3. **Review recent deployments:**
   ```bash
   az functionapp deployment list-publishing-profiles \
     --name YOUR-FUNCTION-APP \
     --resource-group YOUR-RESOURCE-GROUP
   ```

4. **Contact support:**
   - Check GitHub Issues:
     <https://github.com/JustAGhosT/PhoenixRooivalk/issues>
   - Review documentation: `apps/docs/azure-functions/INFRASTRUCTURE.md`

## Related Documentation

- [Infrastructure Setup](./INFRASTRUCTURE.md) - Initial Azure setup guide
- [Deployment Workflow](../../.github/workflows/deploy-azure-functions.yml) - CI/CD pipeline
- [CORS Fix Summary](../../CORS_LOGIN_FIX.md) - CORS and login issue history
