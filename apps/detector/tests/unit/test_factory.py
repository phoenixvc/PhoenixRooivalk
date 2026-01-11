"""
Unit tests for factory.py - pipeline creation and component wiring.
"""

import sys
from pathlib import Path
from unittest.mock import MagicMock, Mock, patch

import pytest

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "src"))

from factory import (
    DetectionPipeline,
    create_demo_pipeline,
    create_minimal_pipeline,
    create_pipeline,
)
from interfaces import AcceleratorType, HardwareProfile, PipelineConfig


@pytest.fixture
def mock_hardware_profile():
    """Create a mock hardware profile."""
    profile = MagicMock(spec=HardwareProfile)
    profile.platform = "linux"
    profile.accelerator_available = False
    profile.accelerator_type = AcceleratorType.NONE
    profile.recommended_capture_resolution = (640, 480)
    profile.recommended_capture_fps = 30
    profile.recommended_model_input = (320, 320)
    profile.recommended_inference_threads = 4
    return profile


@pytest.fixture
def mock_frame_source():
    """Create a mock frame source."""
    source = MagicMock()
    source.is_open.return_value = True
    source.open.return_value = True
    source.close.return_value = None
    source.source_info = {"type": "mock"}
    source.resolution = (640, 480)
    return source


@pytest.fixture
def mock_inference_engine():
    """Create a mock inference engine."""
    engine = MagicMock()
    engine.engine_info = {"type": "mock"}
    engine.load_model.return_value = True
    return engine


@pytest.fixture
def mock_tracker():
    """Create a mock tracker."""
    tracker = MagicMock()
    tracker.tracker_info = {"type": "centroid"}
    return tracker


@pytest.fixture
def mock_alert_handler():
    """Create a mock alert handler."""
    handler = MagicMock()
    handler.flush.return_value = None
    return handler


@pytest.fixture
def mock_renderer():
    """Create a mock renderer."""
    renderer = MagicMock()
    renderer.renderer_info = {"type": "opencv"}
    renderer.close.return_value = None
    return renderer


class TestDetectionPipeline:
    """Tests for DetectionPipeline dataclass."""

    def test_pipeline_initialization(
        self,
        mock_frame_source,
        mock_inference_engine,
        mock_tracker,
        mock_alert_handler,
        mock_renderer,
        mock_hardware_profile,
    ):
        """Should initialize pipeline with all components."""
        config = PipelineConfig(
            model_path="test.tflite",
            confidence_threshold=0.5,
            nms_threshold=0.45,
        )

        pipeline = DetectionPipeline(
            frame_source=mock_frame_source,
            inference_engine=mock_inference_engine,
            tracker=mock_tracker,
            alert_handler=mock_alert_handler,
            renderer=mock_renderer,
            config=config,
            hardware=mock_hardware_profile,
        )

        assert pipeline.frame_source == mock_frame_source
        assert pipeline.inference_engine == mock_inference_engine
        assert pipeline.tracker == mock_tracker
        assert pipeline.alert_handler == mock_alert_handler
        assert pipeline.renderer == mock_renderer
        assert pipeline.config == config
        assert pipeline.hardware == mock_hardware_profile

    def test_pipeline_start(self, mock_frame_source, mock_inference_engine, mock_tracker, mock_alert_handler, mock_renderer, mock_hardware_profile):
        """Should start pipeline components."""
        config = PipelineConfig(
            model_path="test.tflite",
            confidence_threshold=0.5,
            nms_threshold=0.45,
        )

        # Frame source is already open
        mock_frame_source.is_open.return_value = True

        pipeline = DetectionPipeline(
            frame_source=mock_frame_source,
            inference_engine=mock_inference_engine,
            tracker=mock_tracker,
            alert_handler=mock_alert_handler,
            renderer=mock_renderer,
            config=config,
            hardware=mock_hardware_profile,
        )

        result = pipeline.start()

        assert result is True
        # If already open, open() is not called
        mock_frame_source.is_open.assert_called()

    def test_pipeline_start_fails_when_frame_source_fails(self, mock_frame_source, mock_inference_engine, mock_tracker, mock_alert_handler, mock_renderer, mock_hardware_profile):
        """Should return False when frame source fails to open."""
        config = PipelineConfig(
            model_path="test.tflite",
            confidence_threshold=0.5,
            nms_threshold=0.45,
        )

        mock_frame_source.is_open.return_value = False
        mock_frame_source.open.return_value = False

        pipeline = DetectionPipeline(
            frame_source=mock_frame_source,
            inference_engine=mock_inference_engine,
            tracker=mock_tracker,
            alert_handler=mock_alert_handler,
            renderer=mock_renderer,
            config=config,
            hardware=mock_hardware_profile,
        )

        result = pipeline.start()

        assert result is False

    def test_pipeline_stop(self, mock_frame_source, mock_inference_engine, mock_tracker, mock_alert_handler, mock_renderer, mock_hardware_profile):
        """Should stop pipeline components."""
        config = PipelineConfig(
            model_path="test.tflite",
            confidence_threshold=0.5,
            nms_threshold=0.45,
        )

        pipeline = DetectionPipeline(
            frame_source=mock_frame_source,
            inference_engine=mock_inference_engine,
            tracker=mock_tracker,
            alert_handler=mock_alert_handler,
            renderer=mock_renderer,
            config=config,
            hardware=mock_hardware_profile,
        )

        pipeline.stop()

        mock_alert_handler.flush.assert_called_once()
        mock_frame_source.close.assert_called_once()
        mock_renderer.close.assert_called_once()

    def test_pipeline_stop_with_streaming(self, mock_frame_source, mock_inference_engine, mock_tracker, mock_alert_handler, mock_renderer, mock_hardware_profile):
        """Should stop streaming manager if present."""
        config = PipelineConfig(
            model_path="test.tflite",
            confidence_threshold=0.5,
            nms_threshold=0.45,
        )

        mock_streaming_manager = MagicMock()
        mock_streaming_manager.stop.return_value = None

        pipeline = DetectionPipeline(
            frame_source=mock_frame_source,
            inference_engine=mock_inference_engine,
            tracker=mock_tracker,
            alert_handler=mock_alert_handler,
            renderer=mock_renderer,
            config=config,
            hardware=mock_hardware_profile,
            streaming_manager=mock_streaming_manager,
        )

        pipeline.stop()

        mock_streaming_manager.stop.assert_called_once()
        mock_alert_handler.flush.assert_called_once()
        mock_frame_source.close.assert_called_once()


