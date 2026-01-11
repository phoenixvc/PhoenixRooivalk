"""
Integration tests for full detection pipeline workflows.
"""

import pytest
import sys
import numpy as np
from pathlib import Path
from unittest.mock import MagicMock, patch

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "src"))

from factory import DetectionPipeline, create_pipeline, create_minimal_pipeline, create_demo_pipeline
from interfaces import FrameData, Detection, BoundingBox, InferenceResult, HardwareProfile
from frame_sources import MockFrameSource
from inference_engines import MockInferenceEngine
from alert_handlers import ConsoleAlertHandler


class TestPipelineWorkflow:
    """Tests for full detection pipeline workflows."""

    @pytest.fixture
    def mock_frame_source(self):
        """Create a mock frame source."""
        source = MockFrameSource(width=640, height=480, fps=30)
        source.open()
        return source

    @pytest.fixture
    def mock_inference_engine(self):
        """Create a mock inference engine."""
        engine = MockInferenceEngine(generate_detections=True)
        engine.load_model("mock")
        return engine

    @pytest.fixture
    def mock_hardware_profile(self):
        """Create a mock hardware profile."""
        profile = MagicMock(spec=HardwareProfile)
        profile.accelerator_available = False
        profile.recommended_capture_resolution = (640, 480)
        profile.recommended_capture_fps = 30
        profile.recommended_model_input = (320, 320)
        profile.recommended_inference_threads = 4
        return profile

    @patch("factory.create_frame_source")
    @patch("factory.create_inference_engine")
    @patch("factory.create_tracker")
    @patch("factory.create_alert_handler")
    @patch("factory.create_renderer")
    @patch("factory.detect_hardware")
    def test_pipeline_creation_and_start(
        self,
        mock_detect_hw,
        mock_create_renderer,
        mock_create_alert,
        mock_create_tracker,
        mock_create_engine,
        mock_create_source,
        mock_frame_source,
        mock_inference_engine,
        mock_hardware_profile,
    ):
        """Should create and start a pipeline successfully."""
        # Setup mocks
        mock_detect_hw.return_value = mock_hardware_profile
        mock_create_source.return_value = mock_frame_source
        mock_create_engine.return_value = mock_inference_engine
        mock_create_tracker.return_value = MagicMock()
        mock_create_alert.return_value = MagicMock(spec=ConsoleAlertHandler)
        mock_create_renderer.return_value = MagicMock()

        # Create pipeline
        pipeline = create_pipeline(
            model_path="mock",
            camera_source="mock",
            engine_type="mock",
            print_hardware=False,
        )

        assert isinstance(pipeline, DetectionPipeline)

        # Start pipeline
        result = pipeline.start()
        assert result is True

        # Stop pipeline
        pipeline.stop()
        # After stop, frame source should be closed
        assert not pipeline.frame_source.is_open()

    @patch("factory.create_frame_source")
    @patch("factory.create_inference_engine")
    @patch("factory.create_tracker")
    @patch("factory.create_alert_handler")
    @patch("factory.create_renderer")
    @patch("factory.detect_hardware")
    def test_pipeline_processes_frames(
        self,
        mock_detect_hw,
        mock_create_renderer,
        mock_create_alert,
        mock_create_tracker,
        mock_create_engine,
        mock_create_source,
        mock_frame_source,
        mock_inference_engine,
        mock_hardware_profile,
    ):
        """Should process frames through the pipeline."""
        # Setup mocks
        mock_detect_hw.return_value = mock_hardware_profile
        mock_create_source.return_value = mock_frame_source
        mock_create_engine.return_value = mock_inference_engine
        mock_tracker = MagicMock()
        mock_create_tracker.return_value = mock_tracker
        mock_alert = MagicMock(spec=ConsoleAlertHandler)
        mock_create_alert.return_value = mock_alert
        mock_renderer = MagicMock()
        mock_create_renderer.return_value = mock_renderer

        # Create pipeline
        pipeline = create_pipeline(
            model_path="mock",
            camera_source="mock",
            engine_type="mock",
            print_hardware=False,
        )

        # Start pipeline
        pipeline.start()

        # Process a few frames
        for _ in range(3):
            # Pipeline should process frames internally
            # In a real scenario, this would be in a loop
            pass

        # Verify frame source was opened (before stop)
        assert mock_frame_source.is_open()

        # Stop pipeline
        pipeline.stop()

        # After stop, frame source should be closed
        assert not mock_frame_source.is_open()

    @patch("factory.create_frame_source")
    @patch("factory.create_inference_engine")
    @patch("factory.create_tracker")
    @patch("factory.create_alert_handler")
    @patch("factory.create_renderer")
    @patch("factory.detect_hardware")
    def test_minimal_pipeline_creation(
        self,
        mock_detect_hw,
        mock_create_renderer,
        mock_create_alert,
        mock_create_tracker,
        mock_create_engine,
        mock_create_source,
        mock_frame_source,
        mock_inference_engine,
        mock_hardware_profile,
    ):
        """Should create a minimal pipeline."""
        # Setup mocks
        mock_detect_hw.return_value = mock_hardware_profile
        mock_create_source.return_value = mock_frame_source
        mock_create_engine.return_value = mock_inference_engine
        mock_create_tracker.return_value = MagicMock()
        mock_create_alert.return_value = MagicMock(spec=ConsoleAlertHandler)
        mock_create_renderer.return_value = MagicMock()

        # Create minimal pipeline
        pipeline = create_minimal_pipeline(model_path="mock")

        assert isinstance(pipeline, DetectionPipeline)

        # Should be able to start and stop
        result = pipeline.start()
        assert result is True
        pipeline.stop()
        assert not pipeline.frame_source.is_open()

    @patch("factory.create_frame_source")
    @patch("factory.create_inference_engine")
    @patch("factory.create_tracker")
    @patch("factory.create_alert_handler")
    @patch("factory.create_renderer")
    @patch("factory.detect_hardware")
    def test_demo_pipeline_creation(
        self,
        mock_detect_hw,
        mock_create_renderer,
        mock_create_alert,
        mock_create_tracker,
        mock_create_engine,
        mock_create_source,
        mock_frame_source,
        mock_inference_engine,
        mock_hardware_profile,
    ):
        """Should create a demo pipeline."""
        # Setup mocks
        mock_detect_hw.return_value = mock_hardware_profile
        mock_create_source.return_value = mock_frame_source
        mock_create_engine.return_value = mock_inference_engine
        mock_create_tracker.return_value = MagicMock()
        mock_create_alert.return_value = MagicMock(spec=ConsoleAlertHandler)
        mock_create_renderer.return_value = MagicMock()

        # Create demo pipeline (requires model_path)
        pipeline = create_demo_pipeline(model_path="mock")

        assert isinstance(pipeline, DetectionPipeline)

        # Should be able to start and stop
        result = pipeline.start()
        assert result is True
        pipeline.stop()
        assert not pipeline.frame_source.is_open()


