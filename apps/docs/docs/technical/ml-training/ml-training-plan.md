---
id: ml-training-plan
title: ML Model Training & Fine-Tuning Plan
sidebar_label: ML Training Plan
difficulty: intermediate
estimated_reading_time: 10
points: 15
tags:
  - technical
  - ai
  - counter-uas
---

## Executive Summary

This document provides a comprehensive training and fine-tuning strategy for all
ML models in the Phoenix Rooivalk counter-drone system. The strategy is
optimized for achieving **99.7% threat detection accuracy** with **sub-200ms
inference latency**.

### Key Decisions Summary

| Model       | Approach           | Rationale                       |
| ----------- | ------------------ | ------------------------------- |
| Optical     | Fine-tune          | ImageNet features transfer well |
| RF          | Train from scratch | No suitable pretrained models   |
| Radar       | Train from scratch | Domain-specific sequences       |
| Acoustic    | Fine-tune          | AudioSet contains motor sounds  |
| Fusion      | Train from scratch | Custom architecture             |
| Behavioral  | Train from scratch | Graph structure is unique       |
| Attribution | Train from scratch | Tabular data, fast training     |

### Resource Summary

| Resource     | Specification                                    |
| ------------ | ------------------------------------------------ |
| **Timeline** | 16 weeks                                         |
| **Compute**  | 4× NVIDIA A100 GPUs                              |
| **Budget**   | ~$45,000 (cloud) or 8 weeks (dedicated hardware) |
| **Data**     | 380,000+ labeled samples across all modalities   |

---

## Training vs Fine-Tuning Decision Matrix

### Fundamental Difference

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TRAINING FROM SCRATCH                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Random Weights ──────────► Train ALL Layers ──────────► Learned Model    │
│        [????]                  (100k+ samples)              [Domain]        │
│                                                                             │
│   • Model learns EVERYTHING from zero                                       │
│   • Must learn basic features (edges, textures, patterns)                   │
│   • Requires massive labeled dataset                                        │
│   • High compute cost, long training time                                   │
│   • Full architectural flexibility                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              FINE-TUNING                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Pretrained Model ────────► Adapt Layers ──────────────► Adapted Model    │
│   [ImageNet/AudioSet]        (5k-50k samples)              [Your Domain]   │
│                                                                             │
│   • Model already knows universal features                                  │
│   • Only adapts to YOUR specific task                                       │
│   • Works with smaller datasets                                             │
│   • Lower compute, faster convergence                                       │
│   • Risk: catastrophic forgetting                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Decision Criteria

| Criterion                  | Train from Scratch | Fine-Tune |
| -------------------------- | ------------------ | --------- |
| Pretrained model exists?   | No                 | Yes       |
| Domain similarity          | Very different     | Similar   |
| Labeled data available     | 100k+              | 5k-50k    |
| Compute budget             | High               | Limited   |
| Time constraint            | Flexible           | Tight     |
| Custom architecture needed | Yes                | No        |

---

## Progressive Unfreezing Strategy

Progressive unfreezing is the key technique for successful fine-tuning. It
prevents catastrophic forgetting while allowing the model to adapt to your
domain.

### The Problem: Catastrophic Forgetting

When fine-tuning, aggressive training can destroy valuable pretrained knowledge:

```
BEFORE FINE-TUNING (Pretrained on ImageNet):
┌─────────────────────────────────────────────────────────────────────────────┐
│ Stage 1: [edges ✓] [colors ✓] [gradients ✓]                                │
│ Stage 2: [textures ✓] [patterns ✓] [curves ✓]                              │
│ Stage 3: [shapes ✓] [parts ✓] [objects ✓]                                  │
│ Stage 4: [compositions ✓] [scenes ✓] [contexts ✓]                          │
│ Head:    [ImageNet classes - not useful]                                    │
└─────────────────────────────────────────────────────────────────────────────┘

AFTER AGGRESSIVE FINE-TUNING (High LR on all layers):
┌─────────────────────────────────────────────────────────────────────────────┐
│ Stage 1: [????? ✗] [????? ✗] [????? ✗]          ← DESTROYED!               │
│ Stage 2: [????? ✗] [drone?? ✗] [????? ✗]        ← DESTROYED!               │
│ Stage 3: [drone ✓] [bird ~] [????? ✗]           ← PARTIALLY LOST           │
│ Stage 4: [drone ✓] [bird ✓] [aircraft ✓]        ← LEARNED                  │
│ Head:    [your classes ✓]                        ← LEARNED                  │
└─────────────────────────────────────────────────────────────────────────────┘

         Model forgot HOW TO SEE! Only knows drones now.
         Will fail on edge cases, generalization is poor.
```

### The Solution: Progressive Unfreezing Timeline

```
STAGE 1: Train Head Only (Epochs 1-5)
─────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────┐
│ Stage 1: [FROZEN ❄️] edges, colors, gradients           │
│ Stage 2: [FROZEN ❄️] textures, patterns                 │
│ Stage 3: [FROZEN ❄️] shapes, parts                      │
│ Stage 4: [FROZEN ❄️] compositions                       │
│ Head:    [TRAINING 🔥] LR = 1e-3                        │  ← Only this trains
└─────────────────────────────────────────────────────────┘

   Purpose: Learn task-specific classification without
            disturbing any pretrained features.
   Result:  Baseline accuracy ~85-90%


STAGE 2: Unfreeze Last 1-2 Stages (Epochs 6-25)
─────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────┐
│ Stage 1: [FROZEN ❄️] edges, colors, gradients           │
│ Stage 2: [FROZEN ❄️] textures, patterns                 │
│ Stage 3: [TRAINING 🔥] LR = 1e-5    shapes → drone parts│  ← Adapting
│ Stage 4: [TRAINING 🔥] LR = 1e-4    comps → drone views │  ← Adapting
│ Head:    [TRAINING 🔥] LR = 1e-3                        │
└─────────────────────────────────────────────────────────┘

   Purpose: Adapt high-level features to drone domain
            while preserving universal low-level features.
   Result:  Accuracy improves to ~94-96%


STAGE 3: Unfreeze All with Differential LR (Epochs 26-50+)
─────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────┐
│ Stage 1: [TRAINING 🔥] LR = 1e-7    minimal adjustment  │  ← Tiny updates
│ Stage 2: [TRAINING 🔥] LR = 1e-6    small refinement    │  ← Small updates
│ Stage 3: [TRAINING 🔥] LR = 1e-5    moderate tuning     │  ← Medium updates
│ Stage 4: [TRAINING 🔥] LR = 1e-4    active learning     │  ← Larger updates
│ Head:    [TRAINING 🔥] LR = 1e-3    most learning       │  ← Most updates
└─────────────────────────────────────────────────────────┘

   Purpose: Fine-tune entire network with learning rates
            proportional to how much each layer should change.
   Result:  Final accuracy ~97-99%
```

### Stage-by-Stage Expected Results

| Stage     | Epochs | Trainable Params | Val Accuracy | Training Time |
| --------- | ------ | ---------------- | ------------ | ------------- |
| 1         | 5      | 1.2M (1%)        | 85-88%       | ~2 hours      |
| 2         | 20     | 35M (39%)        | 94-96%       | ~12 hours     |
| 3         | 25-50  | 89M (100%)       | 97-99%       | ~20 hours     |
| **TOTAL** | 50-75  | -                | 97-99%       | ~34 hours     |

---

## Model Training Plans

### Optical Detection (ConvNeXt)

**Training Type**: Fine-tune from ImageNet-22k

#### Data Requirements

