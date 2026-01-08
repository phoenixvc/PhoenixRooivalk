# Raspberry Pi Drone Detection System - One Week Implementation Plan

## Executive Summary

This plan outlines a **minimal viable drone detection system** that can
distinguish drones from common objects (like coke cans) on a Raspberry Pi within
one week. This is a scaled-down proof-of-concept aligned with the broader
PhoenixRooivalk platform.

---

## Constraints & Realities

| Factor        | Full PhoenixRooivalk       | This Project                    |
| ------------- | -------------------------- | ------------------------------- |
| **Hardware**  | Jetson AGX Orin (275 TOPS) | Raspberry Pi 4/5 (~13 TOPS max) |
| **Timeline**  | Production system          | 1 week MVP                      |
| **Detection** | Multi-modal sensor fusion  | Single camera only              |
| **Model**     | YOLOv9 @ 30+ FPS           | YOLOv5n/YOLOv8n @ 5-15 FPS      |
| **Range**     | 500m - 2km                 | 10-50m (visual)                 |

---

## Azure ML Fine-Tuning Guide

Fine-tuning YOLOv5 on Azure Machine Learning gives you better accuracy than
heuristics alone. Here's how to set it up:

### Cost Estimate

| Resource         | Config    | Cost/Hour | Time    | Total  |
| ---------------- | --------- | --------- | ------- | ------ |
| **NC6s_v3**      | V100 16GB | ~$3.06    | 2-4 hrs | ~$6-12 |
| **NC4as_T4_v3**  | T4 16GB   | ~$0.53    | 4-6 hrs | ~$2-4  |
| **NC24ads_A100** | A100 80GB | ~$3.67    | 1-2 hrs | ~$4-7  |

**Recommended**: `NC4as_T4_v3` - Best cost/performance for small dataset
fine-tuning (~$3-5 total)

### Quick Setup (Azure CLI)

```bash
# 1. Install Azure ML CLI extension
az extension add -n ml

# 2. Create resource group (if needed)
az group create --name rg-drone-training --location eastus

# 3. Create Azure ML workspace
az ml workspace create \
  --name mlw-drone-detection \
  --resource-group rg-drone-training \
  --location eastus

# 4. Create compute cluster (auto-scales to 0 when idle)
az ml compute create \
  --name gpu-cluster \
  --type AmlCompute \
  --size Standard_NC4as_T4_v3 \
  --min-instances 0 \
  --max-instances 1 \
  --resource-group rg-drone-training \
  --workspace-name mlw-drone-detection
```

### Dataset Preparation

Create this folder structure locally:

```text
drone-dataset/
├── images/
│   ├── train/
│   │   ├── drone_001.jpg
│   │   ├── drone_002.jpg
│   │   ├── cokecan_001.jpg
│   │   └── ...
│   └── val/
│       ├── drone_100.jpg
│       └── cokecan_100.jpg
├── labels/
│   ├── train/
│   │   ├── drone_001.txt    # YOLO format: class x_center y_center width height
│   │   └── ...
│   └── val/
│       └── ...
└── dataset.yaml
```

**dataset.yaml:**

```yaml
path: /mnt/data/drone-dataset
train: images/train
val: images/val

nc: 2 # number of classes
names: ["drone", "not_drone"] # class names
```

### Training Script (train_azure.py)

```python
import os
import argparse
from ultralytics import YOLO

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--data', type=str, required=True)
    parser.add_argument('--epochs', type=int, default=50)
    parser.add_argument('--imgsz', type=int, default=320)
    parser.add_argument('--batch', type=int, default=16)
    parser.add_argument('--output', type=str, default='./outputs')
    args = parser.parse_args()

    # Load YOLOv5n pretrained
    model = YOLO('yolov5n.pt')

    # Fine-tune on drone dataset
    results = model.train(
        data=args.data,
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch=args.batch,
        project=args.output,
        name='drone-detector',
        exist_ok=True,
        # Optimizations for small dataset
        patience=10,           # Early stopping
        save_period=10,        # Save every 10 epochs
        amp=True,              # Mixed precision (faster)
        workers=4,
        cache=True,            # Cache images in RAM
    )

    # Export to TFLite for Raspberry Pi
    best_model = YOLO(f'{args.output}/drone-detector/weights/best.pt')
    best_model.export(format='tflite', imgsz=320, int8=True)

    print(f"Training complete! Model saved to {args.output}")

if __name__ == '__main__':
    main()
```

