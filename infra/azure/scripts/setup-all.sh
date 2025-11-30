#!/bin/bash
#
# Phoenix Rooivalk - Complete Azure Setup Script
#
# This script sets up everything needed for Azure deployment from scratch.
# Run this once to get your Azure infrastructure ready.
#
# Usage: ./setup-all.sh <environment> <location> [azure-openai-endpoint] [azure-openai-api-key]
#
# Examples:
#   ./setup-all.sh dev eastus2
#   ./setup-all.sh prod westeurope https://myopenai.openai.azure.com your-api-key
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
LOCATION="${2:-eastus2}"
AZURE_OPENAI_ENDPOINT="${3:-}"
AZURE_OPENAI_API_KEY="${4:-}"

# Environment short codes for naming
case "$ENVIRONMENT" in
    "dev"|"development") ENV_SHORT="dev" ;;
    "stg"|"staging") ENV_SHORT="stg" ;;
    "prd"|"prod"|"production") ENV_SHORT="prd" ;;
    "preview"|"pr-"*) ENV_SHORT="prv" ;;  # Preview environments for PRs
    *) ENV_SHORT="${ENVIRONMENT:0:3}" ;;
esac

# Location short codes for naming: {env}-{region}-{type}-rooivalk
case "$LOCATION" in
    "eastus") LOCATION_SHORT="eus" ;;
    "eastus2") LOCATION_SHORT="eus2" ;;
    "westus") LOCATION_SHORT="wus" ;;
    "westus2") LOCATION_SHORT="wus2" ;;
    "westeurope") LOCATION_SHORT="weu" ;;
    "northeurope") LOCATION_SHORT="neu" ;;
    "eastasia") LOCATION_SHORT="eas" ;;
    "southeastasia") LOCATION_SHORT="seas" ;;
    "centralus") LOCATION_SHORT="cus" ;;
    "southafricanorth") LOCATION_SHORT="san" ;;
    "uksouth") LOCATION_SHORT="uks" ;;
    "ukwest") LOCATION_SHORT="ukw" ;;
    *) LOCATION_SHORT="${LOCATION:0:4}" ;;
esac

# Resource Group naming: {env}-{region}-rg-rooivalk (same pattern as resources)
RESOURCE_GROUP="${ENV_SHORT}-${LOCATION_SHORT}-rg-rooivalk"

# Resource naming: {env}-{region}-{type}-rooivalk
# Following Azure naming best practices: https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/azure-best-practices/resource-naming
KEY_VAULT_NAME="${ENV_SHORT}-${LOCATION_SHORT}-kv-rooivalk"
STORAGE_NAME="${ENV_SHORT}${LOCATION_SHORT}strooivalk"  # Storage: no hyphens, max 24 chars
APPI_NAME="${ENV_SHORT}-${LOCATION_SHORT}-appi-rooivalk"
COSMOS_NAME="${ENV_SHORT}-${LOCATION_SHORT}-cosmos-rooivalk"
FUNC_NAME="${ENV_SHORT}-${LOCATION_SHORT}-func-rooivalk"
SWA_NAME="${ENV_SHORT}-${LOCATION_SHORT}-swa-rooivalk"
LOG_NAME="${ENV_SHORT}-${LOCATION_SHORT}-log-rooivalk"  # Log Analytics workspace

print_banner

log_info "Configuration:"
echo "  Environment:    $ENVIRONMENT ($ENV_SHORT)"
echo "  Location:       $LOCATION ($LOCATION_SHORT)"
echo "  Resource Group: $RESOURCE_GROUP"
echo ""
echo "  Naming Convention: {env}-{region}-{type}-rooivalk"
echo ""
echo "  Resources:"
echo "    Key Vault:        $KEY_VAULT_NAME"
echo "    Storage:          $STORAGE_NAME"
echo "    App Insights:     $APPI_NAME"
echo "    Cosmos DB:        $COSMOS_NAME"
echo "    Functions:        $FUNC_NAME"
echo "    Static Web App:   $SWA_NAME"
echo ""
echo "  Environments supported:"
echo "    dev/development  → dev-{region}-*-rooivalk"
echo "    stg/staging      → stg-{region}-*-rooivalk"
echo "    prd/prod         → prd-{region}-*-rooivalk"
echo "    preview/pr-*     → prv-{region}-*-rooivalk"
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

# Check if parameters file exists, create default if not
PARAMS_FILE="$INFRA_DIR/parameters.${ENVIRONMENT}.json"
if [ ! -f "$PARAMS_FILE" ]; then
    log_warning "Parameters file not found, using defaults"
    PARAMS_FILE=""
fi

DEPLOY_PARAMS="location=$LOCATION environment=$ENVIRONMENT"
if [ -n "$AZURE_OPENAI_ENDPOINT" ]; then
    DEPLOY_PARAMS="$DEPLOY_PARAMS azureOpenAiEndpoint=$AZURE_OPENAI_ENDPOINT"
fi
if [ -n "$AZURE_OPENAI_API_KEY" ]; then
    DEPLOY_PARAMS="$DEPLOY_PARAMS azureOpenAiApiKey=$AZURE_OPENAI_API_KEY"
fi

if [ -n "$PARAMS_FILE" ]; then
    az deployment group create \
        --name "main" \
        --resource-group "$RESOURCE_GROUP" \
        --template-file "$INFRA_DIR/main.bicep" \
        --parameters "@$PARAMS_FILE" \
        --parameters $DEPLOY_PARAMS \
        --output none
