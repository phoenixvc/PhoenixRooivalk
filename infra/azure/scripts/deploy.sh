#!/bin/bash
#
# Phoenix Rooivalk - Azure Deployment Script
#
# This script deploys all Azure infrastructure using Bicep templates.
#
# Prerequisites:
# - Azure CLI installed and logged in (az login)
# - Bicep CLI installed (az bicep install)
#
# Usage:
#   ./deploy.sh [environment] [resource-group] [location]
#
# Examples:
#   ./deploy.sh dev phoenix-rooivalk-dev eastus
#   ./deploy.sh prod phoenix-rooivalk-prod westeurope
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="${1:-dev}"
RESOURCE_GROUP="${2:-phoenix-rooivalk-${ENVIRONMENT}}"
LOCATION="${3:-eastus}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Phoenix Rooivalk - Azure Infrastructure Deployment     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Environment:${NC}    $ENVIRONMENT"
echo -e "${YELLOW}Resource Group:${NC} $RESOURCE_GROUP"
echo -e "${YELLOW}Location:${NC}       $LOCATION"
echo ""

# Check prerequisites
check_prerequisites() {
    echo -e "${BLUE}Checking prerequisites...${NC}"

    if ! command -v az &> /dev/null; then
        echo -e "${RED}Error: Azure CLI is not installed.${NC}"
        echo "Install it from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
        exit 1
    fi

    # Check if logged in
    if ! az account show &> /dev/null; then
        echo -e "${RED}Error: Not logged in to Azure CLI.${NC}"
        echo "Run 'az login' to authenticate."
        exit 1
    fi

    # Check Bicep
    if ! az bicep version &> /dev/null; then
        echo -e "${YELLOW}Installing Bicep CLI...${NC}"
        az bicep install
    fi

    echo -e "${GREEN}✓ Prerequisites check passed${NC}"
}

# Create resource group if it doesn't exist
create_resource_group() {
    echo -e "${BLUE}Creating resource group '$RESOURCE_GROUP' in '$LOCATION'...${NC}"

    if az group show --name "$RESOURCE_GROUP" &> /dev/null; then
        echo -e "${YELLOW}Resource group already exists.${NC}"
    else
        az group create \
            --name "$RESOURCE_GROUP" \
            --location "$LOCATION" \
            --tags project=phoenixrooivalk environment="$ENVIRONMENT" managedBy=bicep
        echo -e "${GREEN}✓ Resource group created${NC}"
    fi
}

# Deploy Bicep template
deploy_infrastructure() {
    echo -e "${BLUE}Deploying infrastructure...${NC}"

    PARAMS_FILE="$INFRA_DIR/parameters.${ENVIRONMENT}.json"

    if [ ! -f "$PARAMS_FILE" ]; then
        echo -e "${YELLOW}Parameters file not found: $PARAMS_FILE${NC}"
        echo -e "${YELLOW}Using parameters.dev.json as fallback${NC}"
        PARAMS_FILE="$INFRA_DIR/parameters.dev.json"
    fi

    # Prompt for Azure OpenAI configuration if not set
    if [ -z "$AZURE_OPENAI_ENDPOINT" ]; then
        echo -e "${YELLOW}Azure OpenAI endpoint not set.${NC}"
        read -p "Enter Azure OpenAI endpoint (or press Enter to skip): " AZURE_OPENAI_ENDPOINT
    fi

    if [ -z "$AZURE_OPENAI_API_KEY" ]; then
        echo -e "${YELLOW}Azure OpenAI API key not set.${NC}"
        read -sp "Enter Azure OpenAI API key (or press Enter to skip): " AZURE_OPENAI_API_KEY
        echo ""
    fi

    # Deploy
    echo -e "${BLUE}Starting deployment (this may take 5-10 minutes)...${NC}"

    DEPLOYMENT_OUTPUT=$(az deployment group create \
        --name "phoenix-deploy-$(date +%Y%m%d%H%M%S)" \
        --resource-group "$RESOURCE_GROUP" \
        --template-file "$INFRA_DIR/main.bicep" \
        --parameters "@$PARAMS_FILE" \
        --parameters azureOpenAiApiKey="$AZURE_OPENAI_API_KEY" \
        --parameters azureOpenAiEndpoint="$AZURE_OPENAI_ENDPOINT" \
        --output json)

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Infrastructure deployment completed${NC}"

        # Extract outputs
        echo ""
        echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
        echo -e "${GREEN}Deployment Outputs:${NC}"
        echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

        STATIC_WEB_APP_URL=$(echo "$DEPLOYMENT_OUTPUT" | jq -r '.properties.outputs.staticWebAppUrl.value')
        FUNCTIONS_URL=$(echo "$DEPLOYMENT_OUTPUT" | jq -r '.properties.outputs.functionsUrl.value')
        APP_INSIGHTS_CONN=$(echo "$DEPLOYMENT_OUTPUT" | jq -r '.properties.outputs.appInsightsConnectionString.value')
        COSMOS_ENDPOINT=$(echo "$DEPLOYMENT_OUTPUT" | jq -r '.properties.outputs.cosmosDbEndpoint.value')
        KEY_VAULT_URI=$(echo "$DEPLOYMENT_OUTPUT" | jq -r '.properties.outputs.keyVaultUri.value')

        echo -e "${YELLOW}Static Web App URL:${NC}  $STATIC_WEB_APP_URL"
        echo -e "${YELLOW}Functions URL:${NC}       $FUNCTIONS_URL"
        echo -e "${YELLOW}Cosmos DB Endpoint:${NC}  $COSMOS_ENDPOINT"
        echo -e "${YELLOW}Key Vault URI:${NC}       $KEY_VAULT_URI"

        # Save outputs to file
        echo "$DEPLOYMENT_OUTPUT" | jq '.properties.outputs' > "$INFRA_DIR/outputs.${ENVIRONMENT}.json"
        echo ""
        echo -e "${GREEN}Outputs saved to: $INFRA_DIR/outputs.${ENVIRONMENT}.json${NC}"

        # Generate client config
        generate_client_config
    else
        echo -e "${RED}✗ Deployment failed${NC}"
        exit 1
    fi
}