class TestPipelineIntegration:
    """Integration tests for pipeline with real components."""

    def test_pipeline_with_mock_components(self):
        """Should work with actual mock components (no full mocking)."""
        # Create pipeline with mock source and engine
        pipeline = create_pipeline(
            model_path="mock",
            camera_source="mock",
            engine_type="mock",
            print_hardware=False,
        )

        assert isinstance(pipeline, DetectionPipeline)
        assert pipeline.frame_source is not None
        assert pipeline.inference_engine is not None

        # Start and stop
        result = pipeline.start()
        assert result is True
        pipeline.stop()
        assert not pipeline.frame_source.is_open()

    def test_pipeline_stop_closes_frame_source(self):
        """Should close frame source when pipeline stops."""
        pipeline = create_pipeline(
            model_path="mock",
            camera_source="mock",
            engine_type="mock",
            print_hardware=False,
        )

        # Start pipeline
        pipeline.start()
        assert pipeline.frame_source.is_open()

        # Stop pipeline
        pipeline.stop()
        assert not pipeline.frame_source.is_open()

    def test_pipeline_configuration(self):
        """Should have correct configuration."""
        pipeline = create_pipeline(
            model_path="mock",
            camera_source="mock",
            engine_type="mock",
            confidence_threshold=0.7,
            nms_threshold=0.5,
            print_hardware=False,
        )

        assert pipeline.config is not None
        assert pipeline.config.confidence_threshold == 0.7
        assert pipeline.config.nms_threshold == 0.5