else
    az deployment group create \
        --name "main" \
        --resource-group "$RESOURCE_GROUP" \
        --template-file "$INFRA_DIR/main.bicep" \
        --parameters $DEPLOY_PARAMS \
        --output none
fi

log_success "Infrastructure deployed successfully"

# Step 3: Get deployment outputs
log_info "Step 3/6: Retrieving deployment outputs..."

OUTPUTS=$(az deployment group show \
    --resource-group "$RESOURCE_GROUP" \
    --name "main" \
    --query properties.outputs 2>/dev/null || echo "{}")

# Extract values from outputs or use computed names
COSMOS_ENDPOINT=$(echo "$OUTPUTS" | jq -r '.cosmosDbEndpoint.value // empty')
APP_INSIGHTS_CONNECTION=$(echo "$OUTPUTS" | jq -r '.appInsightsConnectionString.value // empty')
FUNCTIONS_URL=$(echo "$OUTPUTS" | jq -r '.functionsUrl.value // empty')

# Use computed names (they match what Bicep creates)
STATIC_WEB_APP_NAME="$SWA_NAME"
FUNCTIONS_APP_NAME="$FUNC_NAME"

# Fallback for Functions URL
if [ -z "$FUNCTIONS_URL" ]; then
    FUNCTIONS_URL="https://${FUNCTIONS_APP_NAME}.azurewebsites.net"
fi

log_success "Retrieved deployment outputs"

# Step 4: Configure Key Vault secrets
log_info "Step 4/6: Configuring Key Vault secrets..."

if [ -n "$AZURE_OPENAI_API_KEY" ]; then
    az keyvault secret set \
        --vault-name "$KEY_VAULT_NAME" \
        --name "AzureOpenAiApiKey" \
        --value "$AZURE_OPENAI_API_KEY" \
        --output none 2>/dev/null || log_warning "Could not set Key Vault secret (may need permissions)"
    log_success "Azure OpenAI API key stored in Key Vault"
else
    log_warning "No Azure OpenAI API key provided. Add it later with:"
    echo "  az keyvault secret set --vault-name $KEY_VAULT_NAME --name AzureOpenAiApiKey --value 'your-key'"
fi

if [ -n "$AZURE_OPENAI_ENDPOINT" ]; then
    log_info "Azure OpenAI endpoint: $AZURE_OPENAI_ENDPOINT"
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

# Get App Insights connection string if not from outputs
if [ -z "$APP_INSIGHTS_CONNECTION" ]; then
    APP_INSIGHTS_CONNECTION=$(az monitor app-insights component show \
        --app "$APPI_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query connectionString -o tsv 2>/dev/null || echo "")
fi

# Get Cosmos endpoint if not from outputs
if [ -z "$COSMOS_ENDPOINT" ]; then
    COSMOS_ENDPOINT=$(az cosmosdb show \
        --name "$COSMOS_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query documentEndpoint -o tsv 2>/dev/null || echo "")
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
# Region: $LOCATION ($LOCATION_SHORT)

# Cloud Provider Selection
CLOUD_PROVIDER=azure

# Azure Static Web Apps
AZURE_STATIC_WEB_APP_NAME=$STATIC_WEB_APP_NAME

# Azure Functions
AZURE_FUNCTIONS_BASE_URL=$FUNCTIONS_URL
AZURE_FUNCTIONS_APP_NAME=$FUNCTIONS_APP_NAME

# Azure Application Insights
AZURE_APP_INSIGHTS_CONNECTION_STRING=$APP_INSIGHTS_CONNECTION

# Azure Key Vault
AZURE_KEY_VAULT_NAME=$KEY_VAULT_NAME

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

# Azure Functions
gh secret set AZURE_FUNCTIONS_BASE_URL --body "$FUNCTIONS_URL"
gh secret set AZURE_FUNCTIONS_APP_NAME --body "$FUNCTIONS_APP_NAME"

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
echo "  - Cosmos DB:          $COSMOS_NAME"
echo "  - Key Vault:          $KEY_VAULT_NAME"
echo "  - App Insights:       $APPI_NAME"
echo "  - Storage:            $STORAGE_NAME"
echo ""
echo "Next steps:"
echo ""
echo "  1. Configure Azure AD B2C for authentication:"
echo "     ./scripts/setup-b2c.sh phoenixrooivalkb2c"
echo ""
echo "  2. Add GitHub secrets (requires gh CLI):"
echo "     $SECRETS_FILE"
echo ""
echo "  3. Copy environment variables to your .env.local:"
echo "     cat $ENV_FILE"
echo ""
echo "  4. Push to trigger GitHub Actions deployment"
echo ""

# Save deployment info
INFO_FILE="$OUTPUT_DIR/deployment-info.${ENVIRONMENT}.json"
cat > "$INFO_FILE" << EOF
{
  "environment": "$ENVIRONMENT",
  "location": "$LOCATION",
  "locationShort": "$LOCATION_SHORT",
  "resourceGroup": "$RESOURCE_GROUP",
  "naming": "${ENVIRONMENT}-${LOCATION_SHORT}-{type}-rooivalk",
  "resources": {
    "staticWebApp": "$STATIC_WEB_APP_NAME",
    "functionsApp": "$FUNCTIONS_APP_NAME",
    "cosmosDb": "$COSMOS_NAME",
    "keyVault": "$KEY_VAULT_NAME",
    "appInsights": "$APPI_NAME",
    "storage": "$STORAGE_NAME"
  },
  "urls": {
    "functions": "$FUNCTIONS_URL",
    "cosmosEndpoint": "$COSMOS_ENDPOINT"
  },
  "deployedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

log_success "Deployment info saved to: $INFO_FILE"
