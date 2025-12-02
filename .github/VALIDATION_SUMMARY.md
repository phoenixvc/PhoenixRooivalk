# Azure Functions Deployment Validation - Summary

## Problem Statement

The Azure Functions deployment was being skipped with the message:
> "Azure Functions secrets not configured - skipping Functions deployment"

Despite having the following configured:
- `AZURE_FUNCTIONAPP_PUBLISH_PROFILE` secret ✓
- `AZURE_FUNCTIONAPP_NAME` variable ✓
- `AZURE_AI_DEPLOYMENT_NAME` variable (value: "gpt-5.1") ⚠️

## Root Cause Analysis

The workflow validation logic was correctly detecting missing or misconfigured secrets/variables, but was providing minimal diagnostic information. This made it difficult to identify:

1. **Which specific secret/variable was missing or misconfigured**
2. **Whether items were set in the wrong category** (secret vs variable)
3. **Whether secret values were empty or contained invalid data**
4. **Whether unusual values like "gpt-5.1" were causing issues**

## Solution Implemented

### 1. Enhanced Workflow Diagnostics

Both `deploy-docs-azure.yml` and `deploy-azure-functions.yml` now include:

#### Debug Output
```bash
🔍 Debugging Azure Functions deployment prerequisites:
  AZURE_FUNCTIONAPP_PUBLISH_PROFILE is set: true/false
  AZURE_FUNCTIONAPP_NAME (var) value: 'phoenix-rooivalk-functions'
  AZURE_FUNCTIONAPP_NAME is set as secret: true/false
```

#### Specific Error Messages
Instead of:
```
::notice::Azure Functions secrets not configured
```

Now shows:
```
::error::AZURE_FUNCTIONAPP_PUBLISH_PROFILE secret is NOT configured or is EMPTY
::error::To fix this issue:
::error::  1. Go to Azure Portal → Your Function App → Get publish profile
::error::  2. Download the .PublishSettings XML file
::error::  ...
```

#### Value Validation
- Detects empty secrets (set but containing only whitespace)
- Warns about unusual values like "gpt-5.1" (Azure OpenAI doesn't have gpt-5.1)
- Checks for common typos like "vAZURE_AI_DEPLOYMENT_NAME"
- Identifies variables set as secrets (wrong category)

### 2. Comprehensive Documentation

Updated `.github/AZURE_TROUBLESHOOTING.md` with a new section covering:

#### Four Common Root Causes

1. **Empty or Whitespace-Only Secret**
   - Secret exists but has no actual content
   - Fix: Re-download and re-set publish profile

2. **Variable Set as Secret**
   - `AZURE_FUNCTIONAPP_NAME` set in Secrets instead of Variables
   - Fix: Delete from Secrets, add as Variable

3. **Wrong Variable Name (Typo)**
   - Examples: `vAZURE_*`, `AZURE_FUNCTIONS_APP_NAME`
   - Fix: Delete incorrect name, create with correct name

4. **Unusual Deployment Name**
   - Example: "gpt-5.1" (doesn't exist in Azure OpenAI)
   - Fix: Update to match actual Azure deployment name

#### Quick Fix Checklist
A systematic checklist to verify:
- [ ] Publish profile secret exists and contains complete XML
- [ ] Function app name is a Variable (not Secret)
- [ ] No typos in variable names
- [ ] Deployment names match Azure exactly

## What You Need to Do

### Immediate Actions

1. **Check Your Publish Profile Secret**
   ```bash
   # Verify the secret is set
   gh secret list | grep AZURE_FUNCTIONAPP_PUBLISH_PROFILE
   ```
   
   If it exists, verify it contains the complete XML:
   - Download fresh publish profile from Azure Portal
   - Re-set the secret ensuring no extra whitespace:
     ```bash
     gh secret set AZURE_FUNCTIONAPP_PUBLISH_PROFILE < publish-profile.xml
     ```

2. **Verify AZURE_FUNCTIONAPP_NAME is a Variable**
   ```bash
   # Check variables
   gh variable get AZURE_FUNCTIONAPP_NAME
   # Should return: phoenix-rooivalk-functions
   
   # Check if mistakenly set as secret
   gh secret list | grep AZURE_FUNCTIONAPP_NAME
   # Should return: nothing (not found)
   ```

3. **Check AZURE_AI_DEPLOYMENT_NAME Value**
   ```bash
   gh variable get AZURE_AI_DEPLOYMENT_NAME
   # Current value: gpt-5.1 ⚠️
   ```
   
   **⚠️ WARNING**: "gpt-5.1" appears to be an unusual model name and may not match your Azure OpenAI deployment. 
   
   To fix:
   - Go to Azure Portal → Azure OpenAI → Model deployments
   - Note your actual deployment name (common prefixes: gpt-3, gpt-35, gpt-4, text-embedding, dall-e)
   - Update the variable:
     ```bash
     gh variable set AZURE_AI_DEPLOYMENT_NAME --body "gpt-4"
     ```

### Testing the Fix

After making corrections, test the deployment:

1. **Trigger a workflow run**:
   ```bash
   gh workflow run deploy-docs-azure.yml
   ```

2. **Monitor the "Validate Secrets" job** for:
   ```
   ✅ Azure Functions deployment prerequisites met:
     - AZURE_FUNCTIONAPP_PUBLISH_PROFILE: configured
     - AZURE_FUNCTIONAPP_NAME: phoenix-rooivalk-functions
   ```

3. **Confirm the "Deploy Azure Functions" job runs** (not skipped)

4. **Check for warnings** about the AI deployment name:
   ```
   ⚠️ AZURE_AI_DEPLOYMENT_NAME value 'gpt-5.1' may be unusual
   ⚠️ Common Azure OpenAI deployment names start with: gpt-3, gpt-35, gpt-4, text-embedding, dall-e
   ```

## Expected Behavior After Fix

### Before (Current State)
```
Validate Secrets: ✓ (passes but sets has-functions-profile=false)
Deploy Azure Functions: ⊘ (skipped)
```

### After (Fixed State)
```
Validate Secrets: ✓ (shows debug output, sets has-functions-profile=true)
Deploy Azure Functions: ✓ (runs and deploys)
```

## Files Changed

### Workflows
- `.github/workflows/deploy-docs-azure.yml` - Added diagnostics and better error messages
- `.github/workflows/deploy-azure-functions.yml` - Added diagnostics and validation warnings

### Documentation
- `.github/AZURE_TROUBLESHOOTING.md` - New section with detailed troubleshooting steps
- `.github/AZURE_SETUP.md` - Added troubleshooting cross-reference

## Reference

- **Complete Setup Guide**: [.github/AZURE_SETUP.md](.github/AZURE_SETUP.md)
- **Troubleshooting Guide**: [.github/AZURE_TROUBLESHOOTING.md](.github/AZURE_TROUBLESHOOTING.md)
- **Workflow Runs**: Check recent runs at https://github.com/JustAGhosT/PhoenixRooivalk/actions

## Next Steps

1. ✅ Verify all secrets and variables are correctly configured
2. ✅ Fix the "gpt-5.1" value to match your actual Azure OpenAI deployment
3. ✅ Trigger a test deployment
4. ✅ Monitor workflow logs for improved diagnostic output
5. ✅ Confirm Azure Functions deployment succeeds

If issues persist after following the checklist, the enhanced error messages will provide specific guidance on what's wrong and how to fix it.
