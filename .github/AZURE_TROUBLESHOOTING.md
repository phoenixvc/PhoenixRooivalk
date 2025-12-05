# Azure Functions Deployment Troubleshooting Guide

This document covers common issues encountered when deploying Azure Functions
through GitHub Actions and their solutions.

## Issue: "Azure Functions secrets not configured" Despite Secrets Being Set

### Symptoms

The workflow shows the message:

```
Azure Functions secrets not configured - skipping Functions deployment
```

Even though you have configured:

- `AZURE_FUNCTIONAPP_PUBLISH_PROFILE` secret
- `AZURE_FUNCTIONAPP_NAME` variable
- Other required secrets

The `deploy-functions` job is skipped entirely.

### Root Causes

This can happen for several reasons:

#### 1. Empty or Whitespace-Only Secret Value

The `AZURE_FUNCTIONAPP_PUBLISH_PROFILE` secret is set but contains:

- An empty string
- Only whitespace characters
- Incomplete XML content

**How to verify:** Look for the debug output in the workflow logs:

```
🔍 Debugging Azure Functions deployment prerequisites:
  AZURE_FUNCTIONAPP_PUBLISH_PROFILE is set: false  ← Should be true
```

**Solution:** Re-download and re-set the publish profile:

```bash
# Download fresh publish profile from Azure
az functionapp deployment list-publishing-profiles \
  --name phoenix-rooivalk-functions \
  --resource-group rg-phoenix-rooivalk \
  --xml > publish-profile.xml

# Verify the file contains XML content (not empty)
cat publish-profile.xml | head -5

# Set the secret (ensure no extra whitespace)
gh secret set AZURE_FUNCTIONAPP_PUBLISH_PROFILE < publish-profile.xml
```

Or via Azure Portal:

1. Go to your Function App → Overview
2. Click "Get publish profile"
3. Download the `.PublishSettings` file
4. Open in a text editor and copy the ENTIRE contents
5. Go to GitHub repo → Settings → Secrets → Actions
6. Update `AZURE_FUNCTIONAPP_PUBLISH_PROFILE`
7. Paste the XML (ensure no leading/trailing spaces)

#### 2. Variable Set as Secret Instead

The `AZURE_FUNCTIONAPP_NAME` is configured as a **secret** instead of a
**variable**.

**How to verify:** Look for the error message in workflow logs:

```
⚠️ AZURE_FUNCTIONAPP_NAME is set as a SECRET but should be a VARIABLE
```

**Solution:**

1. Go to GitHub repo → Settings → Secrets and variables → Actions
2. Click the **Secrets** tab
3. Delete `AZURE_FUNCTIONAPP_NAME` from secrets
4. Click the **Variables** tab
5. Click "New repository variable"
6. Name: `AZURE_FUNCTIONAPP_NAME`
7. Value: `phoenix-rooivalk-functions` (or your function app name)
8. Click "Add variable"

**Why this matters:** GitHub Actions treats secrets and variables differently.
Variables can be used in conditionals and shown in logs (for debugging), while
secrets are always masked. The workflow needs to check the actual value to
determine if deployment should proceed.

#### 3. Wrong Variable Name (Typo)

Common typos include:

- `vAZURE_AI_DEPLOYMENT_NAME` instead of `AZURE_AI_DEPLOYMENT_NAME`
- `AZURE_FUNCTIONS_APP_NAME` instead of `AZURE_FUNCTIONAPP_NAME`
- Extra spaces in the variable name

**How to verify:** The workflow will detect common typos and show:

```
⚠️ Found vAZURE_AI_DEPLOYMENT_NAME but it should be AZURE_AI_DEPLOYMENT_NAME (remove the 'v' prefix)
```

**Solution:**

1. Go to Settings → Secrets and variables → Actions → Variables
2. Delete the incorrectly named variable
3. Create a new variable with the correct name
4. See [AZURE_SETUP.md](AZURE_SETUP.md) for the complete list of correct names

#### 4. Unusual Deployment Name Value

The `AZURE_AI_DEPLOYMENT_NAME` variable contains an unusual or unexpected value
like `gpt-5.1`.

**How to verify:** Look for the warning:

```
⚠️ AZURE_AI_DEPLOYMENT_NAME value 'gpt-5.1' may be unusual
⚠️ Common Azure OpenAI deployment names start with: gpt-3, gpt-35, gpt-4, text-embedding, dall-e
```

**Solution:**

1. Go to Azure Portal → Azure OpenAI resource → Model deployments
2. Note the exact deployment name (e.g., `gpt-4`, `gpt-35-turbo`, `gpt-4o`,
   `text-embedding-ada-002`)
3. Update the variable with the correct deployment name:
   ```bash
   gh variable set AZURE_AI_DEPLOYMENT_NAME --body "gpt-4"
   ```

**Note:** The deployment name must match EXACTLY what you named it in Azure,
including any suffixes or version numbers. The workflow checks for common
prefixes to catch potential typos or configuration errors.

