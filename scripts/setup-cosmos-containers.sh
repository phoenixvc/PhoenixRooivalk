#!/bin/bash
#
# Phoenix Rooivalk - Cosmos DB Containers Setup Script
#
# This script creates the phoenix-docs database and all required containers
# with appropriate partition keys for the Phoenix Rooivalk application.
#
# Usage: ./setup-cosmos-containers.sh <resource-group> <cosmos-account-name> [database-name]
#
# Examples:
#   ./setup-cosmos-containers.sh dev-euw-rg-rooivalk phoenixrooivalksa
#   ./setup-cosmos-containers.sh dev-euw-rg-rooivalk phoenixrooivalksa my-custom-db
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

# Functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

print_header() {
    echo ""
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}========================================${NC}"
    echo ""
}

# Parse arguments
if [ $# -lt 2 ]; then
    echo "Usage: $0 <resource-group> <cosmos-account-name> [database-name]"
    echo ""
    echo "Examples:"
    echo "  $0 dev-euw-rg-rooivalk phoenixrooivalksa"
    echo "  $0 dev-euw-rg-rooivalk phoenixrooivalksa my-custom-db"
    exit 1
fi

RESOURCE_GROUP="$1"
COSMOS_ACCOUNT_NAME="$2"
DATABASE_NAME="${3:-phoenix-docs}"

# Container definitions with partition keys
# Based on apps/docs/azure-functions/INFRASTRUCTURE.md
declare -a CONTAINERS=(
    "news_articles:/id:News articles storage"
    "user_news_preferences:/userId:User preferences"
    "documents:/id:Document embeddings for RAG"
    "support_tickets:/id:Support tickets"
    "news_subscriptions:/id:Push/email subscriptions"
    "notification_queue:/id:Email/notification queue"
    "embeddings:/id:Vector embeddings cache"
    "configuration:/type:Dynamic configuration"
    "monitoring_logs:/id:Monitoring and metrics"
    "cache:/id:General caching"
)

print_header "Cosmos DB Containers Setup for Phoenix Rooivalk"

log_info "Configuration:"
echo "  Resource Group:    $RESOURCE_GROUP"
echo "  Cosmos Account:    $COSMOS_ACCOUNT_NAME"
echo "  Database Name:     $DATABASE_NAME"
echo "  Containers:        ${#CONTAINERS[@]} containers"
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

# Verify Cosmos DB account exists
log_info "Verifying Cosmos DB account..."
COSMOS_EXISTS=$(az cosmosdb show \
    --name "$COSMOS_ACCOUNT_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "name" \
    --output tsv 2>/dev/null || echo "")

if [ -z "$COSMOS_EXISTS" ]; then
    log_error "Cosmos DB account '$COSMOS_ACCOUNT_NAME' not found in resource group '$RESOURCE_GROUP'"
    log_info "Available Cosmos DB accounts:"
    az cosmosdb list --resource-group "$RESOURCE_GROUP" --output table
    exit 1
fi

log_success "Cosmos DB account verified: $COSMOS_ACCOUNT_NAME"

# Create database
print_header "Creating Database"
log_info "Creating database '$DATABASE_NAME'..."

DB_EXISTS=$(az cosmosdb sql database show \
    --account-name "$COSMOS_ACCOUNT_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --name "$DATABASE_NAME" \
    --query "name" \
    --output tsv 2>/dev/null || echo "")

if [ -z "$DB_EXISTS" ]; then
    az cosmosdb sql database create \
        --account-name "$COSMOS_ACCOUNT_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --name "$DATABASE_NAME" \
        --output none
    
    log_success "Database '$DATABASE_NAME' created successfully"
else
    log_warning "Database '$DATABASE_NAME' already exists"
fi

# Create containers
print_header "Creating Containers"

SUCCESS_COUNT=0
SKIPPED_COUNT=0
FAILED_COUNT=0

for container_def in "${CONTAINERS[@]}"; do
    # Parse container definition: name:partition_key:description
    IFS=':' read -r CONTAINER_NAME PARTITION_KEY DESCRIPTION <<< "$container_def"
    
    echo ""
    echo -e "Creating container: ${YELLOW}${CONTAINER_NAME}${NC} (${DESCRIPTION})"
    echo -e "  Partition key: ${GRAY}${PARTITION_KEY}${NC}"
    
    # Check if container already exists
    CONTAINER_EXISTS=$(az cosmosdb sql container show \
        --account-name "$COSMOS_ACCOUNT_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --database-name "$DATABASE_NAME" \
        --name "$CONTAINER_NAME" \
        --query "name" \
        --output tsv 2>/dev/null || echo "")
    
    if [ -n "$CONTAINER_EXISTS" ]; then
        log_warning "  Container '$CONTAINER_NAME' already exists - skipping"
        ((SKIPPED_COUNT++))
        continue
    fi
    
    # Create container
    if az cosmosdb sql container create \
        --account-name "$COSMOS_ACCOUNT_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --database-name "$DATABASE_NAME" \
        --name "$CONTAINER_NAME" \
        --partition-key-path "$PARTITION_KEY" \
        --output none 2>/dev/null; then
        log_success "  Container '$CONTAINER_NAME' created successfully"
        ((SUCCESS_COUNT++))
    else
        log_error "  Failed to create container '$CONTAINER_NAME'"
        ((FAILED_COUNT++))
    fi
done

# Summary
print_header "Summary"

echo "Database: ${CYAN}${DATABASE_NAME}${NC}"
echo ""
echo "Containers:"
echo -e "  Created:  ${GREEN}${SUCCESS_COUNT}${NC}"
echo -e "  Skipped:  ${YELLOW}${SKIPPED_COUNT}${NC}"
echo -e "  Failed:   ${RED}${FAILED_COUNT}${NC}"
echo ""

if [ $FAILED_COUNT -gt 0 ]; then
    log_error "Some containers failed to create. Check the errors above."
    exit 1
fi

log_success "Cosmos DB setup completed successfully!"

# Next steps
print_header "Next Steps"
log_info "1. Get your connection string:"
echo -e "   ${GRAY}az cosmosdb keys list --name $COSMOS_ACCOUNT_NAME --resource-group $RESOURCE_GROUP --type connection-strings --query 'connectionStrings[0].connectionString' -o tsv${NC}"
echo ""
log_info "2. Add to GitHub secrets as COSMOS_DB_CONNECTION_STRING"
echo ""
log_info "3. Add to local.settings.json for local development"
echo ""
log_info "4. Run scripts/Get-AzureSecrets.ps1 to retrieve all secrets for GitHub Actions"
echo ""
