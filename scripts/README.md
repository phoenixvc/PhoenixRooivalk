# Phoenix Rooivalk Scripts

This directory contains utility scripts for setting up and managing the Phoenix Rooivalk infrastructure.

## Azure Infrastructure Scripts

### Setup-CosmosContainers.ps1 / setup-cosmos-containers.sh

Automated scripts to create all required Cosmos DB containers for the Azure Functions application.

**When to use:**

- After creating a new Cosmos DB account
- Setting up a new environment (dev, staging, prod)
- Recovering from accidental container deletion
- Ensuring all containers exist with correct partition keys

**Features:**

- ✅ Creates database and all 10 required containers
- ✅ Uses correct partition keys for each container
- ✅ Skips existing resources (idempotent)
- ✅ Detailed progress output with color coding
- ✅ Error handling and validation
- ✅ Cross-platform (PowerShell and Bash)

**PowerShell Usage:**

```powershell
# Basic usage
.\scripts\Setup-CosmosContainers.ps1 -ResourceGroup "dev-euw-rg-rooivalk" -CosmosAccountName "phoenixrooivalksa"

# Skip database creation if it already exists
.\scripts\Setup-CosmosContainers.ps1 -ResourceGroup "dev-euw-rg-rooivalk" -CosmosAccountName "phoenixrooivalksa" -SkipDatabase

# Custom database name
.\scripts\Setup-CosmosContainers.ps1 -ResourceGroup "dev-euw-rg-rooivalk" -CosmosAccountName "phoenixrooivalksa" -DatabaseName "my-database"
```

**Bash Usage:**

```bash
# Basic usage
./scripts/setup-cosmos-containers.sh dev-euw-rg-rooivalk phoenixrooivalksa

# Custom database name
./scripts/setup-cosmos-containers.sh dev-euw-rg-rooivalk phoenixrooivalksa my-database
```

**Containers Created:**

| Container               | Partition Key | Purpose                     |
| ----------------------- | ------------- | --------------------------- |
| `news_articles`         | `/id`         | News articles storage       |
| `user_news_preferences` | `/userId`     | User preferences            |
| `documents`             | `/id`         | Document embeddings for RAG |
| `support_tickets`       | `/id`         | Support tickets             |
| `news_subscriptions`    | `/id`         | Push/email subscriptions    |
| `notification_queue`    | `/id`         | Email/notification queue    |
| `embeddings`            | `/id`         | Vector embeddings cache     |
| `configuration`         | `/type`       | Dynamic configuration       |
| `monitoring_logs`       | `/id`         | Monitoring and metrics      |
| `cache`                 | `/id`         | General caching             |

### Get-AzureSecrets.ps1

Retrieves all Azure secrets and configuration values needed for GitHub Actions deployment.

**Usage:**

```powershell
.\scripts\Get-AzureSecrets.ps1 -ResourceGroup "dev-euw-rg-rooivalk" -CosmosDbAccountName "phoenixrooivalksa"

# Interactive mode (prompts for missing values)
.\scripts\Get-AzureSecrets.ps1
```

**Outputs:**

- GitHub secrets configuration
- GitHub variables configuration
- Connection strings
- Deployment tokens
- Configuration file: `azure-secrets-output.txt`

### diagnose-azure-functions.sh

**NEW** - Comprehensive diagnostic tool for Azure Functions deployment issues.

Validates Azure Functions configuration and diagnoses common problems like missing connection strings, CORS errors, and health check failures.

**Features:**

- ✅ Tests health endpoint and parses response
- ✅ Validates COSMOS_DB_CONNECTION_STRING is set
- ✅ Checks CORS configuration and credentials support
- ✅ Verifies Azure OpenAI settings
- ✅ Provides actionable fix commands for each issue
- ✅ Color-coded output for easy reading
- ✅ Detailed summary of all configuration issues

**Usage:**

```bash
# Using environment variables
export AZURE_FUNCTIONAPP_NAME="phoenix-rooivalk-functions-cjfde7dng4hsbtfk"
export AZURE_RESOURCE_GROUP="dev-euw-rg-rooivalk"
./scripts/diagnose-azure-functions.sh

# Or provide as arguments
./scripts/diagnose-azure-functions.sh phoenix-rooivalk-functions-cjfde7dng4hsbtfk dev-euw-rg-rooivalk
```

**When to use:**

- Troubleshooting 500 errors from Azure Functions
- Verifying deployment configuration
- Diagnosing CORS issues
- Checking Cosmos DB connectivity
- After infrastructure changes
- Before reporting deployment issues

**Example output:**

```
🔍 Azure Functions Configuration Diagnostic Tool
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔐 Checking Azure authentication...
✅ Authenticated to Azure

🏥 Testing health endpoint...
✅ Health endpoint returned 200 OK

⚙️  Checking application settings...
✅ COSMOS_DB_CONNECTION_STRING is set
✅ COSMOS_DB_DATABASE is set to: phoenix-docs

🌐 Checking CORS configuration...
✅ CORS origins configured:
  - https://docs.phoenixrooivalk.com
  - http://localhost:3000
✅ CORS credentials enabled

📊 Configuration Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ All critical configurations are present
```

