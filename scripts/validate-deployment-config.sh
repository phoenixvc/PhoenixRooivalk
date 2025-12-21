#!/bin/bash
# Pre-Deployment Configuration Validation Script
# Validates that all required configuration is present before deploying

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔍 Pre-Deployment Configuration Validator${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

ERRORS=0
WARNINGS=0

# Function to check if a variable is set
check_required_secret() {
  local name="$1"
  local value="$2"
  local description="$3"
  
  if [ -z "$value" ]; then
    echo -e "${RED}❌ ${name} is NOT set${NC}"
    echo -e "   ${description}"
    ((ERRORS++))
    return 1
  else
    echo -e "${GREEN}✅ ${name} is set${NC}"
    return 0
  fi
}

check_optional_setting() {
  local name="$1"
  local value="$2"
  local description="$3"
  
  if [ -z "$value" ]; then
    echo -e "${YELLOW}⚠️  ${name} is not set (optional)${NC}"
    echo -e "   ${description}"
    ((WARNINGS++))
    return 1
  else
    echo -e "${GREEN}✅ ${name} is set${NC}"
    return 0
  fi
}

# Check GitHub Actions environment
if [ -n "$GITHUB_ACTIONS" ]; then
  echo -e "${BLUE}Running in GitHub Actions environment${NC}"
  echo ""
  
  # Required Secrets
  echo -e "${BLUE}Checking required secrets...${NC}"
  check_required_secret "AZURE_CREDENTIALS" "$AZURE_CREDENTIALS" "Azure service principal credentials for authentication"
  check_required_secret "COSMOS_DB_CONNECTION_STRING" "$COSMOS_DB_CONNECTION_STRING" "Cosmos DB connection string for database operations"
  
  # Azure OpenAI (check both naming conventions)
  if [ -n "$AZURE_AI_ENDPOINT" ] || [ -n "$AZURE_OPENAI_ENDPOINT" ]; then
    echo -e "${GREEN}✅ Azure OpenAI endpoint is set${NC}"
  else
    echo -e "${RED}❌ Neither AZURE_AI_ENDPOINT nor AZURE_OPENAI_ENDPOINT is set${NC}"
    echo -e "   Required for AI features"
    ((ERRORS++))
  fi
  
  if [ -n "$AZURE_AI_API_KEY" ] || [ -n "$AZURE_OPENAI_API_KEY" ]; then
    echo -e "${GREEN}✅ Azure OpenAI API key is set${NC}"
  else
    echo -e "${RED}❌ Neither AZURE_AI_API_KEY nor AZURE_OPENAI_API_KEY is set${NC}"
    echo -e "   Required for AI features"
    ((ERRORS++))
  fi
  
  # Required Variables
  echo ""
  echo -e "${BLUE}Checking required variables...${NC}"
  check_required_secret "AZURE_FUNCTIONAPP_NAME" "$AZURE_FUNCTIONAPP_NAME" "Name of the Azure Function App to deploy to"
  check_required_secret "AZURE_RESOURCE_GROUP" "$AZURE_RESOURCE_GROUP" "Azure resource group containing the Function App"
  
  # Optional Settings
  echo ""
  echo -e "${BLUE}Checking optional settings...${NC}"
  check_optional_setting "AZURE_AI_DEPLOYMENT_NAME" "$AZURE_AI_DEPLOYMENT_NAME" "Azure OpenAI chat deployment name (defaults to 'gpt-4')"
  check_optional_setting "APPLICATIONINSIGHTS_CONNECTION_STRING" "$APPLICATIONINSIGHTS_CONNECTION_STRING" "Application Insights for monitoring"
  check_optional_setting "SENDGRID_API_KEY" "$SENDGRID_API_KEY" "SendGrid API key for email notifications"
  
else
  # Local environment validation
  echo -e "${BLUE}Running in local environment${NC}"
  echo ""
  echo -e "${YELLOW}To validate deployment configuration, set environment variables:${NC}"
  echo -e "${YELLOW}  export AZURE_CREDENTIALS='<service-principal-json>'${NC}"
  echo -e "${YELLOW}  export COSMOS_DB_CONNECTION_STRING='<connection-string>'${NC}"
  echo -e "${YELLOW}  export AZURE_AI_ENDPOINT='<openai-endpoint>'${NC}"
  echo -e "${YELLOW}  export AZURE_AI_API_KEY='<openai-key>'${NC}"
  echo -e "${YELLOW}  export AZURE_FUNCTIONAPP_NAME='<function-app-name>'${NC}"
  echo -e "${YELLOW}  export AZURE_RESOURCE_GROUP='<resource-group>'${NC}"
  echo ""
  echo -e "${YELLOW}Then re-run this script.${NC}"
  exit 0
fi

# Check static web app configuration
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Checking Static Web App Configuration...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

STATICWEBAPP_CONFIG="apps/docs/staticwebapp.config.json"

if [ ! -f "$STATICWEBAPP_CONFIG" ]; then
  echo -e "${RED}❌ staticwebapp.config.json not found at ${STATICWEBAPP_CONFIG}${NC}"
  ((ERRORS++))
else
  echo -e "${GREEN}✅ staticwebapp.config.json found${NC}"
  
  # Check if COOP header is present (it should NOT be) - case insensitive
  if grep -qi "Cross-Origin-Opener-Policy" "$STATICWEBAPP_CONFIG"; then
    echo -e "${RED}❌ Cross-Origin-Opener-Policy header found in staticwebapp.config.json${NC}"
    echo -e "   This header blocks OAuth popup communication and should be removed"
    echo -e "   See: CORS_LOGIN_FIX.md for details"
    ((ERRORS++))
  else
    echo -e "${GREEN}✅ Cross-Origin-Opener-Policy header correctly absent${NC}"
  fi
  
  # Check if COEP header is present - use jq for reliable JSON parsing
  if command -v jq &> /dev/null; then
    COEP_VALUE=$(jq -r '.globalHeaders["Cross-Origin-Embedder-Policy"] // empty' "$STATICWEBAPP_CONFIG" 2>/dev/null)
    if [ -n "$COEP_VALUE" ]; then
      if [ "$COEP_VALUE" = "unsafe-none" ]; then
        echo -e "${GREEN}✅ Cross-Origin-Embedder-Policy correctly set to 'unsafe-none'${NC}"
      else
        echo -e "${YELLOW}⚠️  Cross-Origin-Embedder-Policy is set to '${COEP_VALUE}'${NC}"
        echo -e "   Recommended value: 'unsafe-none'"
        ((WARNINGS++))
      fi
    else
      echo -e "${YELLOW}⚠️  Cross-Origin-Embedder-Policy header not found${NC}"
      ((WARNINGS++))
    fi
  else
    # Fallback to grep if jq not available
    if grep -qi "Cross-Origin-Embedder-Policy" "$STATICWEBAPP_CONFIG"; then
      COEP_VALUE=$(grep -i "Cross-Origin-Embedder-Policy" "$STATICWEBAPP_CONFIG" | grep -o '"[^"]*"' | tail -1 | tr -d '"')
      if [ "$COEP_VALUE" = "unsafe-none" ]; then
        echo -e "${GREEN}✅ Cross-Origin-Embedder-Policy correctly set to 'unsafe-none'${NC}"
      else
        echo -e "${YELLOW}⚠️  Cross-Origin-Embedder-Policy is set to '${COEP_VALUE}'${NC}"
        echo -e "   Recommended value: 'unsafe-none'"
        ((WARNINGS++))
      fi
    else
      echo -e "${YELLOW}⚠️  Cross-Origin-Embedder-Policy header not found${NC}"
      ((WARNINGS++))
    fi
  fi
fi

# Summary
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Validation Summary${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}✅ All required configuration is present${NC}"
  if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  ${WARNINGS} optional setting(s) not configured${NC}"
  fi
  echo ""
  echo -e "${GREEN}🚀 Ready to deploy!${NC}"
  exit 0
else
  echo -e "${RED}❌ ${ERRORS} configuration error(s) found${NC}"
  if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  ${WARNINGS} optional setting(s) not configured${NC}"
  fi
  echo ""
  echo -e "${RED}❌ Deployment blocked - fix configuration errors first${NC}"
  echo ""
  echo -e "${YELLOW}For help, see:${NC}"
  echo -e "${YELLOW}  - .github/AZURE_SETUP.md${NC}"
  echo -e "${YELLOW}  - apps/docs/azure-functions/DEPLOYMENT_GUIDE.md${NC}"
  echo -e "${YELLOW}  - apps/docs/azure-functions/TROUBLESHOOTING.md${NC}"
  exit 1
fi
