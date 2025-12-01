# PhoenixRooivalk Azure Functions Deployment Script
# This script deploys Azure Functions and related resources for the PhoenixRooivalk project

#region Azure CLI Helper Functions
# Provides timeout protection and Azure CLI wrappers
function Invoke-AzCliWithTimeout {
<#
.SYNOPSIS
Executes an Azure CLI command with a timeout.
.PARAMETER Command
The Azure CLI command to execute (without 'az' prefix)
.PARAMETER TimeoutSeconds
Maximum time to wait for the command (default: 30)
.PARAMETER Verbose
Show verbose output
#>
param(
    [string]$Command,
    [int]$TimeoutSeconds = 30,
    [switch]$Verbose
)
    try {
        $job = Start-Job -ScriptBlock {
            param($cmd)
            $ErrorActionPreference = 'SilentlyContinue'
            $output = Invoke-Expression $cmd 2>&1 | Out-String
            return $output
        } -ArgumentList $Command
        $result = $job | Wait-Job -Timeout $TimeoutSeconds
        if ($result) {
            $output = $job | Receive-Job
            $job | Remove-Job -ErrorAction SilentlyContinue
            return $output.Trim()
        }
        else {
            $job | Stop-Job -ErrorAction SilentlyContinue
            $job | Remove-Job -ErrorAction SilentlyContinue
            if ($Verbose) {
                Write-Warning "Command timed out after $TimeoutSeconds seconds"
            }
            return $null
        }
    }
    catch {
        if ($Verbose) {
            Write-Warning "Error executing command: $($_.Exception.Message)"
        }
        return $null
    }
}

function Test-AzureLogin {
<#
.SYNOPSIS
Checks if user is logged into Azure CLI.
#>
    try {
        $account = az account show 2>$null | ConvertFrom-Json
        return $account
    }
    catch {
        return $null
    }
}

function Set-AzureSubscription {
<#
.SYNOPSIS
Sets the active Azure subscription.
.PARAMETER SubscriptionId
The subscription ID to set
#>
param(
    [string]$SubscriptionId
)
    try {
        az account set --subscription $SubscriptionId 2>$null | Out-Null
        return $true
    }
    catch {
        return $false
    }
}
#endregion

# Configuration - Update these values as needed
$SUBSCRIPTION_ID = "22f9eb18-6553-4b7d-9451-47d0195085fe"
$RESOURCE_GROUP = "phoenixrooivalk-rg"
$LOCATION = "eastus"  # Default location if resources need to be created

# Resource Names
$COSMOS_DB_NAME = "phoenixrooivalk-cosmos"
$COSMOS_DB_DATABASE = "PhoenixRooivalkDb"
$STORAGE_ACCOUNT_NAME = "COSMOS_DB_CONNECTION_STRING"
$FUNCTION_APP_NAME = "phoenixrooivalk-functions"
$APP_SERVICE_PLAN_NAME = "phoenixrooivalk-plan"

# Cosmos DB Configuration
$COSMOS_DB_SERVERLESS = $true

# Function App Configuration
$RUNTIME_STACK = "node"
$RUNTIME_VERSION = "20"
$FUNCTIONS_VERSION = "4"

# Check Azure login status
Write-Host "Checking Azure login status..."
$loginStatus = Test-AzureLogin
if (-not $loginStatus) {
    Write-Host "Not logged in to Azure. Please login with az login command."
    az login
}

# Set the correct subscription
Write-Host "Setting Azure subscription..."
$result = Set-AzureSubscription -SubscriptionId $SUBSCRIPTION_ID
if ($result) {
    Write-Host "Subscription set successfully."
} else {
    Write-Error "Failed to set subscription. Please check the subscription ID and try again."
    exit 1
}

# Verify subscription
$CURRENT_SUB = (az account show --query name -o tsv)
Write-Host "Using subscription: $CURRENT_SUB"

# Check if resource group exists, create if not
Write-Host "Checking resource group $RESOURCE_GROUP..."
$rgExists = (az group show --name $RESOURCE_GROUP 2>&1)
if ($LASTEXITCODE -ne 0) {
  Write-Host "Creating resource group $RESOURCE_GROUP..."
  az group create --name $RESOURCE_GROUP --location $LOCATION
}
else {
  Write-Host "Resource group $RESOURCE_GROUP exists."
}

