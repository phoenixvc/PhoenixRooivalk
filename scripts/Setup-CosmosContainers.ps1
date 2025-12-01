<#
.SYNOPSIS
    Creates all required Cosmos DB containers for Phoenix Rooivalk Azure Functions.

.DESCRIPTION
    This script creates the phoenix-docs database and all required containers
    with appropriate partition keys for the Phoenix Rooivalk application.

.PARAMETER ResourceGroup
    The Azure resource group containing the Cosmos DB account.

.PARAMETER CosmosAccountName
    The name of the Cosmos DB account.

.PARAMETER DatabaseName
    The name of the database to create (default: phoenix-docs).

.PARAMETER SkipDatabase
    Skip database creation if it already exists.

.EXAMPLE
    .\Setup-CosmosContainers.ps1 -ResourceGroup "dev-euw-rg-rooivalk" -CosmosAccountName "phoenixrooivalksa"

.EXAMPLE
    .\Setup-CosmosContainers.ps1 -ResourceGroup "dev-euw-rg-rooivalk" -CosmosAccountName "phoenixrooivalksa" -SkipDatabase

.NOTES
    Requires Azure CLI to be installed and authenticated (az login).
    Run 'az login' before executing this script.
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$ResourceGroup,

    [Parameter(Mandatory = $true)]
    [string]$CosmosAccountName,

    [Parameter(Mandatory = $false)]
    [string]$DatabaseName = "phoenix-docs",

    [Parameter(Mandatory = $false)]
    [switch]$SkipDatabase
)

# Color output functions
function Write-Header {
    param([string]$Message)
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor Blue
}

# Check if Azure CLI is installed
function Test-AzureCLI {
    try {
        $azVersion = az version --output json 2>$null | ConvertFrom-Json
        Write-Success "Azure CLI version: $($azVersion.'azure-cli')"
        return $true
    }
    catch {
        Write-Error "Azure CLI is not installed or not in PATH"
        Write-Info "Install from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
        return $false
    }
}

# Check if logged in to Azure
function Test-AzureLogin {
    try {
        $account = az account show --output json 2>$null | ConvertFrom-Json
        Write-Success "Logged in as: $($account.user.name)"
        Write-Info "Subscription: $($account.name) ($($account.id))"
        return $true
    }
    catch {
        Write-Error "Not logged in to Azure"
        Write-Info "Run 'az login' to authenticate"
        return $false
    }
}

# Container definitions with partition keys
# Based on apps/docs/azure-functions/INFRASTRUCTURE.md
$containers = @(
    @{ Name = "news_articles"; PartitionKey = "/id"; Description = "News articles storage" },
    @{ Name = "user_news_preferences"; PartitionKey = "/userId"; Description = "User preferences" },
    @{ Name = "documents"; PartitionKey = "/id"; Description = "Document embeddings for RAG" },
    @{ Name = "support_tickets"; PartitionKey = "/id"; Description = "Support tickets" },
    @{ Name = "news_subscriptions"; PartitionKey = "/id"; Description = "Push/email subscriptions" },
    @{ Name = "notification_queue"; PartitionKey = "/id"; Description = "Email/notification queue" },
    @{ Name = "embeddings"; PartitionKey = "/id"; Description = "Vector embeddings cache" },
    @{ Name = "configuration"; PartitionKey = "/type"; Description = "Dynamic configuration" },
    @{ Name = "monitoring_logs"; PartitionKey = "/id"; Description = "Monitoring and metrics" },
    @{ Name = "cache"; PartitionKey = "/id"; Description = "General caching" }
)

# Main execution
Write-Header "Cosmos DB Containers Setup for Phoenix Rooivalk"

# Validate prerequisites
if (-not (Test-AzureCLI)) { exit 1 }
if (-not (Test-AzureLogin)) { exit 1 }

Write-Info "Configuration:"
Write-Host "  Resource Group:    $ResourceGroup" -ForegroundColor White
Write-Host "  Cosmos Account:    $CosmosAccountName" -ForegroundColor White
Write-Host "  Database Name:     $DatabaseName" -ForegroundColor White
Write-Host "  Containers:        $($containers.Count) containers" -ForegroundColor White
Write-Host ""

