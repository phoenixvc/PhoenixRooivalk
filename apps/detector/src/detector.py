#!/usr/bin/env python3
"""
Drone Detection for Raspberry Pi

Lightweight inference using TFLite for real-time drone vs not-drone classification.
Optimized for Raspberry Pi 4/5 with optional Coral USB Accelerator support.
"""

import time
from dataclasses import dataclass
from pathlib import Path

import numpy as np

# Try to import TFLite runtime (Pi-optimized) first, fall back to full TF
try:
    import tflite_runtime.interpreter as tflite

    USING_TFLITE_RUNTIME = True
except ImportError:
    import tensorflow.lite as tflite

    USING_TFLITE_RUNTIME = False


@dataclass
class Detection:
    """Single detection result."""

    class_id: int
    class_name: str
    confidence: float
    bbox: tuple[int, int, int, int]  # x1, y1, x2, y2
    drone_score: float  # 0-1, higher = more likely drone

    @property
    def is_drone(self) -> bool:
        return self.class_id == 0 and self.confidence > 0.5

    def to_dict(self) -> dict:
        return {
            "class_id": self.class_id,
            "class_name": self.class_name,
            "confidence": self.confidence,
            "bbox": self.bbox,
            "drone_score": self.drone_score,
            "is_drone": self.is_drone,
        }


class DroneDetector:
    """
    TFLite-based drone detector optimized for Raspberry Pi.

    Classes:
        0: drone
        1: not_drone (coke cans, birds, etc.)
    """

    CLASS_NAMES = ["drone", "not_drone"]

    def __init__(
        self,
        model_path: str,
        confidence_threshold: float = 0.5,
        nms_threshold: float = 0.45,
        use_coral: bool = False,
    ):
        """
        Initialize the detector.

        Args:
            model_path: Path to TFLite model file
            confidence_threshold: Minimum confidence to report detection
            nms_threshold: Non-max suppression IoU threshold
            use_coral: Use Coral Edge TPU if available
        """
        self.model_path = Path(model_path)
        self.confidence_threshold = confidence_threshold
        self.nms_threshold = nms_threshold

        # Load model
        if use_coral:
            try:
                from pycoral.utils.edgetpu import make_interpreter

                self.interpreter = make_interpreter(str(self.model_path))
                print("Loaded model on Coral Edge TPU")
            except Exception as e:
                print(f"Coral not available ({e}), using CPU")
                self.interpreter = tflite.Interpreter(model_path=str(self.model_path))
        else:
            self.interpreter = tflite.Interpreter(
                model_path=str(self.model_path),
                num_threads=4,  # Use all Pi cores
            )

        self.interpreter.allocate_tensors()

        # Get input/output details
        self.input_details = self.interpreter.get_input_details()
        self.output_details = self.interpreter.get_output_details()

        # Input shape
        self.input_shape = self.input_details[0]["shape"]
        self.input_height = self.input_shape[1]
        self.input_width = self.input_shape[2]
        self.input_dtype = self.input_details[0]["dtype"]

        # Check for quantization
        self.is_quantized = self.input_dtype == np.uint8

        print(f"Model loaded: {self.model_path.name}")
        print(f"  Input shape: {self.input_shape}")
        print(f"  Quantized: {self.is_quantized}")
        print(f"  TFLite runtime: {USING_TFLITE_RUNTIME}")

    def preprocess(self, frame: np.ndarray) -> tuple[np.ndarray, float, float]:
        """
        Preprocess frame for inference.

        Returns:
            Preprocessed input tensor, x_scale, y_scale
        """
        orig_h, orig_w = frame.shape[:2]

        # Resize to model input size
        import cv2

        resized = cv2.resize(frame, (self.input_width, self.input_height))

        # Convert BGR to RGB
        rgb = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)

        if self.is_quantized:
            # INT8 quantized model expects uint8 input
            input_data = np.expand_dims(rgb, axis=0).astype(np.uint8)
        else:
            # Float model expects normalized input
            input_data = np.expand_dims(rgb, axis=0).astype(np.float32) / 255.0

        x_scale = orig_w / self.input_width
        y_scale = orig_h / self.input_height

        return input_data, x_scale, y_scale

    def postprocess(
        self,
        outputs: np.ndarray,
        x_scale: float,
        y_scale: float,
    ) -> list[Detection]:
        """
        Post-process model outputs to detection results.

        Handles YOLO output format: [batch, num_detections, 4+num_classes]
        """
        detections = []

        # YOLO outputs: [1, num_boxes, 4 + num_classes]
        # Format: [x_center, y_center, width, height, class_scores...]
        if len(outputs.shape) == 3:
            outputs = outputs[0]  # Remove batch dimension

        for detection in outputs:
            # Extract bbox and class scores
            x_center, y_center, width, height = detection[:4]
            class_scores = detection[4:]

            # Get best class
            class_id = np.argmax(class_scores)
            confidence = class_scores[class_id]

            if confidence < self.confidence_threshold:
                continue

            # Convert to corner format and scale to original image
            x1 = int((x_center - width / 2) * x_scale)
            y1 = int((y_center - height / 2) * y_scale)
            x2 = int((x_center + width / 2) * x_scale)
            y2 = int((y_center + height / 2) * y_scale)

            # Clamp to image bounds
            x1 = max(0, x1)
            y1 = max(0, y1)
            x2 = max(0, x2)
            y2 = max(0, y2)

            # Calculate drone likelihood score with heuristics
            drone_score = self._calculate_drone_score(class_id, confidence, (x1, y1, x2, y2))

            detections.append(
                Detection(
                    class_id=int(class_id),
                    class_name=(
                        self.CLASS_NAMES[class_id]
                        if class_id < len(self.CLASS_NAMES)
                        else "unknown"
                    ),
                    confidence=float(confidence),
                    bbox=(x1, y1, x2, y2),
                    drone_score=drone_score,
                )
            )

        # Apply NMS
        detections = self._nms(detections)

        return detections

    def _calculate_drone_score(
        self,
        class_id: int,
        confidence: float,
        bbox: tuple[int, int, int, int],
    ) -> float:
        """
        Calculate drone likelihood score using model output + heuristics.

        Heuristics based on drone vs coke can characteristics:
        - Drones: aspect ratio 0.8-2.5 (wider)
        - Coke cans: aspect ratio 0.3-0.5 (tall/thin)
        """
        score = 0.0

        # Base score from model prediction
        if class_id == 0:  # drone class
            score = confidence * 0.7
        else:  # not_drone class
            score = (1 - confidence) * 0.3

        # Aspect ratio heuristic
        x1, y1, x2, y2 = bbox
        width = x2 - x1
        height = y2 - y1

        if height > 0:
            aspect_ratio = width / height

            # Drones typically have AR 0.8-2.5
            if 0.8 < aspect_ratio < 2.5:
                score += 0.15
            # Coke cans have AR ~0.3-0.5 (tall and thin)
            elif aspect_ratio < 0.6:
                score -= 0.2

        # Clamp to [0, 1]
        return max(0.0, min(1.0, score))

    def _nms(self, detections: list[Detection]) -> list[Detection]:
        """Apply non-maximum suppression."""
        if len(detections) == 0:
            return []

        # Sort by confidence
        detections = sorted(detections, key=lambda x: x.confidence, reverse=True)

        keep = []
        while detections:
            best = detections.pop(0)
            keep.append(best)

            detections = [
                d for d in detections if self._iou(best.bbox, d.bbox) < self.nms_threshold
            ]

        return keep

    def _iou(self, box1: tuple, box2: tuple) -> float:
        """Calculate intersection over union."""
        x1 = max(box1[0], box2[0])
        y1 = max(box1[1], box2[1])
        x2 = min(box1[2], box2[2])
        y2 = min(box1[3], box2[3])

        intersection = max(0, x2 - x1) * max(0, y2 - y1)

        area1 = (box1[2] - box1[0]) * (box1[3] - box1[1])
        area2 = (box2[2] - box2[0]) * (box2[3] - box2[1])

        union = area1 + area2 - intersection

        return intersection / union if union > 0 else 0

    def detect(self, frame: np.ndarray) -> tuple[list[Detection], float]:
        """
        Run detection on a frame.

        Args:
            frame: BGR image from OpenCV

        Returns:
            List of detections, inference time in ms
        """
        # Preprocess
        input_data, x_scale, y_scale = self.preprocess(frame)

        # Run inference
        start_time = time.perf_counter()

        self.interpreter.set_tensor(self.input_details[0]["index"], input_data)
        self.interpreter.invoke()

        # Get outputs
        outputs = self.interpreter.get_tensor(self.output_details[0]["index"])

        inference_time = (time.perf_counter() - start_time) * 1000  # ms

        # Postprocess
        detections = self.postprocess(outputs, x_scale, y_scale)

        return detections, inference_time