| Dataset Component | Quantity     | Source                  |
| ----------------- | ------------ | ----------------------- |
| Commercial drones | 25,000       | Field trials, synthetic |
| Military drones   | 15,000       | Partner data            |
| Birds             | 20,000       | Public datasets, field  |
| Aircraft          | 12,000       | Public datasets         |
| Unknown objects   | 10,000       | Field trials            |
| **Total**         | **100,000+** |                         |

#### Progressive Unfreezing Schedule

| Stage | Epochs | Frozen     | Learning Rate                            | Expected Accuracy |
| ----- | ------ | ---------- | ---------------------------------------- | ----------------- |
| 1     | 5      | Stages 0-3 | Head: 1e-3                               | 85-88%            |
| 2     | 20     | Stages 0-1 | Stage 2: 1e-5, Stage 3: 1e-4, Head: 1e-3 | 94-96%            |
| 3     | 25-50  | None       | Differential 1e-7 to 1e-3                | 97-99%            |

#### Training Configuration

```python
optical_config = {
    "model": "convnext_base.fb_in22k_ft_in1k_384",
    "input_size": (384, 384),
    "batch_size": 32,
    "optimizer": "AdamW",
    "weight_decay": 0.05,
    "label_smoothing": 0.1,
    "mixup_alpha": 0.2,
    "cutmix_alpha": 1.0,
    "gradient_clip": 1.0,
    "precision": "bf16-mixed",
    "augmentation": [
        "RandomResizedCrop",
        "HorizontalFlip",
        "ColorJitter",
        "RandomFog",
        "RandomRain",
        "MotionBlur",
    ]
}
```

### RF Signal Analysis (CNN+Transformer)

**Training Type**: From scratch (no suitable pretrained model)

#### Data Requirements

| Signal Type                | Quantity    | Collection Method    |
| -------------------------- | ----------- | -------------------- |
| WiFi control (2.4/5.8 GHz) | 12,000      | Field SDR capture    |
| Proprietary RF (DJI, etc.) | 10,000      | Field trials         |
| FPV protocols              | 8,000       | Partner data         |
| Military datalink          | 5,000       | Classified sources   |
| Background/interference    | 10,000      | Various environments |
| **Total**                  | **50,000+** |                      |

#### Training Schedule

| Phase     | Epochs | Learning Rate | Notes         |
| --------- | ------ | ------------- | ------------- |
| Warmup    | 5      | 0 → 3e-4      | Linear warmup |
| Main      | 100    | 3e-4 → 1e-6   | Cosine decay  |
| Fine-tune | 50     | 1e-5          | If needed     |

### Radar Track Analysis (Mamba-2)

**Training Type**: From scratch

#### Data Requirements

| Track Type    | Quantity     | Notes               |
| ------------- | ------------ | ------------------- |
| Drone hover   | 30,000       | Stationary patterns |
| Drone transit | 40,000       | Linear movement     |
| Drone evasive | 25,000       | Unpredictable paths |
| Bird single   | 35,000       | Natural flight      |
| Bird flock    | 15,000       | Group behavior      |
| Aircraft      | 20,000       | Fixed patterns      |
| **Total**     | **200,000+** |                     |

### Acoustic Detection (BEATs)

**Training Type**: Fine-tune from AudioSet

#### Data Requirements

| Audio Class         | Quantity    | Duration   |
| ------------------- | ----------- | ---------- |
| Quadcopter small    | 6,000       | 5-15s each |
| Quadcopter large    | 5,000       | 5-15s      |
| Fixed-wing electric | 3,000       | 5-15s      |
| Birds               | 6,000       | 5-15s      |
| Background          | 5,000       | 5-15s      |
| **Total**           | **30,000+** |            |

#### Progressive Unfreezing Schedule

| Stage | Epochs | Frozen Layers           | Learning Rate             |
| ----- | ------ | ----------------------- | ------------------------- |
| 1     | 5      | All encoder (12 layers) | Head: 1e-4                |
| 2     | 15     | First 8 layers          | Last 4: 1e-5, Head: 1e-4  |
| 3     | 30     | None                    | Differential 1e-6 to 1e-4 |

