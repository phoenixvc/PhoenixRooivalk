# Azure ML Training Infrastructure

Terraform configuration for provisioning Azure Machine Learning resources
for the Phoenix Rooivalk drone detection model training.

## Prerequisites

1. **Azure CLI** installed and logged in:
   ```bash
   az login
   az account set --subscription "YOUR_SUBSCRIPTION_ID"
   ```

2. **Terraform** >= 1.5.0 installed:
   ```bash
   # macOS
   brew install terraform

   # Ubuntu
   sudo apt-get install terraform

   # Verify
   terraform version
   ```

## Quick Start

```bash
# Navigate to this directory
cd infra/terraform/ml-training

# Initialize Terraform
terraform init

# Review the plan (dev environment)
terraform plan -var-file="environments/dev.tfvars"

# Apply the configuration
terraform apply -var-file="environments/dev.tfvars"

# Get outputs (useful CLI commands)
terraform output cli_commands
```

## Resources Created

| Resource | Purpose |
|----------|---------|
| Resource Group | Container for all ML resources |
| Storage Account | Dataset and model storage |
| Key Vault | Secrets management |
| Application Insights | Training monitoring |
| ML Workspace | Azure ML workspace |
| GPU Compute Cluster | Training compute (T4/V100/A100) |
| Container Registry | Custom environments (optional) |
| CPU Cluster | Data preprocessing (optional) |

## Environments

### Development (`environments/dev.tfvars`)
- T4 GPU (cost-effective, ~$0.53/hr)
- Single node, quick scale-down
- Minimal resources

### Production (`environments/prod.tfvars`)
- V100 GPU (higher performance, ~$3.06/hr)
- Multiple nodes for parallel experiments
- Container registry for custom environments
- CPU cluster for preprocessing

## Usage After Deployment

### 1. Upload Dataset

```bash
# Get values from Terraform outputs
RESOURCE_GROUP=$(terraform output -raw resource_group_name)
WORKSPACE=$(terraform output -raw ml_workspace_name)

# Upload dataset to ML workspace
az ml data create \
  --name drone-dataset \
  --path ../../../apps/detector/data/combined \
  --type uri_folder \
  --resource-group $RESOURCE_GROUP \
  --workspace-name $WORKSPACE
```

### 2. Submit Training Job

```bash
# Submit the training job
az ml job create \
  --file ../../../apps/detector/azure-ml/job.yaml \
  --resource-group $RESOURCE_GROUP \
  --workspace-name $WORKSPACE
```

### 3. Monitor Training

```bash
# List jobs
az ml job list \
  --resource-group $RESOURCE_GROUP \
  --workspace-name $WORKSPACE \
  --output table

# Stream logs (replace JOB_NAME)
az ml job stream \
  --name <JOB_NAME> \
  --resource-group $RESOURCE_GROUP \
  --workspace-name $WORKSPACE
```

### 4. Download Trained Model

```bash
# Download job outputs (replace JOB_NAME)
az ml job download \
  --name <JOB_NAME> \
  --resource-group $RESOURCE_GROUP \
  --workspace-name $WORKSPACE \
  --output-name model
```

## Cost Management

### GPU Options

| VM Size | GPU | VRAM | Cost/hr | Best For |
|---------|-----|------|---------|----------|
| Standard_NC4as_T4_v3 | T4 | 16GB | ~$0.53 | MVP, cost-sensitive |
| Standard_NC6s_v3 | V100 | 16GB | ~$3.06 | Production |
| Standard_NC24ads_A100_v4 | A100 | 80GB | ~$3.67 | Large models |

### Estimated Training Costs

| Dataset | T4 GPU | V100 GPU |
|---------|--------|----------|
| MVP (10 classes) | $3-5 | $10-15 |
| Full (27 classes) | $10-15 | $30-50 |

### Cost Saving Tips

1. **Scale to zero**: Set `min_nodes = 0` (default)
2. **Short idle timeout**: Use 15 min for dev, 30 min for prod
3. **Spot instances**: Set `use_spot_instances = true` (up to 80% savings, may be preempted)
4. **T4 GPU**: Use Standard_NC4as_T4_v3 for MVP

## Cleanup

```bash
# Destroy all resources
terraform destroy -var-file="environments/dev.tfvars"
```

## Troubleshooting

### "Quota exceeded"
Request GPU quota increase in Azure portal:
1. Go to Subscriptions > Your Sub > Usage + quotas
2. Search for "NC" series
3. Request increase

### "Region not available"
Try different regions:
- `eastus` (most availability)
- `westus2`
- `westeurope`

### "Compute cluster stuck"
```bash
# Force delete compute cluster
az ml compute delete \
  --name gpu-cluster \
  --resource-group $RESOURCE_GROUP \
  --workspace-name $WORKSPACE \
  --yes
```

## Integration with CI/CD

See `.github/workflows/ml-training.yml` for automated training pipeline.

## Related Documentation

- [Training Script](../../../apps/detector/azure-ml/README.md)
- [Dataset Configuration](../../../apps/detector/configs/README.md)
- [Azure ML Documentation](https://docs.microsoft.com/azure/machine-learning/)
