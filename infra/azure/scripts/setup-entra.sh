#!/bin/bash
#
# Phoenix Rooivalk - Azure Entra ID Setup Script
#
# This script helps set up Azure Entra ID (formerly Azure AD) for authentication.
# It can create app registrations, configure redirect URIs, and set up API permissions.
#
# Usage:
#   ./setup-entra.sh                    # Interactive setup
#   ./setup-entra.sh --check            # Check existing configuration
#   ./setup-entra.sh --create           # Create new app registration
#   ./setup-entra.sh --app-id <id>      # Configure existing app
#
# Prerequisites:
# - Azure CLI installed and logged in
# - Permissions to create app registrations in your tenant
#

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Default values
APP_NAME="Phoenix Rooivalk"
REDIRECT_URIS_DEV=(
    "http://localhost:3000"
    "http://localhost:3000/callback"
)
REDIRECT_URIS_PROD=()
SCOPES="openid profile email User.Read"

# Parse arguments
ACTION=""
APP_ID=""
while [[ $# -gt 0 ]]; do
    case $1 in
        --check) ACTION="check"; shift ;;
        --create) ACTION="create"; shift ;;
        --app-id) APP_ID="$2"; ACTION="configure"; shift 2 ;;
        --prod-url) REDIRECT_URIS_PROD+=("$2" "$2/callback"); shift 2 ;;
        --help|-h) ACTION="help"; shift ;;
        *) shift ;;
    esac
done

print_banner() {
    echo ""
    echo -e "${BLUE}+==============================================================+${NC}"
    echo -e "${BLUE}|         Phoenix Rooivalk - Azure Entra ID Setup              |${NC}"
    echo -e "${BLUE}+==============================================================+${NC}"
    echo ""
}

print_help() {
    echo "Usage: ./setup-entra.sh [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --check              Check for existing app registration"
    echo "  --create             Create new app registration"
    echo "  --app-id <id>        Configure existing app registration"
    echo "  --prod-url <url>     Add production redirect URL (can be used multiple times)"
    echo "  --help, -h           Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./setup-entra.sh --check"
    echo "  ./setup-entra.sh --create"
    echo "  ./setup-entra.sh --create --prod-url https://myapp.azurestaticapps.net"
    echo "  ./setup-entra.sh --app-id d9934146-e585-467b-8932-8cec14b332fd"
    echo ""
}

check_prerequisites() {
    echo -e "${BLUE}Checking prerequisites...${NC}"

    if ! command -v az &> /dev/null; then
        echo -e "${RED}Error: Azure CLI is not installed.${NC}"
        echo "Install from: https://docs.microsoft.com/cli/azure/install-azure-cli"
        exit 1
    fi

    if ! az account show &> /dev/null; then
        echo -e "${RED}Error: Not logged in to Azure.${NC}"
        echo "Run: az login"
        exit 1
    fi

    TENANT_ID=$(az account show --query "tenantId" -o tsv)
    TENANT_NAME=$(az account show --query "tenantDisplayName" -o tsv 2>/dev/null || echo "Unknown")
    SUBSCRIPTION=$(az account show --query "name" -o tsv)

    echo -e "${GREEN}Logged in successfully${NC}"
    echo ""
    echo -e "  Tenant:       ${CYAN}$TENANT_NAME${NC}"
    echo -e "  Tenant ID:    ${CYAN}$TENANT_ID${NC}"
    echo -e "  Subscription: ${CYAN}$SUBSCRIPTION${NC}"
    echo ""
}

