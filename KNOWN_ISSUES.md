# ⚠️ Known Issues and Fixes

## Current Active Issues (Updated: 2024-12-21)

### 🔧 Authentication and Database Connection Errors - RESOLVED ✅

**Impact**: Users may experience OAuth login failures and database sync errors.

**Status**: ✅ **Fixes Available** - Diagnostic and resolution tools provided.

**Quick Fix**: See [QUICK_FIX.md](./QUICK_FIX.md) for immediate resolution
steps.

#### Issue 1: Cross-Origin-Opener-Policy (COOP) Blocking OAuth Popups

**Symptoms**:

- OAuth popup (Google/GitHub) closes immediately
- Browser console shows:
  `Cross-Origin-Opener-Policy policy would block the window.closed call`
- Login fails to complete

**Resolution**:

- ✅ COOP header removed from `staticwebapp.config.json`
- Status: Fixed in codebase, may require cache clearing
- See:
  [FIX_GUIDE.md](./FIX_GUIDE.md#fix-1-cross-origin-opener-policy-coop-error)

#### Issue 2: Cosmos DB Connection Failure (500 Internal Server Error)

**Symptoms**:

- Network tab shows: `POST /api/cosmos/setDocument` returns 500 error
- Console shows:
  `Functions proxy error: Internal Server Error - {"error":"Failed to set document","code":"DB_OPERATION_FAILED"}`
- User progress fails to sync after login

**Resolution**:

- Required: Configure `COSMOS_DB_CONNECTION_STRING` in Azure Functions
- Diagnostic tool: `./scripts/diagnose-azure-functions.sh`
- See:
  [FIX_GUIDE.md](./FIX_GUIDE.md#fix-2-cosmos-db-connection-error-500-internal-server-error)

## 🛠️ Resolution Tools

### Diagnostic Script

Comprehensive diagnostic tool for Azure Functions:

```bash
./scripts/diagnose-azure-functions.sh <function-app-name> <resource-group>
```

**Features**:

- Tests health endpoint
- Validates Cosmos DB connection
- Checks CORS configuration
- Provides actionable fix commands

### Pre-Deployment Validator

Validates configuration before deploying:

```bash
./scripts/validate-deployment-config.sh
```

**Features**:

- Checks required secrets and variables
- Verifies staticwebapp.config.json
- Ensures COOP header is absent
- Blocks deployment if config is invalid

## 📚 Documentation

- **Quick Fix Guide**: [QUICK_FIX.md](./QUICK_FIX.md) - One-page resolution
  commands
- **Comprehensive Guide**: [FIX_GUIDE.md](./FIX_GUIDE.md) - Detailed
  step-by-step instructions
- **Troubleshooting**:
  [apps/docs/azure-functions/TROUBLESHOOTING.md](./apps/docs/azure-functions/TROUBLESHOOTING.md) -
  Detailed troubleshooting
- **CORS Fix History**: [CORS_LOGIN_FIX.md](./CORS_LOGIN_FIX.md) - Complete fix
  history and background

## 🔍 Quick Diagnosis

Run this command to check if you're affected:

```bash
# Replace <function-app-name> and <resource-group> with your actual values
./scripts/diagnose-azure-functions.sh <function-app-name> <resource-group>
```

Expected healthy output:

```
✅ Health endpoint returned 200 OK
✅ Cosmos DB: OK
✅ CORS origins configured
✅ CORS credentials enabled
✅ All critical configurations are present
```

If you see errors, follow the fix commands provided by the script.

## ✅ Verification After Fix

1. **Clear browser cache**: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R`
   (Mac)
2. **Test OAuth login**: https://docs.phoenixrooivalk.com
3. **Check health endpoint**:
   ```bash
   curl https://<function-app>.azurewebsites.net/api/health/ready
   ```
4. **Verify no errors** in browser console during login

## 🆘 Getting Help

If issues persist after applying fixes:

1. **Run full diagnostics**:

   ```bash
   ./scripts/diagnose-azure-functions.sh <app> <rg> > diagnostics.txt
   ```

2. **Check Function App logs**:

   ```bash
   az functionapp log tail --name <app> --resource-group <rg>
   ```

3. **Create GitHub issue** with:
   - Diagnostics output
   - Health endpoint response
   - Browser console errors
   - Function App logs

## Previous Issues (Resolved)

### ✅ Initial CORS and COOP Configuration (2024-12-21)

- Fixed restrictive COOP headers blocking OAuth
- Enhanced CORS support in Azure Functions
- Improved error handling in Cosmos DB operations
- Documentation: [CORS_LOGIN_FIX.md](./CORS_LOGIN_FIX.md)

## Issue Reporting

When reporting new issues, please include:

1. **Environment**:
   - Browser and version
   - Operating system
   - Deployment environment (local, staging, production)

2. **Diagnostic output**:

   ```bash
   ./scripts/diagnose-azure-functions.sh <app> <rg> > diagnostics.txt
   ```

3. **Browser console errors**:
   - Open DevTools (F12)
   - Copy all red errors
   - Include network tab for failed requests

4. **Health endpoint response**:

   ```bash
   curl https://<app>.azurewebsites.net/api/health/ready
   ```

5. **Steps to reproduce**:
   - Clear, numbered steps
   - Expected vs actual behavior

## Maintenance Schedule

- **Daily**: Automated health checks via GitHub Actions
- **Weekly**: Dependency updates and security patches
- **Monthly**: Infrastructure audit and optimization
- **Quarterly**: Major version updates and feature releases

## Contributing Fixes

Found a solution to an issue? We welcome contributions!

1. Fork the repository
2. Create a feature branch: `git checkout -b fix/issue-description`
3. Make your changes
4. Test thoroughly
5. Submit a PR with:
   - Description of the issue
   - Your solution
   - Testing performed
   - Documentation updates

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

---

**Last Updated**: 2024-12-21 **Next Review**: 2024-12-28
