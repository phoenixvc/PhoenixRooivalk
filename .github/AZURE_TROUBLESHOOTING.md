# Azure Functions Deployment Troubleshooting Guide

This document covers common issues encountered when deploying Azure Functions through GitHub Actions and their solutions.

## Issue: 401 Unauthorized Error (Kudu App Settings)

### Symptoms

```
Error: Execution Exception (state: ValidateAzureResource) (step: Invocation)
Error:   When request Azure resource at ValidateAzureResource, Get Function App Settings : Failed to acquire app settings from https://<scmsite>/api/settings with publish-profile
Error:     Failed to fetch Kudu App Settings.
Unauthorized (CODE: 401)
```

### Root Cause

The `Azure/functions-action@v1` attempts to validate Azure resources and fetch Kudu app settings using the SCM credentials from the publish profile. This validation step can fail with a 401 Unauthorized error due to:

1. **Expired publish profile**: Publish profiles have expiration dates and need to be regenerated periodically
2. **Permission issues**: The SCM credentials may not have sufficient permissions to access the Kudu API
3. **Resource validation overhead**: The action performs unnecessary resource validation that can timeout or fail

### Solution

Add two parameters to the `Azure/functions-action@v1` configuration to skip resource validation and ensure proper build handling:

```yaml
- name: Deploy to Azure Functions
  uses: Azure/functions-action@v1
  with:
    app-name: ${{ vars.AZURE_FUNCTIONAPP_NAME }}
    package: ${{ env.AZURE_FUNCTIONAPP_PACKAGE_PATH }}
    publish-profile: ${{ secrets.AZURE_FUNCTIONAPP_PUBLISH_PROFILE }}
    respect-funcignore: true              # Skip unnecessary resource validation
    scm-do-build-during-deployment: true  # Ensure proper build on SCM side
```

#### Parameter Explanations

- **`respect-funcignore: true`**: 
  - Tells the action to respect `.funcignore` files and skip trying to validate resources
  - Prevents the action from making unnecessary API calls to fetch app settings
  - Reduces deployment time and avoids authentication issues

- **`scm-do-build-during-deployment: true`**:
  - Ensures that the SCM site (Kudu) performs a build during deployment
  - Handles dependency installation and compilation on the Azure side
  - Recommended for Node.js Azure Functions

### When to Regenerate Publish Profile

If you continue to see 401 errors after adding these parameters, you may need to regenerate the publish profile:

#### Using Azure Portal

1. Navigate to your Function App in Azure Portal
2. Click **Get publish profile** in the Overview section
3. Download the `.PublishSettings` XML file
4. Update the GitHub secret `AZURE_FUNCTIONAPP_PUBLISH_PROFILE` with the new content

#### Using Azure CLI

```bash
# Download the publish profile
az functionapp deployment list-publishing-profiles \
  --name func-phoenix-rooivalk \
  --resource-group rg-phoenix-rooivalk \
  --xml > publish-profile.xml

# Update GitHub secret
gh secret set AZURE_FUNCTIONAPP_PUBLISH_PROFILE --body "$(cat publish-profile.xml)"
```

### Alternative: Use Service Principal Authentication

For more robust authentication, consider switching to service principal authentication instead of publish profiles:

```yaml
- name: Login to Azure
  uses: azure/login@v2
  with:
    creds: ${{ secrets.AZURE_CREDENTIALS }}

- name: Deploy to Azure Functions
  uses: Azure/functions-action@v1
  with:
    app-name: ${{ vars.AZURE_FUNCTIONAPP_NAME }}
    package: ${{ env.AZURE_FUNCTIONAPP_PACKAGE_PATH }}
```

To create a service principal:

```bash
az ad sp create-for-rbac \
  --name "github-actions-phoenix" \
  --role contributor \
  --scopes /subscriptions/{subscription-id}/resourceGroups/rg-phoenix-rooivalk \
  --sdk-auth
```

Save the JSON output as `AZURE_CREDENTIALS` GitHub secret.

## Issue: Missing Dependencies in Deployment

### Symptoms

Functions fail to start after deployment with module import errors.

### Solution

Ensure you're installing production dependencies before deployment:

```yaml
- name: Install production dependencies
  working-directory: ${{ env.AZURE_FUNCTIONAPP_PACKAGE_PATH }}
  run: pnpm install --prod --no-frozen-lockfile
```

Or use `scm-do-build-during-deployment: true` to let Azure handle dependency installation.

## Issue: Timeout During Deployment

### Symptoms

Deployment times out after 30 minutes.

### Solution

1. Reduce package size by excluding unnecessary files:
   - Create a `.funcignore` file
   - Add `node_modules`, `.git`, `tests`, etc.

2. Use incremental deployment:
   - Only deploy changed files
   - Enable `respect-funcignore: true`

3. Split large deployments:
   - Deploy infrastructure separately
   - Use deployment slots for staged rollouts

## Issue: Environment Variables Not Set

### Symptoms

Functions can't connect to Cosmos DB or Azure OpenAI.

### Solution

1. Check that required secrets are configured in GitHub:
   ```bash
   gh secret list | grep AZURE
   ```

2. Verify app settings are deployed:
   ```yaml
   - name: Set Environment Variables
     if: vars.CONFIGURE_APP_SETTINGS == 'true'
     uses: azure/appservice-settings@v1
     with:
       app-name: ${{ vars.AZURE_FUNCTIONAPP_NAME }}
       app-settings-json: |
         [
           { "name": "COSMOS_DB_CONNECTION_STRING", "value": "${{ secrets.COSMOS_DB_CONNECTION_STRING }}" }
         ]
   ```

3. Check app settings in Azure Portal:
   - Navigate to Function App → Configuration
   - Verify all required environment variables are present

## Related Documentation

- [Azure Setup Guide](.github/AZURE_SETUP.md) - Complete Azure configuration
- [Infrastructure Setup](../apps/docs/azure-functions/INFRASTRUCTURE.md) - Azure resources setup
- [Azure Functions Action Docs](https://github.com/Azure/functions-action) - Official action documentation

## Support

If you continue to experience issues:

1. Check the GitHub Actions workflow run logs for detailed error messages
2. Review the Function App logs in Azure Portal
3. Verify all secrets and variables are correctly configured
4. Ensure Azure resources exist and are accessible
5. Check Azure service health status

## Changelog

- **2024-12-02**: Added fix for 401 Unauthorized error with `respect-funcignore` and `scm-do-build-during-deployment` parameters
