<#
.SYNOPSIS
    Retrieves Azure secrets and configuration for GitHub Actions deployment.

.DESCRIPTION
    This script retrieves all required Azure resources, secrets, and configuration
    values needed for the Phoenix Rooivalk Azure Functions deployment. It outputs
    the values needed to configure GitHub secrets and variables.

.PARAMETER ResourceGroup
    The Azure resource group name containing the resources.

.PARAMETER FunctionAppName
    The name of the Azure Function App.

.PARAMETER CosmosDbAccountName
    The name of the Cosmos DB account.

.PARAMETER OpenAIAccountName
    The name of the Azure OpenAI account.

.PARAMETER ChatDeploymentName
    The name of the OpenAI chat model deployment (default: gpt-4).

.PARAMETER AppInsightsName
    Optional. The name of the Application Insights resource.

.PARAMETER NotificationHubNamespace
    Optional. The name of the Notification Hub namespace.

.PARAMETER NotificationHubName
    Optional. The name of the Notification Hub.

.EXAMPLE
    .\Get-AzureSecrets.ps1 -ResourceGroup "rg-phoenix-rooivalk" -FunctionAppName "func-phoenix-rooivalk" -CosmosDbAccountName "cosmos-phoenix-rooivalk" -OpenAIAccountName "aoai-phoenix-rooivalk"

.NOTES
    Requires Azure CLI to be installed and authenticated (az login).
    Run 'az login' before executing this script.
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [string]$ResourceGroup,

    [Parameter(Mandatory = $false)]
    [string]$FunctionAppName,

    [Parameter(Mandatory = $false)]
    [string]$CosmosDbAccountName,

    [Parameter(Mandatory = $false)]
    [string]$OpenAIAccountName,

    [Parameter(Mandatory = $false)]
    [string]$ChatDeploymentName = "gpt-4",

    [Parameter(Mandatory = $false)]
    [string]$AppInsightsName,

    [Parameter(Mandatory = $false)]
    [string]$NotificationHubNamespace,

    [Parameter(Mandatory = $false)]
    [string]$NotificationHubName
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

# List available resource groups if not specified
function Get-ResourceGroups {
    Write-Header "Available Resource Groups"
    $groups = az group list --output json | ConvertFrom-Json
    $groups | ForEach-Object { 
        Write-Host "  - $($_.name) ($($_.location))" -ForegroundColor White
    }
    return $groups
}

# List function apps in a resource group
function Get-FunctionApps {
    param([string]$RG)
    Write-Header "Function Apps in $RG"
    $apps = az functionapp list --resource-group $RG --output json 2>$null | ConvertFrom-Json
    if ($apps) {
        $apps | ForEach-Object { 
            Write-Host "  - $($_.name) (Runtime: $($_.kind))" -ForegroundColor White
        }
    }
    else {
        Write-Warning "No Function Apps found in $RG"
    }
    return $apps
}

# List Cosmos DB accounts in a resource group
function Get-CosmosDbAccounts {
    param([string]$RG)
    Write-Header "Cosmos DB Accounts in $RG"
    $accounts = az cosmosdb list --resource-group $RG --output json 2>$null | ConvertFrom-Json
    if ($accounts) {
        $accounts | ForEach-Object { 
            Write-Host "  - $($_.name) ($($_.location))" -ForegroundColor White
        }
    }
    else {
        Write-Warning "No Cosmos DB accounts found in $RG"
    }
    return $accounts
}

# List Cognitive Services (OpenAI) accounts in a resource group
function Get-OpenAIAccounts {
    param([string]$RG)
    Write-Header "Azure OpenAI Accounts in $RG"
    $accounts = az cognitiveservices account list --resource-group $RG --output json 2>$null | ConvertFrom-Json
    $openAIAccounts = $accounts | Where-Object { $_.kind -eq "OpenAI" }
    if ($openAIAccounts) {
        $openAIAccounts | ForEach-Object { 
            Write-Host "  - $($_.name) ($($_.location))" -ForegroundColor White
        }
    }
    else {
        Write-Warning "No Azure OpenAI accounts found in $RG"
    }
    return $openAIAccounts
}

# Main execution
Write-Header "Azure Secrets Retrieval for GitHub Actions"

# Validate prerequisites
if (-not (Test-AzureCLI)) { exit 1 }
if (-not (Test-AzureLogin)) { exit 1 }

# Interactive mode if parameters not provided
if (-not $ResourceGroup) {
    $groups = Get-ResourceGroups
    $ResourceGroup = Read-Host "`nEnter Resource Group name"
}

if (-not $FunctionAppName) {
    $apps = Get-FunctionApps -RG $ResourceGroup
    $FunctionAppName = Read-Host "`nEnter Function App name"
}

if (-not $CosmosDbAccountName) {
    $cosmosAccounts = Get-CosmosDbAccounts -RG $ResourceGroup
    $CosmosDbAccountName = Read-Host "`nEnter Cosmos DB account name"
}

