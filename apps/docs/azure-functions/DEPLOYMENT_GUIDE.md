# Azure Functions Deployment Guide

This guide provides step-by-step instructions for deploying the Phoenix Rooivalk Azure Functions after the COOP and error handling improvements.

## Prerequisites

Before deploying, ensure you have:

1. **Azure Resources**:
   - Azure Function App (Flex Consumption plan)
   - Azure Cosmos DB account with `phoenix-docs` database
   - Azure AD B2C tenant (for authentication)
   - Azure OpenAI service (optional, for AI features)

2. **GitHub Secrets Configured**:
   - `AZURE_CREDENTIALS` - Service principal credentials
   - `COSMOS_DB_CONNECTION_STRING` - Cosmos DB connection string
   - `AZURE_AI_ENDPOINT` or `AZURE_OPENAI_ENDPOINT`
   - `AZURE_AI_API_KEY` or `AZURE_OPENAI_API_KEY`

3. **GitHub Variables Configured**:
   - `AZURE_FUNCTIONAPP_NAME` - Your function app name
   - `AZURE_RESOURCE_GROUP` - Resource group name
   - `AZURE_AI_DEPLOYMENT_NAME` - AI model deployment name

See [INFRASTRUCTURE.md](./INFRASTRUCTURE.md) for detailed Azure setup instructions.

## Deployment Methods

### Method 1: Automated Deployment via GitHub Actions (Recommended)

The easiest way to deploy is using the automated GitHub Actions workflow:

1. **Navigate to Actions**:
   - Go to your repository on GitHub
   - Click on the "Actions" tab
   - Select "Deploy Azure Functions" workflow

2. **Trigger Deployment**:
   - Click "Run workflow"
   - Select branch: `copilot/fix-cross-origin-errors` (or `main` after merge)
   - Select environment: `production`
   - Click "Run workflow"

3. **Monitor Deployment**:
   - Watch the workflow progress in real-time
   - Check for any errors in the build or deploy steps
   - Verify the deployment summary at the end

4. **Verify Deployment**:
   ```bash
   # Check health endpoint
   curl https://YOUR-FUNCTION-APP.azurewebsites.net/api/health/ready
   
   # Expected response (200 OK):
   {
     "status": "healthy",
     "checks": {
       "cosmos": "ok",
       "openai": "ok"
     }
   }
   ```

### Method 2: Manual Deployment via Azure Functions Core Tools

For local testing or manual deployment:

1. **Install Dependencies**:
   ```bash
   cd apps/docs/azure-functions
   npm install
   ```

2. **Build the Functions**:
   ```bash
   npm run build
   ```

3. **Login to Azure**:
   ```bash
   az login
   ```

4. **Deploy**:
   ```bash
   func azure functionapp publish YOUR-FUNCTION-APP-NAME --javascript
   ```

5. **Configure Environment Variables** (if not already set):
   ```bash
   az functionapp config appsettings set \
     --name YOUR-FUNCTION-APP-NAME \
     --resource-group YOUR-RESOURCE-GROUP \
     --settings \
       "COSMOS_DB_CONNECTION_STRING=YOUR_CONNECTION_STRING" \
       "AZURE_AI_ENDPOINT=YOUR_AI_ENDPOINT" \
       "AZURE_AI_API_KEY=YOUR_AI_KEY"
   ```

## Post-Deployment Verification

### 1. Health Check

Verify the Functions are running and configured correctly:

```bash
# Basic health check
curl https://YOUR-FUNCTION-APP.azurewebsites.net/api/health

# Detailed readiness check
curl https://YOUR-FUNCTION-APP.azurewebsites.net/api/health/ready
```

**Expected Response (Healthy)**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "version": "1.0.0",
  "uptime": 3600,
  "checks": {
    "cosmos": "ok",
    "openai": "ok"
  }
}
```

**Expected Response (Unhealthy - Missing Config)**:
```json
{
  "status": "unhealthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "version": "1.0.0",
  "uptime": 60,
  "checks": {
    "cosmos": "error",
    "openai": "not-configured"
  },
  "errors": [
    "Cosmos DB: COSMOS_DB_CONNECTION_STRING not configured"
  ]
}
```

If unhealthy, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for resolution steps.

### 2. Test Cosmos DB Operations

Test the setDocument endpoint (requires authentication):

```bash
# Get authentication token (use your actual auth flow)
TOKEN="your-jwt-token-here"

