"""
Unit tests for configuration and settings.

Tests Pydantic settings validation and configuration loading.
"""

import pytest
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "src"))

from config.settings import (
    Settings,
    CaptureSettings,
    InferenceSettings,
    TargetingSettings,
    DroneScoreSettings,
    AlertSettings,
    StreamingSettings,
    CameraType,
    EngineType,
    TrackerType,
    DEFAULT_CONFIG_YAML,
    create_default_config,
)
from config.constants import (
    VERSION,
    DEFAULT_CLASS_NAMES,
    PI_CAMERA_SENSORS,
    COLORS,
)


# =============================================================================
# Constants Tests
# =============================================================================

class TestConstants:
    """Tests for configuration constants."""

    def test_version_format(self):
        """Version should be semver format."""
        parts = VERSION.split('.')
        assert len(parts) == 3
        assert all(p.isdigit() for p in parts)

    def test_class_names_defined(self):
        """Default class names should be defined."""
        assert len(DEFAULT_CLASS_NAMES) >= 2
        assert 'drone' in DEFAULT_CLASS_NAMES

    def test_camera_sensors_have_required_fields(self):
        """Camera sensor specs should have all required fields."""
        required_fields = ['name', 'max_resolution', 'max_fps_1080p']

        for sensor_id, specs in PI_CAMERA_SENSORS.items():
            for field in required_fields:
                assert field in specs, f"Missing {field} in {sensor_id}"

    def test_colors_are_bgr_tuples(self):
        """Colors should be BGR tuples."""
        for name, color in COLORS.items():
            assert isinstance(color, tuple), f"Color {name} is not a tuple"
            assert len(color) == 3, f"Color {name} doesn't have 3 components"
            assert all(0 <= c <= 255 for c in color), f"Color {name} has invalid values"


# =============================================================================
# Capture Settings Tests
# =============================================================================

class TestCaptureSettings:
    """Tests for capture settings validation."""

    def test_default_values(self):
        """Default values should be sensible."""
        settings = CaptureSettings()

        assert settings.width == 640
        assert settings.height == 480
        assert settings.fps == 30
        assert settings.buffer_size == 1

    def test_valid_resolution(self):
        """Valid resolutions should be accepted."""
        settings = CaptureSettings(width=1280, height=720)

        assert settings.width == 1280
        assert settings.height == 720

    @pytest.mark.skipif(
        'pydantic' not in sys.modules,
        reason="Pydantic not installed"
    )
    def test_invalid_resolution_rejected(self):
        """Invalid resolutions should be rejected."""
        from pydantic import ValidationError

        with pytest.raises(ValidationError):
            CaptureSettings(width=100)  # Below minimum

        with pytest.raises(ValidationError):
            CaptureSettings(height=50)  # Below minimum

    @pytest.mark.skipif(
        'pydantic' not in sys.modules,
        reason="Pydantic not installed"
    )
    def test_invalid_fps_rejected(self):
        """Invalid FPS should be rejected."""
        from pydantic import ValidationError

        with pytest.raises(ValidationError):
            CaptureSettings(fps=0)

        with pytest.raises(ValidationError):
            CaptureSettings(fps=200)  # Above maximum


# =============================================================================
# Inference Settings Tests
# =============================================================================

class TestInferenceSettings:
    """Tests for inference settings validation."""

    def test_default_values(self):
        """Default values should be sensible."""
        settings = InferenceSettings()

        assert settings.input_size == 320
        assert settings.confidence_threshold == 0.5
        assert settings.nms_threshold == 0.45
        assert settings.num_threads == 4

    def test_valid_thresholds(self):
        """Valid thresholds should be accepted."""
        settings = InferenceSettings(
            confidence_threshold=0.7,
            nms_threshold=0.3,
        )

        assert settings.confidence_threshold == 0.7
        assert settings.nms_threshold == 0.3

    @pytest.mark.skipif(
        'pydantic' not in sys.modules,
        reason="Pydantic not installed"
    )
    def test_threshold_bounds(self):
        """Thresholds should be bounded 0-1."""
        from pydantic import ValidationError

        with pytest.raises(ValidationError):
            InferenceSettings(confidence_threshold=1.5)

        with pytest.raises(ValidationError):
            InferenceSettings(confidence_threshold=-0.1)


# =============================================================================
# Targeting Settings Tests
# =============================================================================

class TestTargetingSettings:
    """Tests for targeting settings validation."""

    def test_default_values(self):
        """Default values should be sensible."""
        settings = TargetingSettings()

        assert settings.max_targeting_distance_m == 100.0
        assert settings.min_confidence_for_lock == 0.7
        assert settings.fire_net_enabled is False
        assert settings.fire_net_arm_required is True

    def test_fire_net_defaults_safe(self):
        """Fire net defaults should be conservative/safe."""
        settings = TargetingSettings()

        # Disabled by default
        assert settings.fire_net_enabled is False

        # Arming required by default
        assert settings.fire_net_arm_required is True

        # High confidence required
        assert settings.fire_net_min_confidence >= 0.8

        # Reasonable track requirement
        assert settings.fire_net_min_track_frames >= 5

    @pytest.mark.skipif(
        'pydantic' not in sys.modules,
        reason="Pydantic not installed"
    )
    def test_distance_envelope_valid(self):
        """Min distance must be less than max distance."""
        # This should work - valid envelope
        settings = TargetingSettings(
            fire_net_min_distance_m=5.0,
            fire_net_max_distance_m=50.0,
        )

        assert settings.fire_net_min_distance_m < settings.fire_net_max_distance_m