def draw_detections(
    frame: np.ndarray,
    detections: list[Detection],
    inference_time: float = None,
) -> np.ndarray:
    """Draw detections on frame."""
    import cv2

    frame = frame.copy()

    for det in detections:
        x1, y1, x2, y2 = det.bbox

        # Color based on classification
        if det.is_drone:
            color = (0, 0, 255)  # Red for drones (BGR)
            label = f"DRONE {det.confidence:.2f}"
        else:
            color = (0, 255, 0)  # Green for not-drone
            label = f"{det.class_name} {det.confidence:.2f}"

        # Draw bounding box
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)

        # Draw label background
        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
        cv2.rectangle(frame, (x1, y1 - th - 10), (x1 + tw + 10, y1), color, -1)

        # Draw label text
        cv2.putText(
            frame, label, (x1 + 5, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1
        )

        # Draw drone score bar
        score_width = int(det.drone_score * 100)
        cv2.rectangle(frame, (x1, y2 + 5), (x1 + 100, y2 + 15), (100, 100, 100), -1)
        cv2.rectangle(frame, (x1, y2 + 5), (x1 + score_width, y2 + 15), (0, 0, 255), -1)

    # Draw FPS/inference time
    if inference_time is not None:
        fps = 1000 / inference_time if inference_time > 0 else 0
        cv2.putText(
            frame,
            f"FPS: {fps:.1f} ({inference_time:.1f}ms)",
            (10, 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0, 255, 0),
            2,
        )

    return frame
