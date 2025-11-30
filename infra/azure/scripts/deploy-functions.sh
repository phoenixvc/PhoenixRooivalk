#!/bin/bash
#
# Phoenix Rooivalk - Azure Functions Deployment Script
#
# Deploys the Azure Functions project.
#
# Prerequisites:
# - Azure CLI installed and logged in
# - Azure Functions Core Tools installed (npm install -g azure-functions-core-tools@4)
# - Infrastructure already deployed (run deploy.sh first)
#

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ENVIRONMENT="${1:-dev}"
RESOURCE_GROUP="${2:-phoenix-rooivalk-${ENVIRONMENT}}"
FUNCTION_APP_NAME="phoenixrooivalk-${ENVIRONMENT}-func"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FUNCTIONS_DIR="$SCRIPT_DIR/../../../apps/docs/azure-functions"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      Phoenix Rooivalk - Azure Functions Deployment         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Environment:${NC}   $ENVIRONMENT"
echo -e "${YELLOW}Function App:${NC}  $FUNCTION_APP_NAME"
echo -e "${YELLOW}Source Dir:${NC}    $FUNCTIONS_DIR"
echo ""

# Check prerequisites
check_prerequisites() {
    echo -e "${BLUE}Checking prerequisites...${NC}"

    if ! command -v az &> /dev/null; then
        echo -e "${RED}Error: Azure CLI is not installed.${NC}"
        exit 1
    fi

    if ! command -v func &> /dev/null; then
        echo -e "${RED}Error: Azure Functions Core Tools not installed.${NC}"
        echo "Install with: npm install -g azure-functions-core-tools@4"
        exit 1
    fi

    if [ ! -d "$FUNCTIONS_DIR" ]; then
        echo -e "${YELLOW}Functions directory not found. Creating...${NC}"
        create_functions_project
    fi

    echo -e "${GREEN}✓ Prerequisites check passed${NC}"
}

# Create Azure Functions project if it doesn't exist
create_functions_project() {
    mkdir -p "$FUNCTIONS_DIR"
    cd "$FUNCTIONS_DIR"

    echo -e "${BLUE}Initializing Azure Functions project...${NC}"

    # Create host.json
    cat > host.json << 'EOF'
{
  "version": "2.0",
  "logging": {
    "applicationInsights": {
      "samplingSettings": {
        "isEnabled": true,
        "excludedTypes": "Request"
      }
    }
  },
  "extensionBundle": {
    "id": "Microsoft.Azure.Functions.ExtensionBundle",
    "version": "[4.*, 5.0.0)"
  },
  "extensions": {
    "http": {
      "routePrefix": "api"
    }
  }
}
EOF

    # Create local.settings.json
    cat > local.settings.json << 'EOF'
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "COSMOS_DB_CONNECTION_STRING": "",
    "COSMOS_DB_DATABASE": "phoenix-docs",
    "AZURE_OPENAI_ENDPOINT": "",
    "AZURE_OPENAI_API_KEY": "",
    "AZURE_OPENAI_API_VERSION": "2024-10-21",
    "AZURE_OPENAI_CHAT_DEPLOYMENT": "gpt-4",
    "AZURE_OPENAI_EMBEDDING_DEPLOYMENT": "text-embedding-3-small"
  },
  "Host": {
    "CORS": "*"
  }
}
EOF

    # Create package.json
    cat > package.json << 'EOF'
{
  "name": "phoenix-rooivalk-functions",
  "version": "1.0.0",
  "description": "Azure Functions for Phoenix Rooivalk",
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "start": "func start",
    "test": "jest"
  },
  "dependencies": {
    "@azure/cosmos": "^4.0.0",
    "@azure/identity": "^4.0.0",
    "openai": "^4.0.0"
  },
  "devDependencies": {
    "@azure/functions": "^4.0.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
EOF

    # Create tsconfig.json
    cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2022",
    "outDir": "dist",
    "rootDir": ".",
    "sourceMap": true,
    "strict": false,
    "esModuleInterop": true
  },
  "include": ["src/**/*"]
}
EOF

    # Create .gitignore
    cat > .gitignore << 'EOF'
node_modules/
dist/
local.settings.json
.env
*.js.map
EOF

    # Create src directory
    mkdir -p src/functions

    echo -e "${GREEN}✓ Azure Functions project created${NC}"
}

# Build the project
build_project() {
    echo -e "${BLUE}Building Azure Functions project...${NC}"

    cd "$FUNCTIONS_DIR"

    if [ -f "package.json" ]; then
        npm install
        npm run build 2>/dev/null || echo "No build script, continuing..."
    fi

    echo -e "${GREEN}✓ Build completed${NC}"
}

# Deploy to Azure
deploy_to_azure() {
    echo -e "${BLUE}Deploying to Azure...${NC}"

    cd "$FUNCTIONS_DIR"

    # Check if function app exists
    if ! az functionapp show --name "$FUNCTION_APP_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
        echo -e "${RED}Error: Function app '$FUNCTION_APP_NAME' not found.${NC}"
        echo "Run deploy.sh first to create infrastructure."
        exit 1
    fi

    # Deploy using Azure Functions Core Tools
    func azure functionapp publish "$FUNCTION_APP_NAME" --typescript

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Functions deployed successfully${NC}"

        FUNCTIONS_URL=$(az functionapp show \
            --name "$FUNCTION_APP_NAME" \
            --resource-group "$RESOURCE_GROUP" \
            --query "defaultHostName" -o tsv)

        echo ""
        echo -e "${GREEN}Functions available at: https://${FUNCTIONS_URL}/api${NC}"
    else
        echo -e "${RED}✗ Deployment failed${NC}"
        exit 1
    fi
}

# List deployed functions
list_functions() {
    echo ""
    echo -e "${BLUE}Deployed functions:${NC}"

    az functionapp function list \
        --name "$FUNCTION_APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query "[].{Name:name, Trigger:config.bindings[0].type}" \
        --output table 2>/dev/null || echo "No functions deployed yet."
}

main() {
    check_prerequisites
    build_project
    deploy_to_azure
    list_functions

    echo ""
    echo -e "${GREEN}✓ Deployment complete!${NC}"
}

main
