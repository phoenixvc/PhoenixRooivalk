# Raspberry Pi Drone Detector

Real-time drone detection system for Raspberry Pi, distinguishing drones from common objects like coke cans.

Part of the [PhoenixRooivalk](../../README.md) counter-UAS platform.

## Quick Start

### 1. Setup Raspberry Pi

```bash
# Clone repo (or copy this folder)
cd ~/
git clone https://github.com/JustAGhosT/PhoenixRooivalk.git
cd PhoenixRooivalk/apps/pi-drone-detector

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements-pi.txt

# Enable camera (if using Pi Camera)
sudo raspi-config  # Interface Options > Camera > Enable
```

### 2. Get a Model

**Option A: Use pre-trained YOLOv5n (quick start, less accurate)**
```bash
# Download YOLOv5n and convert to TFLite
pip install ultralytics
python -c "from ultralytics import YOLO; YOLO('yolov5n.pt').export(format='tflite', imgsz=320, int8=True)"
cp yolov5n_int8.tflite models/
```

**Option B: Train custom model on Azure (recommended)**
```bash
# See azure-ml/ folder for training scripts
cd azure-ml
./setup-azure.sh
# Follow instructions to upload dataset and train
```

### 3. Run Detection

```bash
# With display
python src/main.py --model models/drone-detector_int8.tflite

# Headless (no monitor)
python src/main.py --model models/drone-detector_int8.tflite --headless

# With Coral USB Accelerator (10x faster)
python src/main.py --model models/drone-detector_int8.tflite --coral

# Save detections to file
python src/main.py --model models/drone-detector_int8.tflite --save-detections detections.json
```

## Project Structure

```
pi-drone-detector/
├── azure-ml/              # Azure ML training infrastructure
│   ├── train.py           # Training script
│   ├── job.yaml           # Azure ML job definition
│   ├── conda.yaml         # Training environment
│   └── setup-azure.sh     # One-click Azure setup
├── scripts/
│   └── download_datasets.py  # Dataset preparation
├── src/
│   ├── detector.py        # TFLite inference engine
│   └── main.py            # Real-time detection app
├── models/                # Trained models (add your .tflite here)
├── data/                  # Training data
├── requirements-pi.txt    # Pi inference dependencies
├── requirements-training.txt  # Training dependencies
└── README.md
```

## Training on Azure ML

### Cost: ~$3-5 for full training run

```bash
# 1. Setup Azure resources
cd azure-ml
./setup-azure.sh

# 2. Prepare dataset
cd ../scripts
python download_datasets.py --output ../data

# 3. Add your own images
# - Add drone images to data/combined/images/train/
# - Add coke can images to data/negatives/images/
# - Label with Roboflow (free): https://roboflow.com

# 4. Upload to Azure
az ml data create --name drone-dataset --path ../data/combined --type uri_folder \
  --resource-group rg-drone-training --workspace-name mlw-drone-detection

# 5. Start training
az ml job create --file job.yaml \
  --resource-group rg-drone-training --workspace-name mlw-drone-detection

# 6. Download trained model
az ml job download --name <job-name> --output-name model --download-path ./trained
scp trained/exports/drone-detector_int8.tflite pi@raspberrypi:~/models/
```

## Performance

| Configuration | FPS | Notes |
|--------------|-----|-------|
| Pi 4 + TFLite | 5-8 | Baseline |
| Pi 5 + TFLite | 12-18 | 2x faster |
| Pi 4 + Coral USB | 25-35 | 10x speedup |
| Pi 5 + Coral USB | 40-50 | Best performance |

## Classes

| Class ID | Name | Examples |
|----------|------|----------|
| 0 | drone | Quadcopters, multirotors, fixed-wing UAVs |
| 1 | not_drone | Coke cans, birds, balloons, kites |

## Detection Output

```json
{
  "timestamp": "2026-01-07T12:00:00",
  "class_id": 0,
  "class_name": "drone",
  "confidence": 0.87,
  "bbox": [120, 80, 280, 200],
  "drone_score": 0.92,
  "is_drone": true
}
```

## Integration with PhoenixRooivalk

Send detections to the main platform:

```bash
python src/main.py --model models/drone-detector_int8.tflite \
  --alert-webhook https://your-phoenixrooivalk-api/api/detections
```

## Troubleshooting

### Camera not found
```bash
# Enable legacy camera support
sudo raspi-config  # Interface Options > Legacy Camera > Enable

# Or use libcamera
libcamera-hello --timeout 5000

# Check video devices
ls -la /dev/video*
```

### Low FPS
- Use smaller input size: `--width 320 --height 240`
- Add Coral USB Accelerator
- Use Pi 5 instead of Pi 4
- Enable headless mode: `--headless`

### TFLite import error
```bash
# Install Pi-optimized TFLite runtime
pip install tflite-runtime
```

## License

MIT - Part of PhoenixRooivalk project
