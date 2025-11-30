#!/bin/bash
#
# Phoenix Rooivalk - Complete Azure Setup Script
#
# This script sets up everything needed for Azure deployment from scratch.
# Run this once to get your Azure infrastructure ready.
#
# Usage: ./setup-all.sh <environment> <location> [openai-api-key]
#
# Examples:
#   ./setup-all.sh dev eastus
#   ./setup-all.sh prod westeurope sk-xxx
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

print_banner() {
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║           Phoenix Rooivalk - Azure Setup Script               ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Parse arguments
ENVIRONMENT="${1:-dev}"
LOCATION="${2:-eastus}"
OPENAI_API_KEY="${3:-}"

# Derived names
RESOURCE_GROUP="phoenix-rooivalk-${ENVIRONMENT}"
PROJECT_NAME="phoenix-rooivalk"

print_banner

log_info "Configuration:"
echo "  Environment:    $ENVIRONMENT"
echo "  Location:       $LOCATION"
echo "  Resource Group: $RESOURCE_GROUP"
echo ""

# Check prerequisites
log_info "Checking prerequisites..."

if ! command -v az &> /dev/null; then
    log_error "Azure CLI is not installed. Install it from: https://docs.microsoft.com/cli/azure/install-azure-cli"
    exit 1
fi

if ! az account show &> /dev/null; then
    log_error "Not logged in to Azure. Run: az login"
    exit 1
fi

SUBSCRIPTION=$(az account show --query name -o tsv)
log_success "Logged in to Azure subscription: $SUBSCRIPTION"

# Step 1: Create Resource Group
log_info "Step 1/6: Creating resource group..."
az group create \
    --name "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --output none

log_success "Resource group '$RESOURCE_GROUP' created in $LOCATION"

# Step 2: Deploy Infrastructure
log_info "Step 2/6: Deploying Azure infrastructure (this takes 5-10 minutes)..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(dirname "$SCRIPT_DIR")"

az deployment group create \
    --resource-group "$RESOURCE_GROUP" \
    --template-file "$INFRA_DIR/main.bicep" \
    --parameters "$INFRA_DIR/parameters.${ENVIRONMENT}.json" \
    --parameters location="$LOCATION" projectName="$PROJECT_NAME" \
    --output none

log_success "Infrastructure deployed successfully"

# Step 3: Get deployment outputs
log_info "Step 3/6: Retrieving deployment outputs..."

OUTPUTS=$(az deployment group show \
    --resource-group "$RESOURCE_GROUP" \
    --name phoenix-rooivalk \
    --query properties.outputs)

# Extract values
STATIC_WEB_APP_NAME=$(echo "$OUTPUTS" | jq -r '.staticWebAppName.value // empty')
FUNCTIONS_APP_NAME=$(echo "$OUTPUTS" | jq -r '.functionsAppName.value // empty')
COSMOS_ENDPOINT=$(echo "$OUTPUTS" | jq -r '.cosmosEndpoint.value // empty')
APP_INSIGHTS_CONNECTION=$(echo "$OUTPUTS" | jq -r '.appInsightsConnectionString.value // empty')
KEY_VAULT_NAME=$(echo "$OUTPUTS" | jq -r '.keyVaultName.value // empty')

# Fallback to naming convention if outputs not available
STATIC_WEB_APP_NAME="${STATIC_WEB_APP_NAME:-swa-${PROJECT_NAME}-${ENVIRONMENT}}"
FUNCTIONS_APP_NAME="${FUNCTIONS_APP_NAME:-func-${PROJECT_NAME}-${ENVIRONMENT}}"
KEY_VAULT_NAME="${KEY_VAULT_NAME:-kv-phoenixrooivalk-${ENVIRONMENT}}"

log_success "Retrieved deployment outputs"

# Step 4: Configure Key Vault secrets
log_info "Step 4/6: Configuring Key Vault secrets..."

if [ -n "$OPENAI_API_KEY" ]; then
    az keyvault secret set \
        --vault-name "$KEY_VAULT_NAME" \
        --name "OpenAIApiKey" \
        --value "$OPENAI_API_KEY" \
        --output none
    log_success "OpenAI API key stored in Key Vault"
else
    log_warning "No OpenAI API key provided. Add it later with:"
    echo "  az keyvault secret set --vault-name $KEY_VAULT_NAME --name OpenAIApiKey --value 'your-key'"
fi

# Step 5: Get Static Web Apps deployment token
log_info "Step 5/6: Getting Static Web Apps deployment token..."

SWA_TOKEN=$(az staticwebapp secrets list \
    --name "$STATIC_WEB_APP_NAME" \
    --query "properties.apiKey" -o tsv 2>/dev/null || echo "")

if [ -z "$SWA_TOKEN" ]; then
    log_warning "Could not retrieve SWA token. The Static Web App may still be provisioning."
    log_warning "Run this command later to get the token:"
    echo "  az staticwebapp secrets list --name $STATIC_WEB_APP_NAME --query 'properties.apiKey' -o tsv"
fi

# Step 6: Generate configuration
log_info "Step 6/6: Generating configuration files..."

FUNCTIONS_URL="https://${FUNCTIONS_APP_NAME}.azurewebsites.net"

# Get App Insights connection string if not from outputs
if [ -z "$APP_INSIGHTS_CONNECTION" ]; then
    APP_INSIGHTS_CONNECTION=$(az monitor app-insights component show \
        --app "appi-${PROJECT_NAME}-${ENVIRONMENT}" \
        --resource-group "$RESOURCE_GROUP" \
        --query connectionString -o tsv 2>/dev/null || echo "")
fi

# Create output directory
OUTPUT_DIR="$INFRA_DIR/output"
mkdir -p "$OUTPUT_DIR"

# Generate .env file
ENV_FILE="$OUTPUT_DIR/.env.${ENVIRONMENT}"
cat > "$ENV_FILE" << EOF
# Phoenix Rooivalk - Azure Configuration
# Generated on $(date)
# Environment: $ENVIRONMENT

# Cloud Provider Selection
CLOUD_PROVIDER=azure

# Azure Static Web Apps
AZURE_STATIC_WEB_APP_NAME=$STATIC_WEB_APP_NAME

# Azure Functions
AZURE_FUNCTIONS_BASE_URL=$FUNCTIONS_URL

# Azure Application Insights
AZURE_APP_INSIGHTS_CONNECTION_STRING=$APP_INSIGHTS_CONNECTION

# Azure AD B2C (configure after running setup-b2c.sh)
AZURE_AD_B2C_TENANT_ID=
AZURE_AD_B2C_CLIENT_ID=
AZURE_AD_B2C_AUTHORITY=

# Azure Cosmos DB (server-side only, used by Functions)
AZURE_COSMOS_ENDPOINT=$COSMOS_ENDPOINT
EOF

log_success "Environment file created: $ENV_FILE"

# Generate GitHub secrets commands
SECRETS_FILE="$OUTPUT_DIR/github-secrets.${ENVIRONMENT}.sh"
cat > "$SECRETS_FILE" << EOF
#!/bin/bash
# GitHub Secrets Setup Commands
# Run these commands to configure GitHub repository secrets
# Requires: gh CLI (https://cli.github.com/)

# Static Web Apps Deployment Token
gh secret set AZURE_STATIC_WEB_APPS_API_TOKEN --body "$SWA_TOKEN"

# Cloud Provider
gh secret set CLOUD_PROVIDER --body "azure"

# Azure Functions URL
gh secret set AZURE_FUNCTIONS_BASE_URL --body "$FUNCTIONS_URL"

# Azure Application Insights
gh secret set AZURE_APP_INSIGHTS_CONNECTION_STRING --body "$APP_INSIGHTS_CONNECTION"

# Azure AD B2C (update these after B2C setup)
# gh secret set AZURE_AD_B2C_TENANT_ID --body "your-tenant.onmicrosoft.com"
# gh secret set AZURE_AD_B2C_CLIENT_ID --body "your-client-id"
# gh secret set AZURE_AD_B2C_AUTHORITY --body "https://your-tenant.b2clogin.com/..."

echo "GitHub secrets configured!"
EOF

chmod +x "$SECRETS_FILE"
log_success "GitHub secrets script created: $SECRETS_FILE"

# Print summary
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    Setup Complete!                             ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Resources created:"
echo "  - Resource Group:     $RESOURCE_GROUP"
echo "  - Static Web App:     $STATIC_WEB_APP_NAME"
echo "  - Azure Functions:    $FUNCTIONS_APP_NAME"
echo "  - Key Vault:          $KEY_VAULT_NAME"
echo ""
echo "Next steps:"
echo ""
echo "  1. Configure Azure AD B2C for authentication:"
echo "     ./scripts/setup-b2c.sh phoenixrooivalkb2c"
echo ""
echo "  2. Add GitHub secrets (requires gh CLI):"
echo "     $SECRETS_FILE"
echo ""
echo "  3. Deploy Azure Functions:"
echo "     ./scripts/deploy-functions.sh $ENVIRONMENT $RESOURCE_GROUP"
echo ""
echo "  4. Copy environment variables to your .env.local:"
echo "     cat $ENV_FILE"
echo ""
echo "  5. Push to trigger GitHub Actions deployment"
echo ""

# Save deployment info
INFO_FILE="$OUTPUT_DIR/deployment-info.${ENVIRONMENT}.json"
cat > "$INFO_FILE" << EOF
{
  "environment": "$ENVIRONMENT",
  "location": "$LOCATION",
  "resourceGroup": "$RESOURCE_GROUP",
  "staticWebApp": "$STATIC_WEB_APP_NAME",
  "functionsApp": "$FUNCTIONS_APP_NAME",
  "keyVault": "$KEY_VAULT_NAME",
  "functionsUrl": "$FUNCTIONS_URL",
  "cosmosEndpoint": "$COSMOS_ENDPOINT",
  "deployedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

log_success "Deployment info saved to: $INFO_FILE"
