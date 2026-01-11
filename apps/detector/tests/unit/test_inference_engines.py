"""
Unit tests for inference_engines.py - inference engine creation and operations.
"""

import pytest
import sys
import numpy as np
from pathlib import Path
from unittest.mock import MagicMock, patch, mock_open

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "src"))

from inference_engines import (
    create_inference_engine,
    MockInferenceEngine,
    TFLiteEngine,
    ONNXEngine,
)
from interfaces import Detection, BoundingBox, InferenceResult


class TestMockInferenceEngine:
    """Tests for MockInferenceEngine."""

    def test_mock_engine_initialization(self):
        """Should initialize mock inference engine."""
        engine = MockInferenceEngine()

        assert engine is not None
        assert isinstance(engine, MockInferenceEngine)

    def test_mock_engine_detect(self):
        """Should perform detection and return InferenceResult."""
        engine = MockInferenceEngine()
        engine.load_model("mock")  # Mock engine needs model loaded

        # Create a dummy frame
        frame = np.zeros((480, 640, 3), dtype=np.uint8)

        result = engine.detect(frame)

        assert result is not None
        assert hasattr(result, "detections")
        assert hasattr(result, "inference_time_ms")
        assert isinstance(result.detections, list)

    def test_mock_engine_engine_info(self):
        """Should have engine info."""
        engine = MockInferenceEngine()

        info = engine.engine_info

        assert info is not None
        assert isinstance(info, dict)
        assert "type" in info

    def test_mock_engine_input_size(self):
        """Should have input size property."""
        engine = MockInferenceEngine()

        # Check if input_size exists (may be property or method)
        if hasattr(engine, "input_size"):
            size = engine.input_size
            assert size is not None
            assert len(size) == 2  # (width, height)


class TestCreateInferenceEngine:
    """Tests for create_inference_engine factory function."""

    def test_create_mock_engine(self):
        """Should create mock inference engine."""
        engine = create_inference_engine(
            engine_type="mock", model_path="mock", use_coral=False
        )

        assert isinstance(engine, MockInferenceEngine)

    def test_create_mock_engine_with_coral(self):
        """Should create mock engine even with use_coral=True (coral ignored for mock)."""
        engine = create_inference_engine(
            engine_type="mock", model_path="mock", use_coral=True
        )

        assert isinstance(engine, MockInferenceEngine)

    def test_create_tflite_engine_with_nonexistent_model_raises_error(self):
        """Should raise RuntimeError when TFLite model doesn't exist."""
        with pytest.raises(RuntimeError, match="Failed to load TFLite model"):
            create_inference_engine(
                engine_type="tflite", model_path="nonexistent.tflite", use_coral=False
            )

    def test_create_onnx_engine_with_nonexistent_model_raises_error(self):
        """Should raise RuntimeError when ONNX model doesn't exist."""
        with pytest.raises(RuntimeError, match="Failed to load ONNX model"):
            create_inference_engine(
                engine_type="onnx", model_path="nonexistent.onnx", use_coral=False
            )

    def test_create_auto_engine_with_nonexistent_model_raises_error(self):
        """Should raise RuntimeError when auto-detection fails to load model."""
        # When no model is available, auto will try tflite and fail
        with pytest.raises(RuntimeError, match="Failed to load"):
            create_inference_engine(
                engine_type="auto", model_path="nonexistent.model", use_coral=False
            )

    def test_create_invalid_engine_type(self):
        """Should raise ValueError for invalid engine type."""
        with pytest.raises((ValueError, NotImplementedError)):
            create_inference_engine(
                engine_type="invalid", model_path="test.model", use_coral=False
            )