### Azure ML Job Definition (job.yaml)

```yaml
$schema: https://azuremlschemas.azureedge.net/latest/commandJob.schema.json
code: ./src
command: >-
  pip install ultralytics && python train_azure.py --data
  ${{inputs.dataset}}/dataset.yaml --epochs 50 --imgsz 320 --batch 16 --output
  ${{outputs.model}}
inputs:
  dataset:
    type: uri_folder
    path: azureml://datastores/workspaceblobstore/paths/drone-dataset
outputs:
  model:
    type: uri_folder
compute: azureml:gpu-cluster
environment:
  image: mcr.microsoft.com/azureml/openmpi4.1.0-cuda11.8-cudnn8-ubuntu22.04:latest
  conda_file: conda.yaml
display_name: drone-detection-finetune
experiment_name: drone-detection
```

### Submit Training Job

```bash
# Upload dataset to Azure ML
az ml data create \
  --name drone-dataset \
  --path ./drone-dataset \
  --type uri_folder \
  --resource-group rg-drone-training \
  --workspace-name mlw-drone-detection

# Submit training job
az ml job create \
  --file job.yaml \
  --resource-group rg-drone-training \
  --workspace-name mlw-drone-detection

# Monitor job
az ml job stream \
  --name <job-name> \
  --resource-group rg-drone-training \
  --workspace-name mlw-drone-detection
```

### Download Trained Model

```bash
# List job outputs
az ml job download \
  --name <job-name> \
  --output-name model \
  --download-path ./trained-model \
  --resource-group rg-drone-training \
  --workspace-name mlw-drone-detection

# Copy TFLite model to Raspberry Pi
scp ./trained-model/drone-detector/weights/best-int8.tflite pi@raspberrypi:/home/pi/
```

### Alternative: Azure ML Studio (GUI)