# Deploy Cosmos DB using Bicep template
Write-Host "`n=== Deploying Cosmos DB Resources ===" -ForegroundColor Green
Write-Host "Deploying Cosmos DB Account and Database..."
$cosmosDeployment = Invoke-AzCliWithTimeout -Command "az deployment group create --resource-group $RESOURCE_GROUP --template-file cosmos-db.bicep --parameters cosmosDbAccountName=$COSMOS_DB_NAME databaseName=$COSMOS_DB_DATABASE serverless=$COSMOS_DB_SERVERLESS --query properties.outputs" -TimeoutSeconds 300
if ($null -eq $cosmosDeployment) {
    Write-Error "Failed to deploy Cosmos DB resources. Deployment timed out or failed."
    exit 1
} else {
    try {
        $cosmosOutputs = $cosmosDeployment | ConvertFrom-Json
        Write-Host "Cosmos DB deployment successful!"
        Write-Host "Cosmos DB Account: $($cosmosOutputs.cosmosDbAccountName.value)"
        Write-Host "Database Name: $($cosmosOutputs.databaseName.value)"
        Write-Host "Cosmos DB Endpoint: $($cosmosOutputs.cosmosDbEndpoint.value)"
        
        # Store connection string for later use with Function App
        $COSMOS_DB_CONNECTION_STRING = $cosmosOutputs.cosmosDbConnectionString.value
    } catch {
        Write-Warning "Couldn't parse Cosmos DB deployment outputs: $($_.Exception.Message)"
        exit 1
    }
}

# Create Storage Account for Azure Functions
Write-Host "`n=== Creating Storage Account for Azure Functions ===" -ForegroundColor Green
$storageAccount = Invoke-AzCliWithTimeout -Command "az storage account show --name $STORAGE_ACCOUNT_NAME --resource-group $RESOURCE_GROUP" -TimeoutSeconds 30
if ($null -eq $storageAccount) {
    Write-Host "Creating storage account $STORAGE_ACCOUNT_NAME..."
    $storageAccount = Invoke-AzCliWithTimeout -Command "az storage account create --name $STORAGE_ACCOUNT_NAME --resource-group $RESOURCE_GROUP --location $LOCATION --sku Standard_LRS --kind StorageV2" -TimeoutSeconds 60
    if ($null -eq $storageAccount) {
        Write-Error "Failed to create storage account."
        exit 1
    }
} else {
    Write-Host "Storage account $STORAGE_ACCOUNT_NAME exists."
}

# Get storage account connection string
Write-Host "Retrieving storage account connection string..."
$storageConnectionString = Invoke-AzCliWithTimeout -Command "az storage account show-connection-string --name $STORAGE_ACCOUNT_NAME --resource-group $RESOURCE_GROUP --query connectionString -o tsv" -TimeoutSeconds 30
if ($null -eq $storageConnectionString) {
    Write-Error "Failed to get storage account connection string."
    exit 1
}

# Create App Service Plan for Function App
Write-Host "`n=== Creating App Service Plan ===" -ForegroundColor Green
$appServicePlan = Invoke-AzCliWithTimeout -Command "az appservice plan show --name $APP_SERVICE_PLAN_NAME --resource-group $RESOURCE_GROUP" -TimeoutSeconds 30
if ($null -eq $appServicePlan) {
    Write-Host "Creating App Service Plan $APP_SERVICE_PLAN_NAME..."
    $appServicePlan = Invoke-AzCliWithTimeout -Command "az appservice plan create --name $APP_SERVICE_PLAN_NAME --resource-group $RESOURCE_GROUP --location $LOCATION --sku B1" -TimeoutSeconds 60
    if ($null -eq $appServicePlan) {
        Write-Error "Failed to create App Service Plan."
        exit 1
    }
} else {
    Write-Host "App Service Plan $APP_SERVICE_PLAN_NAME exists."
}

