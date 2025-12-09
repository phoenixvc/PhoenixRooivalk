# GitHub Actions Workflows

This directory contains the CI/CD workflows for the Phoenix Rooivalk project.

## Deployment Environments

### Environment Naming

The Azure Static Web Apps deployment workflows use a two-tier environment naming system:

1. **ENV_NAME** - Internal environment variable used in GitHub Actions:
   - `production` - for pushes to the `main` branch
   - `preview` - for pull requests

2. **SWA_ENV** - Azure Static Web Apps CLI environment parameter:
   - `prod` - for production deployments (mapped from `ENV_NAME=production`)
   - `preview` - for preview deployments (mapped from `ENV_NAME=preview`)

### Why "preview" for Pull Requests?

When you see **"Deploying to environment: preview (ENV_NAME: preview)"** in workflow logs for a pull request, this is **expected and correct behavior**:

- ✅ **Pull Requests** → `ENV_NAME=preview` → `SWA_ENV=preview`
- ✅ **Push to main** → `ENV_NAME=production` → `SWA_ENV=prod`

Azure Static Web Apps automatically creates isolated preview environments for each PR, which are automatically deleted when the PR is closed.

## Deployment Workflows

### Marketing Site (`deploy-marketing-azure.yml`)

Deploys the Next.js marketing website to Azure Static Web Apps.

- **Triggers**: Push to `main`, Pull Requests, Manual workflow dispatch
- **Build Output**: `apps/marketing/out`
- **Deployment Timeout**: 15 minutes

### Documentation Site (`deploy-docs-azure.yml`)

Deploys the Docusaurus documentation site to Azure Static Web Apps.

- **Triggers**: Push to `main`, Pull Requests, Manual workflow dispatch
- **Build Output**: `apps/docs/build`
- **Deployment Timeout**: 15 minutes
- **Additional**: Deploys Azure Functions on main branch pushes

## Deployment Timeout

Both workflows have a **15-minute timeout** on the deployment step to prevent indefinite hanging. If your deployment exceeds this time:

1. Check Azure Portal for deployment status
2. Review workflow logs for errors
3. Consider optimizing build size or investigating network issues

## Troubleshooting

### Deployment Taking Too Long?

The deployment step previously used `--verbose` flag which caused buffering issues and could hang indefinitely. This has been fixed:

- ❌ **Old**: `swa deploy ... --verbose` (could hang for 1+ hours)
- ✅ **New**: `swa deploy ...` without verbose (typical deployment: 2-5 minutes)

### Common Issues

1. **Missing Secrets**: See `.github/AZURE_SETUP.md` for required secrets
2. **Build Failures**: Check `.github/AZURE_TROUBLESHOOTING.md`
3. **Environment Variables**: Review `scripts/validate-env.sh`

## Related Documentation

- [Azure Setup Guide](../AZURE_SETUP.md) - Configure Azure secrets
- [Deployment Sequence](../DEPLOYMENT_SEQUENCE.md) - Infrastructure setup order
- [Workflow Improvements](../WORKFLOW_IMPROVEMENTS.md) - Planned enhancements
- [Azure Troubleshooting](../AZURE_TROUBLESHOOTING.md) - Common issues and solutions