check_existing_app() {
    echo -e "${BLUE}Checking for existing app registration...${NC}"
    echo ""

    EXISTING_APPS=$(az ad app list --display-name "$APP_NAME" --query "[].{appId:appId,displayName:displayName,createdDateTime:createdDateTime}" -o json 2>/dev/null || echo "[]")
    APP_COUNT=$(echo "$EXISTING_APPS" | jq length)

    if [ "$APP_COUNT" -gt 0 ]; then
        echo -e "${GREEN}Found $APP_COUNT existing app registration(s):${NC}"
        echo ""
        echo "$EXISTING_APPS" | jq -r '.[] | "  App ID: \(.appId)\n  Name:   \(.displayName)\n  Created: \(.createdDateTime)\n"'

        # Get the first app's ID
        FOUND_APP_ID=$(echo "$EXISTING_APPS" | jq -r '.[0].appId')

        echo -e "${YELLOW}To configure this app, run:${NC}"
        echo "  ./setup-entra.sh --app-id $FOUND_APP_ID"
        echo ""
        return 0
    else
        echo -e "${YELLOW}No existing app registration found with name '$APP_NAME'${NC}"
        echo ""
        echo "To create one, run:"
        echo "  ./setup-entra.sh --create"
        echo ""
        return 1
    fi
}

get_app_details() {
    local app_id="$1"

    echo -e "${BLUE}Fetching app registration details...${NC}"
    echo ""

    APP_DETAILS=$(az ad app show --id "$app_id" 2>/dev/null || echo "")

    if [ -z "$APP_DETAILS" ]; then
        echo -e "${RED}Error: App registration not found with ID: $app_id${NC}"
        exit 1
    fi

    DISPLAY_NAME=$(echo "$APP_DETAILS" | jq -r '.displayName')
    TENANT_ID=$(az account show --query "tenantId" -o tsv)
    REDIRECT_URIS=$(echo "$APP_DETAILS" | jq -r '.spa.redirectUris // [] | .[]' 2>/dev/null || echo "")

    echo -e "${GREEN}App Registration Found:${NC}"
    echo ""
    echo -e "  Display Name: ${CYAN}$DISPLAY_NAME${NC}"
    echo -e "  Client ID:    ${CYAN}$app_id${NC}"
    echo -e "  Tenant ID:    ${CYAN}$TENANT_ID${NC}"
    echo ""

    if [ -n "$REDIRECT_URIS" ]; then
        echo -e "  ${BLUE}Configured Redirect URIs:${NC}"
        echo "$REDIRECT_URIS" | while read -r uri; do
            echo "    - $uri"
        done
        echo ""
    else
        echo -e "  ${YELLOW}No redirect URIs configured${NC}"
        echo ""
    fi
}

create_app_registration() {
    echo -e "${BLUE}Creating new app registration...${NC}"
    echo ""

    # Check if app already exists
    EXISTING=$(az ad app list --display-name "$APP_NAME" --query "[0].appId" -o tsv 2>/dev/null || echo "")
    if [ -n "$EXISTING" ]; then
        echo -e "${YELLOW}App registration '$APP_NAME' already exists with ID: $EXISTING${NC}"
        echo ""
        read -p "Do you want to configure the existing app? (y/N) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            APP_ID="$EXISTING"
            configure_app_registration
            return
        else
            echo "Exiting. To create a new app with a different name, modify this script."
            exit 0
        fi
    fi

    # Build redirect URIs array
    ALL_URIS=("${REDIRECT_URIS_DEV[@]}" "${REDIRECT_URIS_PROD[@]}")
    URIS_JSON=$(printf '%s\n' "${ALL_URIS[@]}" | jq -R . | jq -s .)

    # Create the app registration
    echo "Creating app registration with name: $APP_NAME"

    APP_ID=$(az ad app create \
        --display-name "$APP_NAME" \
        --sign-in-audience AzureADMyOrg \
        --query appId -o tsv)

    if [ -z "$APP_ID" ]; then
        echo -e "${RED}Failed to create app registration${NC}"
        exit 1
    fi

    echo -e "${GREEN}App registration created!${NC}"
    echo ""
    echo -e "  Client ID: ${CYAN}$APP_ID${NC}"
    echo ""

    # Configure the app
    configure_app_registration
}