class TestCreatePipeline:
    """Tests for create_pipeline factory function."""

    @patch("factory.create_frame_source")
    @patch("factory.create_inference_engine")
    @patch("factory.create_tracker")
    @patch("factory.create_renderer")
    @patch("factory.detect_hardware")
    @patch("factory.print_hardware_report")
    def test_create_pipeline_mock(
        self,
        mock_print_hw,
        mock_detect_hw,
        mock_create_renderer,
        mock_create_tracker,
        mock_create_engine,
        mock_create_source,
        mock_hardware_profile,
        mock_frame_source,
        mock_inference_engine,
        mock_tracker,
        mock_renderer,
    ):
        """Should create pipeline with mock components."""
        mock_detect_hw.return_value = mock_hardware_profile
        mock_create_source.return_value = mock_frame_source
        mock_create_engine.return_value = mock_inference_engine
        mock_create_tracker.return_value = mock_tracker
        mock_create_renderer.return_value = mock_renderer

        pipeline = create_pipeline(
            model_path="mock",
            camera_source="mock",
            engine_type="mock",
            print_hardware=False,
        )

        assert isinstance(pipeline, DetectionPipeline)
        assert pipeline.frame_source == mock_frame_source
        assert pipeline.inference_engine == mock_inference_engine
        assert pipeline.tracker == mock_tracker
        # Alert handler is created internally, just verify it exists
        assert pipeline.alert_handler is not None
        assert pipeline.renderer == mock_renderer

    @patch("factory.create_frame_source")
    @patch("factory.create_inference_engine")
    @patch("factory.create_tracker")
    @patch("factory.create_alert_handler")
    @patch("factory.create_renderer")
    @patch("factory.detect_hardware")
    @patch("factory.print_hardware_report")
    def test_create_pipeline_auto_configure(
        self,
        mock_print_hw,
        mock_detect_hw,
        mock_create_renderer,
        mock_create_alert,
        mock_create_tracker,
        mock_create_engine,
        mock_create_source,
        mock_hardware_profile,
        mock_frame_source,
        mock_inference_engine,
        mock_tracker,
        mock_alert_handler,
        mock_renderer,
    ):
        """Should use hardware recommendations when auto_configure is True."""
        mock_detect_hw.return_value = mock_hardware_profile
        mock_create_source.return_value = mock_frame_source
        mock_create_engine.return_value = mock_inference_engine
        mock_create_tracker.return_value = mock_tracker
        mock_create_alert.return_value = mock_alert_handler
        mock_create_renderer.return_value = mock_renderer

        pipeline = create_pipeline(
            model_path="mock",
            camera_source="mock",
            engine_type="mock",
            auto_configure=True,
            print_hardware=False,
        )

        assert pipeline.config.capture_width == 640
        assert pipeline.config.capture_height == 480
        assert pipeline.config.capture_fps == 30

    @patch("factory.create_frame_source")
    @patch("factory.create_inference_engine")
    @patch("factory.create_tracker")
    @patch("factory.create_alert_handler")
    @patch("factory.create_renderer")
    @patch("factory.detect_hardware")
    @patch("factory.print_hardware_report")
    def test_create_pipeline_manual_config(
        self,
        mock_print_hw,
        mock_detect_hw,
        mock_create_renderer,
        mock_create_alert,
        mock_create_tracker,
        mock_create_engine,
        mock_create_source,
        mock_hardware_profile,
        mock_frame_source,
        mock_inference_engine,
        mock_tracker,
        mock_alert_handler,
        mock_renderer,
    ):
        """Should use provided values when auto_configure is False."""
        mock_detect_hw.return_value = mock_hardware_profile
        mock_create_source.return_value = mock_frame_source
        mock_create_engine.return_value = mock_inference_engine
        mock_create_tracker.return_value = mock_tracker
        mock_create_alert.return_value = mock_alert_handler
        mock_create_renderer.return_value = mock_renderer

        pipeline = create_pipeline(
            model_path="mock",
            camera_source="mock",
            engine_type="mock",
            width=1280,
            height=720,
            fps=60,
            auto_configure=False,
            print_hardware=False,
        )

        assert pipeline.config.capture_width == 1280
        assert pipeline.config.capture_height == 720
        assert pipeline.config.capture_fps == 60

    @patch("factory.create_frame_source")
    @patch("factory.create_inference_engine")
    @patch("factory.create_tracker")
    @patch("factory.create_alert_handler")
    @patch("factory.create_renderer")
    @patch("factory.detect_hardware")
    @patch("factory.print_hardware_report")
    def test_create_pipeline_video_source(
        self,
        mock_print_hw,
        mock_detect_hw,
        mock_create_renderer,
        mock_create_alert,
        mock_create_tracker,
        mock_create_engine,
        mock_create_source,
        mock_hardware_profile,
        mock_frame_source,
        mock_inference_engine,
        mock_tracker,
        mock_alert_handler,
        mock_renderer,
    ):
        """Should create video source when video_file is provided."""
        mock_detect_hw.return_value = mock_hardware_profile
        mock_create_source.return_value = mock_frame_source
        mock_create_engine.return_value = mock_inference_engine
        mock_create_tracker.return_value = mock_tracker
        mock_create_alert.return_value = mock_alert_handler
        mock_create_renderer.return_value = mock_renderer

        pipeline = create_pipeline(
            model_path="mock",
            video_file="test.mp4",
            engine_type="mock",
            print_hardware=False,
        )

        # Verify video source was created
        mock_create_source.assert_called_once()
        call_args = mock_create_source.call_args
        assert call_args[1]["source_type"] == "video"
        assert call_args[1]["file_path"] == "test.mp4"


