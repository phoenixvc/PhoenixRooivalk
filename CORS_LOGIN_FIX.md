# CORS and Login Issues - Fix Summary

## Problem Statement

The login system was experiencing two critical issues:

1. **Cross-Origin-Opener-Policy (COOP) blocking OAuth popups**
   - Error:
     `Cross-Origin-Opener-Policy policy would block the window.closed call`
   - OAuth popup authentication (Google/GitHub) could not communicate with
     parent window

2. **Empty JSON responses causing parse errors**
   - Error: `SyntaxError: Failed to execute 'json' on 'Response'`
   - API calls were failing silently or returning empty bodies

## Root Causes

### 1. Restrictive COOP Header

- `staticwebapp.config.json` had
  `Cross-Origin-Opener-Policy: same-origin-allow-popups`
- This policy was too restrictive and blocked OAuth popup communication
- OAuth providers (Google, GitHub) open popups that need to communicate back to
  parent window

### 2. Missing JSON Response Handling

- `database.ts` called `response.json()` directly without checking if response
  had content
- Empty or malformed responses caused JSON parsing to fail
- No error handling for empty response bodies

### 3. Missing Credentials in Fetch Calls

- Cross-origin authenticated requests need `credentials: "include"`
- Without this, cookies and authorization headers may not be sent properly
- Affects both database service and functions service

## Changes Made

### 1. Fixed COOP Policy (`apps/docs/staticwebapp.config.json`)

```diff
  "globalHeaders": {
-   "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    "Cross-Origin-Embedder-Policy": "unsafe-none"
  },
```

- **Removed** the restrictive COOP header entirely
- OAuth popups can now communicate freely with parent window
- Maintains COEP as `unsafe-none` which is appropriate for this use case

### 2. Enhanced CORS Support (`apps/docs/azure-functions/src/functions/cosmos-proxy.ts`)

- Added `handleOptionsRequest` for OPTIONS preflight requests
- Added `addCorsHeaders` helper to dynamically set CORS headers based on origin
- All endpoints now properly handle OPTIONS method
- CORS headers include:
  - `Access-Control-Allow-Origin`: Dynamic based on request origin
  - `Access-Control-Allow-Methods`: GET, POST, PUT, DELETE, OPTIONS
  - `Access-Control-Allow-Headers`: Content-Type, Authorization,
    X-Requested-With, Accept
  - `Access-Control-Allow-Credentials`: true
  - `Access-Control-Max-Age`: 86400 (24 hours)

### 3. Centralized CORS Utilities (`apps/docs/azure-functions/src/lib/utils/responses.ts`)

- Created `getCorsHeaders()` helper function
- Supports allowed origins list:
  - `http://localhost:3000` (local dev)
  - `http://localhost:3001` (local dev alt port)
  - `https://phoenixrooivalk.com`
  - `https://docs.phoenixrooivalk.com`
  - `https://www.phoenixrooivalk.com`
  - `*.azurestaticapps.net` (Azure deployment previews)
- All error and success responses now include CORS headers automatically

### 4. Improved JSON Response Handling (`apps/docs/src/services/cloud/azure/database.ts`)

```typescript
// OLD: Direct json() call - fails on empty response
return response.json();

// NEW: Safe JSON parsing with empty response handling
const text = await response.text();
if (!text || text.trim() === "") {
  return {} as T;
}
try {
  return JSON.parse(text);
} catch (parseError) {
  console.error("Failed to parse JSON response:", text);
  throw new Error(`Invalid JSON response: ${text}`);
}
```

- First reads response as text to check if empty
- Returns empty object for successful operations with no body
- Provides clear error messages when JSON parsing fails
- Added `credentials: "include"` to fetch call for proper cross-origin auth

### 5. Added Credentials to Fetch Calls (`apps/docs/src/services/cloud/azure/functions.ts`)

```typescript
const response = await fetch(url, {
  method: "POST",
  headers,
  body: JSON.stringify(data),
  signal: controller.signal,
  credentials: "include", // <-- ADDED
});
```

- Applied to both `call()` and `callAuthenticated()` methods
- Ensures cookies and authorization headers are properly sent cross-origin

## Infrastructure Configuration

### Azure Functions CORS (Already Configured)

The bicep template (`infra/azure/modules/functions.bicep`) already has proper
CORS configuration:

```bicep
cors: {
  allowedOrigins: [
    'http://localhost:3000'
    'http://localhost:3001'
    'https://*.azurestaticapps.net'
    'https://phoenixrooivalk.com'
    'https://docs.phoenixrooivalk.com'
    'https://www.phoenixrooivalk.com'
  ]
  supportCredentials: true
}
```

✅ No changes needed to infrastructure

## Testing Recommendations

### 1. Local Testing

```bash
# Start docs app
cd apps/docs
npm run start

# Test login flow:
# 1. Click "Sign In" button
# 2. Try Google OAuth login
# 3. Try GitHub OAuth login
# 4. Verify no COOP errors in console
# 5. Verify login completes successfully
# 6. Check that user progress syncs from Cosmos DB
```

### 2. Deployed Environment Testing

After deployment:

1. Test on Azure Static Web Apps preview deployment
2. Verify OAuth popup opens and closes properly
3. Check browser console for CORS errors
4. Test user progress sync after login
5. Verify authenticated API calls work (profile, progress, etc.)

### 3. Cross-Browser Testing

Test on:

- Chrome/Edge (Chromium)
- Firefox
- Safari (if possible)

### 4. Network Tab Verification

Check in browser DevTools:

- OPTIONS preflight requests return 204 with CORS headers
- POST requests include `Access-Control-Allow-Origin` header
- No "blocked by CORS policy" errors
- Authorization headers are sent properly

## Expected Behavior After Fix

### ✅ OAuth Login Should Work

- Clicking "Sign In with Google" opens popup
- User authenticates in popup
- Popup closes automatically after auth
- User is logged in on main page
- No COOP errors in console

### ✅ API Calls Should Succeed

- Cosmos DB proxy endpoints respond with JSON
- Empty responses are handled gracefully
- User progress syncs properly
- No "Unexpected end of JSON input" errors

### ✅ CORS Headers Present

All API responses include:

```
Access-Control-Allow-Origin: https://docs.phoenixrooivalk.com
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept
```

## Deployment Notes

### CI/CD Pipelines

The following workflows deploy the changes:

- `deploy-docs-azure.yml` - Deploys docs site with updated
  `staticwebapp.config.json`
- `deploy-azure-functions.yml` - Deploys Functions with CORS improvements

### Deployment Order

1. Functions deployment (includes CORS updates)
2. Docs deployment (includes COOP policy fix)

### Rollback Plan

If issues occur:

1. Revert to previous commit: `git revert HEAD~3..HEAD`
2. Redeploy Functions and Docs
3. Previous COOP policy will be restored (but will have same issue)

## Security Considerations

### CORS Configuration

- Only whitelisted origins are allowed
- Credentials are required for authenticated requests
- No wildcard `*` for production origins

### COOP Policy

- Removed COOP to allow OAuth popups
- This is safe as we're not loading untrusted cross-origin content
- OAuth providers (Google, GitHub) are trusted

### Authentication

- Bearer tokens still required for authenticated endpoints
- No changes to authentication logic
- CORS does not bypass authentication

## Files Modified

1. `apps/docs/staticwebapp.config.json` - Removed COOP header
2. `apps/docs/azure-functions/src/functions/cosmos-proxy.ts` - Added CORS
   support
3. `apps/docs/azure-functions/src/lib/utils/responses.ts` - Centralized CORS
   helpers
4. `apps/docs/azure-functions/src/lib/utils/index.ts` - Export new utilities
5. `apps/docs/src/services/cloud/azure/database.ts` - Improved JSON parsing +
   credentials
6. `apps/docs/src/services/cloud/azure/functions.ts` - Added credentials to
   fetch

## Monitoring

After deployment, monitor:

- Azure Application Insights for errors
- Browser console for CORS/COOP errors
- User login success rate
- API call success rate

## Related Issues

This fix addresses:

- OAuth popup communication blocked by COOP
- JSON parsing errors on empty responses
- Missing credentials in cross-origin requests
- CORS preflight handling

## Update: Enhanced Error Handling (2024-12-21)

Following the initial CORS fixes, additional improvements were made to provide
better diagnostics for deployment issues:

### Azure Functions Error Handling Improvements

**Problem**: When `/api/cosmos/setDocument` failed with 500 errors, there was
insufficient diagnostic information to identify the root cause.

**Enhancements Made**:

1. **Detailed Logging** - Added structured logging with correlation IDs to track
   operations
2. **Configuration Validation** - Check for `COSMOS_DB_CONNECTION_STRING` before
   attempting database operations
3. **Error Codes** - Structured error responses with codes:
   - `DB_CONFIG_ERROR` - Database not configured
   - `DB_OPERATION_FAILED` - Database operation failed
   - `INVALID_REQUEST` - Missing required parameters
4. **Enhanced Health Check** - Health endpoint now reports configuration issues
5. **Development Mode Details** - Error messages include detailed information
   when `NODE_ENV=development`

**Files Modified**:

- `apps/docs/azure-functions/src/functions/cosmos-proxy.ts` - Enhanced error
  handling
- `apps/docs/azure-functions/src/lib/cosmos.ts` - Better error messages
- `apps/docs/azure-functions/src/functions/health.ts` - Configuration validation
- `apps/docs/azure-functions/TROUBLESHOOTING.md` - Comprehensive troubleshooting
  guide (new)
- `apps/docs/azure-functions/DEPLOYMENT_GUIDE.md` - Deployment procedures (new)

**Testing the Fix**:

```bash
# Check health endpoint to verify configuration
curl https://YOUR-FUNCTION-APP.azurewebsites.net/api/health/ready

# If configuration is missing, response will indicate:
{
  "status": "unhealthy",
  "checks": {
    "cosmos": "error"
  },
  "errors": [
    "Cosmos DB: COSMOS_DB_CONNECTION_STRING not configured"
  ]
}
```

**Deployment Guide**: See `apps/docs/azure-functions/DEPLOYMENT_GUIDE.md` for
complete deployment instructions.

**Troubleshooting Guide**: See `apps/docs/azure-functions/TROUBLESHOOTING.md`
for detailed troubleshooting steps.

## Additional Resources

- [MDN: Cross-Origin-Opener-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Opener-Policy)
- [MDN: CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Azure Static Web Apps: Configuration](https://learn.microsoft.com/en-us/azure/static-web-apps/configuration)
- [Azure Functions: CORS](https://learn.microsoft.com/en-us/azure/azure-functions/functions-how-to-use-azure-function-app-settings#cors)
- [Azure Functions Deployment Guide](apps/docs/azure-functions/DEPLOYMENT_GUIDE.md)
- [Azure Functions Troubleshooting](apps/docs/azure-functions/TROUBLESHOOTING.md)