### Quick Fix Checklist

Run through this checklist to resolve the issue:

- [ ] **Publish Profile Secret**
  - [ ] Secret `AZURE_FUNCTIONAPP_PUBLISH_PROFILE` exists
  - [ ] Secret contains the complete XML from Azure (not empty)
  - [ ] No extra whitespace at beginning/end
  - [ ] XML is valid (opens in browser/editor without errors)

- [ ] **Function App Name**
  - [ ] `AZURE_FUNCTIONAPP_NAME` set as a **Variable** (not Secret)
  - [ ] Variable value matches your Azure Function App name exactly
  - [ ] No typos in the variable name

- [ ] **Other Variables**
  - [ ] `AZURE_AI_DEPLOYMENT_NAME` matches your Azure OpenAI deployment
  - [ ] No variables with typos (like `vAZURE_*`)
  - [ ] No variables set as secrets that should be variables

- [ ] **Verify in Logs**
  - [ ] Check workflow run for debug output showing actual values
  - [ ] Look for red error messages with specific fix instructions
  - [ ] Confirm `has-functions-profile=true` is set in validation step

### Testing Your Fix

After making changes:

1. Trigger a new workflow run:

   ```bash
   gh workflow run deploy-docs-azure.yml
   ```

2. Watch the "Validate Secrets" job output for:

   ```
   ✅ Azure Functions deployment prerequisites met:
     - AZURE_FUNCTIONAPP_PUBLISH_PROFILE: configured
     - AZURE_FUNCTIONAPP_NAME: phoenix-rooivalk-functions
   ```

3. Confirm the "Deploy Azure Functions" job runs (not skipped)

## Issue: 401 Unauthorized Error (Kudu App Settings)

### Symptoms

```
Error: Execution Exception (state: ValidateAzureResource) (step: Invocation)
Error:   When request Azure resource at ValidateAzureResource, Get Function App Settings : Failed to acquire app settings from https://<scmsite>/api/settings with publish-profile
Error:     Failed to fetch Kudu App Settings.
Unauthorized (CODE: 401)
```

### Root Cause

The `Azure/functions-action@v1` attempts to validate Azure resources and fetch
Kudu app settings using the SCM credentials from the publish profile. This
validation step can fail with a 401 Unauthorized error due to:

1. **Expired publish profile**: Publish profiles have expiration dates and need
   to be regenerated periodically
2. **Permission issues**: The SCM credentials may not have sufficient
   permissions to access the Kudu API
3. **Resource validation overhead**: The action performs unnecessary resource
   validation that can timeout or fail

### Solution

Add two parameters to the `Azure/functions-action@v1` configuration to skip
resource validation and ensure proper build handling:

```yaml
- name: Deploy to Azure Functions
  uses: Azure/functions-action@v1
  with:
    app-name: ${{ vars.AZURE_FUNCTIONAPP_NAME }}
    package: ${{ env.AZURE_FUNCTIONAPP_PACKAGE_PATH }}
    publish-profile: ${{ secrets.AZURE_FUNCTIONAPP_PUBLISH_PROFILE }}
    respect-funcignore: true # Skip unnecessary resource validation
    scm-do-build-during-deployment: true # Ensure proper build on SCM side
```

#### Parameter Explanations

- **`respect-funcignore: true`**:
  - Tells the action to respect `.funcignore` files and skip trying to validate
    resources
  - Prevents the action from making unnecessary API calls to fetch app settings
  - Reduces deployment time and avoids authentication issues

- **`scm-do-build-during-deployment: true`**:
  - Ensures that the SCM site (Kudu) performs a build during deployment
  - Handles dependency installation and compilation on the Azure side
  - Recommended for Node.js Azure Functions

### When to Regenerate Publish Profile

If you continue to see 401 errors after adding these parameters, you may need to
regenerate the publish profile:

#### Using Azure Portal

1. Navigate to your Function App in Azure Portal
2. Click **Get publish profile** in the Overview section
3. Download the `.PublishSettings` XML file
4. Update the GitHub secret `AZURE_FUNCTIONAPP_PUBLISH_PROFILE` with the new
   content

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

For more robust authentication, consider switching to service principal
authentication instead of publish profiles:

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

Or use `scm-do-build-during-deployment: true` to let Azure handle dependency
installation.

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
- [Infrastructure Setup](../apps/docs/azure-functions/INFRASTRUCTURE.md) - Azure
  resources setup
- [Azure Functions Action Docs](https://github.com/Azure/functions-action) -
  Official action documentation

## Support

If you continue to experience issues:

1. Check the GitHub Actions workflow run logs for detailed error messages
2. Review the Function App logs in Azure Portal
3. Verify all secrets and variables are correctly configured
4. Ensure Azure resources exist and are accessible
5. Check Azure service health status

## Changelog

- **2024-12-02**: Added fix for 401 Unauthorized error with `respect-funcignore`
  and `scm-do-build-during-deployment` parameters
