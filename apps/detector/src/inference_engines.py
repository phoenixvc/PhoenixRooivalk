#!/usr/bin/env python3
"""
Inference engine implementations for different ML runtimes.

Supports hot-swapping between TFLite, ONNX, Coral TPU, or mock inference
based on what's available on demo day.
"""

import time
from typing import List, Dict, Any, Tuple, Optional
from pathlib import Path

import numpy as np

from .interfaces import (
    InferenceEngine,
    InferenceResult,
    Detection,
    BoundingBox,
    DroneScorer,
)


class AspectRatioDroneScorer(DroneScorer):
    """
    Default drone scorer using aspect ratio heuristics.

    Drones typically have aspect ratio 0.8-2.5 (wider)
    Coke cans have aspect ratio 0.3-0.5 (tall/thin)
    """

    def __init__(
        self,
        drone_class_id: int = 0,
        model_weight: float = 0.7,
        aspect_bonus: float = 0.15,
        tall_penalty: float = 0.2,
    ):
        self._drone_class_id = drone_class_id
        self._model_weight = model_weight
        self._aspect_bonus = aspect_bonus
        self._tall_penalty = tall_penalty

    def calculate_score(
        self,
        class_id: int,
        confidence: float,
        bbox: BoundingBox,
        frame_data=None,
    ) -> float:
        score = 0.0

        # Base score from model prediction
        if class_id == self._drone_class_id:
            score = confidence * self._model_weight
        else:
            score = (1 - confidence) * (1 - self._model_weight)

        # Aspect ratio heuristic
        ar = bbox.aspect_ratio

        if 0.8 < ar < 2.5:  # Drone-like
            score += self._aspect_bonus
        elif ar < 0.6:  # Tall/thin like a can
            score -= self._tall_penalty

        return max(0.0, min(1.0, score))


class BaseInferenceEngine(InferenceEngine):
    """Base class with common functionality for inference engines."""

    DEFAULT_CLASS_NAMES = ['drone', 'not_drone']

    def __init__(
        self,
        confidence_threshold: float = 0.5,
        nms_threshold: float = 0.45,
        num_threads: int = 4,
        class_names: List[str] = None,
        scorer: DroneScorer = None,
    ):
        self._confidence_threshold = confidence_threshold
        self._nms_threshold = nms_threshold
        self._num_threads = num_threads
        self._class_names = class_names or self.DEFAULT_CLASS_NAMES
        self._scorer = scorer or AspectRatioDroneScorer()
        self._model_path: Optional[str] = None
        self._input_shape: Tuple[int, ...] = (1, 320, 320, 3)
        self._is_quantized = False

    def set_confidence_threshold(self, threshold: float) -> None:
        self._confidence_threshold = threshold

    def set_nms_threshold(self, threshold: float) -> None:
        self._nms_threshold = threshold

    @property
    def input_shape(self) -> Tuple[int, ...]:
        return self._input_shape

    @property
    def class_names(self) -> List[str]:
        return self._class_names

    def _preprocess(self, frame: np.ndarray) -> Tuple[np.ndarray, float, float]:
        """Preprocess frame for inference."""
        import cv2

        orig_h, orig_w = frame.shape[:2]
        input_h, input_w = self._input_shape[1], self._input_shape[2]

        # Resize
        resized = cv2.resize(frame, (input_w, input_h))

        # BGR to RGB
        rgb = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)

        # Normalize based on quantization
        if self._is_quantized:
            input_data = np.expand_dims(rgb, axis=0).astype(np.uint8)
        else:
            input_data = np.expand_dims(rgb, axis=0).astype(np.float32) / 255.0

        x_scale = orig_w / input_w
        y_scale = orig_h / input_h

        return input_data, x_scale, y_scale

    def _postprocess(
        self,
        outputs: np.ndarray,
        x_scale: float,
        y_scale: float,
    ) -> List[Detection]:
        """Post-process YOLO outputs to detections."""
        detections = []

        # Handle batch dimension
        if len(outputs.shape) == 3:
            outputs = outputs[0]

        for detection in outputs:
            x_center, y_center, width, height = detection[:4]
            class_scores = detection[4:]

            class_id = int(np.argmax(class_scores))
            confidence = float(class_scores[class_id])

            if confidence < self._confidence_threshold:
                continue

            # Convert to corner format and scale
            x1 = int((x_center - width / 2) * x_scale)
            y1 = int((y_center - height / 2) * y_scale)
            x2 = int((x_center + width / 2) * x_scale)
            y2 = int((y_center + height / 2) * y_scale)

            # Clamp to frame bounds
            # Calculate original frame dimensions from scale factors
            orig_w = int(x_scale * self._input_shape[2])
            orig_h = int(y_scale * self._input_shape[1])
            x1 = max(0, min(x1, orig_w - 1))
            y1 = max(0, min(y1, orig_h - 1))
            x2 = max(0, min(x2, orig_w))
            y2 = max(0, min(y2, orig_h))

            bbox = BoundingBox(x1, y1, x2, y2)
            drone_score = self._scorer.calculate_score(class_id, confidence, bbox)

            class_name = (
                self._class_names[class_id]
                if class_id < len(self._class_names)
                else 'unknown'
            )

            detections.append(Detection(
                class_id=class_id,
                class_name=class_name,
                confidence=confidence,
                bbox=bbox,
                drone_score=drone_score,
            ))

        # Apply NMS
        return self._nms(detections)

    def _nms(self, detections: List[Detection]) -> List[Detection]:
        """Apply non-maximum suppression."""
        if len(detections) == 0:
            return []

        detections = sorted(detections, key=lambda x: x.confidence, reverse=True)

        keep = []
        while detections:
            best = detections.pop(0)
            keep.append(best)

            detections = [
                d for d in detections
                if self._iou(best.bbox, d.bbox) < self._nms_threshold
            ]

        return keep

    def _iou(self, box1: BoundingBox, box2: BoundingBox) -> float:
        """Calculate intersection over union."""
        x1 = max(box1.x1, box2.x1)
        y1 = max(box1.y1, box2.y1)
        x2 = min(box1.x2, box2.x2)
        y2 = min(box1.y2, box2.y2)

        intersection = max(0, x2 - x1) * max(0, y2 - y1)
        union = box1.area + box2.area - intersection

        return intersection / union if union > 0 else 0