# Create Function App
Write-Host "`n=== Creating Function App ===" -ForegroundColor Green
$functionApp = Invoke-AzCliWithTimeout -Command "az functionapp show --name $FUNCTION_APP_NAME --resource-group $RESOURCE_GROUP" -TimeoutSeconds 30
if ($null -eq $functionApp) {
    Write-Host "Creating Function App $FUNCTION_APP_NAME..."
    $functionApp = Invoke-AzCliWithTimeout -Command "az functionapp create --name $FUNCTION_APP_NAME --resource-group $RESOURCE_GROUP --storage-account $STORAGE_ACCOUNT_NAME --plan $APP_SERVICE_PLAN_NAME --runtime $RUNTIME_STACK --runtime-version $RUNTIME_VERSION --functions-version $FUNCTIONS_VERSION" -TimeoutSeconds 120
    if ($null -eq $functionApp) {
        Write-Error "Failed to create Function App."
        exit 1
    }
} else {
    Write-Host "Function App $FUNCTION_APP_NAME exists."
}

# Configure Function App Settings
Write-Host "`n=== Configuring Function App Settings ===" -ForegroundColor Green
Write-Host "Setting application settings for the Function App..."
$appSettings = Invoke-AzCliWithTimeout -Command "az functionapp config appsettings set --name $FUNCTION_APP_NAME --resource-group $RESOURCE_GROUP --settings 'COSMOS_DB_CONNECTION_STRING=$COSMOS_DB_CONNECTION_STRING' 'COSMOS_DB_DATABASE_NAME=$COSMOS_DB_DATABASE'" -TimeoutSeconds 60
if ($null -eq $appSettings) {
    Write-Warning "Failed to set application settings for the Function App."
} else {
    Write-Host "Application settings configured successfully."
}

# Enable Function App logs
Write-Host "Enabling Function App logs..."
$appLogs = Invoke-AzCliWithTimeout -Command "az functionapp config appsettings set --name $FUNCTION_APP_NAME --resource-group $RESOURCE_GROUP --settings 'AzureWebJobsStorage=$storageConnectionString' 'FUNCTIONS_EXTENSION_VERSION=~$FUNCTIONS_VERSION' 'APPINSIGHTS_INSTRUMENTATIONKEY=1'" -TimeoutSeconds 60
if ($null -eq $appLogs) {
    Write-Warning "Failed to enable Function App logs."
} else {
    Write-Host "Function App logs enabled."
}

# Get the Function App URL
Write-Host "`n=== Function App Information ===" -ForegroundColor Green
$functionAppHostname = Invoke-AzCliWithTimeout -Command "az functionapp show --name $FUNCTION_APP_NAME --resource-group $RESOURCE_GROUP --query defaultHostName -o tsv" -TimeoutSeconds 30
if ($null -ne $functionAppHostname) {
    Write-Host "Function App URL: https://$functionAppHostname"
}

# Cosmos DB connection information
Write-Host "`n=== Cosmos DB Connection Information ===" -ForegroundColor Green
Write-Host "Cosmos DB Account Name: $COSMOS_DB_NAME"
Write-Host "Database Name: $COSMOS_DB_DATABASE"
Write-Host "To retrieve the connection string manually, run:"
Write-Host "az cosmosdb keys list --name $COSMOS_DB_NAME --resource-group $RESOURCE_GROUP --type connection-strings --query 'connectionStrings[0].connectionString' -o tsv"

# Deployment instructions
Write-Host "`n=== Deploying Functions to Azure Function App ===" -ForegroundColor Green
Write-Host "To deploy functions from your local project, use the Azure Functions extension in VS Code or run:"
Write-Host "func azure functionapp publish $FUNCTION_APP_NAME --javascript"
Write-Host "`nAlternatively, you can set up GitHub Actions for CI/CD by:"
Write-Host "1. Setting up a GitHub repository for your functions code"
Write-Host "2. Adding Azure Function App publishing profile secrets to your GitHub repository"
Write-Host "3. Creating a GitHub workflow file (.github/workflows/azure-functions.yml)"

# Completion message
Write-Host "`n=== Deployment Script Complete ===" -ForegroundColor Green
Write-Host "PhoenixRooivalk Azure Functions environment has been set up."
Write-Host "The Function App is ready to receive your function code."