# Quick Reference: Fix COOP and Cosmos DB Errors

## 🔍 Quick Diagnosis

```bash
# Check if you're affected by these errors:
# 1. Browser console shows: "Cross-Origin-Opener-Policy policy would block the window.closed call"
# 2. Network tab shows: POST /api/cosmos/setDocument returns 500 error
# 3. Console shows: "DB_OPERATION_FAILED"

# Run this diagnostic command:
./scripts/diagnose-azure-functions.sh <function-app-name> <resource-group>
```

## ⚡ Quick Fix Commands

### Fix 1: COOP Error (OAuth Popup Blocked)

**Already Fixed** ✅ - The COOP header has been removed from `staticwebapp.config.json`

**Verify the fix:**
```bash
# Should NOT contain "Cross-Origin-Opener-Policy"
grep "Cross-Origin-Opener-Policy" apps/docs/staticwebapp.config.json

# Should return empty (no match) = CORRECT ✅
# If it returns a match = INCORRECT ❌
```

**Clear cache and test:**
```bash
# 1. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
# 2. Test login at: https://docs.phoenixrooivalk.com
# 3. OAuth popup should open and close successfully
# 4. No COOP errors in browser console
```

### Fix 2: Cosmos DB Connection Error (500 from /api/cosmos/setDocument)

**One-line fix:**
```bash
# Replace <placeholders> with your actual values
az functionapp config appsettings set \
  --name <function-app-name> \
  --resource-group <resource-group> \
  --settings "COSMOS_DB_CONNECTION_STRING=$(az cosmosdb keys list --name <cosmos-account> --resource-group <resource-group> --type connection-strings --query 'connectionStrings[0].connectionString' -o tsv)"
```

**Step-by-step fix:**
```bash
# 1. Get Cosmos DB connection string
COSMOS_CONNECTION=$(az cosmosdb keys list \
  --name <cosmos-account> \
  --resource-group <resource-group> \
  --type connection-strings \
  --query "connectionStrings[0].connectionString" \
  --output tsv)

# 2. Set in Function App
az functionapp config appsettings set \
  --name <function-app-name> \
  --resource-group <resource-group> \
  --settings "COSMOS_DB_CONNECTION_STRING=$COSMOS_CONNECTION"

# 3. Restart Function App
az functionapp restart \
  --name <function-app-name> \
  --resource-group <resource-group>

# 4. Wait 30 seconds, then verify
curl https://<function-app-name>.azurewebsites.net/api/health/ready
```

## ✅ Verification Checklist

After applying fixes, verify:

```bash
# 1. Health endpoint shows Cosmos DB is OK
curl https://<function-app-name>.azurewebsites.net/api/health/ready | jq '.checks.cosmos'
# Expected: "ok" ✅

# 2. CORS is configured
az functionapp cors show --name <function-app-name> --resource-group <resource-group>
# Expected: List of allowed origins including docs.phoenixrooivalk.com ✅

# 3. CORS credentials enabled
az functionapp show \
  --name <function-app-name> \
  --resource-group <resource-group> \
  --query "siteConfig.cors.supportCredentials"
# Expected: true ✅

# 4. Static web app headers are correct
curl -I https://docs.phoenixrooivalk.com | grep -i "cross-origin"
# Expected: Only "Cross-Origin-Embedder-Policy: unsafe-none" ✅
# Expected: NO "Cross-Origin-Opener-Policy" header ✅
```

## 🧪 End-to-End Test

1. **Clear browser cache**: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
2. **Open docs site**: https://docs.phoenixrooivalk.com
3. **Open DevTools Console**: F12
4. **Click "Sign In"**
5. **Authenticate with Google or GitHub**
6. **Expected results**:
   - ✅ OAuth popup opens
   - ✅ No COOP errors in console
   - ✅ Popup closes after auth
   - ✅ User logged in successfully
   - ✅ Console shows: `[AuthContext] User signed in, syncing progress...`
   - ✅ NO 500 errors
   - ✅ NO "DB_OPERATION_FAILED" errors
   - ✅ User progress syncs successfully

## 📊 Troubleshooting Decision Tree

```
┌─────────────────────────────────┐
│ OAuth popup opens but closes    │
│ immediately with COOP error?    │
└────────┬────────────────────────┘
         │ YES
         ▼
┌─────────────────────────────────┐
│ Check staticwebapp.config.json  │
│ grep "Cross-Origin-Opener"      │
└────────┬────────────────────────┘
         │ Found?
         ├─ YES → Remove header, redeploy
         └─ NO  → Clear browser cache
                  Wait for CDN refresh

┌─────────────────────────────────┐
│ Login works but 500 error       │
│ on /api/cosmos/setDocument?     │
└────────┬────────────────────────┘
         │ YES
         ▼
┌─────────────────────────────────┐
│ Check health endpoint:          │
│ curl .../api/health/ready       │
└────────┬────────────────────────┘
         │ cosmos: "error"?
         ├─ YES → Set COSMOS_DB_CONNECTION_STRING
         └─ NO  → Check Cosmos DB firewall rules

┌─────────────────────────────────┐
│ Both issues resolved but still  │
│ seeing errors?                  │
└────────┬────────────────────────┘
         │ YES
         ▼
┌─────────────────────────────────┐
│ 1. Clear all caches             │
│ 2. Wait 10 minutes for CDN      │
│ 3. Try incognito/private mode   │
│ 4. Check Application Insights   │
│ 5. Review Function App logs     │
└─────────────────────────────────┘
```

## 🔗 Full Documentation

- **Comprehensive Fix Guide**: [FIX_GUIDE.md](./FIX_GUIDE.md)
- **Troubleshooting**: [apps/docs/azure-functions/TROUBLESHOOTING.md](./apps/docs/azure-functions/TROUBLESHOOTING.md)
- **Deployment Guide**: [apps/docs/azure-functions/DEPLOYMENT_GUIDE.md](./apps/docs/azure-functions/DEPLOYMENT_GUIDE.md)
- **CORS Fix History**: [CORS_LOGIN_FIX.md](./CORS_LOGIN_FIX.md)

## 💡 Pro Tips

1. **Always run diagnostics first**:
   ```bash
   ./scripts/diagnose-azure-functions.sh <app-name> <rg>
   ```

2. **Use validation before deployment**:
   ```bash
   ./scripts/validate-deployment-config.sh
   ```

3. **Monitor health endpoint after changes**:
   ```bash
   watch -n 5 'curl -s https://<app>.azurewebsites.net/api/health/ready | jq'
   ```

4. **Stream logs during troubleshooting**:
   ```bash
   az functionapp log tail --name <app> --resource-group <rg>
   ```

## 🆘 Need More Help?

If the quick fixes don't resolve your issue:

1. Run full diagnostics and save output:
   ```bash
   ./scripts/diagnose-azure-functions.sh <app> <rg> > diagnostics.txt
   ```

2. Check detailed logs:
   ```bash
   az functionapp log tail --name <app> --resource-group <rg>
   ```

3. Create a GitHub issue with:
   - Diagnostics output
   - Health endpoint response
   - Browser console errors
   - Function App logs
   - Steps to reproduce

## 📅 Last Updated

2024-12-21 - Initial creation with COOP and Cosmos DB fixes
