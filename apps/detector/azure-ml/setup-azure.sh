#!/bin/bash
# Azure ML Setup Script for Drone Detection Training
#
# Prerequisites:
#   - Azure CLI installed: https://docs.microsoft.com/cli/azure/install-azure-cli
#   - Logged in: az login
#
# Usage:
#   chmod +x setup-azure.sh
#   ./setup-azure.sh

set -e

# Configuration - modify these as needed
RESOURCE_GROUP="${RESOURCE_GROUP:-rg-drone-training}"
WORKSPACE_NAME="${WORKSPACE_NAME:-mlw-drone-detection}"
LOCATION="${LOCATION:-eastus}"
COMPUTE_NAME="${COMPUTE_NAME:-gpu-cluster}"
COMPUTE_SIZE="${COMPUTE_SIZE:-Standard_NC4as_T4_v3}"  # T4 GPU, cost-effective

echo "================================================"
echo "Azure ML Setup for Drone Detection"
echo "================================================"
echo "Resource Group: $RESOURCE_GROUP"
echo "Workspace: $WORKSPACE_NAME"
echo "Location: $LOCATION"
echo "Compute: $COMPUTE_NAME ($COMPUTE_SIZE)"
echo "================================================"
echo ""

# Check if logged in
echo "[1/5] Checking Azure login..."
if ! az account show &> /dev/null; then
    echo "Not logged in. Running 'az login'..."
    az login
fi
echo "  Logged in as: $(az account show --query user.name -o tsv)"
echo ""

# Install ML extension
echo "[2/5] Installing Azure ML CLI extension..."
az extension add -n ml --upgrade -y 2>/dev/null || true
echo "  ML extension installed"
echo ""

# Create resource group
echo "[3/5] Creating resource group..."
if az group show --name "$RESOURCE_GROUP" &> /dev/null; then
    echo "  Resource group '$RESOURCE_GROUP' already exists"
else
    az group create --name "$RESOURCE_GROUP" --location "$LOCATION" --output none
    echo "  Created resource group '$RESOURCE_GROUP'"
fi
echo ""

# Create workspace
echo "[4/5] Creating Azure ML workspace..."
if az ml workspace show --name "$WORKSPACE_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
    echo "  Workspace '$WORKSPACE_NAME' already exists"
else
    echo "  Creating workspace (this may take a few minutes)..."
    az ml workspace create \
        --name "$WORKSPACE_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --location "$LOCATION" \
        --output none
    echo "  Created workspace '$WORKSPACE_NAME'"
fi
echo ""

# Create compute cluster
echo "[5/5] Creating GPU compute cluster..."
if az ml compute show --name "$COMPUTE_NAME" --resource-group "$RESOURCE_GROUP" --workspace-name "$WORKSPACE_NAME" &> /dev/null; then
    echo "  Compute cluster '$COMPUTE_NAME' already exists"
else
    echo "  Creating compute cluster (auto-scales to 0 when idle)..."
    az ml compute create \
        --name "$COMPUTE_NAME" \
        --type AmlCompute \
        --size "$COMPUTE_SIZE" \
        --min-instances 0 \
        --max-instances 1 \
        --idle-time-before-scale-down 1800 \
        --resource-group "$RESOURCE_GROUP" \
        --workspace-name "$WORKSPACE_NAME" \
        --output none
    echo "  Created compute cluster '$COMPUTE_NAME'"
fi
echo ""

echo "================================================"
echo "Setup Complete!"
echo "================================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Prepare your dataset:"
echo "   python ../scripts/download_datasets.py --output ../data"
echo ""
echo "2. Upload dataset to Azure ML:"
echo "   az ml data create \\"
echo "     --name drone-dataset \\"
echo "     --path ../data/combined \\"
echo "     --type uri_folder \\"
echo "     --resource-group $RESOURCE_GROUP \\"
echo "     --workspace-name $WORKSPACE_NAME"
echo ""
echo "3. Submit training job:"
echo "   az ml job create \\"
echo "     --file job.yaml \\"
echo "     --resource-group $RESOURCE_GROUP \\"
echo "     --workspace-name $WORKSPACE_NAME"
echo ""
echo "4. Monitor training:"
echo "   az ml job stream --name <job-name> \\"
echo "     --resource-group $RESOURCE_GROUP \\"
echo "     --workspace-name $WORKSPACE_NAME"
echo ""
echo "Estimated cost: ~\$3-5 for full training run"
echo ""