class TFLiteEngine(BaseInferenceEngine):
    """TensorFlow Lite inference engine for Raspberry Pi."""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._interpreter = None
        self._input_details = None
        self._output_details = None
        self._using_tflite_runtime = False

    def load_model(self, model_path: str) -> bool:
        self._model_path = model_path

        # Try tflite_runtime first (optimized for Pi)
        try:
            import tflite_runtime.interpreter as tflite
            self._using_tflite_runtime = True
        except ImportError:
            try:
                import tensorflow.lite as tflite
                self._using_tflite_runtime = False
            except ImportError:
                print("ERROR: Neither tflite_runtime nor tensorflow available")
                return False

        try:
            self._interpreter = tflite.Interpreter(
                model_path=model_path,
                num_threads=self._num_threads,
            )
            self._interpreter.allocate_tensors()

            self._input_details = self._interpreter.get_input_details()
            self._output_details = self._interpreter.get_output_details()

            # Get input shape
            self._input_shape = tuple(self._input_details[0]['shape'])
            self._is_quantized = self._input_details[0]['dtype'] == np.uint8

            return True

        except Exception as e:
            print(f"ERROR loading TFLite model: {e}")
            return False

    def detect(self, frame: np.ndarray) -> InferenceResult:
        if self._interpreter is None:
            return InferenceResult(detections=[], inference_time_ms=0)

        input_data, x_scale, y_scale = self._preprocess(frame)

        start_time = time.perf_counter()

        self._interpreter.set_tensor(self._input_details[0]['index'], input_data)
        self._interpreter.invoke()
        outputs = self._interpreter.get_tensor(self._output_details[0]['index'])

        inference_time = (time.perf_counter() - start_time) * 1000

        detections = self._postprocess(outputs, x_scale, y_scale)

        return InferenceResult(
            detections=detections,
            inference_time_ms=inference_time,
            model_name=Path(self._model_path).name if self._model_path else "unknown",
            input_shape=self._input_shape,
        )

    @property
    def engine_info(self) -> Dict[str, Any]:
        return {
            'type': 'tflite',
            'model_path': self._model_path,
            'using_tflite_runtime': self._using_tflite_runtime,
            'input_shape': self._input_shape,
            'is_quantized': self._is_quantized,
            'num_threads': self._num_threads,
            'confidence_threshold': self._confidence_threshold,
            'nms_threshold': self._nms_threshold,
        }


