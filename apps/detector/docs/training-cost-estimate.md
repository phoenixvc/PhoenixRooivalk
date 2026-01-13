# Training Cost Estimate

> **Back to**: [Detector README](../README.md) | [All Documentation](.)

## Azure ML GPU Pricing (East US, Jan 2025)

| VM Size         | GPU     | VRAM | $/hour | Best For                       |
| --------------- | ------- | ---- | ------ | ------------------------------ |
| NC4as_T4_v3     | 1x T4   | 16GB | $0.53  | MVP, small datasets            |
| NC6s_v3         | 1x V100 | 16GB | $3.06  | Production, medium datasets    |
| NC12s_v3        | 2x V100 | 32GB | $6.12  | Large datasets, fast iteration |
| NC24ads_A100_v4 | 1x A100 | 80GB | $3.67  | Large models, huge datasets    |

**Recommended: NC4as_T4_v3** - Best cost/performance for this project.

---

## Training Time Estimates

### YOLOv5n (Nano) - Recommended for Pi

| Dataset Size  | Classes | Epochs | T4 Time   | T4 Cost |
| ------------- | ------- | ------ | --------- | ------- |
| 1,000 images  | 2       | 100    | 1-2 hrs   | $0.50-1 |
| 2,500 images  | 10      | 100    | 3-4 hrs   | $1.50-2 |
| 5,000 images  | 10      | 100    | 5-7 hrs   | $2.50-4 |
| 5,000 images  | 27      | 100    | 6-8 hrs   | $3-4    |
| 10,000 images | 27      | 100    | 10-14 hrs | $5-7    |

### YOLOv5s (Small) - Better accuracy

| Dataset Size  | Classes | Epochs | T4 Time   | T4 Cost |
| ------------- | ------- | ------ | --------- | ------- |
| 5,000 images  | 10      | 100    | 8-12 hrs  | $4-6    |
| 5,000 images  | 27      | 100    | 10-14 hrs | $5-7    |
| 10,000 images | 27      | 100    | 18-24 hrs | $9-13   |

---

## Realistic Project Costs

### MVP (1 Week, 10 Classes)

| Item                           | Hours      | Cost      |
| ------------------------------ | ---------- | --------- |
| Initial training run           | 4 hrs      | $2        |
| Hyperparameter tuning (2 runs) | 8 hrs      | $4        |
| Final model + export           | 4 hrs      | $2        |
| **Total**                      | **16 hrs** | **$8-10** |

### Production (2-3 Weeks, 27 Classes)

| Item                                   | Hours      | Cost       |
| -------------------------------------- | ---------- | ---------- |
| Initial training run                   | 8 hrs      | $4         |
| Learning rate sweep (3 runs)           | 24 hrs     | $12        |
| Augmentation experiments (3 runs)      | 24 hrs     | $12        |
| Architecture comparison (YOLOv5n vs s) | 16 hrs     | $8         |
| Final model + quantization tests       | 8 hrs      | $4         |
| **Total**                              | **80 hrs** | **$40-50** |

### Research Grade (Ongoing)

| Item                  | Monthly Hours | Monthly Cost  |
| --------------------- | ------------- | ------------- |
| Continuous retraining | 40 hrs        | $20           |
| A/B model testing     | 20 hrs        | $10           |
| Edge case mining      | 20 hrs        | $10           |
| **Total**             | **80 hrs**    | **$40/month** |

---

## Cost Optimization Tips

### 1. Use Spot Instances (50-70% savings)

```bash
az ml compute create --name gpu-spot --type AmlCompute \
  --size Standard_NC4as_T4_v3 \
  --priority LowPriority \
  --min-instances 0 --max-instances 1
```

### 2. Cache Dataset in Compute

```yaml
# In job.yaml
inputs:
  dataset:
    type: uri_folder
    path: azureml://datastores/workspaceblobstore/paths/drone-dataset
    mode: download # Download once, not stream
```

### 3. Use Mixed Precision Training

```python
# In train.py - already enabled with amp=True
model.train(amp=True)  # 2x faster, same accuracy
```

### 4. Early Stopping

```python
model.train(patience=20)  # Stop if no improvement for 20 epochs
```

### 5. Start Small, Scale Up

1. Train on 1,000 images first (1 hr, $0.50)
2. If promising, scale to full dataset
3. Never run overnight without checkpointing

---

## Comparison: Cloud vs Local

### Cloud (Azure ML)

- **Pros**: Fast, scalable, no hardware investment
- **Cons**: Ongoing cost, data upload time
- **Best for**: Iteration, experiments, production training

### Local GPU (RTX 3060 example)

- **Pros**: One-time cost (~$300), no per-hour fees
- **Cons**: Slower, power costs, hardware maintenance
- **Best for**: Hobbyists, frequent small experiments

### Google Colab (Free Tier)

- **Pros**: Free GPU access
- **Cons**: Time limits, disconnections, slow for large datasets
- **Best for**: Prototyping, learning

---

## Total Project Budget

| Phase                         | Dataset     | Training | Hardware | Total    |
| ----------------------------- | ----------- | -------- | -------- | -------- |
| **MVP**                       | $0 (public) | $10      | $0       | **$10**  |
| **MVP + Coral**               | $0          | $10      | $60      | **$70**  |
| **Production**                | $0          | $50      | $0       | **$50**  |
| **Production + Pi 5 + Coral** | $0          | $50      | $160     | **$210** |

_Hardware costs are one-time purchases._

---

## Break-Even Analysis

**Question**: When does buying a local GPU make sense?

| GPU      | Cost   | Equivalent Azure Hours |
| -------- | ------ | ---------------------- |
| RTX 3060 | $300   | 560 hours on T4        |
| RTX 4070 | $550   | 1,040 hours on T4      |
| RTX 4090 | $1,600 | 3,000 hours on T4      |

**Recommendation**:

- If training <500 hours/year → Use Azure
- If training >500 hours/year → Consider local GPU
