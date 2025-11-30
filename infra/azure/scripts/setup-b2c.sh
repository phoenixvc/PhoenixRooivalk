#!/bin/bash
#
# Phoenix Rooivalk - Azure AD B2C Setup Script
#
# This script helps set up Azure AD B2C for authentication.
#
# Note: Some B2C configuration requires the Azure Portal or MS Graph API.
# This script creates the tenant and provides guidance for manual steps.
#
# Prerequisites:
# - Azure CLI installed and logged in
# - Subscription with permissions to create AD B2C tenant
#

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TENANT_NAME="${1:-phoenixrooivalkb2c}"
LOCATION="${2:-United States}"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         Phoenix Rooivalk - Azure AD B2C Setup              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Tenant Name:${NC}  ${TENANT_NAME}.onmicrosoft.com"
echo -e "${YELLOW}Location:${NC}     $LOCATION"
echo ""

# Check if B2C tenant already exists
check_tenant() {
    echo -e "${BLUE}Checking for existing B2C tenant...${NC}"

    if az ad signed-in-user show &> /dev/null; then
        CURRENT_TENANT=$(az account show --query "tenantId" -o tsv)
        echo -e "${YELLOW}Current tenant ID:${NC} $CURRENT_TENANT"
    fi
}

# Provide manual setup instructions
print_setup_instructions() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}Azure AD B2C Setup Instructions${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${YELLOW}Step 1: Create B2C Tenant${NC}"
    echo "1. Go to: https://portal.azure.com/#create/Microsoft.AzureActiveDirectoryB2C"
    echo "2. Select 'Create a new Azure AD B2C Tenant'"
    echo "3. Enter:"
    echo "   - Organization name: Phoenix Rooivalk"
    echo "   - Initial domain name: ${TENANT_NAME}"
    echo "   - Country/Region: ${LOCATION}"
    echo "4. Click 'Review + create'"
    echo ""
    echo -e "${YELLOW}Step 2: Register Application${NC}"
    echo "1. Switch to your B2C tenant in the portal"
    echo "2. Go to: Azure AD B2C > App registrations > New registration"
    echo "3. Enter:"
    echo "   - Name: Phoenix Rooivalk Docs"
    echo "   - Supported account types: Accounts in any identity provider..."
    echo "   - Redirect URI: Select 'Single-page application (SPA)'"
    echo "4. Save the Application (client) ID"
    echo ""
    echo -e "${BLUE}Redirect URIs to add (SPA platform):${NC}"
    echo "   http://localhost:3000"
    echo "   http://localhost:3000/login"
    echo "   http://localhost:3000/callback"
    echo "   https://<your-app>.azurestaticapps.net"
    echo "   https://<your-app>.azurestaticapps.net/login"
    echo "   https://<your-app>.azurestaticapps.net/callback"
    echo "   https://docs.phoenixrooivalk.com (if using custom domain)"
    echo "   https://docs.phoenixrooivalk.com/login"
    echo "   https://docs.phoenixrooivalk.com/callback"
    echo ""
    echo -e "${YELLOW}Important: Under Authentication > Implicit grant and hybrid flows:${NC}"
    echo "   ☑ Access tokens (for calling APIs)"
    echo "   ☑ ID tokens (for sign-in)"
    echo ""
    echo -e "${YELLOW}Step 3: Configure Identity Providers${NC}"
    echo ""
    echo -e "${BLUE}Google:${NC}"
    echo "1. Go to: Azure AD B2C > Identity providers > Google"
    echo "2. Create OAuth app at: https://console.cloud.google.com/apis/credentials"
    echo "3. Authorized redirect URI: https://${TENANT_NAME}.b2clogin.com/${TENANT_NAME}.onmicrosoft.com/oauth2/authresp"
    echo "4. Enter Client ID and Secret in Azure"
    echo ""
    echo -e "${BLUE}GitHub:${NC}"
    echo "1. Go to: Azure AD B2C > Identity providers > GitHub"
    echo "2. Create OAuth app at: https://github.com/settings/developers"
    echo "3. Authorization callback URL: https://${TENANT_NAME}.b2clogin.com/${TENANT_NAME}.onmicrosoft.com/oauth2/authresp"
    echo "4. Enter Client ID and Secret in Azure"
    echo ""
    echo -e "${YELLOW}Step 4: Create User Flow${NC}"
    echo "1. Go to: Azure AD B2C > User flows > New user flow"
    echo "2. Select 'Sign up and sign in'"
    echo "3. Version: Recommended"
    echo "4. Name: B2C_1_SignUpSignIn"
    echo "5. Identity providers: Select Google, GitHub, Email"
    echo "6. User attributes: Email, Display Name"
    echo "7. Application claims: Same as above"
    echo ""
    echo -e "${YELLOW}Step 5: Update Your App Configuration${NC}"
    echo ""
    echo "Add to your .env file or Docusaurus config:"
    echo ""
    echo "AZURE_AD_B2C_TENANT_ID=${TENANT_NAME}.onmicrosoft.com"
    echo "AZURE_AD_B2C_CLIENT_ID=<your-app-client-id>"
    echo "AZURE_AD_B2C_AUTHORITY=https://${TENANT_NAME}.b2clogin.com/${TENANT_NAME}.onmicrosoft.com/B2C_1_SignUpSignIn"
    echo ""
}

# Create a sample user flow policy template
create_policy_template() {
    echo -e "${BLUE}Creating custom policy templates...${NC}"

    POLICY_DIR="$(dirname "$0")/../b2c-policies"
    mkdir -p "$POLICY_DIR"

    cat > "$POLICY_DIR/README.md" << 'EOF'
# Azure AD B2C Custom Policies

This directory contains custom policy templates for Azure AD B2C.

## Files

- `TrustFrameworkBase.xml` - Base policy (download from Azure samples)
- `TrustFrameworkExtensions.xml` - Extensions with identity providers
- `SignUpOrSignIn.xml` - Sign-up/sign-in user journey

## Setup

1. Download starter pack from:
   https://github.com/Azure-Samples/active-directory-b2c-custom-policy-starterpack

2. Replace placeholder values:
   - `yourtenant` with your B2C tenant name
   - Identity provider client IDs and secrets

3. Upload to Azure AD B2C > Identity Experience Framework > Upload custom policy

## User Flows vs Custom Policies

- **User Flows**: Simpler, recommended for most cases
- **Custom Policies**: For advanced scenarios like custom claims, API calls

For Phoenix Rooivalk, User Flows should be sufficient.
EOF

    echo -e "${GREEN}✓ Policy template directory created: $POLICY_DIR${NC}"
}

main() {
    check_tenant
    print_setup_instructions
    create_policy_template

    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                   Setup guide complete!                    ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
}

main
