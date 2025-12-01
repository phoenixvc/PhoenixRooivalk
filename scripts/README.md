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