### Sensor Fusion (Cross-Modal Transformer)

**Training Type**: From scratch (requires pretrained modality models)

#### Prerequisites

All modality-specific models must be trained first:

- Optical model checkpoint
- RF model checkpoint
- Radar model checkpoint
- Acoustic model checkpoint

#### Training Strategy

1. **Freeze all modality encoders** - Only train fusion layers
2. **Cache extracted features** - Speeds up training significantly
3. **Modality dropout** - Randomly drop 1-2 modalities during training (20%
   probability)

### Behavioral Analysis (GAT)

**Training Type**: From scratch

#### Data Requirements

Multi-drone trajectory graphs from swarm scenarios:

- Single drone tracks: 50,000
- Multi-drone scenes: 30,000
- Swarm formations: 10,000

### Threat Attribution (XGBoost+NN)

**Training Type**: From scratch (fast, tabular data)

```python
attribution_config = {
    "ensemble_weights": {
        "xgboost": 0.6,
        "neural_network": 0.4,
    },
    "xgboost": {
        "n_estimators": 200,
        "max_depth": 8,
        "learning_rate": 0.1,
        "early_stopping_rounds": 20,
    },
    "neural_network": {
        "architecture": [256, 128, 64],
        "dropout": 0.3,
        "learning_rate": 1e-3,
        "epochs": 100,
    }
}
```

---

## Edge Deployment & Optimization

### Optimization Pipeline

```
PyTorch Model
     │
     ▼
┌─────────────────┐
│  ONNX Export    │  torch.onnx.export()
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  ONNX Optimize  │  onnxruntime optimizations
└────────┬────────┘
         │
         ├──────────────────┬──────────────────┐
         ▼                  ▼                  ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   TensorRT      │ │   OpenVINO      │ │   TFLite        │
│   (NVIDIA)      │ │   (Intel)       │ │   (Mobile)      │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                  │                  │
         ▼                  ▼                  ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  FP16/INT8      │ │  FP16/INT8      │ │  INT8/FP16      │
│  Quantization   │ │  Quantization   │ │  Quantization   │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                  │                  │
         ▼                  ▼                  ▼
    Jetson AGX         Intel NUC           Mobile/ARM
```

### Quantization Strategy

| Model    | FP32 Size | FP16 Size | INT8 Size | Accuracy Drop |
| -------- | --------- | --------- | --------- | ------------- |
| Optical  | 350 MB    | 175 MB    | 90 MB     | < 0.5%        |
| RF       | 100 MB    | 50 MB     | 25 MB     | < 0.3%        |
| Radar    | 60 MB     | 30 MB     | 15 MB     | < 0.2%        |
| Acoustic | 350 MB    | 175 MB    | 90 MB     | < 0.5%        |
| Fusion   | 80 MB     | 40 MB     | 20 MB     | < 0.3%        |

### Target Latencies

| Component | GPU (A100) | Edge (Jetson) | Target      |
| --------- | ---------- | ------------- | ----------- |
| Optical   | 35ms       | 80ms          | < 120ms     |
| RF        | 25ms       | 50ms          | < 80ms      |
| Radar     | 18ms       | 35ms          | < 60ms      |
| Acoustic  | 40ms       | 70ms          | < 100ms     |
| Fusion    | 30ms       | 50ms          | < 80ms      |
| **Total** | ~100ms     | ~150ms        | **< 200ms** |

---

## Training Timeline & Resource Requirements

### 16-Week Training Timeline

