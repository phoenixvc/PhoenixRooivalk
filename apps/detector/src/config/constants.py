"""
Immutable constants for Pi Drone Detector.

These values should never be configured at runtime.
For configurable values, use settings.py instead.
"""

# =============================================================================
# Version & Identity
# =============================================================================

VERSION = "2.0.0"
APP_NAME = "pi-drone-detector"
APP_DESCRIPTION = "Real-time drone detection for Raspberry Pi"

# =============================================================================
# Supported Formats
# =============================================================================

SUPPORTED_MODEL_EXTENSIONS: set[str] = {".tflite", ".onnx"}
SUPPORTED_VIDEO_EXTENSIONS: set[str] = {".mp4", ".avi", ".mkv", ".mov", ".webm"}
SUPPORTED_IMAGE_EXTENSIONS: set[str] = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

# =============================================================================
# Camera Sensors
# =============================================================================

PI_CAMERA_SENSORS: dict[str, dict] = {
    "imx219": {
        "name": "Pi Camera Module v2",
        "max_resolution": (3280, 2464),
        "max_fps_1080p": 30,
        "max_fps_720p": 60,
        "focal_length_mm": 3.04,
        "sensor_width_mm": 3.68,
        "sensor_height_mm": 2.76,
        "pixel_size_um": 1.12,
    },
    "imx477": {
        "name": "Pi Camera HQ",
        "max_resolution": (4056, 3040),
        "max_fps_1080p": 30,
        "max_fps_720p": 50,
        "focal_length_mm": None,  # Interchangeable lens
        "sensor_width_mm": 6.287,
        "sensor_height_mm": 4.712,
        "pixel_size_um": 1.55,
    },
    "imx708": {
        "name": "Pi Camera Module v3",
        "max_resolution": (4608, 2592),
        "max_fps_1080p": 50,
        "max_fps_720p": 120,
        "focal_length_mm": 4.74,
        "sensor_width_mm": 6.45,
        "sensor_height_mm": 3.63,
        "pixel_size_um": 1.4,
    },
    "imx296": {
        "name": "Pi Global Shutter Camera",
        "max_resolution": (1456, 1088),
        "max_fps_1080p": 30,
        "max_fps_720p": 30,
        "focal_length_mm": None,  # Interchangeable lens
        "sensor_width_mm": 5.04,
        "sensor_height_mm": 3.78,
        "pixel_size_um": 3.45,
    },
}

# Default camera specs (Pi Camera v2 - most common)
DEFAULT_FOCAL_LENGTH_MM = 3.04
DEFAULT_SENSOR_WIDTH_MM = 3.68

# =============================================================================
# Platform Identifiers
# =============================================================================

PI_SOC_MODELS: dict[str, str] = {
    "bcm2711": "pi4",
    "bcm2712": "pi5",
    "bcm2837": "pi3",
    "bcm2836": "pi2",
    "bcm2835": "pi1",
}

# RAM thresholds for configuration recommendations (in MB)
RAM_THRESHOLD_LOW = 2048  # 2GB - use minimal settings
RAM_THRESHOLD_MEDIUM = 4096  # 4GB - use standard settings
RAM_THRESHOLD_HIGH = 8192  # 8GB - can use full settings

# =============================================================================
# Class Names
# =============================================================================

# Binary classification (MVP)
DEFAULT_CLASS_NAMES = ("drone", "not_drone")

# 10-class standard taxonomy
STANDARD_CLASS_NAMES = (
    "drone",  # 0 - Alert
    "bird_small",  # 1
    "bird_large",  # 2
    "aircraft",  # 3 - Critical non-alert (manned)
    "recreational",  # 4
    "sports",  # 5
    "debris",  # 6
    "insect",  # 7
    "atmospheric",  # 8
    "background",  # 9
)

# 27-class full taxonomy
FULL_CLASS_NAMES = (
    # Drones (0-4) - Alert classes
    "drone_multirotor",
    "drone_fixedwing",
    "drone_vtol",
    "drone_helicopter",
    "drone_unknown",
    # Birds (5-9)
    "bird_tiny",
    "bird_small",
    "bird_medium",
    "bird_large",
    "bird_raptor",
    # Aircraft (10-13) - Critical non-alert
    "aircraft_fixed",
    "aircraft_helicopter",
    "aircraft_glider",
    "aircraft_ultralight",
    # Recreational (14-18)
    "balloon",
    "kite",
    "rc_plane",
    "rc_helicopter",
    "paraglider",
    # Sports (19-20)
    "ball",
    "frisbee",
    # Debris (21-23)
    "plastic_bag",
    "paper",
    "leaf_cluster",
    # Atmospheric (24-26)
    "cloud_edge",
    "lens_flare",
    "bird_flock",
)