# Test setDocument
curl -X POST https://YOUR-FUNCTION-APP.azurewebsites.net/api/cosmos/setDocument \
  -H "Content-Type: application/json" \
  -H "Authorization: ******" \
  -d '{
    "collection": "userProgress",
    "documentId": "test-user-123",
    "data": {
      "completedModules": ["intro"],
      "lastActive": "2024-01-01T12:00:00.000Z"
    }
  }'
```

**Expected Response (Success)**:
```json
{
  "success": true
}
```

**Expected Response (Missing Config)**:
```json
{
  "error": "Database not configured",
  "code": "DB_CONFIG_ERROR"
}
```

### 3. Check CORS Configuration

Verify CORS is properly configured:

```bash
az functionapp cors show \
  --name YOUR-FUNCTION-APP-NAME \
  --resource-group YOUR-RESOURCE-GROUP
```

**Expected Output**:
```json
[
  "https://docs.phoenixrooivalk.com",
  "https://phoenixrooivalk.com",
  "http://localhost:3000",
  "http://localhost:3001"
]
```

If missing, add origins:
```bash
az functionapp cors add \
  --name YOUR-FUNCTION-APP-NAME \
  --resource-group YOUR-RESOURCE-GROUP \
  --allowed-origins \
    "https://docs.phoenixrooivalk.com" \
    "https://phoenixrooivalk.com" \
    "http://localhost:3000" \
    "http://localhost:3001"

# Enable credentials
az functionapp cors credentials \
  --name YOUR-FUNCTION-APP-NAME \
  --resource-group YOUR-RESOURCE-GROUP \
  --enable true
```

### 4. Verify Static Web App Configuration

Check that the docs site has no COOP header:

```bash
# Test from your local machine or CI
curl -I https://docs.phoenixrooivalk.com
```

**Verify**:
- ✅ `Cross-Origin-Embedder-Policy: unsafe-none` is present
- ✅ `Cross-Origin-Opener-Policy` is **NOT** present (should be absent)

If COOP header is present, redeploy the docs site.

### 5. Test OAuth Login Flow

1. Navigate to `https://docs.phoenixrooivalk.com`
2. Click "Sign In"
3. Try Google or GitHub OAuth
4. **Verify**:
   - ✅ OAuth popup opens
   - ✅ No "Cross-Origin-Opener-Policy" errors in console
   - ✅ Popup closes after authentication
   - ✅ User is logged in on main page
   - ✅ User progress syncs successfully

### 6. Monitor Logs

Stream logs to monitor for any errors:

```bash
# Stream live logs
az functionapp log tail \
  --name YOUR-FUNCTION-APP-NAME \
  --resource-group YOUR-RESOURCE-GROUP

# Or view in Azure Portal:
# Function App → Monitoring → Log stream
```

**Look for**:
- ✅ `[Cosmos] Client initialized successfully`
- ✅ `getDocument request` with successful operations
- ✅ `Document upserted successfully`
- ❌ `COSMOS_DB_CONNECTION_STRING not configured` (indicates missing config)
- ❌ `Failed to initialize Cosmos DB client` (indicates connection issues)

## Common Post-Deployment Issues

### Issue 1: Health Check Returns "cosmos: error"

**Cause**: Missing or invalid `COSMOS_DB_CONNECTION_STRING`

**Fix**:
```bash
# Get connection string from Cosmos DB
COSMOS_CONNECTION=$(az cosmosdb keys list \
  --name YOUR-COSMOS-ACCOUNT \
  --resource-group YOUR-RESOURCE-GROUP \
  --type connection-strings \
  --query "connectionStrings[0].connectionString" \
  --output tsv)

# Set in Function App
az functionapp config appsettings set \
  --name YOUR-FUNCTION-APP-NAME \
  --resource-group YOUR-RESOURCE-GROUP \
  --settings "COSMOS_DB_CONNECTION_STRING=$COSMOS_CONNECTION"

# Restart Function App
az functionapp restart \
  --name YOUR-FUNCTION-APP-NAME \
  --resource-group YOUR-RESOURCE-GROUP
```