# =============================================================================
# Drone Score Settings Tests
# =============================================================================

class TestDroneScoreSettings:
    """Tests for drone scoring settings."""

    def test_default_values(self):
        """Default values should be sensible."""
        settings = DroneScoreSettings()

        assert settings.drone_class_id == 0
        assert settings.model_weight == 0.7
        assert settings.drone_threshold == 0.5
        assert settings.aspect_ratio_min < settings.aspect_ratio_max

    def test_aspect_ratio_range(self):
        """Aspect ratio range should be valid."""
        settings = DroneScoreSettings()

        # Drone aspect ratios typically 0.8-2.5
        assert settings.aspect_ratio_min > 0
        assert settings.aspect_ratio_max > settings.aspect_ratio_min


# =============================================================================
# Alert Settings Tests
# =============================================================================

class TestAlertSettings:
    """Tests for alert settings."""

    def test_default_values(self):
        """Default values should disable alerts."""
        settings = AlertSettings()

        assert settings.webhook_url is None
        assert settings.save_detections_path is None

    def test_cooldown_values(self):
        """Cooldown values should be reasonable."""
        settings = AlertSettings()

        assert settings.cooldown_per_track >= 0
        assert settings.global_cooldown >= 0


# =============================================================================
# Streaming Settings Tests
# =============================================================================

class TestStreamingSettings:
    """Tests for streaming settings."""

    def test_default_disabled(self):
        """Streaming should be disabled by default."""
        settings = StreamingSettings()

        assert settings.enabled is False

    def test_default_port(self):
        """Default port should be 8080."""
        settings = StreamingSettings()

        assert settings.port == 8080

    def test_quality_bounds(self):
        """Quality should be 10-100."""
        settings = StreamingSettings()

        assert 10 <= settings.quality <= 100


# =============================================================================
# Root Settings Tests
# =============================================================================

class TestSettings:
    """Tests for root Settings class."""

    def test_default_initialization(self):
        """Should initialize with all defaults."""
        settings = Settings()

        assert settings.camera_type == CameraType.AUTO
        assert settings.engine_type == EngineType.AUTO
        assert settings.tracker_type == TrackerType.CENTROID

    def test_nested_settings(self):
        """Nested settings should be accessible."""
        settings = Settings()

        assert settings.capture is not None
        assert settings.inference is not None
        assert settings.targeting is not None

    def test_to_dict(self):
        """to_dict should return complete dictionary."""
        settings = Settings()

        if hasattr(settings, 'to_dict'):
            d = settings.to_dict()
            assert 'capture' in d
            assert 'inference' in d
            assert 'targeting' in d

    def test_yaml_load(self, temp_config_file):
        """Should load from YAML file."""
        if hasattr(Settings, 'from_yaml'):
            settings = Settings.from_yaml(str(temp_config_file))
            assert settings is not None

    def test_yaml_save(self, tmp_path):
        """Should save to YAML file."""
        settings = Settings()
        output_file = tmp_path / "output.yaml"

        if hasattr(settings, 'to_yaml'):
            settings.to_yaml(str(output_file))
            assert output_file.exists()


# =============================================================================
# Enum Tests
# =============================================================================

class TestEnums:
    """Tests for configuration enums."""

    def test_camera_type_values(self):
        """Camera type enum should have expected values."""
        assert CameraType.AUTO == "auto"
        assert CameraType.PICAMERA == "picamera"
        assert CameraType.USB == "usb"
        assert CameraType.VIDEO == "video"
        assert CameraType.MOCK == "mock"

    def test_engine_type_values(self):
        """Engine type enum should have expected values."""
        assert EngineType.AUTO == "auto"
        assert EngineType.TFLITE == "tflite"
        assert EngineType.ONNX == "onnx"
        assert EngineType.CORAL == "coral"
        assert EngineType.MOCK == "mock"

    def test_tracker_type_values(self):
        """Tracker type enum should have expected values."""
        assert TrackerType.NONE == "none"
        assert TrackerType.CENTROID == "centroid"
        assert TrackerType.KALMAN == "kalman"


# =============================================================================
# Default Config Tests
# =============================================================================

class TestDefaultConfig:
    """Tests for default configuration template."""

    def test_default_yaml_is_valid(self):
        """Default YAML template should be valid YAML."""
        import yaml
        data = yaml.safe_load(DEFAULT_CONFIG_YAML)

        assert data is not None
        assert 'camera_type' in data
        assert 'capture' in data
        assert 'inference' in data

    def test_create_default_config(self, tmp_path):
        """Should create valid default config file."""
        config_file = tmp_path / "config.yaml"
        create_default_config(str(config_file))

        assert config_file.exists()

        import yaml
        with open(config_file) as f:
            data = yaml.safe_load(f)

        assert data is not None