configure_app_registration() {
    if [ -z "$APP_ID" ]; then
        echo -e "${RED}Error: No app ID specified${NC}"
        exit 1
    fi

    TENANT_ID=$(az account show --query "tenantId" -o tsv)

    echo -e "${BLUE}Configuring app registration...${NC}"
    echo ""

    # Build redirect URIs
    ALL_URIS=("${REDIRECT_URIS_DEV[@]}" "${REDIRECT_URIS_PROD[@]}")

    # Add redirect URIs as SPA platform
    echo "Adding redirect URIs..."
    for uri in "${ALL_URIS[@]}"; do
        az ad app update --id "$APP_ID" --add spa.redirectUris "$uri" 2>/dev/null || true
        echo "  Added: $uri"
    done
    echo ""

    # Get Microsoft Graph API resource ID
    echo "Configuring API permissions..."
    GRAPH_API_ID="00000003-0000-0000-c000-000000000000"

    # Permission IDs for Microsoft Graph delegated permissions
    # openid: 37f7f235-527c-4136-accd-4a02d197296e
    # profile: 14dad69e-099b-42c9-810b-d002981feec1
    # email: 64a6cdd6-aab1-4aaf-94b8-3cc8405e90d0
    # User.Read: e1fe6dd8-ba31-4d61-89e7-88639da4683d

    # Add delegated permissions
    az ad app permission add \
        --id "$APP_ID" \
        --api "$GRAPH_API_ID" \
        --api-permissions "37f7f235-527c-4136-accd-4a02d197296e=Scope" 2>/dev/null || true  # openid
    az ad app permission add \
        --id "$APP_ID" \
        --api "$GRAPH_API_ID" \
        --api-permissions "14dad69e-099b-42c9-810b-d002981feec1=Scope" 2>/dev/null || true  # profile
    az ad app permission add \
        --id "$APP_ID" \
        --api "$GRAPH_API_ID" \
        --api-permissions "64a6cdd6-aab1-4aaf-94b8-3cc8405e90d0=Scope" 2>/dev/null || true  # email
    az ad app permission add \
        --id "$APP_ID" \
        --api "$GRAPH_API_ID" \
        --api-permissions "e1fe6dd8-ba31-4d61-89e7-88639da4683d=Scope" 2>/dev/null || true  # User.Read

    echo -e "${GREEN}API permissions added: openid, profile, email, User.Read${NC}"
    echo ""

    # Print configuration summary
    print_configuration_summary
}

print_configuration_summary() {
    TENANT_ID=$(az account show --query "tenantId" -o tsv)
    AUTHORITY="https://login.microsoftonline.com/$TENANT_ID"

    echo ""
    echo -e "${GREEN}+==============================================================+${NC}"
    echo -e "${GREEN}|                Configuration Complete!                        |${NC}"
    echo -e "${GREEN}+==============================================================+${NC}"
    echo ""
    echo -e "${BLUE}Environment Variables:${NC}"
    echo ""
    echo "# Add these to your .env.local or GitHub secrets:"
    echo ""
    echo "CLOUD_PROVIDER=azure"
    echo "AZURE_ENTRA_CLIENT_ID=$APP_ID"
    echo "AZURE_ENTRA_TENANT_ID=$TENANT_ID"
    echo "AZURE_ENTRA_AUTHORITY=$AUTHORITY"
    echo "AZURE_ENTRA_REDIRECT_URI=http://localhost:3000/callback"
    echo "AZURE_ENTRA_POST_LOGOUT_REDIRECT_URI=http://localhost:3000"
    echo "AZURE_ENTRA_SCOPES=$SCOPES"
    echo ""
    echo -e "${BLUE}GitHub Secrets Commands:${NC}"
    echo ""
    echo "gh secret set CLOUD_PROVIDER --body \"azure\""
    echo "gh secret set AZURE_ENTRA_CLIENT_ID --body \"$APP_ID\""
    echo "gh secret set AZURE_ENTRA_TENANT_ID --body \"$TENANT_ID\""
    echo "gh secret set AZURE_ENTRA_AUTHORITY --body \"$AUTHORITY\""
    echo "gh secret set AZURE_ENTRA_SCOPES --body \"$SCOPES\""
    echo ""
    echo -e "${YELLOW}Manual Steps Required:${NC}"
    echo ""
    echo "1. Go to Azure Portal -> Microsoft Entra ID -> App registrations"
    echo "2. Select '$APP_NAME'"
    echo "3. Go to 'Certificates & secrets' -> 'New client secret'"
    echo "4. Copy the secret value and add to GitHub:"
    echo "   gh secret set AZURE_ENTRA_CLIENT_SECRET --body \"<your-secret>\""
    echo ""
    echo "5. Go to 'API permissions' -> 'Grant admin consent for [Your Org]'"
    echo ""
    echo "6. (Optional) Go to 'Token configuration' -> 'Add optional claim'"
    echo "   Add: email, family_name, given_name, upn"
    echo ""
    echo "7. Add production redirect URIs when deploying:"
    echo "   - https://<your-app>.azurestaticapps.net"
    echo "   - https://<your-app>.azurestaticapps.net/callback"
    echo ""
    echo -e "${BLUE}Quick Links:${NC}"
    echo ""
    echo "  App Registration: https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId/$APP_ID"
    echo "  Authentication:   https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Authentication/appId/$APP_ID"
    echo "  API Permissions:  https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/CallAnAPI/appId/$APP_ID"
    echo ""
}