if (-not $OpenAIAccountName) {
    $openAIAccounts = Get-OpenAIAccounts -RG $ResourceGroup
    $OpenAIAccountName = Read-Host "`nEnter Azure OpenAI account name"
}

# Retrieve secrets and configuration
Write-Header "Retrieving Required Secrets and Variables"

$secrets = @{}
$variables = @{}
$errors = @()

# 1. AZURE_FUNCTIONAPP_PUBLISH_PROFILE
try {
    Write-Host "Retrieving Function App publish profile..." -NoNewline
    $publishProfile = az functionapp deployment list-publishing-profiles `
        --name $FunctionAppName `
        --resource-group $ResourceGroup `
        --xml 2>$null
    
    if ($LASTEXITCODE -eq 0 -and $publishProfile) {
        $secrets['AZURE_FUNCTIONAPP_PUBLISH_PROFILE'] = $publishProfile
        Write-Success " Retrieved"
    }
    else {
        Write-Error " Failed"
        $errors += "Failed to retrieve publish profile for $FunctionAppName"
    }
}
catch {
    Write-Error " Failed - $_"
    $errors += "Error retrieving publish profile: $_"
}

# 2. AZURE_CREDENTIALS (Service Principal)
Write-Host "Retrieving Azure credentials (Service Principal)..." -NoNewline
Write-Warning " Manual setup required"
Write-Info "  Run: az ad sp create-for-rbac --name `"github-actions-phoenix`" --role contributor --scopes /subscriptions/{subscription-id}/resourceGroups/$ResourceGroup --sdk-auth"
Write-Info "  Store the JSON output as AZURE_CREDENTIALS secret"

# 3. COSMOS_DB_CONNECTION_STRING
try {
    Write-Host "Retrieving Cosmos DB connection string..." -NoNewline
    $cosmosConnString = az cosmosdb keys list `
        --name $CosmosDbAccountName `
        --resource-group $ResourceGroup `
        --type connection-strings `
        --query "connectionStrings[0].connectionString" `
        --output tsv 2>$null
    
    if ($LASTEXITCODE -eq 0 -and $cosmosConnString) {
        $secrets['COSMOS_DB_CONNECTION_STRING'] = $cosmosConnString
        Write-Success " Retrieved"
    }
    else {
        Write-Error " Failed"
        $errors += "Failed to retrieve Cosmos DB connection string for $CosmosDbAccountName"
    }
}
catch {
    Write-Error " Failed - $_"
    $errors += "Error retrieving Cosmos DB connection string: $_"
}

# 4. AZURE_AI_ENDPOINT
try {
    Write-Host "Retrieving Azure OpenAI endpoint..." -NoNewline
    $aiEndpoint = az cognitiveservices account show `
        --name $OpenAIAccountName `
        --resource-group $ResourceGroup `
        --query "properties.endpoint" `
        --output tsv 2>$null
    
    if ($LASTEXITCODE -eq 0 -and $aiEndpoint) {
        $secrets['AZURE_AI_ENDPOINT'] = $aiEndpoint
        Write-Success " Retrieved"
    }
    else {
        Write-Error " Failed"
        $errors += "Failed to retrieve Azure OpenAI endpoint for $OpenAIAccountName"
    }
}
catch {
    Write-Error " Failed - $_"
    $errors += "Error retrieving Azure OpenAI endpoint: $_"
}

# 5. AZURE_AI_API_KEY or AZURE_OPENAI_API_KEY
try {
    Write-Host "Retrieving Azure OpenAI API key..." -NoNewline
    $aiApiKey = az cognitiveservices account keys list `
        --name $OpenAIAccountName `
        --resource-group $ResourceGroup `
        --query "key1" `
        --output tsv 2>$null
    
    if ($LASTEXITCODE -eq 0 -and $aiApiKey) {
        $secrets['AZURE_AI_API_KEY'] = $aiApiKey
        $secrets['AZURE_OPENAI_API_KEY'] = $aiApiKey  # Alternative name
        Write-Success " Retrieved"
    }
    else {
        Write-Error " Failed"
        $errors += "Failed to retrieve Azure OpenAI API key for $OpenAIAccountName"
    }
}
catch {
    Write-Error " Failed - $_"
    $errors += "Error retrieving Azure OpenAI API key: $_"
}

# 6. AZURE_FUNCTIONAPP_NAME (Variable)
$variables['AZURE_FUNCTIONAPP_NAME'] = $FunctionAppName
Write-Success "Function App name: $FunctionAppName"

# 7. AZURE_AI_DEPLOYMENT_NAME (Variable)
$variables['AZURE_AI_DEPLOYMENT_NAME'] = $ChatDeploymentName
Write-Success "Chat deployment name: $ChatDeploymentName"

# Optional: Application Insights
if ($AppInsightsName) {
    try {
        Write-Host "Retrieving Application Insights connection string..." -NoNewline
        $appInsightsConnString = az monitor app-insights component show `
            --app $AppInsightsName `
            --resource-group $ResourceGroup `
            --query "connectionString" `
            --output tsv 2>$null
        
        if ($LASTEXITCODE -eq 0 -and $appInsightsConnString) {
            $secrets['APPLICATIONINSIGHTS_CONNECTION_STRING'] = $appInsightsConnString
            Write-Success " Retrieved"
        }
        else {
            Write-Warning " Not found"
        }
    }
    catch {
        Write-Warning " Failed - $_"
    }
}

# Optional: Notification Hub
if ($NotificationHubNamespace -and $NotificationHubName) {
    try {
        Write-Host "Retrieving Notification Hub connection string..." -NoNewline
        $nhConnString = az notification-hub authorization-rule list-keys `
            --resource-group $ResourceGroup `
            --namespace-name $NotificationHubNamespace `
            --notification-hub-name $NotificationHubName `
            --name DefaultFullSharedAccessSignature `
            --query "primaryConnectionString" `
            --output tsv 2>$null
        
        if ($LASTEXITCODE -eq 0 -and $nhConnString) {
            $secrets['AZURE_NOTIFICATION_HUB_CONNECTION_STRING'] = $nhConnString
            Write-Success " Retrieved"
        }
        else {
            Write-Warning " Not found"
        }
    }
    catch {
        Write-Warning " Failed - $_"
    }
}

# Display results
Write-Header "GitHub Secrets Configuration"

if ($secrets.Count -gt 0) {
    Write-Info "Add these as GitHub Repository Secrets:"
    Write-Host ""
    
    foreach ($key in $secrets.Keys | Sort-Object) {
        $value = $secrets[$key]
        $displayValue = if ($value.Length -gt 50) { 
            $value.Substring(0, 47) + "..." 
        } else { 
            $value 
        }
        
        Write-Host "  $key" -ForegroundColor Yellow
        Write-Host "    $displayValue" -ForegroundColor Gray
        Write-Host ""
    }
}

Write-Header "GitHub Variables Configuration"

if ($variables.Count -gt 0) {
    Write-Info "Add these as GitHub Repository Variables:"
    Write-Host ""
    
    foreach ($key in $variables.Keys | Sort-Object) {
        Write-Host "  $key = $($variables[$key])" -ForegroundColor Cyan
    }
    Write-Host ""
}

# Export to file
$outputPath = Join-Path $PSScriptRoot "azure-secrets-output.txt"
$outputContent = @"
# Azure Secrets and Variables for GitHub Actions
# Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# Resource Group: $ResourceGroup

## GitHub Secrets
# Add these in: GitHub Repository → Settings → Secrets and variables → Actions → Secrets

"@

foreach ($key in $secrets.Keys | Sort-Object) {
    $outputContent += "`n$key`n$($secrets[$key])`n"
}

$outputContent += @"

## GitHub Variables
# Add these in: GitHub Repository → Settings → Secrets and variables → Actions → Variables

"@

foreach ($key in $variables.Keys | Sort-Object) {
    $outputContent += "`n$key=$($variables[$key])"
}

$outputContent += @"


## How to Add Secrets to GitHub:
1. Go to your repository on GitHub
2. Click Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Enter the secret name and value from above
5. Click "Add secret"
6. Repeat for each secret

## How to Add Variables to GitHub:
1. Go to your repository on GitHub
2. Click Settings → Secrets and variables → Actions
3. Click the "Variables" tab
4. Click "New repository variable"
5. Enter the variable name and value from above
6. Click "Add variable"
7. Repeat for each variable

## Notes:
- AZURE_CREDENTIALS requires creating a service principal (see above)
- Keep these secrets secure and never commit them to source control
- Rotate secrets regularly for security
"@

$outputContent | Out-File -FilePath $outputPath -Encoding UTF8
Write-Success "Results saved to: $outputPath"

# Summary
Write-Header "Summary"

if ($errors.Count -gt 0) {
    Write-Warning "Completed with errors:"
    $errors | ForEach-Object { Write-Error "  - $_" }
    Write-Host ""
}

Write-Info "Retrieved $($secrets.Count) secrets and $($variables.Count) variables"
Write-Info "Review the output file for complete instructions"

# Copy to clipboard if available
if (Get-Command Set-Clipboard -ErrorAction SilentlyContinue) {
    $outputContent | Set-Clipboard
    Write-Success "Results copied to clipboard!"
}

Write-Host ""
Write-Info "Next steps:"
Write-Host "  1. Review the secrets and variables above" -ForegroundColor White
Write-Host "  2. Add them to GitHub Repository Settings" -ForegroundColor White
Write-Host "  3. Create service principal for AZURE_CREDENTIALS:" -ForegroundColor White
Write-Host "     az ad sp create-for-rbac --name 'github-actions-phoenix' --role contributor --scopes /subscriptions/{subscription-id}/resourceGroups/$ResourceGroup --sdk-auth" -ForegroundColor Gray
Write-Host "  4. Re-run the GitHub Actions workflow" -ForegroundColor White
Write-Host ""
