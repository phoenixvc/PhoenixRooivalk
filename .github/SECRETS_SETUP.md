# GitHub Actions Secrets Setup (DEPRECATED)

> **⚠️ DEPRECATED**: This document describes Netlify deployment secrets.
> The project now deploys exclusively to Azure Static Web Apps.
> See `.github/AZURE_SETUP.md` for current deployment configuration.

---

This document explains how to set up the required secrets for GitHub Actions
workflows to deploy to Netlify.

## Required Secrets

The following secrets need to be configured in your GitHub repository settings:

### For Marketing Site Deployment

- `NETLIFY_AUTH_TOKEN` - Your Netlify personal access token
- `NETLIFY_MARKETING_SITE_ID` - The Netlify site ID for the marketing site

### For Docs Site Deployment

- `NETLIFY_AUTH_TOKEN` - Your Netlify personal access token (same as above)
- `NETLIFY_DOCS_SITE_ID` - The Netlify site ID for the docs site

## How to Set Up Secrets

1. **Get your Netlify Personal Access Token:**
   - Go to
     [Netlify User Settings](https://app.netlify.com/user/applications#personal-access-tokens)
   - Click "New access token"
   - Give it a descriptive name (e.g., "GitHub Actions Deployment")
   - Copy the generated token

2. **Get your Netlify Site IDs:**
   - Go to your Netlify dashboard
   - Select the site you want to deploy
   - Go to Site Settings → General → Site details
   - Copy the "Site ID"

3. **Add secrets to GitHub:**
   - Go to your GitHub repository
   - Navigate to Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Add each secret with the exact name and value

## Workflow Behavior

The workflows have been updated to:

- Check if the required secrets are available before attempting deployment
- Skip deployment with a warning if secrets are not configured
- Continue with build steps even if deployment is skipped

This ensures that:

- The workflows don't fail due to missing secrets
- Developers can still run builds and tests locally
- Deployments only happen when properly configured

## Troubleshooting

If you see warnings about missing secrets:

1. Verify the secret names match exactly (case-sensitive)
2. Ensure the secrets are set at the repository level (not organization level
   unless intended)
3. Check that the Netlify token has the necessary permissions
4. Verify the site IDs are correct for your Netlify sites

## Security Notes

- Never commit secrets to the repository
- Use repository-level secrets for project-specific deployments
- Consider using organization-level secrets for shared resources
- Regularly rotate your Netlify access tokens