### Issue 2: CORS Errors Persist

**Cause**: CORS not configured or credentials not enabled

**Fix**: See "Check CORS Configuration" section above

### Issue 3: 401 Unauthorized Errors

**Cause**: Azure AD B2C not configured correctly

**Fix**:
```bash
# Verify B2C settings
az functionapp config appsettings list \
  --name YOUR-FUNCTION-APP-NAME \
  --resource-group YOUR-RESOURCE-GROUP \
  --query "[?starts_with(name, 'AZURE_AD_B2C')]"

# Set if missing
az functionapp config appsettings set \
  --name YOUR-FUNCTION-APP-NAME \
  --resource-group YOUR-RESOURCE-GROUP \
  --settings \
    "AZURE_AD_B2C_TENANT=your-tenant.onmicrosoft.com" \
    "AZURE_AD_B2C_CLIENT_ID=your-client-id" \
    "AZURE_AD_B2C_POLICY=B2C_1_signupsignin"
```

### Issue 4: Still Seeing COOP Errors

**Cause**: Browser cache or CDN cache

**Fix**:
1. Clear browser cache completely
2. Try incognito/private browsing mode
3. Wait for CDN cache to expire (usually 5-10 minutes)
4. Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)

## Rollback Procedure

If issues occur after deployment:

### Option 1: Rollback via Azure Portal

1. Navigate to Function App → Deployment Center
2. Click on "Deployment History"
3. Select the previous working deployment
4. Click "Redeploy"

### Option 2: Rollback via Git

```bash
# Identify the last working commit
git log --oneline

# Revert to previous commit
git revert HEAD~3..HEAD

# Push revert commits
git push origin main

# Or create a hotfix branch
git checkout -b hotfix/revert-coop-fix <previous-commit-hash>
git push origin hotfix/revert-coop-fix
```

Then trigger the deployment workflow for the reverted code.

## Monitoring and Alerting

### Application Insights Queries

If Application Insights is configured:

**Error Rate**:
```kusto
traces
| where severityLevel > 2
| where timestamp > ago(1h)
| summarize count() by operation_Name
| order by count_ desc
```

**Cosmos DB Operations**:
```kusto
traces
| where message contains "cosmos" or message contains "Cosmos"
| where timestamp > ago(1h)
| project timestamp, message, severityLevel
| order by timestamp desc
```

**Authentication Issues**:
```kusto
traces
| where message contains "Authentication" or message contains "auth"
| where severityLevel > 1
| where timestamp > ago(1h)
| order by timestamp desc
```

### Set Up Alerts

Consider setting up alerts for:
- Health check failures (cosmos: error)
- High error rate (>5% of requests)
- Authentication failures spike
- Database operation timeouts

## Deployment Checklist

Before deploying to production:

- [ ] All changes reviewed and approved
- [ ] TypeScript compilation successful
- [ ] Security scan passed
- [ ] Azure resources provisioned
- [ ] GitHub secrets configured
- [ ] GitHub variables configured
- [ ] CORS origins configured
- [ ] Test deployment to staging environment
- [ ] Health check returns "healthy"
- [ ] OAuth login tested successfully
- [ ] User progress sync tested
- [ ] Monitor logs for 15 minutes post-deployment
- [ ] Document any issues encountered

After deployment:

- [ ] Verify health endpoint
- [ ] Test Cosmos DB operations
- [ ] Test OAuth login flow
- [ ] Check browser console for errors
- [ ] Monitor Application Insights
- [ ] Update stakeholders

## Additional Resources

- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Detailed troubleshooting guide
- [INFRASTRUCTURE.md](./INFRASTRUCTURE.md) - Azure infrastructure setup
- [CORS_LOGIN_FIX.md](../../../CORS_LOGIN_FIX.md) - CORS and COOP fix history
- [GitHub Workflow](../../../.github/workflows/deploy-azure-functions.yml) - CI/CD pipeline

## Support

For issues or questions:
- Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) first
- Review Application Insights logs
- Create a GitHub issue with detailed error messages
- Include health check response in issue reports