# Alert class IDs (classes that trigger alerts)
ALERT_CLASS_IDS_BINARY = {0}  # drone
ALERT_CLASS_IDS_STANDARD = {0}  # drone
ALERT_CLASS_IDS_FULL = {0, 1, 2, 3, 4}  # All drone types

# Critical non-alert (manned aircraft - never fire at these)
CRITICAL_NON_ALERT_STANDARD = {3}  # aircraft
CRITICAL_NON_ALERT_FULL = {10, 11, 12, 13}  # All aircraft types

# =============================================================================
# Physical Constants for Distance Estimation
# =============================================================================

# Typical drone sizes (meters)
DRONE_SIZE_SMALL = 0.15  # Mini/toy drone
DRONE_SIZE_MEDIUM = 0.30  # Consumer drone (DJI Mini, etc.)
DRONE_SIZE_LARGE = 0.50  # Professional drone (DJI Phantom, etc.)
DRONE_SIZE_DEFAULT = DRONE_SIZE_MEDIUM

# Speed estimates (m/s)
DRONE_SPEED_HOVER = 0.0
DRONE_SPEED_SLOW = 5.0
DRONE_SPEED_MEDIUM = 15.0
DRONE_SPEED_FAST = 30.0
DRONE_SPEED_MAX = 50.0  # ~180 km/h - racing drones

# =============================================================================
# Colors (BGR format for OpenCV)
# =============================================================================

COLORS: dict[str, tuple[int, int, int]] = {
    # Detection states
    "drone": (0, 0, 255),  # Red
    "drone_locked": (0, 255, 255),  # Yellow
    "non_drone": (0, 255, 0),  # Green
    "unknown": (128, 128, 128),  # Gray
    # Tracking
    "track_active": (255, 165, 0),  # Orange
    "track_predicted": (255, 0, 255),  # Magenta
    "track_lost": (100, 100, 100),  # Dark gray
    # Targeting states
    "searching": (0, 255, 0),  # Green
    "tracking": (0, 255, 255),  # Yellow
    "locked": (0, 165, 255),  # Orange
    "armed": (0, 0, 255),  # Red
    "firing": (255, 0, 255),  # Magenta
    "cooldown": (128, 128, 128),  # Gray
    # UI elements
    "text": (255, 255, 255),  # White
    "text_shadow": (0, 0, 0),  # Black
    "bbox_default": (0, 255, 0),  # Green
    "score_bar_bg": (100, 100, 100),  # Dark gray
    "score_bar_fill": (0, 0, 255),  # Red
}

# =============================================================================
# Timing Constants
# =============================================================================

# Timeouts (seconds)
WEBHOOK_TIMEOUT_DEFAULT = 5.0
WEBHOOK_TIMEOUT_MAX = 30.0
FRAME_READ_TIMEOUT = 1.0
MODEL_LOAD_TIMEOUT = 30.0

# Intervals (seconds)
HEALTH_CHECK_INTERVAL = 10.0
STATS_LOG_INTERVAL = 30.0
FPS_SMOOTHING_WINDOW = 30  # frames

# Processing limits
MAX_FRAME_PROCESSING_MS = 1000
MAX_DETECTIONS_PER_FRAME = 100
MAX_TRACKS = 50

# =============================================================================
# Network
# =============================================================================

DEFAULT_STREAM_PORT = 8080
DEFAULT_STREAM_HOST = "0.0.0.0"  # nosec B104 - default for LAN access on Pi
MJPEG_BOUNDARY = b"--frame"

# =============================================================================
# GPIO (Raspberry Pi)
# =============================================================================

# Valid GPIO pins for fire net trigger (BCM numbering)
VALID_GPIO_PINS = set(range(2, 28))  # GPIO 2-27
DEFAULT_FIRE_NET_GPIO = 17

# Trigger pulse duration (seconds)
FIRE_NET_PULSE_DURATION = 0.1