# Generate client configuration for the docs app
generate_client_config() {
    echo ""
    echo -e "${BLUE}Generating client configuration...${NC}"

    CONFIG_FILE="$INFRA_DIR/../../apps/docs/.env.azure.${ENVIRONMENT}"

    cat > "$CONFIG_FILE" << EOF
# Azure Configuration - Generated by deploy.sh
# Environment: $ENVIRONMENT
# Generated: $(date -Iseconds)

# Cloud Provider
CLOUD_PROVIDER=azure

# Azure Functions
AZURE_FUNCTIONS_BASE_URL=$FUNCTIONS_URL

# Azure Application Insights
AZURE_APP_INSIGHTS_CONNECTION_STRING=$APP_INSIGHTS_CONN

# Azure Cosmos DB (for server-side use only - don't expose key to client)
AZURE_COSMOS_ENDPOINT=$COSMOS_ENDPOINT

# Azure AD B2C (fill in after B2C tenant setup)
AZURE_AD_B2C_TENANT_ID=
AZURE_AD_B2C_CLIENT_ID=
AZURE_AD_B2C_AUTHORITY=

# Key Vault (for Functions to fetch secrets)
AZURE_KEY_VAULT_URI=$KEY_VAULT_URI
EOF

    echo -e "${GREEN}✓ Client config saved to: $CONFIG_FILE${NC}"
}

# Get Static Web App deployment token
get_deployment_token() {
    echo ""
    echo -e "${BLUE}Fetching Static Web App deployment token...${NC}"

    SWA_NAME="phoenixrooivalk-${ENVIRONMENT}-swa"

    DEPLOYMENT_TOKEN=$(az staticwebapp secrets list \
        --name "$SWA_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query "properties.apiKey" \
        --output tsv 2>/dev/null)

    if [ -n "$DEPLOYMENT_TOKEN" ]; then
        echo ""
        echo -e "${YELLOW}Add this secret to your GitHub repository:${NC}"
        echo -e "${BLUE}Name:${NC}  AZURE_STATIC_WEB_APPS_API_TOKEN_${ENVIRONMENT^^}"
        echo -e "${BLUE}Value:${NC} $DEPLOYMENT_TOKEN"
        echo ""
        echo -e "${YELLOW}Or run:${NC}"
        echo "gh secret set AZURE_STATIC_WEB_APPS_API_TOKEN_${ENVIRONMENT^^} --body \"$DEPLOYMENT_TOKEN\""
    fi
}

# Main execution
main() {
    check_prerequisites
    create_resource_group
    deploy_infrastructure
    get_deployment_token

    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║              Deployment completed successfully!            ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Set up Azure AD B2C tenant for authentication"
    echo "2. Deploy Azure Functions code"
    echo "3. Update GitHub Actions with deployment token"
    echo "4. Configure custom domain (optional)"
    echo ""
}

main