```
PHASE 1: DATA PREPARATION (Weeks 1-2)
─────────────────────────────────────────────────────────────────────────────
Week 1 │ Optical & RF data collection, labeling, quality validation
Week 2 │ Radar & acoustic data, synthetic augmentation, dataset splits

PHASE 2: INDIVIDUAL MODEL TRAINING (Weeks 3-10)
─────────────────────────────────────────────────────────────────────────────
Week 3 │ Optical Stage 1 (head only)
Week 4 │ Optical Stages 2-3 (progressive unfreezing)
Week 5 │ RF model training (from scratch)
Week 6 │ RF model training continued + validation
Week 7 │ Radar Mamba training (from scratch)
Week 8 │ Radar validation + Acoustic Stage 1
Week 9 │ Acoustic Stages 2-3 (progressive unfreezing)
Week 10│ All individual model validation + checkpointing

PHASE 3: FUSION & BEHAVIORAL MODELS (Weeks 11-13)
─────────────────────────────────────────────────────────────────────────────
Week 11│ Feature extraction caching from all modality models
Week 12│ Cross-modal fusion training
Week 13│ Behavioral GAT training + attribution ensemble

PHASE 4: OPTIMIZATION & VALIDATION (Weeks 14-16)
─────────────────────────────────────────────────────────────────────────────
Week 14│ ONNX export, TensorRT conversion
Week 15│ Edge device benchmarking, quantization tuning
Week 16│ Final validation, documentation, deployment package
```

### Resource Requirements

| Resource      | Specification         | Cost Estimate |
| ------------- | --------------------- | ------------- |
| GPU Compute   | 4× NVIDIA A100 (80GB) | $35,000 cloud |
| Storage       | 10 TB NVMe            | $2,000        |
| Data Labeling | 380,000 samples       | $5,000        |
| Edge Devices  | 2× Jetson AGX Orin    | $3,000        |
| **Total**     |                       | **~$45,000**  |

### Team Requirements

| Role           | Count | Responsibility               |
| -------------- | ----- | ---------------------------- |
| ML Engineer    | 2     | Model training, optimization |
| Data Engineer  | 1     | Pipeline, data quality       |
| MLOps Engineer | 1     | Infrastructure, deployment   |

---

## Validation & Success Criteria

### Model-Level Validation

| Model    | Accuracy Target | Latency Target | Validation Dataset     |
| -------- | --------------- | -------------- | ---------------------- |
| Optical  | > 98%           | < 35ms GPU     | 15,000 held-out images |
| RF       | > 96%           | < 25ms GPU     | 7,500 held-out samples |
| Radar    | > 97%           | < 18ms GPU     | 30,000 held-out tracks |
| Acoustic | > 95%           | < 40ms GPU     | 4,500 held-out clips   |
| Fusion   | > 99%           | < 30ms GPU     | Multi-modal test set   |

### System-Level Validation

| Metric                         | Target  | Validation Method |
| ------------------------------ | ------- | ----------------- |
| End-to-end accuracy            | > 99%   | Field trial data  |
| Total latency                  | < 200ms | Timing benchmarks |
| False positive rate            | < 1%    | Extended testing  |
| Edge deployment                | < 150ms | Jetson benchmarks |
| Degraded mode (missing sensor) | > 95%   | Ablation testing  |

### Validation Checkpoints

```
Week 4  │ ✓ Optical accuracy > 97%        → Proceed to RF training
Week 6  │ ✓ RF accuracy > 95%             → Proceed to Radar training
Week 8  │ ✓ Radar accuracy > 96%          → Proceed to Acoustic training
Week 10 │ ✓ Acoustic accuracy > 94%       → Proceed to Fusion
Week 13 │ ✓ Fusion accuracy > 98%         → Proceed to Edge optimization
Week 16 │ ✓ Edge latency < 150ms          → Ready for deployment
        │ ✓ All models pass robustness tests
```

---

## Federated Learning Integration

### FLBC Protocol

After initial centralized training, models are deployed for federated learning:

```
Central Server                    Deployment Sites
─────────────────                 ─────────────────────────────────────────

┌───────────────┐                 ┌─────────┐  ┌─────────┐  ┌─────────┐
│ Global Model  │ ───Distribute──►│ Site A  │  │ Site B  │  │ Site C  │
│   v1.0        │                 │ Local   │  │ Local   │  │ Local   │
└───────────────┘                 │ Data    │  │ Data    │  │ Data    │
       ▲                          └────┬────┘  └────┬────┘  └────┬────┘
       │                               │            │            │
       │                               ▼            ▼            ▼
       │                          Local Train   Local Train  Local Train
       │                               │            │            │
       │                               ▼            ▼            ▼
       │                          ┌─────────────────────────────────┐
       │                          │      Blockchain Consensus       │
       │                          │   (Validate + Aggregate)        │
       │                          └─────────────────┬───────────────┘
       │                                            │
       └────────────────────────────────────────────┘
                    Aggregated Update
                         │
                         ▼
               ┌───────────────┐
               │ Global Model  │
               │   v1.1        │
               └───────────────┘
```

### Continuous Learning Schedule

| Frequency | Activity                                      |
| --------- | --------------------------------------------- |
| Daily     | Local model inference, data collection        |
| Weekly    | Federated learning round (if enough new data) |
| Monthly   | Full model evaluation, performance audit      |
| Quarterly | Major model update consideration              |

---

## Quick Reference Card

```
═══════════════════════════════════════════════════════════════════════════════
               PHOENIX ROOIVALK ML TRAINING QUICK REFERENCE
═══════════════════════════════════════════════════════════════════════════════

MODEL SUMMARY
─────────────────────────────────────────────────────────────────────────────
Component     │ Model           │ Training    │ Data      │ Time
─────────────────────────────────────────────────────────────────────────────
Optical       │ ConvNeXt-Base   │ Fine-tune   │ 100k img  │ 2 weeks
RF            │ CNN+Transformer │ Scratch     │ 50k samp  │ 2 weeks
Radar         │ Mamba-2         │ Scratch     │ 200k trk  │ 1 week
Acoustic      │ BEATs           │ Fine-tune   │ 30k clip  │ 2 weeks
Fusion        │ Cross-Modal TF  │ Scratch     │ Features  │ 1 week
Behavioral    │ GAT+TF          │ Scratch     │ Graphs    │ 1 week
Attribution   │ XGBoost+NN      │ Scratch     │ Tabular   │ 2 days

PROGRESSIVE UNFREEZING (Fine-tuning models)
─────────────────────────────────────────────────────────────────────────────
Stage 1 │ Freeze all, train head      │ LR: 1e-3        │ 5 epochs
Stage 2 │ Unfreeze last 2 stages      │ LR: 1e-5 to 1e-3│ 20 epochs
Stage 3 │ Unfreeze all, differential  │ LR: 1e-7 to 1e-3│ 25+ epochs

KEY HYPERPARAMETERS
─────────────────────────────────────────────────────────────────────────────
Optimizer     │ AdamW (weight_decay=0.01-0.05)
Scheduler     │ CosineAnnealingWarmRestarts or OneCycleLR
Label Smooth  │ 0.1
Gradient Clip │ 1.0
Mixed Prec    │ BF16 or FP16

EDGE DEPLOYMENT
─────────────────────────────────────────────────────────────────────────────
Export        │ PyTorch → ONNX → TensorRT/OpenVINO
Quantization  │ FP16 (default), INT8 (if accuracy allows)
Target        │ < 150ms total, < 4GB GPU memory

═══════════════════════════════════════════════════════════════════════════════
```

---

## Document Control

| Version | Date | Author  | Changes                                        |
| ------- | ---- | ------- | ---------------------------------------------- |
| 1.0     | 2025 | AI Team | Initial draft                                  |
| 2.0     | 2025 | AI Team | Added progressive unfreezing detail, finalized |

---

_This document is the authoritative reference for ML model training in the
Phoenix Rooivalk project. All training activities should follow these guidelines
to ensure consistency and reproducibility. © 2025 Phoenix Rooivalk. All rights
reserved._
