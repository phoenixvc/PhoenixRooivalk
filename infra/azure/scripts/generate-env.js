#!/usr/bin/env node
/**
 * Generate Environment Variables for Azure Deployment
 *
 * This script retrieves all necessary configuration from your Azure deployment
 * and generates environment variable files and GitHub secrets commands.
 *
 * Usage:
 *   node generate-env.js --resource-group <rg-name> --env <environment>
 *
 * Example:
 *   node generate-env.js --resource-group phoenix-rooivalk-prod --env prod
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Parse arguments
const args = process.argv.slice(2);
let resourceGroup = '';
let environment = 'dev';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--resource-group' || args[i] === '-g') {
    resourceGroup = args[i + 1];
    i++;
  } else if (args[i] === '--env' || args[i] === '-e') {
    environment = args[i + 1];
    i++;
  } else if (args[i] === '--help' || args[i] === '-h') {
    console.log(`
Usage: node generate-env.js --resource-group <rg-name> --env <environment>

Options:
  -g, --resource-group  Azure resource group name (required)
  -e, --env             Environment name: dev, staging, prod (default: dev)
  -h, --help            Show this help message

Example:
  node generate-env.js -g phoenix-rooivalk-prod -e prod
`);
    process.exit(0);
  }
}

if (!resourceGroup) {
  console.error('Error: --resource-group is required');
  process.exit(1);
}

console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('       Phoenix Rooivalk - Environment Generator');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');
console.log(`Resource Group: ${resourceGroup}`);
console.log(`Environment:    ${environment}`);
console.log('');

// Helper to run Azure CLI commands
function az(command) {
  try {
    return execSync(`az ${command}`, { encoding: 'utf8' }).trim();
  } catch (error) {
    return null;
  }
}

// Helper to run Azure CLI and parse JSON
function azJson(command) {
  try {
    const result = execSync(`az ${command} -o json`, { encoding: 'utf8' });
    return JSON.parse(result);
  } catch (error) {
    return null;
  }
}

console.log('Fetching Azure resources...');
console.log('');

// Project naming convention
const projectName = 'phoenix-rooivalk';
const shortEnv = environment.substring(0, 4);

// Resource names (matching Bicep naming)
const staticWebAppName = `swa-${projectName}-${environment}`;
const functionsAppName = `func-${projectName}-${environment}`;
const cosmosAccountName = `cosmos-${projectName}-${environment}`;
const appInsightsName = `appi-${projectName}-${environment}`;
const keyVaultName = `kv-phoenixrooivalk-${shortEnv}`;

// Collect configuration
const config = {
  CLOUD_PROVIDER: 'azure',
  AZURE_STATIC_WEB_APP_NAME: staticWebAppName,
  AZURE_FUNCTIONS_APP_NAME: functionsAppName,
  AZURE_FUNCTIONS_BASE_URL: '',
  AZURE_APP_INSIGHTS_CONNECTION_STRING: '',
  AZURE_COSMOS_ENDPOINT: '',
  AZURE_ENTRA_TENANT_ID: '',
  AZURE_ENTRA_CLIENT_ID: '',
  AZURE_ENTRA_AUTHORITY: '',
  AZURE_ENTRA_SCOPES: 'openid profile email User.Read',
  AZURE_STATIC_WEB_APPS_API_TOKEN: '',
  AZURE_FUNCTIONS_PUBLISH_PROFILE: '',
};

// Get Static Web App token
console.log('Getting Static Web App deployment token...');
const swaToken = az(`staticwebapp secrets list --name "${staticWebAppName}" --query "properties.apiKey" -o tsv`);
if (swaToken) {
  config.AZURE_STATIC_WEB_APPS_API_TOKEN = swaToken;
  console.log('  ✓ Static Web App token retrieved');
} else {
  console.log('  ⚠ Could not retrieve Static Web App token');
}

// Get Functions URL
console.log('Getting Azure Functions URL...');
const functionsHostname = az(`functionapp show --name "${functionsAppName}" --resource-group "${resourceGroup}" --query "defaultHostName" -o tsv`);
if (functionsHostname) {
  config.AZURE_FUNCTIONS_BASE_URL = `https://${functionsHostname}`;
  console.log(`  ✓ Functions URL: ${config.AZURE_FUNCTIONS_BASE_URL}`);
} else {
  config.AZURE_FUNCTIONS_BASE_URL = `https://${functionsAppName}.azurewebsites.net`;
  console.log(`  ⚠ Using default URL: ${config.AZURE_FUNCTIONS_BASE_URL}`);
}

// Get Functions publish profile
console.log('Getting Azure Functions publish profile...');
const publishProfile = az(`functionapp deployment list-publishing-profiles --name "${functionsAppName}" --resource-group "${resourceGroup}" --xml`);
if (publishProfile) {
  config.AZURE_FUNCTIONS_PUBLISH_PROFILE = publishProfile;
  console.log('  ✓ Functions publish profile retrieved');
} else {
  console.log('  ⚠ Could not retrieve Functions publish profile');
}

// Get Application Insights connection string
console.log('Getting Application Insights connection string...');
const appInsightsConnection = az(`monitor app-insights component show --app "${appInsightsName}" --resource-group "${resourceGroup}" --query "connectionString" -o tsv`);
if (appInsightsConnection) {
  config.AZURE_APP_INSIGHTS_CONNECTION_STRING = appInsightsConnection;
  console.log('  ✓ App Insights connection string retrieved');
} else {
  console.log('  ⚠ Could not retrieve App Insights connection string');
}

// Get Cosmos DB endpoint
console.log('Getting Cosmos DB endpoint...');
const cosmosEndpoint = az(`cosmosdb show --name "${cosmosAccountName}" --resource-group "${resourceGroup}" --query "documentEndpoint" -o tsv`);
if (cosmosEndpoint) {
  config.AZURE_COSMOS_ENDPOINT = cosmosEndpoint;
  console.log(`  ✓ Cosmos DB endpoint: ${cosmosEndpoint}`);
} else {
  console.log('  ⚠ Could not retrieve Cosmos DB endpoint');
}

console.log('');

// Create output directory
const outputDir = path.join(__dirname, '..', 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate .env file
const envFile = path.join(outputDir, `.env.${environment}`);
const envContent = `# Phoenix Rooivalk - Azure Configuration
# Generated on ${new Date().toISOString()}
# Environment: ${environment}

# Cloud Provider Selection
CLOUD_PROVIDER=${config.CLOUD_PROVIDER}

# Azure Functions
AZURE_FUNCTIONS_BASE_URL=${config.AZURE_FUNCTIONS_BASE_URL}

# Azure Application Insights
AZURE_APP_INSIGHTS_CONNECTION_STRING=${config.AZURE_APP_INSIGHTS_CONNECTION_STRING}

# Azure Cosmos DB (server-side only)
AZURE_COSMOS_ENDPOINT=${config.AZURE_COSMOS_ENDPOINT}

# Azure Entra ID (configure after running setup-entra.sh)
# Run: ./scripts/setup-entra.sh --create
AZURE_ENTRA_TENANT_ID=
AZURE_ENTRA_CLIENT_ID=
AZURE_ENTRA_AUTHORITY=
AZURE_ENTRA_SCOPES=openid profile email User.Read
`;

fs.writeFileSync(envFile, envContent);
console.log(`✓ Environment file created: ${envFile}`);

// Generate GitHub secrets script
const secretsFile = path.join(outputDir, `github-secrets.${environment}.sh`);
const secretsContent = `#!/bin/bash
# GitHub Secrets Setup Commands
# Generated on ${new Date().toISOString()}
# Environment: ${environment}
#
# Run these commands to configure GitHub repository secrets
# Requires: gh CLI (https://cli.github.com/)
#
# Usage: bash ${path.basename(secretsFile)}

set -e

echo "Setting up GitHub secrets for Phoenix Rooivalk Azure deployment..."
echo ""

# Cloud Provider
gh secret set CLOUD_PROVIDER --body "azure"
echo "✓ CLOUD_PROVIDER set"

# Static Web Apps Token
gh secret set AZURE_STATIC_WEB_APPS_API_TOKEN --body "${config.AZURE_STATIC_WEB_APPS_API_TOKEN}"
echo "✓ AZURE_STATIC_WEB_APPS_API_TOKEN set"

# Azure Functions
gh secret set AZURE_FUNCTIONS_APP_NAME --body "${functionsAppName}"
echo "✓ AZURE_FUNCTIONS_APP_NAME set"

gh secret set AZURE_FUNCTIONS_BASE_URL --body "${config.AZURE_FUNCTIONS_BASE_URL}"
echo "✓ AZURE_FUNCTIONS_BASE_URL set"

# Azure Functions Publish Profile (for deployment)
gh secret set AZURE_FUNCTIONS_PUBLISH_PROFILE --body '${config.AZURE_FUNCTIONS_PUBLISH_PROFILE.replace(/'/g, "'\\''")}'
echo "✓ AZURE_FUNCTIONS_PUBLISH_PROFILE set"

# Application Insights
gh secret set AZURE_APP_INSIGHTS_CONNECTION_STRING --body "${config.AZURE_APP_INSIGHTS_CONNECTION_STRING}"
echo "✓ AZURE_APP_INSIGHTS_CONNECTION_STRING set"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "GitHub secrets configured successfully!"
echo ""
echo "Remaining manual steps:"
echo "  1. Configure Azure Entra ID (run: ./scripts/setup-entra.sh --create)"
echo "  2. Add Entra ID secrets:"
echo "     gh secret set AZURE_ENTRA_TENANT_ID --body 'your-tenant-id'"
echo "     gh secret set AZURE_ENTRA_CLIENT_ID --body 'your-client-id'"
echo "     gh secret set AZURE_ENTRA_CLIENT_SECRET --body 'your-client-secret'"
echo "     gh secret set AZURE_ENTRA_AUTHORITY --body 'https://login.microsoftonline.com/your-tenant-id'"
echo "     gh secret set AZURE_ENTRA_SCOPES --body 'openid profile email User.Read'"
echo "═══════════════════════════════════════════════════════════════"
`;

fs.writeFileSync(secretsFile, secretsContent);
fs.chmodSync(secretsFile, '755');
console.log(`✓ GitHub secrets script created: ${secretsFile}`);

// Generate JSON config
const jsonFile = path.join(outputDir, `config.${environment}.json`);
const jsonContent = {
  environment,
  resourceGroup,
  generatedAt: new Date().toISOString(),
  resources: {
    staticWebApp: staticWebAppName,
    functionsApp: functionsAppName,
    cosmosAccount: cosmosAccountName,
    appInsights: appInsightsName,
    keyVault: keyVaultName,
  },
  urls: {
    functions: config.AZURE_FUNCTIONS_BASE_URL,
    cosmos: config.AZURE_COSMOS_ENDPOINT,
  },
  hasSecrets: {
    swaToken: !!config.AZURE_STATIC_WEB_APPS_API_TOKEN,
    functionsPublishProfile: !!config.AZURE_FUNCTIONS_PUBLISH_PROFILE,
    appInsightsConnection: !!config.AZURE_APP_INSIGHTS_CONNECTION_STRING,
  },
};

fs.writeFileSync(jsonFile, JSON.stringify(jsonContent, null, 2));
console.log(`✓ JSON config created: ${jsonFile}`);

console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('                     Configuration Complete!');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');
console.log('Next steps:');
console.log('');
console.log('  1. Copy environment variables to your local .env.local:');
console.log(`     cat ${envFile}`);
console.log('');
console.log('  2. Configure GitHub secrets:');
console.log(`     bash ${secretsFile}`);
console.log('');
console.log('  3. Set up Azure Entra ID for authentication:');
console.log('     ./scripts/setup-entra.sh --create');
console.log('');
console.log('  4. Push to main branch to trigger deployment');
console.log('');
