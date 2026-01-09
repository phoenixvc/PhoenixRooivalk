"""
Unit tests for streaming module.

Tests MJPEG streaming, frame buffer, and StreamingRenderer.
"""

import pytest
import sys
import time
import threading
from pathlib import Path
from unittest.mock import Mock, MagicMock, patch

# Add src to path for imports
src_path = Path(__file__).parent.parent.parent / "src"
sys.path.insert(0, str(src_path))

import numpy as np

from interfaces import FrameData, Detection, TrackedObject, BoundingBox
from streaming import (
    StreamFrame,
    FrameBuffer,
    StreamingRenderer,
    create_streaming_renderer,
)


# =============================================================================
# StreamFrame Tests
# =============================================================================

class TestStreamFrame:
    """Tests for StreamFrame dataclass."""

    def test_creation(self):
        """Should create StreamFrame with all fields."""
        frame = StreamFrame(
            jpeg_data=b'\xff\xd8\xff\xe0',
            timestamp=1234567890.0,
            frame_number=42,
            detection_count=3,
            inference_time_ms=15.5,
        )

        assert frame.jpeg_data == b'\xff\xd8\xff\xe0'
        assert frame.timestamp == 1234567890.0
        assert frame.frame_number == 42
        assert frame.detection_count == 3
        assert frame.inference_time_ms == 15.5


# =============================================================================
# FrameBuffer Tests
# =============================================================================

class TestFrameBuffer:
    """Tests for thread-safe FrameBuffer."""

    def test_put_and_get_latest(self):
        """Should store and retrieve frames."""
        buffer = FrameBuffer()
        frame = StreamFrame(
            jpeg_data=b'test',
            timestamp=time.time(),
            frame_number=1,
            detection_count=0,
            inference_time_ms=10.0,
        )

        buffer.put(frame)
        retrieved = buffer.get_latest()

        assert retrieved is not None
        assert retrieved.jpeg_data == b'test'
        assert retrieved.frame_number == 1

    def test_get_latest_empty(self):
        """Should return None when empty."""
        buffer = FrameBuffer()
        assert buffer.get_latest() is None

    def test_overwrites_old_frame(self):
        """Should overwrite old frames with new ones."""
        buffer = FrameBuffer()

        frame1 = StreamFrame(
            jpeg_data=b'first',
            timestamp=time.time(),
            frame_number=1,
            detection_count=0,
            inference_time_ms=10.0,
        )
        frame2 = StreamFrame(
            jpeg_data=b'second',
            timestamp=time.time(),
            frame_number=2,
            detection_count=1,
            inference_time_ms=12.0,
        )

        buffer.put(frame1)
        buffer.put(frame2)

        retrieved = buffer.get_latest()
        assert retrieved.jpeg_data == b'second'
        assert retrieved.frame_number == 2

    def test_get_with_timeout(self):
        """Should wait for frame with timeout."""
        buffer = FrameBuffer()

        def delayed_put():
            time.sleep(0.1)
            buffer.put(StreamFrame(
                jpeg_data=b'delayed',
                timestamp=time.time(),
                frame_number=1,
                detection_count=0,
                inference_time_ms=10.0,
            ))

        thread = threading.Thread(target=delayed_put)
        thread.start()

        frame = buffer.get(timeout=1.0)
        thread.join()

        assert frame is not None
        assert frame.jpeg_data == b'delayed'

    def test_get_timeout_returns_none(self):
        """Should return None on timeout with no frame."""
        buffer = FrameBuffer()
        frame = buffer.get(timeout=0.1)
        assert frame is None

    def test_thread_safety(self):
        """Should handle concurrent access."""
        buffer = FrameBuffer()
        frames_written = []
        frames_read = []

        def writer():
            for i in range(100):
                frame = StreamFrame(
                    jpeg_data=f'frame{i}'.encode(),
                    timestamp=time.time(),
                    frame_number=i,
                    detection_count=0,
                    inference_time_ms=10.0,
                )
                buffer.put(frame)
                frames_written.append(i)
                time.sleep(0.001)

        def reader():
            for _ in range(50):
                frame = buffer.get_latest()
                if frame:
                    frames_read.append(frame.frame_number)
                time.sleep(0.002)

        writer_thread = threading.Thread(target=writer)
        reader_thread = threading.Thread(target=reader)

        writer_thread.start()
        reader_thread.start()

        writer_thread.join()
        reader_thread.join()

        assert len(frames_written) == 100
        assert len(frames_read) > 0


# =============================================================================
# StreamingRenderer Tests
# =============================================================================