class TestCreateMinimalPipeline:
    """Tests for create_minimal_pipeline factory function."""

    @patch("factory.create_pipeline")
    def test_create_minimal_pipeline(self, mock_create_pipeline):
        """Should call create_pipeline with minimal settings."""
        mock_pipeline = MagicMock()
        mock_create_pipeline.return_value = mock_pipeline

        result = create_minimal_pipeline("test.tflite")

        mock_create_pipeline.assert_called_once()
        call_kwargs = mock_create_pipeline.call_args[1]
        assert call_kwargs["model_path"] == "test.tflite"
        assert call_kwargs["width"] == 480
        assert call_kwargs["height"] == 360
        assert call_kwargs["fps"] == 24
        assert call_kwargs["engine_type"] == "tflite"
        assert call_kwargs["tracker_type"] == "none"
        assert call_kwargs["headless"] is True
        assert call_kwargs["auto_configure"] is False
        assert result == mock_pipeline


class TestCreateDemoPipeline:
    """Tests for create_demo_pipeline factory function."""

    @patch("factory.create_pipeline")
    def test_create_demo_pipeline_with_mock(self, mock_create_pipeline):
        """Should create demo pipeline with mock components."""
        mock_pipeline = MagicMock()
        mock_create_pipeline.return_value = mock_pipeline

        result = create_demo_pipeline("test.tflite", use_mock=True)

        mock_create_pipeline.assert_called_once()
        call_kwargs = mock_create_pipeline.call_args[1]
        assert call_kwargs["model_path"] == "test.tflite"
        assert call_kwargs["camera_source"] == "mock"
        assert call_kwargs["engine_type"] == "mock"
        assert call_kwargs["tracker_type"] == "centroid"
        assert call_kwargs["headless"] is False
        assert call_kwargs["auto_configure"] is True
        assert result == mock_pipeline

    @patch("factory.create_pipeline")
    def test_create_demo_pipeline_without_mock(self, mock_create_pipeline):
        """Should create demo pipeline without mock components."""
        mock_pipeline = MagicMock()
        mock_create_pipeline.return_value = mock_pipeline

        result = create_demo_pipeline("test.tflite", use_mock=False)

        mock_create_pipeline.assert_called_once()
        call_kwargs = mock_create_pipeline.call_args[1]
        assert call_kwargs["model_path"] == "test.tflite"
        assert call_kwargs["camera_source"] == "auto"
        assert call_kwargs["engine_type"] == "auto"
        assert result == mock_pipeline

    @patch("factory.create_pipeline")
    def test_create_demo_pipeline_with_mock_model_path(self, mock_create_pipeline):
        """Should create demo pipeline with mock engine when model_path is 'mock'."""
        mock_pipeline = MagicMock()
        mock_create_pipeline.return_value = mock_pipeline

        result = create_demo_pipeline("mock", use_mock=False, camera_source="usb")

        mock_create_pipeline.assert_called_once()
        call_kwargs = mock_create_pipeline.call_args[1]
        assert call_kwargs["model_path"] == "mock"
        assert call_kwargs["camera_source"] == "usb"  # Should use provided camera_source
        assert call_kwargs["engine_type"] == "mock"  # Should be mock when model_path is "mock"
        assert result == mock_pipeline
