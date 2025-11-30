#!/bin/bash
#
# Phoenix Rooivalk - Azure Entra ID Setup Script
#
# This script helps set up Azure Entra ID (formerly Azure AD) for authentication.
# It can create app registrations, configure redirect URIs, set up API permissions,
# and sync configuration between GitHub secrets and local environment.
#
# Usage:
#   ./setup-entra.sh                    # Interactive setup
#   ./setup-entra.sh --check            # Check existing configuration
#   ./setup-entra.sh --create           # Create new app registration
#   ./setup-entra.sh --app-id <id>      # Configure existing app
#   ./setup-entra.sh --sync-to-gh       # Push config to GitHub secrets
#   ./setup-entra.sh --sync-from-gh     # Pull config from GitHub secrets to local
#
# Prerequisites:
# - Azure CLI installed and logged in
# - GitHub CLI (gh) for secrets sync
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

# Script directory for relative paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
ENV_LOCAL_PATH="$PROJECT_ROOT/apps/docs/.env.local"

# Parse arguments
ACTION=""
APP_ID=""
while [[ $# -gt 0 ]]; do
    case $1 in
        --check) ACTION="check"; shift ;;
        --create) ACTION="create"; shift ;;
        --app-id) APP_ID="$2"; ACTION="configure"; shift 2 ;;
        --prod-url) REDIRECT_URIS_PROD+=("$2" "$2/callback"); shift 2 ;;
        --sync-to-gh) ACTION="sync-to-gh"; shift ;;
        --sync-from-gh) ACTION="sync-from-gh"; shift ;;
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
    echo "  --sync-to-gh         Push Azure config to GitHub secrets"
    echo "  --sync-from-gh       Pull GitHub secrets to local .env.local"
    echo "  --help, -h           Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./setup-entra.sh --check"
    echo "  ./setup-entra.sh --create"
    echo "  ./setup-entra.sh --create --prod-url https://myapp.azurestaticapps.net"
    echo "  ./setup-entra.sh --app-id d9934146-e585-467b-8932-8cec14b332fd"
    echo "  ./setup-entra.sh --sync-to-gh"
    echo "  ./setup-entra.sh --sync-from-gh"
    echo ""
}

# Check if GitHub CLI is available and logged in
check_gh_cli() {
    if ! command -v gh &> /dev/null; then
        echo -e "${YELLOW}GitHub CLI (gh) is not installed.${NC}"
        echo "Install from: https://cli.github.com/"
        return 1
    fi

    if ! gh auth status &> /dev/null; then
        echo -e "${YELLOW}Not logged in to GitHub CLI.${NC}"
        echo "Run: gh auth login"
        return 1
    fi

    echo -e "${GREEN}GitHub CLI is available and logged in${NC}"
    return 0
}

# Get a GitHub secret value (returns empty if not set)
get_gh_secret() {
    local secret_name="$1"
    # Note: gh secret list shows names but not values for security
    # We can only check if a secret exists, not read its value
    if gh secret list 2>/dev/null | grep -q "^$secret_name"; then
        echo "***SET***"
        return 0
    fi
    return 1
}