### validate-deployment-config.sh

**NEW** - Pre-deployment configuration validator for CI/CD pipelines.

Validates that all required secrets and variables are configured before deploying to Azure.

**Features:**

- ✅ Validates required GitHub secrets (AZURE_CREDENTIALS, COSMOS_DB_CONNECTION_STRING, etc.)
- ✅ Checks optional settings with warnings
- ✅ Verifies staticwebapp.config.json headers
- ✅ Ensures COOP header is absent (OAuth fix)
- ✅ Provides detailed error messages with fix instructions
- ✅ Supports both GitHub Actions and local validation

**Usage in GitHub Actions:**

```yaml
- name: Validate Configuration
  run: ./scripts/validate-deployment-config.sh
  env:
    AZURE_CREDENTIALS: ${{ secrets.AZURE_CREDENTIALS }}
    COSMOS_DB_CONNECTION_STRING: ${{ secrets.COSMOS_DB_CONNECTION_STRING }}
    AZURE_AI_ENDPOINT: ${{ secrets.AZURE_AI_ENDPOINT }}
    AZURE_AI_API_KEY: ${{ secrets.AZURE_AI_API_KEY }}
    AZURE_FUNCTIONAPP_NAME: ${{ vars.AZURE_FUNCTIONAPP_NAME }}
    AZURE_RESOURCE_GROUP: ${{ vars.AZURE_RESOURCE_GROUP }}
```

**Local usage:**

```bash
# Set environment variables
export AZURE_CREDENTIALS='<service-principal-json>'
export COSMOS_DB_CONNECTION_STRING='<connection-string>'
export AZURE_AI_ENDPOINT='<openai-endpoint>'
export AZURE_AI_API_KEY='<openai-key>'
export AZURE_FUNCTIONAPP_NAME='<function-app-name>'
export AZURE_RESOURCE_GROUP='<resource-group>'

# Run validation
./scripts/validate-deployment-config.sh
```

**When to use:**

- Before deploying to production
- In CI/CD pipelines as a gate
- After infrastructure changes
- When troubleshooting deployment failures
- To verify all secrets are configured correctly

**Example output:**

```
🔍 Pre-Deployment Configuration Validator
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Running in GitHub Actions environment

Checking required secrets...
✅ AZURE_CREDENTIALS is set
✅ COSMOS_DB_CONNECTION_STRING is set
✅ Azure OpenAI endpoint is set
✅ Azure OpenAI API key is set

Checking required variables...
✅ AZURE_FUNCTIONAPP_NAME is set
✅ AZURE_RESOURCE_GROUP is set

Checking Static Web App Configuration...
✅ staticwebapp.config.json found
✅ Cross-Origin-Opener-Policy header correctly absent
✅ Cross-Origin-Embedder-Policy correctly set to 'unsafe-none'

Validation Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ All required configuration is present
🚀 Ready to deploy!
```

## Best Practices

### Infrastructure Setup

1. **Use automation scripts** - Reduces human error and ensures consistency
2. **Idempotent operations** - Scripts can be run multiple times safely
3. **Verify before destructive operations** - Scripts check for existing resources
4. **Use descriptive names** - Follow Azure naming conventions
5. **Document custom configurations** - Add comments for non-standard setups

### When to Use Manual vs. Automated Setup

**Use automated scripts when:**

- ✅ Setting up standard infrastructure
- ✅ Creating multiple environments
- ✅ Onboarding new team members
- ✅ Recovering from failures
- ✅ Ensuring consistency across environments

**Use manual commands when:**

- ⚠️ Testing/debugging specific Azure features
- ⚠️ One-off custom configurations
- ⚠️ Learning Azure CLI commands
- ⚠️ Troubleshooting specific issues

### Security Considerations

- 🔒 Never commit secrets to source control
- 🔒 Use Azure Key Vault for sensitive data
- 🔒 Rotate secrets regularly
- 🔒 Use service principals with minimal permissions
- 🔒 Enable Azure AD authentication where possible

## Other Scripts

### Invoke-OutboxWorker.ps1

Worker script for processing outbox messages.

### Invoke-Tests.ps1

Test runner for the project.

### check-docs-links.sh

Validates documentation links.

### deploy.sh

Main deployment script.

### setup-branch-protection.ps1

Configures branch protection rules for GitHub.

### validate-env.sh

Validates environment variables and configuration.

## Contributing

When adding new scripts:

1. Add error handling and validation
2. Support both PowerShell and Bash when possible
3. Use clear, descriptive names
4. Add help documentation (`.SYNOPSIS`, usage examples)
5. Update this README with usage instructions
6. Test on both Windows and Unix-like systems
7. Follow the existing code style and conventions

## Support

For issues or questions:

1. Check `apps/docs/azure-functions/INFRASTRUCTURE.md` for detailed setup instructions
2. Review the Azure Functions documentation
3. Open a GitHub issue with the `infrastructure` label