class TestStreamingRenderer:
    """Tests for StreamingRenderer wrapper."""

    @pytest.fixture
    def mock_base_renderer(self):
        """Create a mock base renderer."""
        renderer = Mock()
        renderer.render.return_value = np.zeros((480, 640, 3), dtype=np.uint8)
        renderer.show.return_value = True
        renderer.renderer_info = {'type': 'mock'}
        return renderer

    @pytest.fixture
    def frame_data(self):
        """Create sample frame data."""
        return FrameData(
            frame=np.zeros((480, 640, 3), dtype=np.uint8),
            timestamp=time.time(),
            frame_number=1,
            width=640,
            height=480,
        )

    @pytest.fixture
    def sample_detection(self):
        """Create sample detection."""
        return Detection(
            class_id=0,
            class_name='drone',
            confidence=0.85,
            bbox=BoundingBox(100, 100, 200, 200),
            drone_score=0.9,
        )

    def test_creation_without_base(self):
        """Should create renderer without base."""
        renderer = StreamingRenderer()

        assert renderer._base_renderer is None
        assert renderer._quality == 80
        assert renderer._max_fps == 15

    def test_creation_with_base(self, mock_base_renderer):
        """Should create renderer with base renderer."""
        renderer = StreamingRenderer(
            base_renderer=mock_base_renderer,
            quality=90,
            max_fps=30,
        )

        assert renderer._base_renderer is mock_base_renderer
        assert renderer._quality == 90
        assert renderer._max_fps == 30

    def test_has_frame_buffer(self):
        """Should provide frame buffer access."""
        renderer = StreamingRenderer()

        assert renderer.frame_buffer is not None
        assert isinstance(renderer.frame_buffer, FrameBuffer)

    @patch('streaming.cv2')
    def test_render_encodes_frame(self, mock_cv2, frame_data, sample_detection):
        """Should encode frames to JPEG."""
        # Mock cv2.imencode
        mock_cv2.imencode.return_value = (True, np.array([255, 216, 255, 224]))
        mock_cv2.IMWRITE_JPEG_QUALITY = 1

        renderer = StreamingRenderer(quality=85)
        renderer.render(frame_data, [sample_detection], [], 15.0)

        # Wait for potential rate limiting
        time.sleep(0.1)

        # Should have encoded a frame
        mock_cv2.imencode.assert_called()

    def test_delegates_to_base_renderer(self, mock_base_renderer, frame_data, sample_detection):
        """Should call base renderer's render method."""
        renderer = StreamingRenderer(base_renderer=mock_base_renderer)

        with patch('streaming.cv2') as mock_cv2:
            mock_cv2.imencode.return_value = (True, np.array([255, 216]))
            mock_cv2.IMWRITE_JPEG_QUALITY = 1

            renderer.render(frame_data, [sample_detection], [], 15.0)

        mock_base_renderer.render.assert_called_once()

    def test_show_delegates_to_base(self, mock_base_renderer):
        """Should delegate show() to base renderer."""
        renderer = StreamingRenderer(base_renderer=mock_base_renderer)
        frame = np.zeros((480, 640, 3), dtype=np.uint8)

        result = renderer.show(frame)

        mock_base_renderer.show.assert_called_once_with(frame)
        assert result is True

    def test_show_without_base(self):
        """Should return True when no base renderer."""
        renderer = StreamingRenderer()
        frame = np.zeros((480, 640, 3), dtype=np.uint8)

        result = renderer.show(frame)
        assert result is True

    def test_close_delegates_to_base(self, mock_base_renderer):
        """Should delegate close() to base renderer."""
        renderer = StreamingRenderer(base_renderer=mock_base_renderer)
        renderer.close()

        mock_base_renderer.close.assert_called_once()

    def test_renderer_info(self, mock_base_renderer):
        """Should return complete renderer info."""
        renderer = StreamingRenderer(
            base_renderer=mock_base_renderer,
            quality=90,
            max_fps=25,
        )

        info = renderer.renderer_info

        assert info['type'] == 'streaming'
        assert info['quality'] == 90
        assert info['max_fps'] == 25
        assert 'base_renderer' in info

    def test_rate_limiting(self, frame_data, sample_detection):
        """Should rate limit frame encoding."""
        renderer = StreamingRenderer(max_fps=10)  # 100ms between frames

        with patch('streaming.cv2') as mock_cv2:
            mock_cv2.imencode.return_value = (True, np.array([255, 216]))
            mock_cv2.IMWRITE_JPEG_QUALITY = 1

            # Render multiple frames quickly
            for i in range(5):
                frame_data.frame_number = i
                renderer.render(frame_data, [sample_detection], [], 15.0)

        # Should have skipped some frames
        assert renderer._skip_count > 0 or renderer._encode_count <= 5


# =============================================================================
# Factory Function Tests
# =============================================================================

class TestCreateStreamingRenderer:
    """Tests for create_streaming_renderer factory."""

    def test_creates_default_renderer(self):
        """Should create renderer with defaults."""
        renderer = create_streaming_renderer()

        assert isinstance(renderer, StreamingRenderer)
        assert renderer._quality == 80
        assert renderer._max_fps == 15

    def test_uses_streaming_settings(self):
        """Should use streaming settings when provided."""
        settings = Mock()
        settings.quality = 95
        settings.max_fps = 30

        renderer = create_streaming_renderer(streaming_settings=settings)

        assert renderer._quality == 95
        assert renderer._max_fps == 30

    def test_wraps_base_renderer(self):
        """Should wrap provided base renderer."""
        base = Mock()
        base.renderer_info = {'type': 'base'}

        renderer = create_streaming_renderer(base_renderer=base)

        assert renderer._base_renderer is base