class CoralEngine(BaseInferenceEngine):
    """Coral Edge TPU inference engine for hardware acceleration."""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._interpreter = None
        self._input_details = None
        self._output_details = None

    def load_model(self, model_path: str) -> bool:
        self._model_path = model_path

        try:
            from pycoral.utils.edgetpu import make_interpreter

            self._interpreter = make_interpreter(model_path)
            self._interpreter.allocate_tensors()

            self._input_details = self._interpreter.get_input_details()
            self._output_details = self._interpreter.get_output_details()

            self._input_shape = tuple(self._input_details[0]['shape'])
            self._is_quantized = self._input_details[0]['dtype'] == np.uint8

            return True

        except ImportError:
            print("ERROR: pycoral not installed")
            return False
        except Exception as e:
            print(f"ERROR loading Coral model: {e}")
            return False

    def detect(self, frame: np.ndarray) -> InferenceResult:
        if self._interpreter is None:
            return InferenceResult(detections=[], inference_time_ms=0)

        input_data, x_scale, y_scale = self._preprocess(frame)

        start_time = time.perf_counter()

        self._interpreter.set_tensor(self._input_details[0]['index'], input_data)
        self._interpreter.invoke()
        outputs = self._interpreter.get_tensor(self._output_details[0]['index'])

        inference_time = (time.perf_counter() - start_time) * 1000

        detections = self._postprocess(outputs, x_scale, y_scale)

        return InferenceResult(
            detections=detections,
            inference_time_ms=inference_time,
            model_name=Path(self._model_path).name if self._model_path else "unknown",
            input_shape=self._input_shape,
        )

    @property
    def engine_info(self) -> Dict[str, Any]:
        return {
            'type': 'coral',
            'model_path': self._model_path,
            'input_shape': self._input_shape,
            'is_quantized': self._is_quantized,
            'confidence_threshold': self._confidence_threshold,
            'nms_threshold': self._nms_threshold,
        }


class ONNXEngine(BaseInferenceEngine):
    """ONNX Runtime inference engine for cross-platform compatibility."""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._session = None
        self._input_name = None
        self._output_name = None

    def load_model(self, model_path: str) -> bool:
        self._model_path = model_path

        try:
            import onnxruntime as ort

            # Configure session options
            sess_options = ort.SessionOptions()
            sess_options.intra_op_num_threads = self._num_threads
            sess_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL

            # Try to use available providers
            providers = ['CPUExecutionProvider']
            try:
                if 'CUDAExecutionProvider' in ort.get_available_providers():
                    providers.insert(0, 'CUDAExecutionProvider')
            except Exception:
                pass

            self._session = ort.InferenceSession(
                model_path,
                sess_options,
                providers=providers,
            )

            # Get input/output info
            self._input_name = self._session.get_inputs()[0].name
            self._output_name = self._session.get_outputs()[0].name

            input_info = self._session.get_inputs()[0]
            # Handle dynamic dimensions (e.g., 'batch_size', None) by replacing with defaults
            raw_shape = input_info.shape
            resolved_shape = []
            for i, dim in enumerate(raw_shape):
                if isinstance(dim, int) and dim > 0:
                    resolved_shape.append(dim)
                elif i == 0:
                    # Batch dimension - default to 1
                    resolved_shape.append(1)
                else:
                    # Other dimensions - use default 320
                    resolved_shape.append(320)
            self._input_shape = tuple(resolved_shape)

            # ONNX models are typically float32
            self._is_quantized = False

            return True

        except ImportError:
            print("ERROR: onnxruntime not installed")
            return False
        except Exception as e:
            print(f"ERROR loading ONNX model: {e}")
            return False

    def detect(self, frame: np.ndarray) -> InferenceResult:
        if self._session is None:
            return InferenceResult(detections=[], inference_time_ms=0)

        input_data, x_scale, y_scale = self._preprocess(frame)

        start_time = time.perf_counter()

        outputs = self._session.run(
            [self._output_name],
            {self._input_name: input_data}
        )[0]

        inference_time = (time.perf_counter() - start_time) * 1000

        detections = self._postprocess(outputs, x_scale, y_scale)

        return InferenceResult(
            detections=detections,
            inference_time_ms=inference_time,
            model_name=Path(self._model_path).name if self._model_path else "unknown",
            input_shape=self._input_shape,
        )

    @property
    def engine_info(self) -> Dict[str, Any]:
        return {
            'type': 'onnx',
            'model_path': self._model_path,
            'input_shape': self._input_shape,
            'is_quantized': self._is_quantized,
            'num_threads': self._num_threads,
            'confidence_threshold': self._confidence_threshold,
            'nms_threshold': self._nms_threshold,
        }


