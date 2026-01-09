# Azure ML Training

Training infrastructure for the Phoenix Rooivalk drone detection model
using Azure Machine Learning.

## Quick Start

### 1. Setup Infrastructure (one-time)

```bash
# Option A: Using Terraform (recommended)
cd infra/terraform/ml-training
terraform init
terraform apply -var-file="environments/dev.tfvars"

# Option B: Using setup script
cd apps/detector/azure-ml
chmod +x setup-azure.sh
./setup-azure.sh
```

### 2. Prepare Dataset

```bash
# Download public datasets
cd apps/detector
python scripts/download_public_datasets.py --output ./data --all

# Or with Roboflow API key for more data
ROBOFLOW_API_KEY=xxx python scripts/download_public_datasets.py --output ./data --roboflow
```

### 3. Upload to Azure ML

```bash
# Get workspace info from Terraform
cd infra/terraform/ml-training
RG=$(terraform output -raw resource_group_name)
WS=$(terraform output -raw ml_workspace_name)

# Upload dataset
az ml data create \
  --name drone-dataset \
  --path ../../apps/detector/data/combined \
  --type uri_folder \
  --resource-group $RG \
  --workspace-name $WS
```

### 4. Submit Training Job

```bash
cd apps/detector/azure-ml

# Submit with defaults (yolov8n, 100 epochs)
az ml job create --file job.yaml --resource-group $RG --workspace-name $WS

# Submit with custom parameters
az ml job create --file job.yaml \
  --resource-group $RG \
  --workspace-name $WS \
  --set inputs.epochs=150 \
  --set inputs.model=yolov8s.pt
```

### 5. Monitor & Download

```bash
# Stream logs
az ml job stream --name <JOB_NAME> --resource-group $RG --workspace-name $WS

# Download trained model
az ml job download --name <JOB_NAME> --resource-group $RG --workspace-name $WS \
  --output-name model --download-path ./outputs
```

## Files

| File | Purpose |
|------|---------|
| `train.py` | Training script with model export |
| `job.yaml` | Azure ML job definition |
| `conda.yaml` | Training environment dependencies |
| `setup-azure.sh` | Manual Azure CLI setup (alternative to Terraform) |

## Training Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `epochs` | 100 | Training epochs |
| `imgsz` | 320 | Image size (square) |
| `batch` | 16 | Batch size |
| `model` | yolov8n.pt | Base model |
| `patience` | 20 | Early stopping patience |

## Supported Models

| Model | Size | Speed | Accuracy | Best For |
|-------|------|-------|----------|----------|
| `yolov8n.pt` | 6MB | ⭐⭐⭐ | ⭐⭐ | Raspberry Pi |
| `yolov8s.pt` | 22MB | ⭐⭐ | ⭐⭐⭐ | Jetson |
| `yolov8m.pt` | 52MB | ⭐ | ⭐⭐⭐⭐ | Desktop |

## Cost Estimates

| Configuration | Time | Cost |
|---------------|------|------|
| MVP (T4, 100 epochs) | 6-10 hrs | $3-5 |
| Full (T4, 150 epochs) | 20-30 hrs | $10-15 |
| Full (V100, 100 epochs) | 5-8 hrs | $15-25 |

## Outputs

Training produces:

- `drone-detector.pt` - PyTorch model
- `drone-detector_int8.tflite` - TFLite INT8 (for Pi)
- `drone-detector.onnx` - ONNX (for Jetson)
- `training_metadata.json` - Metrics and config

## Troubleshooting

### GPU Quota Error

Request quota increase in Azure Portal: Subscriptions → Usage + quotas → Search "NC"

### OOM Error

Reduce batch size: `--set inputs.batch=8`

### Training Stuck

Check logs: `az ml job stream --name <JOB_NAME> ...`

## CI/CD

Automated training via GitHub Actions: `.github/workflows/ml-training.yml`

Trigger manually from Actions tab with custom parameters.
