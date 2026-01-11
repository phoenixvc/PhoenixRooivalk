"""
Unit tests for frame_sources.py - frame source creation and operations.
"""

import pytest
import sys
import numpy as np
from pathlib import Path
from unittest.mock import Mock, MagicMock, patch, mock_open

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "src"))

from frame_sources import (
    create_frame_source,
    MockFrameSource,
    VideoFileSource,
    USBCameraSource,
    PiCameraSource,
)
from interfaces import FrameData


class TestMockFrameSource:
    """Tests for MockFrameSource."""

    def test_mock_source_initialization(self):
        """Should initialize mock frame source with defaults."""
        source = MockFrameSource()

        assert source.resolution == (640, 480)
        assert source.fps == 30.0

    def test_mock_source_custom_resolution(self):
        """Should initialize with custom resolution."""
        source = MockFrameSource(width=1920, height=1080, fps=60)

        assert source.resolution == (1920, 1080)
        assert source.fps == 60.0

    def test_mock_source_open(self):
        """Should open successfully."""
        source = MockFrameSource()

        result = source.open()

        assert result is True
        assert source.is_open() is True

    def test_mock_source_read(self):
        """Should read mock frame data."""
        source = MockFrameSource(width=640, height=480)
        source.open()

        frame_data = source.read()

        assert frame_data is not None
        assert isinstance(frame_data, FrameData)
        assert frame_data.frame.shape == (480, 640, 3)
        assert frame_data.width == 640
        assert frame_data.height == 480
        assert frame_data.frame_number > 0

    def test_mock_source_read_before_open(self):
        """Should return None if read before opening."""
        source = MockFrameSource()

        frame_data = source.read()

        assert frame_data is None

    def test_mock_source_close(self):
        """Should close successfully."""
        source = MockFrameSource()
        source.open()

        source.close()

        assert source.is_open() is False

    def test_mock_source_source_info(self):
        """Should have correct source info."""
        source = MockFrameSource()
        source.open()

        info = source.source_info

        assert info["type"] == "mock"
        assert "fps" in info
        assert "resolution" in info

    def test_mock_source_resolution_property(self):
        """Should return resolution tuple."""
        source = MockFrameSource(width=1280, height=720)

        assert source.resolution == (1280, 720)

    def test_mock_source_multiple_reads(self):
        """Should generate different frames on multiple reads."""
        source = MockFrameSource()
        source.open()

        frame1 = source.read()
        frame2 = source.read()

        assert frame1 is not None
        assert frame2 is not None
        # Frame numbers should increment
        assert frame2.frame_number > frame1.frame_number


class TestVideoFileSource:
    """Tests for VideoFileSource (with mocked OpenCV)."""

    @patch("frame_sources.Path.exists")
    def test_video_source_initialization(self, mock_exists):
        """Should initialize video source."""
        mock_exists.return_value = True
        source = VideoFileSource(file_path="test.mp4", loop=False)

        assert source._file_path.name == "test.mp4"
        assert source._loop is False

    @patch("frame_sources.Path.exists")
    def test_video_source_open_fails_when_file_not_exists(self, mock_exists):
        """Should return False if video file does not exist."""
        mock_exists.return_value = False

        source = VideoFileSource(file_path="nonexistent.mp4")
        result = source.open()

        assert result is False
        assert source.is_open() is False

    def test_video_source_initialization_with_path(self):
        """Should handle file path correctly."""
        source = VideoFileSource(file_path="/path/to/video.mp4", loop=True)

        assert str(source._file_path).endswith("video.mp4")
        assert source._loop is True


class TestUSBCameraSource:
    """Tests for USBCameraSource (with mocked OpenCV)."""

    def test_usb_source_initialization(self):
        """Should initialize USB camera source."""
        source = USBCameraSource(camera_index=1, width=1280, height=720, fps=60)

        assert source._source == 1  # camera_index stored as _source
        assert source._width == 1280
        assert source._height == 720

    def test_usb_source_different_indices(self):
        """Should support different camera indices."""
        source1 = USBCameraSource(camera_index=0)
        source2 = USBCameraSource(camera_index=1)

        assert source1._source == 0
        assert source2._source == 1


class TestPiCameraSource:
    """Tests for PiCameraSource (with mocked picamera2)."""

    def test_picamera_source_initialization(self):
        """Should initialize Pi Camera source."""
        source = PiCameraSource(width=1920, height=1080, fps=30)

        assert source._width == 1920
        assert source._height == 1080
        assert source._fps == 30

    def test_picamera_source_properties(self):
        """Should have correct properties before opening."""
        source = PiCameraSource(width=1280, height=720)

        # Properties may not be available until open
        assert source._width == 1280
        assert source._height == 720


class TestCreateFrameSource:
    """Tests for create_frame_source factory function."""

    def test_create_mock_source(self):
        """Should create mock frame source."""
        source = create_frame_source(source_type="mock", width=1280, height=720, fps=60)

        assert isinstance(source, MockFrameSource)
        assert source.resolution == (1280, 720)
        assert source.fps == 60.0

    @patch("frame_sources.Path.exists")
    def test_create_video_source(self, mock_exists):
        """Should create video file source."""
        mock_exists.return_value = True

        source = create_frame_source(
            source_type="video", file_path="test.mp4", loop=True
        )

        assert isinstance(source, VideoFileSource)
        assert source._file_path.name == "test.mp4"
        assert source._loop is True

    def test_create_usb_source(self):
        """Should create USB camera source."""
        source = create_frame_source(
            source_type="usb", camera_index=1, width=1920, height=1080
        )

        assert isinstance(source, USBCameraSource)
        assert source._source == 1  # camera_index stored as _source

    def test_create_picamera_source(self):
        """Should create Pi Camera source."""
        source = create_frame_source(source_type="picamera", width=1920, height=1080)

        assert isinstance(source, PiCameraSource)
        assert source._width == 1920

    @patch("frame_sources.PiCameraSource")
    @patch("frame_sources.USBCameraSource")
    def test_create_auto_source_falls_back_to_mock(self, mock_usb, mock_pi):
        """Should fall back to mock source when no camera available."""
        # Mock PiCamera to fail
        mock_pi_instance = MagicMock()
        mock_pi.return_value = mock_pi_instance
        mock_pi_instance.open.return_value = False
        mock_pi_instance.is_open.return_value = False

        # Mock USBCamera to fail
        mock_usb_instance = MagicMock()
        mock_usb.return_value = mock_usb_instance
        mock_usb_instance.open.return_value = False
        mock_usb_instance.is_open.return_value = False

        source = create_frame_source(source_type="auto")

        # Should fall back to mock
        assert isinstance(source, MockFrameSource)

    def test_create_invalid_source_type(self):
        """Should raise ValueError for invalid source type."""
        with pytest.raises(ValueError):
            create_frame_source(source_type="invalid_type")