print_manual_instructions() {
    echo ""
    echo -e "${BLUE}+==============================================================+${NC}"
    echo -e "${BLUE}|           Manual Azure Entra ID Setup Instructions            |${NC}"
    echo -e "${BLUE}+==============================================================+${NC}"
    echo ""
    echo -e "${YELLOW}Step 1: Create App Registration${NC}"
    echo ""
    echo "1. Go to: https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade"
    echo "2. Click 'New registration'"
    echo "3. Enter:"
    echo "   - Name: Phoenix Rooivalk"
    echo "   - Supported account types: Single tenant"
    echo "   - Redirect URI: Single-page application (SPA)"
    echo "   - URI: http://localhost:3000/callback"
    echo "4. Click 'Register'"
    echo ""
    echo -e "${YELLOW}Step 2: Configure Authentication${NC}"
    echo ""
    echo "1. Go to 'Authentication' in your app"
    echo "2. Under 'Single-page application', add redirect URIs:"
    echo "   - http://localhost:3000"
    echo "   - http://localhost:3000/callback"
    echo "   - https://<your-app>.azurestaticapps.net"
    echo "   - https://<your-app>.azurestaticapps.net/callback"
    echo ""
    echo "3. Scroll down and set:"
    echo "   - Allow public client flows: No"
    echo ""
    echo -e "${YELLOW}Step 3: Configure API Permissions${NC}"
    echo ""
    echo "1. Go to 'API permissions'"
    echo "2. Click 'Add a permission' -> 'Microsoft Graph' -> 'Delegated'"
    echo "3. Add: openid, profile, email, User.Read"
    echo "4. Click 'Grant admin consent for [Your Org]'"
    echo ""
    echo -e "${YELLOW}Step 4: Create Client Secret${NC}"
    echo ""
    echo "1. Go to 'Certificates & secrets'"
    echo "2. Click 'New client secret'"
    echo "3. Description: 'Phoenix Rooivalk Production'"
    echo "4. Expires: 12 months"
    echo "5. COPY THE VALUE IMMEDIATELY - you won't see it again!"
    echo ""
    echo -e "${YELLOW}Step 5: (Optional) Add Token Claims${NC}"
    echo ""
    echo "1. Go to 'Token configuration'"
    echo "2. Click 'Add optional claim' -> 'ID'"
    echo "3. Select: email, family_name, given_name, upn"
    echo "4. Click 'Add'"
    echo ""
}

# Main
print_banner
check_prerequisites

case "$ACTION" in
    "help")
        print_help
        ;;
    "check")
        check_existing_app
        ;;
    "create")
        create_app_registration
        ;;
    "configure")
        get_app_details "$APP_ID"
        configure_app_registration
        ;;
    *)
        # Interactive mode
        echo "What would you like to do?"
        echo ""
        echo "  1. Check for existing app registration"
        echo "  2. Create new app registration"
        echo "  3. View manual setup instructions"
        echo ""
        read -p "Enter choice (1-3): " choice
        echo ""

        case $choice in
            1) check_existing_app ;;
            2) create_app_registration ;;
            3) print_manual_instructions ;;
            *) echo "Invalid choice"; exit 1 ;;
        esac
        ;;
esac
