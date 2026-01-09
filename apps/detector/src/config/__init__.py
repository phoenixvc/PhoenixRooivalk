"""
Configuration management for Pi Drone Detector.

Provides centralized settings, constants, and configuration loading.
"""

from .constants import (
    # Version info
    VERSION,
    APP_NAME,
    # File formats
    SUPPORTED_MODEL_EXTENSIONS,
    SUPPORTED_VIDEO_EXTENSIONS,
    SUPPORTED_IMAGE_EXTENSIONS,
    # Camera info
    PI_CAMERA_SENSORS,
    # Class names
    DEFAULT_CLASS_NAMES,
    EXTENDED_CLASS_NAMES,
    # Physical constants
    DRONE_SIZE_DEFAULT,
    DEFAULT_FOCAL_LENGTH_MM,
    DEFAULT_SENSOR_WIDTH_MM,
    FIRE_NET_PULSE_DURATION,
    # Colors
    COLORS,
    # Timing
    MAX_WEBHOOK_TIMEOUT_SECONDS,
    MAX_FRAME_PROCESSING_MS,
    HEALTH_CHECK_INTERVAL_SECONDS,
)
from .settings import (
    Settings,
    CaptureSettings,
    InferenceSettings,
    DroneScoreSettings,
    TargetingSettings,
    AlertSettings,
    StreamingSettings,
    TrackerSettings,
    LoggingSettings,
    CameraType,
    EngineType,
    TrackerType,
)

__all__ = [
    # Constants
    'VERSION',
    'APP_NAME',
    'SUPPORTED_MODEL_EXTENSIONS',
    'SUPPORTED_VIDEO_EXTENSIONS',
    'SUPPORTED_IMAGE_EXTENSIONS',
    'PI_CAMERA_SENSORS',
    'DEFAULT_CLASS_NAMES',
    'EXTENDED_CLASS_NAMES',
    'DRONE_SIZE_DEFAULT',
    'DEFAULT_FOCAL_LENGTH_MM',
    'DEFAULT_SENSOR_WIDTH_MM',
    'FIRE_NET_PULSE_DURATION',
    'COLORS',
    'MAX_WEBHOOK_TIMEOUT_SECONDS',
    'MAX_FRAME_PROCESSING_MS',
    'HEALTH_CHECK_INTERVAL_SECONDS',
    # Settings classes
    'Settings',
    'CaptureSettings',
    'InferenceSettings',
    'DroneScoreSettings',
    'TargetingSettings',
    'AlertSettings',
    'StreamingSettings',
    'TrackerSettings',
    'LoggingSettings',
    # Enums
    'CameraType',
    'EngineType',
    'TrackerType',
]