1. Go to [ml.azure.com](https://ml.azure.com)
2. Create workspace → Compute → Create compute cluster
3. Notebooks → Upload training script
4. Jobs → Create job → Select compute and script
5. Download model from job outputs

### Labeling Tool Recommendation

If you need to label images:

- **Label Studio** (free, self-hosted): `pip install label-studio`
- **Roboflow** (free tier): Upload images, label, export YOLO format
- **CVAT** (free): Computer Vision Annotation Tool

### Quick Dataset Sources

| Dataset        | Images | Notes                    |
| -------------- | ------ | ------------------------ |
| Drone-vs-Bird  | 2,000+ | Video frames, variety    |
| Anti-UAV       | 300+   | Thermal + RGB videos     |
| USC Drone      | 2,600+ | Labeled drones           |
| DIY: Coke cans | 200+   | Various distances/angles |

Links:

- [Drone-vs-Bird](https://github.com/wosdetc/drone-vs-bird)
- [Anti-UAV](https://anti-uav.github.io/)
- [USC Drone](https://data.mendeley.com/datasets/zcsj2g2m4c/4)

---

## Recommended Hardware

### Minimum (Budget ~$75-100)

- **Raspberry Pi 4 (4GB)** - Already owned?
- **Pi Camera Module v2** or USB webcam (1080p)
- **32GB microSD** (Class 10 or better)
- **5V 3A Power Supply**

### Recommended (Budget ~$150-200)

- **Raspberry Pi 5 (8GB)** - 2-3x faster inference
- **Pi Camera Module 3** (HDR, autofocus)
- **Coral USB Accelerator** - 4 TOPS edge TPU (+$60, 10x speedup)
- **Active cooling** (fan/heatsink)

---

## Architecture Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                    RASPBERRY PI                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐    ┌──────────────┐    ┌─────────────────┐    │
│  │ Camera  │───►│ Frame Buffer │───►│ Pre-processing  │    │
│  │ Module  │    │   (OpenCV)   │    │ (resize, norm)  │    │
│  └─────────┘    └──────────────┘    └────────┬────────┘    │
│                                              │              │
│                                              ▼              │
│  ┌─────────┐    ┌──────────────┐    ┌─────────────────┐    │
│  │ Output  │◄───│ Post-process │◄───│   TFLite/ONNX   │    │
│  │ Display │    │  (NMS, conf) │    │   YOLOv5n/v8n   │    │
│  └─────────┘    └──────────────┘    └─────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## Week-by-Week Implementation Plan

### Day 1-2: Environment Setup & Model Selection

#### Setup Tasks

1. **Set up Raspberry Pi OS (64-bit)**

   ```bash
   # Flash Raspberry Pi OS Lite (64-bit) for better performance
   # Enable camera interface
   sudo raspi-config
   ```

2. **Install dependencies**

   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo apt install -y python3-pip python3-opencv libatlas-base-dev
   pip3 install numpy pillow tflite-runtime
   # Optional: pip3 install onnxruntime (if using ONNX)
   ```

3. **Select and download pre-trained model**

   | Model              | Size  | Pi 4 FPS | Pi 5 FPS | Accuracy |
   | ------------------ | ----- | -------- | -------- | -------- |
   | YOLOv5n            | 3.9MB | ~5-8     | ~12-15   | Good     |
   | YOLOv8n            | 6.3MB | ~4-6     | ~10-12   | Better   |
   | MobileNet-SSD      | 4.3MB | ~8-12    | ~15-20   | Moderate |
   | EfficientDet-Lite0 | 4.4MB | ~6-10    | ~12-18   | Good     |

   **Recommendation**: Start with **YOLOv5n** (TFLite quantized) - best balance

4. **Verify camera works**

   ```bash
   libcamera-hello --timeout 5000  # Pi Camera
   # or
   python3 -c "import cv2; cap=cv2.VideoCapture(0); print(cap.read()[0])"
   ```

#### Setup Deliverable

- Working Pi with camera capturing frames
- TFLite runtime installed and tested

---

### Day 3-4: Model Integration & Basic Detection

#### Integration Tasks

1. **Download/convert YOLOv5n to TFLite**

   ```bash
   # Option 1: Use pre-converted model
   wget https://github.com/ultralytics/yolov5/releases/download/v7.0/yolov5n.pt

   # Option 2: Convert to TFLite (on a more powerful machine)
   pip install ultralytics
   python3 -c "from ultralytics import YOLO; YOLO('yolov5n.pt').export(format='tflite')"
   ```

2. **Create basic detection script**

   ```python
   # detector.py - Basic structure
   import cv2
   import numpy as np
   import tflite_runtime.interpreter as tflite

   class DroneDetector:
       def __init__(self, model_path):
           self.interpreter = tflite.Interpreter(model_path=model_path)
           self.interpreter.allocate_tensors()
           # COCO classes: drone not in standard set, need custom or use 'bird'/'kite'

       def detect(self, frame):
           # Preprocess, run inference, postprocess
           pass

       def classify_drone_vs_object(self, detection):
           # Key differentiators:
           # - Aspect ratio (drones more square/symmetric)
           # - Motion patterns (if tracking)
           # - Size consistency
           pass
   ```

3. **Test with static images first**
   - Download drone images and coke can images
   - Verify model produces bounding boxes
   - Measure inference time

#### Integration Deliverable

- Detection script running on Pi
- Baseline FPS measurement
- Detection working on test images

---

### Day 5-6: Drone vs Non-Drone Classification

#### Challenge

Standard COCO-trained models don't have a "drone" class. Options:

#### Option A: Use Existing Classes + Heuristics (Fastest - Recommended for 1 week)

```python
# Drones often detected as: 'bird', 'airplane', 'kite', 'frisbee'
DRONE_LIKE_CLASSES = ['bird', 'airplane', 'kite']
NON_DRONE_CLASSES = ['bottle', 'cup', 'sports ball']  # coke can = bottle

def classify(detection, class_name, bbox, aspect_ratio):
    if class_name in NON_DRONE_CLASSES:
        return "NOT_DRONE", 0.9

    if class_name in DRONE_LIKE_CLASSES:
        # Additional heuristics
        width, height = bbox[2] - bbox[0], bbox[3] - bbox[1]
        ar = width / height

        # Drones typically have AR between 0.8-2.5
        # Coke cans have AR ~0.3-0.4 (tall and thin)
        if 0.7 < ar < 3.0:
            return "POSSIBLE_DRONE", 0.7

    return "UNKNOWN", 0.5
```

#### Option B: Fine-tune on Drone Dataset (Better accuracy, more time)

1. **Dataset sources**:
   - [Drone-vs-Bird Dataset](https://github.com/wosdetc/drone-vs-bird)
   - [Anti-UAV Dataset](https://anti-uav.github.io/)
   - [MAV-VID Dataset](https://bitbucket.org/alejodosr/mav-vid-dataset)
   - Custom: Collect 200-500 images of drones + 200-500 of coke cans/bottles

2. **Quick fine-tuning** (on separate GPU machine, not Pi):

   ```bash
   # Using YOLOv5
   git clone https://github.com/ultralytics/yolov5
   cd yolov5

   # Create dataset.yaml with 2 classes: drone, not_drone
   python train.py --img 320 --batch 16 --epochs 50 --data drone.yaml --weights yolov5n.pt
   python export.py --weights runs/train/exp/weights/best.pt --include tflite
   ```

#### Classification Deliverable

- Classification logic implemented
- Drone vs coke can differentiation working
- Accuracy metrics documented

---

### Day 7: Integration, Testing & Documentation

#### Final Tasks

1. **Create real-time detection loop**

   ```python
   # main.py
   import cv2
   from detector import DroneDetector

   detector = DroneDetector('yolov5n.tflite')
   cap = cv2.VideoCapture(0)
   cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
   cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

   while True:
       ret, frame = cap.read()
       if not ret:
           break

       detections = detector.detect(frame)

       for det in detections:
           label, confidence = detector.classify_drone_vs_object(det)
           color = (0, 255, 0) if label == "POSSIBLE_DRONE" else (0, 0, 255)
           cv2.rectangle(frame, ...)
           cv2.putText(frame, f"{label}: {confidence:.2f}", ...)

       cv2.imshow('Drone Detection', frame)
       if cv2.waitKey(1) & 0xFF == ord('q'):
           break
   ```

2. **Performance optimization**

   ```python
   # Key optimizations for Raspberry Pi
   - Use threading for camera capture (separate thread)
   - Process every 2nd or 3rd frame if needed
   - Use INT8 quantized model
   - Reduce input resolution to 320x320
   - Disable GUI if running headless (use print/log instead)
   ```

3. **Test scenarios**
   - [ ] Drone at 5m, 10m, 20m distances
   - [ ] Coke can at various distances
   - [ ] Different lighting conditions
   - [ ] Moving vs stationary objects
   - [ ] Multiple objects in frame

4. **Document results**
   - FPS achieved
   - Detection accuracy (TP, FP, TN, FN)
   - Known limitations

#### Final Deliverable

- Working real-time detection system
- Performance metrics documented
- README with usage instructions

---

## Key Differentiators: Drone vs Coke Can

| Feature             | Drone                    | Coke Can             |
| ------------------- | ------------------------ | -------------------- |
| **Aspect Ratio**    | ~1.0-2.5 (wider)         | ~0.3-0.4 (tall/thin) |
| **Motion**          | Complex (hover, lateral) | Simple (fall, roll)  |
| **Size @ Distance** | Decreases predictably    | Very small quickly   |
| **Symmetry**        | High (rotors)            | Cylindrical          |
| **Color Pattern**   | Often multi-color        | Red/silver uniform   |
| **Edge Sharpness**  | Sharp propeller edges    | Smooth curves        |

### Heuristic Scoring Function

```python
def drone_likelihood_score(detection):
    score = 0.0

    # Aspect ratio (drones ~1.0-2.5)
    ar = detection.width / detection.height
    if 0.8 < ar < 2.5:
        score += 0.3
    elif ar < 0.5:  # Too thin, likely bottle/can
        score -= 0.4

    # Size relative to frame (drones visible at distance)
    area_ratio = (detection.width * detection.height) / (frame_w * frame_h)
    if 0.01 < area_ratio < 0.3:
        score += 0.2

    # Detection confidence from model
    if detection.class_name in ['bird', 'airplane', 'kite']:
        score += 0.3
    elif detection.class_name in ['bottle', 'cup']:
        score -= 0.5

    # Motion analysis (if tracking enabled)
    if detection.velocity_variance > threshold:
        score += 0.2  # Erratic motion = likely drone

    return min(max(score, 0), 1)  # Clamp to [0, 1]
```

---

## Performance Expectations

| Configuration            | Expected FPS | Detection Range | Accuracy |
| ------------------------ | ------------ | --------------- | -------- |
| Pi 4 + YOLOv5n (320x320) | 5-8 FPS      | 5-30m           | ~70-80%  |
| Pi 4 + Coral USB         | 15-25 FPS    | 5-30m           | ~70-80%  |
| Pi 5 + YOLOv5n (320x320) | 12-18 FPS    | 5-30m           | ~70-80%  |
| Pi 5 + Coral USB         | 30-40 FPS    | 5-30m           | ~70-80%  |

**Note**: Accuracy depends heavily on whether you fine-tune on drone data or use
heuristics.

---

## Quick Start Commands

```bash
# Clone repo and navigate to detection module
cd /home/user/PhoenixRooivalk
mkdir -p apps/pi-drone-detector
cd apps/pi-drone-detector

# Set up virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install opencv-python-headless numpy tflite-runtime

# Download pre-trained model
wget -O yolov5n.tflite https://github.com/ultralytics/yolov5/releases/download/v7.0/yolov5n-int8.tflite

# Run detection (after implementing detector.py)
python main.py
```

---

## Risk Mitigation

| Risk                     | Mitigation                           |
| ------------------------ | ------------------------------------ |
| Pi too slow              | Use Coral USB Accelerator or Pi 5    |
| Poor drone detection     | Fine-tune model on drone dataset     |
| False positives on birds | Add motion tracking (drones hover)   |
| Lighting variations      | Use camera with HDR or auto-exposure |
| Model too large          | Use MobileNet-SSD instead            |

---

## Future Enhancements (Post-MVP)

1. **Add acoustic detection** - USB microphone + FFT for rotor harmonics
2. **Multi-frame tracking** - DeepSORT for trajectory analysis
3. **Edge TPU optimization** - Google Coral for 10x speedup
4. **Integration with PhoenixRooivalk** - Feed detections to main platform
5. **Alert system** - MQTT/webhook on drone detection
6. **Distance estimation** - Known drone size + camera calibration

---

## Integration with PhoenixRooivalk

This MVP can serve as a **low-cost edge sensor node** feeding into the larger
system:

```text
Pi Detector ──► MQTT/HTTP ──► PhoenixRooivalk API ──► Evidence System
                              │
                              ├── Sensor Fusion
                              ├── Threat Classification
                              └── Countermeasure Coordination
```

The detection events from the Pi can be formatted as:

```json
{
  "timestamp": "2026-01-07T12:00:00Z",
  "sensor_id": "pi-node-001",
  "sensor_type": "optical",
  "detection": {
    "class": "possible_drone",
    "confidence": 0.75,
    "bbox": [100, 150, 200, 250],
    "drone_score": 0.82
  },
  "frame_id": 12345,
  "fps": 8.2
}
```

---

## Recommended Next Steps

1. **Today**: Order Coral USB Accelerator if budget allows (~$60)
2. **Tomorrow**: Set up Pi with 64-bit OS and dependencies
3. **Day 3**: Get basic detection running with YOLOv5n
4. **Day 4-5**: Implement drone vs object heuristics
5. **Day 6**: Fine-tune or optimize based on initial results
6. **Day 7**: Document, test edge cases, prepare demo

---

## Resources

- [YOLOv5 GitHub](https://github.com/ultralytics/yolov5)
- [TensorFlow Lite on Pi](https://www.tensorflow.org/lite/guide/python)
- [Coral USB Accelerator](https://coral.ai/products/accelerator)
- [OpenCV on Raspberry Pi](https://docs.opencv.org/4.x/d7/d9f/tutorial_linux_install.html)
- [Drone Detection Datasets](https://paperswithcode.com/task/drone-detection)

---

_Document created: 2026-01-07_ _Project: PhoenixRooivalk - Raspberry Pi Drone
Detection MVP_
