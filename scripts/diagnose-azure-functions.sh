#!/bin/bash
# Azure Functions Configuration Diagnostic Script
# This script validates Azure Functions configuration and diagnoses common issues

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FUNCTION_APP_NAME="${AZURE_FUNCTIONAPP_NAME:-}"
RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-}"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔍 Azure Functions Configuration Diagnostic Tool${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if required parameters are provided
if [ -z "$FUNCTION_APP_NAME" ]; then
  echo -e "${YELLOW}Usage: AZURE_FUNCTIONAPP_NAME=<name> AZURE_RESOURCE_GROUP=<group> ./scripts/diagnose-azure-functions.sh${NC}"
  echo ""
  echo -e "${YELLOW}Alternatively, provide as arguments:${NC}"
  echo -e "${YELLOW}  ./scripts/diagnose-azure-functions.sh <function-app-name> <resource-group>${NC}"
  echo ""
  
  if [ -n "$1" ]; then
    FUNCTION_APP_NAME="$1"
    RESOURCE_GROUP="${2:-dev-euw-rg-rooivalk}"
    echo -e "${GREEN}Using provided arguments:${NC}"
    echo -e "  Function App: ${FUNCTION_APP_NAME}"
    echo -e "  Resource Group: ${RESOURCE_GROUP}"
    echo ""
  else
    echo -e "${RED}❌ Error: AZURE_FUNCTIONAPP_NAME not provided${NC}"
    exit 1
  fi
fi

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
  echo -e "${RED}❌ Azure CLI not found. Please install: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli${NC}"
  exit 1
fi

# Check if logged in to Azure
echo -e "${BLUE}🔐 Checking Azure authentication...${NC}"
if ! az account show &> /dev/null; then
  echo -e "${RED}❌ Not logged in to Azure. Run: az login${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Authenticated to Azure${NC}"
echo ""

# Get current subscription
SUBSCRIPTION=$(az account show --query name -o tsv)
echo -e "${BLUE}📋 Current Subscription: ${YELLOW}${SUBSCRIPTION}${NC}"
echo ""

# Check if Function App exists
echo -e "${BLUE}🔍 Checking if Function App exists...${NC}"
if ! az functionapp show --name "$FUNCTION_APP_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
  echo -e "${RED}❌ Function App '${FUNCTION_APP_NAME}' not found in resource group '${RESOURCE_GROUP}'${NC}"
  echo ""
  echo -e "${YELLOW}Available Function Apps in subscription:${NC}"
  az functionapp list --query "[].{name:name, resourceGroup:resourceGroup}" -o table
  exit 1
fi
echo -e "${GREEN}✅ Function App found${NC}"
echo ""

# Get Function App URL
FUNCTION_URL=$(az functionapp show --name "$FUNCTION_APP_NAME" --resource-group "$RESOURCE_GROUP" --query "defaultHostName" -o tsv)
echo -e "${BLUE}🌐 Function App URL: ${YELLOW}https://${FUNCTION_URL}${NC}"
echo ""

# Test health endpoint
echo -e "${BLUE}🏥 Testing health endpoint...${NC}"
HEALTH_URL="https://${FUNCTION_URL}/api/health/ready"
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$HEALTH_URL" || echo -e "\n000")
HEALTH_STATUS=$(echo "$HEALTH_RESPONSE" | tail -1)
HEALTH_BODY=$(echo "$HEALTH_RESPONSE" | sed '$d')

if [ "$HEALTH_STATUS" = "200" ]; then
  echo -e "${GREEN}✅ Health endpoint returned 200 OK${NC}"
  echo ""
  echo -e "${BLUE}Health Response:${NC}"
  echo "$HEALTH_BODY" | jq . 2>/dev/null || echo "$HEALTH_BODY"
  echo ""
  
  # Parse health check results
  COSMOS_STATUS=$(echo "$HEALTH_BODY" | jq -r '.checks.cosmos // "unknown"' 2>/dev/null)
  OPENAI_STATUS=$(echo "$HEALTH_BODY" | jq -r '.checks.openai // "unknown"' 2>/dev/null)
  
  if [ "$COSMOS_STATUS" = "error" ]; then
    echo -e "${RED}❌ Cosmos DB: Error${NC}"
  elif [ "$COSMOS_STATUS" = "ok" ]; then
    echo -e "${GREEN}✅ Cosmos DB: OK${NC}"
  fi
  
  if [ "$OPENAI_STATUS" = "error" ] || [ "$OPENAI_STATUS" = "not-configured" ]; then
    echo -e "${YELLOW}⚠️  OpenAI: ${OPENAI_STATUS}${NC}"
  elif [ "$OPENAI_STATUS" = "ok" ]; then
    echo -e "${GREEN}✅ OpenAI: OK${NC}"
  fi
  echo ""