# Verify Cosmos DB account exists
Write-Info "Verifying Cosmos DB account..."
$cosmosExists = az cosmosdb show `
    --name $CosmosAccountName `
    --resource-group $ResourceGroup `
    --query "name" `
    --output tsv 2>$null

if (-not $cosmosExists) {
    Write-Error "Cosmos DB account '$CosmosAccountName' not found in resource group '$ResourceGroup'"
    Write-Info "Available Cosmos DB accounts:"
    az cosmosdb list --resource-group $ResourceGroup --output table
    exit 1
}

Write-Success "Cosmos DB account verified: $CosmosAccountName"

# Create database
if (-not $SkipDatabase) {
    Write-Header "Creating Database"
    Write-Info "Creating database '$DatabaseName'..."
    
    try {
        az cosmosdb sql database create `
            --account-name $CosmosAccountName `
            --resource-group $ResourceGroup `
            --name $DatabaseName `
            --output none 2>$null
        
        Write-Success "Database '$DatabaseName' created successfully"
    }
    catch {
        # Check if database already exists
        $dbExists = az cosmosdb sql database show `
            --account-name $CosmosAccountName `
            --resource-group $ResourceGroup `
            --name $DatabaseName `
            --query "name" `
            --output tsv 2>$null
        
        if ($dbExists) {
            Write-Warning "Database '$DatabaseName' already exists"
        }
        else {
            Write-Error "Failed to create database: $_"
            exit 1
        }
    }
}
else {
    Write-Info "Skipping database creation (using existing)"
}

# Create containers
Write-Header "Creating Containers"

$successCount = 0
$skippedCount = 0
$failedCount = 0

foreach ($container in $containers) {
    $containerName = $container.Name
    $partitionKey = $container.PartitionKey
    $description = $container.Description
    
    Write-Host "`nCreating container: " -NoNewline
    Write-Host "$containerName" -ForegroundColor Yellow -NoNewline
    Write-Host " ($description)"
    Write-Host "  Partition key: $partitionKey" -ForegroundColor Gray
    
    try {
        # Check if container already exists
        $existingContainer = az cosmosdb sql container show `
            --account-name $CosmosAccountName `
            --resource-group $ResourceGroup `
            --database-name $DatabaseName `
            --name $containerName `
            --query "name" `
            --output tsv 2>$null
        
        if ($existingContainer) {
            Write-Warning "  Container '$containerName' already exists - skipping"
            $skippedCount++
            continue
        }
        
        # Create container
        az cosmosdb sql container create `
            --account-name $CosmosAccountName `
            --resource-group $ResourceGroup `
            --database-name $DatabaseName `
            --name $containerName `
            --partition-key-path $partitionKey `
            --output none 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "  Container '$containerName' created successfully"
            $successCount++
        }
        else {
            Write-Error "  Failed to create container '$containerName'"
            $failedCount++
        }
    }
    catch {
        Write-Error "  Error creating container '$containerName': $_"
        $failedCount++
    }
}

# Summary
Write-Header "Summary"

Write-Host "Database: " -NoNewline
Write-Host "$DatabaseName" -ForegroundColor Cyan
Write-Host ""

Write-Host "Containers:" -ForegroundColor White
Write-Host "  Created:  " -NoNewline -ForegroundColor White
Write-Host "$successCount" -ForegroundColor Green
Write-Host "  Skipped:  " -NoNewline -ForegroundColor White
Write-Host "$skippedCount" -ForegroundColor Yellow
Write-Host "  Failed:   " -NoNewline -ForegroundColor White
Write-Host "$failedCount" -ForegroundColor Red
Write-Host ""

if ($failedCount -gt 0) {
    Write-Error "Some containers failed to create. Check the errors above."
    exit 1
}

Write-Success "Cosmos DB setup completed successfully!"

# Next steps
Write-Header "Next Steps"
Write-Info "1. Get your connection string:"
Write-Host "   az cosmosdb keys list --name $CosmosAccountName --resource-group $ResourceGroup --type connection-strings --query 'connectionStrings[0].connectionString' -o tsv" -ForegroundColor Gray
Write-Host ""
Write-Info "2. Add to GitHub secrets as COSMOS_DB_CONNECTION_STRING"
Write-Host ""
Write-Info "3. Add to local.settings.json for local development"
Write-Host ""
Write-Info "4. Run Get-AzureSecrets.ps1 to retrieve all secrets for GitHub Actions"
Write-Host ""