# Check which GitHub secrets are already configured
check_gh_secrets() {
    echo -e "${BLUE}Checking GitHub secrets...${NC}"
    echo ""

    local secrets=(
        "CLOUD_PROVIDER"
        "AZURE_ENTRA_CLIENT_ID"
        "AZURE_ENTRA_TENANT_ID"
        "AZURE_ENTRA_CLIENT_SECRET"
        "AZURE_ENTRA_AUTHORITY"
        "AZURE_ENTRA_REDIRECT_URI"
        "AZURE_ENTRA_POST_LOGOUT_REDIRECT_URI"
        "AZURE_ENTRA_SCOPES"
    )

    local existing_secrets=()
    local missing_secrets=()

    for secret in "${secrets[@]}"; do
        if gh secret list 2>/dev/null | grep -q "^$secret"; then
            existing_secrets+=("$secret")
            echo -e "  ${GREEN}[SET]${NC} $secret"
        else
            missing_secrets+=("$secret")
            echo -e "  ${YELLOW}[MISSING]${NC} $secret"
        fi
    done

    echo ""

    if [ ${#existing_secrets[@]} -eq ${#secrets[@]} ]; then
        echo -e "${GREEN}All GitHub secrets are configured!${NC}"
        return 0
    elif [ ${#existing_secrets[@]} -gt 0 ]; then
        echo -e "${YELLOW}Some secrets are configured, some are missing.${NC}"
        return 1
    else
        echo -e "${YELLOW}No Entra ID secrets are configured in GitHub.${NC}"
        return 2
    fi
}

# Sync configuration to GitHub secrets
sync_to_github() {
    echo -e "${BLUE}Syncing configuration to GitHub secrets...${NC}"
    echo ""

    if ! check_gh_cli; then
        exit 1
    fi

    # Try to get values from multiple sources in order:
    # 1. Environment variables (if set)
    # 2. Local .env.local file
    # 3. Azure CLI (for tenant ID)

    local CLIENT_ID="${AZURE_ENTRA_CLIENT_ID:-}"
    local TENANT_ID="${AZURE_ENTRA_TENANT_ID:-}"
    local CLIENT_SECRET="${AZURE_ENTRA_CLIENT_SECRET:-}"
    local AUTHORITY="${AZURE_ENTRA_AUTHORITY:-}"
    local REDIRECT_URI="${AZURE_ENTRA_REDIRECT_URI:-}"
    local POST_LOGOUT_URI="${AZURE_ENTRA_POST_LOGOUT_REDIRECT_URI:-}"
    local ENTRA_SCOPES="${AZURE_ENTRA_SCOPES:-$SCOPES}"

    # Try to read from .env.local if values are missing
    if [ -f "$ENV_LOCAL_PATH" ]; then
        echo -e "${BLUE}Reading from $ENV_LOCAL_PATH...${NC}"
        source_env_file "$ENV_LOCAL_PATH"

        [ -z "$CLIENT_ID" ] && CLIENT_ID="${AZURE_ENTRA_CLIENT_ID:-}"
        [ -z "$TENANT_ID" ] && TENANT_ID="${AZURE_ENTRA_TENANT_ID:-}"
        [ -z "$CLIENT_SECRET" ] && CLIENT_SECRET="${AZURE_ENTRA_CLIENT_SECRET:-}"
        [ -z "$AUTHORITY" ] && AUTHORITY="${AZURE_ENTRA_AUTHORITY:-}"
        [ -z "$REDIRECT_URI" ] && REDIRECT_URI="${AZURE_ENTRA_REDIRECT_URI:-}"
        [ -z "$POST_LOGOUT_URI" ] && POST_LOGOUT_URI="${AZURE_ENTRA_POST_LOGOUT_REDIRECT_URI:-}"
        [ -z "$ENTRA_SCOPES" ] && ENTRA_SCOPES="${AZURE_ENTRA_SCOPES:-$SCOPES}"
    fi

    # Try to get tenant ID from Azure if still missing
    if [ -z "$TENANT_ID" ] && command -v az &> /dev/null && az account show &> /dev/null; then
        TENANT_ID=$(az account show --query "tenantId" -o tsv 2>/dev/null || echo "")
    fi

    # Build authority from tenant ID if missing
    if [ -z "$AUTHORITY" ] && [ -n "$TENANT_ID" ]; then
        AUTHORITY="https://login.microsoftonline.com/$TENANT_ID"
    fi

    # Check what we have
    echo ""
    echo -e "${BLUE}Values to sync:${NC}"
    echo ""
    [ -n "$CLIENT_ID" ] && echo -e "  AZURE_ENTRA_CLIENT_ID:    ${GREEN}$CLIENT_ID${NC}" || echo -e "  AZURE_ENTRA_CLIENT_ID:    ${RED}(missing)${NC}"
    [ -n "$TENANT_ID" ] && echo -e "  AZURE_ENTRA_TENANT_ID:    ${GREEN}$TENANT_ID${NC}" || echo -e "  AZURE_ENTRA_TENANT_ID:    ${RED}(missing)${NC}"
    [ -n "$CLIENT_SECRET" ] && echo -e "  AZURE_ENTRA_CLIENT_SECRET: ${GREEN}***hidden***${NC}" || echo -e "  AZURE_ENTRA_CLIENT_SECRET: ${YELLOW}(not set - add manually)${NC}"
    [ -n "$AUTHORITY" ] && echo -e "  AZURE_ENTRA_AUTHORITY:    ${GREEN}$AUTHORITY${NC}" || echo -e "  AZURE_ENTRA_AUTHORITY:    ${RED}(missing)${NC}"
    [ -n "$REDIRECT_URI" ] && echo -e "  AZURE_ENTRA_REDIRECT_URI: ${GREEN}$REDIRECT_URI${NC}" || echo -e "  AZURE_ENTRA_REDIRECT_URI: ${YELLOW}(optional)${NC}"
    [ -n "$POST_LOGOUT_URI" ] && echo -e "  AZURE_ENTRA_POST_LOGOUT_REDIRECT_URI: ${GREEN}$POST_LOGOUT_URI${NC}" || echo -e "  AZURE_ENTRA_POST_LOGOUT_REDIRECT_URI: ${YELLOW}(optional)${NC}"
    echo -e "  AZURE_ENTRA_SCOPES:       ${GREEN}$ENTRA_SCOPES${NC}"
    echo ""

    # Validate required values
    if [ -z "$CLIENT_ID" ] || [ -z "$TENANT_ID" ]; then
        echo -e "${RED}Error: Missing required values (CLIENT_ID or TENANT_ID)${NC}"
        echo ""
        echo "Please either:"
        echo "  1. Set environment variables: AZURE_ENTRA_CLIENT_ID, AZURE_ENTRA_TENANT_ID"
        echo "  2. Create apps/docs/.env.local with these values"
        echo "  3. Run: ./setup-entra.sh --create  to create an app registration first"
        exit 1
    fi

    read -p "Push these values to GitHub secrets? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 0
    fi

    echo ""
    echo -e "${BLUE}Setting GitHub secrets...${NC}"

    gh secret set CLOUD_PROVIDER --body "azure"
    echo -e "  ${GREEN}[SET]${NC} CLOUD_PROVIDER"

    gh secret set AZURE_ENTRA_CLIENT_ID --body "$CLIENT_ID"
    echo -e "  ${GREEN}[SET]${NC} AZURE_ENTRA_CLIENT_ID"

    gh secret set AZURE_ENTRA_TENANT_ID --body "$TENANT_ID"
    echo -e "  ${GREEN}[SET]${NC} AZURE_ENTRA_TENANT_ID"

    if [ -n "$CLIENT_SECRET" ]; then
        gh secret set AZURE_ENTRA_CLIENT_SECRET --body "$CLIENT_SECRET"
        echo -e "  ${GREEN}[SET]${NC} AZURE_ENTRA_CLIENT_SECRET"
    fi

    gh secret set AZURE_ENTRA_AUTHORITY --body "$AUTHORITY"
    echo -e "  ${GREEN}[SET]${NC} AZURE_ENTRA_AUTHORITY"

    if [ -n "$REDIRECT_URI" ]; then
        gh secret set AZURE_ENTRA_REDIRECT_URI --body "$REDIRECT_URI"
        echo -e "  ${GREEN}[SET]${NC} AZURE_ENTRA_REDIRECT_URI"
    fi

    if [ -n "$POST_LOGOUT_URI" ]; then
        gh secret set AZURE_ENTRA_POST_LOGOUT_REDIRECT_URI --body "$POST_LOGOUT_URI"
        echo -e "  ${GREEN}[SET]${NC} AZURE_ENTRA_POST_LOGOUT_REDIRECT_URI"
    fi

    gh secret set AZURE_ENTRA_SCOPES --body "$ENTRA_SCOPES"
    echo -e "  ${GREEN}[SET]${NC} AZURE_ENTRA_SCOPES"

    echo ""
    echo -e "${GREEN}GitHub secrets synced successfully!${NC}"

    if [ -z "$CLIENT_SECRET" ]; then
        echo ""
        echo -e "${YELLOW}Note: Client secret was not set. Add it manually:${NC}"
        echo "  gh secret set AZURE_ENTRA_CLIENT_SECRET --body \"your-secret-value\""
    fi
}

# Source an env file safely
source_env_file() {
    local file="$1"
    if [ -f "$file" ]; then
        # Read file line by line, export valid variable assignments
        while IFS= read -r line || [ -n "$line" ]; do
            # Skip comments and empty lines
            [[ "$line" =~ ^[[:space:]]*# ]] && continue
            [[ -z "$line" ]] && continue
            # Only process lines with = that look like variable assignments
            if [[ "$line" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]]; then
                export "$line" 2>/dev/null || true
            fi
        done < "$file"
    fi
}

# Create local .env.local from GitHub secrets or prompts
sync_from_github() {
    echo -e "${BLUE}Creating local .env.local from GitHub secrets...${NC}"
    echo ""

    if ! check_gh_cli; then
        echo ""
        echo -e "${YELLOW}Falling back to manual entry...${NC}"
        create_env_local_manual
        return
    fi

    # Check what secrets exist
    echo ""
    check_gh_secrets
    echo ""

    # Since we can't read secret values, we'll prompt for them
    echo -e "${YELLOW}Note: GitHub secret values cannot be read for security reasons.${NC}"
    echo "You'll need to enter the values manually, or copy from Azure Portal."
    echo ""

    create_env_local_manual
}

# Create .env.local with manual input
create_env_local_manual() {
    echo -e "${BLUE}Creating .env.local for local development...${NC}"
    echo ""

    # Try to get tenant ID from Azure CLI
    local DEFAULT_TENANT_ID=""
    if command -v az &> /dev/null && az account show &> /dev/null; then
        DEFAULT_TENANT_ID=$(az account show --query "tenantId" -o tsv 2>/dev/null || echo "")
    fi

    # Try to find existing app registration
    local DEFAULT_CLIENT_ID=""
    if command -v az &> /dev/null; then
        DEFAULT_CLIENT_ID=$(az ad app list --display-name "$APP_NAME" --query "[0].appId" -o tsv 2>/dev/null || echo "")
    fi

    echo "Enter your Azure Entra ID configuration:"
    echo "(Press Enter to accept defaults shown in brackets)"
    echo ""

    read -p "Client ID [$DEFAULT_CLIENT_ID]: " CLIENT_ID
    CLIENT_ID="${CLIENT_ID:-$DEFAULT_CLIENT_ID}"

    read -p "Tenant ID [$DEFAULT_TENANT_ID]: " TENANT_ID
    TENANT_ID="${TENANT_ID:-$DEFAULT_TENANT_ID}"

    local DEFAULT_AUTHORITY="https://login.microsoftonline.com/$TENANT_ID"
    read -p "Authority [$DEFAULT_AUTHORITY]: " AUTHORITY
    AUTHORITY="${AUTHORITY:-$DEFAULT_AUTHORITY}"

    read -p "Client Secret (leave empty to skip): " -s CLIENT_SECRET
    echo ""

    read -p "Redirect URI [http://localhost:3000/callback]: " REDIRECT_URI
    REDIRECT_URI="${REDIRECT_URI:-http://localhost:3000/callback}"

    read -p "Post-logout Redirect URI [http://localhost:3000]: " POST_LOGOUT_URI
    POST_LOGOUT_URI="${POST_LOGOUT_URI:-http://localhost:3000}"

    read -p "Scopes [$SCOPES]: " ENTRA_SCOPES
    ENTRA_SCOPES="${ENTRA_SCOPES:-$SCOPES}"

    echo ""
    echo -e "${BLUE}Writing to $ENV_LOCAL_PATH...${NC}"

    # Create directory if needed
    mkdir -p "$(dirname "$ENV_LOCAL_PATH")"

    # Write the file
    cat > "$ENV_LOCAL_PATH" << EOF
# Phoenix Rooivalk - Local Development Configuration
# Generated on $(date)
# DO NOT COMMIT THIS FILE

# Cloud Provider
CLOUD_PROVIDER=azure

# Azure Entra ID Configuration
AZURE_ENTRA_CLIENT_ID=$CLIENT_ID
AZURE_ENTRA_TENANT_ID=$TENANT_ID
AZURE_ENTRA_AUTHORITY=$AUTHORITY
AZURE_ENTRA_REDIRECT_URI=$REDIRECT_URI
AZURE_ENTRA_POST_LOGOUT_REDIRECT_URI=$POST_LOGOUT_URI
AZURE_ENTRA_SCOPES=$ENTRA_SCOPES
EOF

    if [ -n "$CLIENT_SECRET" ]; then
        echo "AZURE_ENTRA_CLIENT_SECRET=$CLIENT_SECRET" >> "$ENV_LOCAL_PATH"
    fi

    echo ""
    echo -e "${GREEN}.env.local created successfully!${NC}"
    echo ""
    echo "File location: $ENV_LOCAL_PATH"
    echo ""

    # Ensure .env.local is in .gitignore
    local GITIGNORE="$PROJECT_ROOT/.gitignore"
    if [ -f "$GITIGNORE" ]; then
        if ! grep -q "^\.env\.local$" "$GITIGNORE" && ! grep -q "^\*\*\/\.env\.local$" "$GITIGNORE"; then
            echo ".env.local" >> "$GITIGNORE"
            echo -e "${GREEN}Added .env.local to .gitignore${NC}"
        fi
    fi

    # Ask if user wants to also push to GitHub
    echo ""
    if check_gh_cli 2>/dev/null; then
        read -p "Also push these values to GitHub secrets? (y/N) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            # Export for sync_to_github to use
            export AZURE_ENTRA_CLIENT_ID="$CLIENT_ID"
            export AZURE_ENTRA_TENANT_ID="$TENANT_ID"
            export AZURE_ENTRA_CLIENT_SECRET="$CLIENT_SECRET"
            export AZURE_ENTRA_AUTHORITY="$AUTHORITY"
            export AZURE_ENTRA_REDIRECT_URI="$REDIRECT_URI"
            export AZURE_ENTRA_POST_LOGOUT_REDIRECT_URI="$POST_LOGOUT_URI"
            export AZURE_ENTRA_SCOPES="$ENTRA_SCOPES"
            sync_to_github
        fi
    fi
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

    echo -e "${GREEN}Logged in to Azure${NC}"
    echo ""
    echo -e "  Tenant:       ${CYAN}$TENANT_NAME${NC}"
    echo -e "  Tenant ID:    ${CYAN}$TENANT_ID${NC}"
    echo -e "  Subscription: ${CYAN}$SUBSCRIPTION${NC}"
    echo ""

    # Check GitHub CLI status
    if command -v gh &> /dev/null; then
        if gh auth status &> /dev/null; then
            echo -e "${GREEN}GitHub CLI is available and logged in${NC}"
        else
            echo -e "${YELLOW}GitHub CLI is installed but not logged in${NC}"
        fi
    else
        echo -e "${YELLOW}GitHub CLI (gh) is not installed (optional)${NC}"
    fi
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

    # Print configuration summary and offer to sync
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
    echo "CLOUD_PROVIDER=azure"
    echo "AZURE_ENTRA_CLIENT_ID=$APP_ID"
    echo "AZURE_ENTRA_TENANT_ID=$TENANT_ID"
    echo "AZURE_ENTRA_AUTHORITY=$AUTHORITY"
    echo "AZURE_ENTRA_REDIRECT_URI=http://localhost:3000/callback"
    echo "AZURE_ENTRA_POST_LOGOUT_REDIRECT_URI=http://localhost:3000"
    echo "AZURE_ENTRA_SCOPES=$SCOPES"
    echo ""

    # Ask to create .env.local
    read -p "Create .env.local file for local development? (Y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        export AZURE_ENTRA_CLIENT_ID="$APP_ID"
        export AZURE_ENTRA_TENANT_ID="$TENANT_ID"
        export AZURE_ENTRA_AUTHORITY="$AUTHORITY"
        export AZURE_ENTRA_REDIRECT_URI="http://localhost:3000/callback"
        export AZURE_ENTRA_POST_LOGOUT_REDIRECT_URI="http://localhost:3000"
        export AZURE_ENTRA_SCOPES="$SCOPES"

        mkdir -p "$(dirname "$ENV_LOCAL_PATH")"
        cat > "$ENV_LOCAL_PATH" << EOF
# Phoenix Rooivalk - Local Development Configuration
# Generated on $(date)
# DO NOT COMMIT THIS FILE

# Cloud Provider
CLOUD_PROVIDER=azure

# Azure Entra ID Configuration
AZURE_ENTRA_CLIENT_ID=$APP_ID
AZURE_ENTRA_TENANT_ID=$TENANT_ID
AZURE_ENTRA_AUTHORITY=$AUTHORITY
AZURE_ENTRA_REDIRECT_URI=http://localhost:3000/callback
AZURE_ENTRA_POST_LOGOUT_REDIRECT_URI=http://localhost:3000
AZURE_ENTRA_SCOPES=$SCOPES

# Client Secret (add after creating in Azure Portal)
# AZURE_ENTRA_CLIENT_SECRET=your-secret-here
EOF
        echo -e "${GREEN}.env.local created: $ENV_LOCAL_PATH${NC}"
    fi

    # Ask to push to GitHub
    echo ""
    if check_gh_cli 2>/dev/null; then
        read -p "Push configuration to GitHub secrets? (Y/n) " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Nn]$ ]]; then
            sync_to_github
        fi
    fi

    echo ""
    echo -e "${YELLOW}Manual Steps Required:${NC}"
    echo ""
    echo "1. Go to Azure Portal -> Microsoft Entra ID -> App registrations"
    echo "2. Select '$APP_NAME'"
    echo "3. Go to 'Certificates & secrets' -> 'New client secret'"
    echo "4. Copy the secret value and add:"
    echo "   - To .env.local: AZURE_ENTRA_CLIENT_SECRET=your-secret"
    echo "   - To GitHub: gh secret set AZURE_ENTRA_CLIENT_SECRET --body \"your-secret\""
    echo ""
    echo "5. Go to 'API permissions' -> 'Grant admin consent for [Your Org]'"
    echo ""
    echo "6. (Optional) Go to 'Token configuration' -> 'Add optional claim'"
    echo "   Add: email, family_name, given_name, upn"
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

case "$ACTION" in
    "help")
        print_help
        ;;
    "sync-to-gh")
        check_gh_cli || exit 1
        sync_to_github
        ;;
    "sync-from-gh")
        sync_from_github
        ;;
    "check")
        check_prerequisites
        check_existing_app
        echo ""
        if check_gh_cli 2>/dev/null; then
            check_gh_secrets
        fi
        ;;
    "create")
        check_prerequisites
        create_app_registration
        ;;
    "configure")
        check_prerequisites
        get_app_details "$APP_ID"
        configure_app_registration
        ;;
    *)
        check_prerequisites

        # Interactive mode
        echo "What would you like to do?"
        echo ""
        echo "  1. Check for existing app registration"
        echo "  2. Create new app registration"
        echo "  3. Sync local config to GitHub secrets"
        echo "  4. Create local .env.local (from prompts)"
        echo "  5. View manual setup instructions"
        echo ""
        read -p "Enter choice (1-5): " choice
        echo ""

        case $choice in
            1) check_existing_app ;;
            2) create_app_registration ;;
            3) sync_to_github ;;
            4) create_env_local_manual ;;
            5) print_manual_instructions ;;
            *) echo "Invalid choice"; exit 1 ;;
        esac
        ;;
esac