else
  echo -e "${RED}❌ Health endpoint failed: HTTP ${HEALTH_STATUS}${NC}"
  echo ""
  echo -e "${YELLOW}Response:${NC}"
  echo "$HEALTH_BODY"
  echo ""
fi

# Check application settings
echo -e "${BLUE}⚙️  Checking application settings...${NC}"
echo ""

# Check COSMOS_DB_CONNECTION_STRING
echo -e "${BLUE}Checking COSMOS_DB_CONNECTION_STRING...${NC}"
COSMOS_SETTING=$(az functionapp config appsettings list \
  --name "$FUNCTION_APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query "[?name=='COSMOS_DB_CONNECTION_STRING'].name" -o tsv 2>/dev/null || echo "")

if [ -z "$COSMOS_SETTING" ]; then
  echo -e "${RED}❌ COSMOS_DB_CONNECTION_STRING is NOT set${NC}"
  echo ""
  echo -e "${YELLOW}To fix, run:${NC}"
  echo -e "${YELLOW}  COSMOS_CONNECTION=\$(az cosmosdb keys list --name <cosmos-account> --resource-group <rg> --type connection-strings --query 'connectionStrings[0].connectionString' -o tsv)${NC}"
  echo -e "${YELLOW}  az functionapp config appsettings set --name $FUNCTION_APP_NAME --resource-group $RESOURCE_GROUP --settings \"COSMOS_DB_CONNECTION_STRING=\$COSMOS_CONNECTION\"${NC}"
  echo ""
else
  echo -e "${GREEN}✅ COSMOS_DB_CONNECTION_STRING is set${NC}"
  # Don't print the actual value for security
fi

# Check COSMOS_DB_DATABASE
echo -e "${BLUE}Checking COSMOS_DB_DATABASE...${NC}"
COSMOS_DB=$(az functionapp config appsettings list \
  --name "$FUNCTION_APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query "[?name=='COSMOS_DB_DATABASE'].value" -o tsv 2>/dev/null || echo "")

if [ -z "$COSMOS_DB" ]; then
  echo -e "${YELLOW}⚠️  COSMOS_DB_DATABASE not set (will use default 'phoenix-docs')${NC}"
else
  echo -e "${GREEN}✅ COSMOS_DB_DATABASE is set to: ${COSMOS_DB}${NC}"
fi
echo ""

# Check Azure OpenAI settings
echo -e "${BLUE}Checking Azure OpenAI settings...${NC}"
OPENAI_ENDPOINT=$(az functionapp config appsettings list \
  --name "$FUNCTION_APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query "[?name=='AZURE_OPENAI_ENDPOINT'].value" -o tsv 2>/dev/null || echo "")

if [ -z "$OPENAI_ENDPOINT" ]; then
  echo -e "${YELLOW}⚠️  AZURE_OPENAI_ENDPOINT not set${NC}"
else
  echo -e "${GREEN}✅ AZURE_OPENAI_ENDPOINT is set${NC}"
fi

OPENAI_KEY=$(az functionapp config appsettings list \
  --name "$FUNCTION_APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query "[?name=='AZURE_OPENAI_API_KEY'].name" -o tsv 2>/dev/null || echo "")

if [ -z "$OPENAI_KEY" ]; then
  echo -e "${YELLOW}⚠️  AZURE_OPENAI_API_KEY not set${NC}"
else
  echo -e "${GREEN}✅ AZURE_OPENAI_API_KEY is set${NC}"
fi
echo ""

# Check CORS configuration
echo -e "${BLUE}🌐 Checking CORS configuration...${NC}"
CORS_ORIGINS=$(az functionapp cors show \
  --name "$FUNCTION_APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query "allowedOrigins" -o tsv 2>/dev/null || echo "")

if [ -z "$CORS_ORIGINS" ]; then
  echo -e "${RED}❌ No CORS origins configured${NC}"
  echo ""
  echo -e "${YELLOW}To fix, run:${NC}"
  echo -e "${YELLOW}  az functionapp cors add --name $FUNCTION_APP_NAME --resource-group $RESOURCE_GROUP --allowed-origins \"https://docs.phoenixrooivalk.com\" \"https://phoenixrooivalk.com\" \"http://localhost:3000\"${NC}"
  echo ""
else
  echo -e "${GREEN}✅ CORS origins configured:${NC}"
  echo "$CORS_ORIGINS" | while read -r origin; do
    echo -e "  - ${origin}"
  done
  echo ""
fi

# Check if credentials are supported
CORS_CREDENTIALS=$(az functionapp show \
  --name "$FUNCTION_APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query "siteConfig.cors.supportCredentials" -o tsv 2>/dev/null || echo "false")

if [ "$CORS_CREDENTIALS" = "true" ]; then
  echo -e "${GREEN}✅ CORS credentials enabled${NC}"
else
  echo -e "${YELLOW}⚠️  CORS credentials not enabled${NC}"
  echo ""
  echo -e "${YELLOW}To fix, run:${NC}"
  echo -e "${YELLOW}  az functionapp cors credentials --name $FUNCTION_APP_NAME --resource-group $RESOURCE_GROUP --enable true${NC}"
  echo ""
fi

# Test Cosmos DB connectivity (if connection string is available)
if [ -n "$COSMOS_SETTING" ]; then
  echo -e "${BLUE}🧪 Testing Cosmos DB connectivity...${NC}"
  TEST_URL="https://${FUNCTION_URL}/api/health/ready"
  TEST_RESPONSE=$(curl -s "$TEST_URL" 2>/dev/null || echo "{}")
  
  COSMOS_CHECK=$(echo "$TEST_RESPONSE" | jq -r '.checks.cosmos // "unknown"' 2>/dev/null)
  
  if [ "$COSMOS_CHECK" = "ok" ]; then
    echo -e "${GREEN}✅ Cosmos DB connection successful${NC}"
  elif [ "$COSMOS_CHECK" = "error" ]; then
    echo -e "${RED}❌ Cosmos DB connection failed${NC}"
    ERROR_MSG=$(echo "$TEST_RESPONSE" | jq -r '.errors[]? // "No error details"' 2>/dev/null)
    echo -e "${RED}Error: ${ERROR_MSG}${NC}"
  else
    echo -e "${YELLOW}⚠️  Unable to determine Cosmos DB status${NC}"
  fi
  echo ""
fi

# Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📊 Configuration Summary${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Create summary
ISSUES_FOUND=0

if [ "$HEALTH_STATUS" != "200" ]; then
  echo -e "${RED}❌ Health endpoint is not responding (HTTP ${HEALTH_STATUS})${NC}"
  ((ISSUES_FOUND++))
fi

if [ -z "$COSMOS_SETTING" ]; then
  echo -e "${RED}❌ COSMOS_DB_CONNECTION_STRING is not configured${NC}"
  ((ISSUES_FOUND++))
fi

if [ -z "$CORS_ORIGINS" ]; then
  echo -e "${RED}❌ CORS origins are not configured${NC}"
  ((ISSUES_FOUND++))
fi

if [ "$CORS_CREDENTIALS" != "true" ]; then
  echo -e "${YELLOW}⚠️  CORS credentials are not enabled${NC}"
  ((ISSUES_FOUND++))
fi

if [ $ISSUES_FOUND -eq 0 ]; then
  echo -e "${GREEN}✅ All critical configurations are present${NC}"
  echo ""
  echo -e "${GREEN}Your Azure Functions deployment appears to be correctly configured!${NC}"
else
  echo ""
  echo -e "${YELLOW}Found ${ISSUES_FOUND} configuration issue(s) that need attention.${NC}"
  echo ""
  echo -e "${YELLOW}📖 For detailed troubleshooting, see:${NC}"
  echo -e "${YELLOW}  - apps/docs/azure-functions/TROUBLESHOOTING.md${NC}"
  echo -e "${YELLOW}  - apps/docs/azure-functions/DEPLOYMENT_GUIDE.md${NC}"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