class MockInferenceEngine(BaseInferenceEngine):
    """Mock inference engine for testing without a model."""

    def __init__(
        self,
        simulate_latency_ms: float = 100,
        generate_detections: bool = True,
        **kwargs
    ):
        super().__init__(**kwargs)
        self._simulate_latency_ms = simulate_latency_ms
        self._generate_detections = generate_detections
        self._frame_count = 0

    def load_model(self, model_path: str) -> bool:
        self._model_path = model_path
        return True

    def detect(self, frame: np.ndarray) -> InferenceResult:
        self._frame_count += 1

        # Simulate inference latency
        if self._simulate_latency_ms > 0:
            time.sleep(self._simulate_latency_ms / 1000)

        detections = []

        if self._generate_detections:
            # Generate a moving "drone" detection
            h, w = frame.shape[:2]
            x = (self._frame_count * 5) % (w - 100)
            y = h // 2 - 50

            bbox = BoundingBox(x, y, x + 100, y + 100)
            detections.append(Detection(
                class_id=0,
                class_name='drone',
                confidence=0.85,
                bbox=bbox,
                drone_score=0.9,
            ))

        return InferenceResult(
            detections=detections,
            inference_time_ms=self._simulate_latency_ms,
            model_name="mock_model",
            input_shape=self._input_shape,
        )

    @property
    def engine_info(self) -> Dict[str, Any]:
        return {
            'type': 'mock',
            'simulate_latency_ms': self._simulate_latency_ms,
            'generate_detections': self._generate_detections,
            'frame_count': self._frame_count,
        }


def create_inference_engine(
    engine_type: str = "auto",
    model_path: str = "",
    use_coral: bool = False,
    **kwargs
) -> InferenceEngine:
    """
    Factory function to create appropriate inference engine.

    Args:
        engine_type: "auto", "tflite", "coral", "onnx", "mock"
        model_path: Path to model file
        use_coral: Prefer Coral TPU if available
        **kwargs: Arguments passed to engine constructor

    Returns:
        Configured InferenceEngine instance
    """
    if engine_type == "mock":
        engine = MockInferenceEngine(**kwargs)
        engine.load_model(model_path)
        return engine

    # Determine engine type from model extension if auto
    if engine_type == "auto":
        model_ext = Path(model_path).suffix.lower()

        if use_coral or '_edgetpu' in model_path.lower():
            engine_type = "coral"
        elif model_ext in ['.tflite']:
            engine_type = "tflite"
        elif model_ext in ['.onnx']:
            engine_type = "onnx"
        else:
            engine_type = "tflite"  # Default

    # Create engine
    if engine_type == "coral":
        engine = CoralEngine(**kwargs)
        if not engine.load_model(model_path):
            print("Coral not available, falling back to TFLite")
            engine = TFLiteEngine(**kwargs)
            if not engine.load_model(model_path):
                raise RuntimeError(f"Failed to load model with both Coral and TFLite: {model_path}")
        return engine

    if engine_type == "onnx":
        engine = ONNXEngine(**kwargs)
        if not engine.load_model(model_path):
            raise RuntimeError(f"Failed to load ONNX model: {model_path}")
        return engine

    if engine_type == "tflite":
        engine = TFLiteEngine(**kwargs)
        if not engine.load_model(model_path):
            raise RuntimeError(f"Failed to load TFLite model: {model_path}")
        return engine

    raise ValueError(f"Unknown engine type: {engine_type}")
