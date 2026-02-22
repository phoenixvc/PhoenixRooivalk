"""
Pydantic settings models for Pi Drone Detector.

All configurable values are defined here with validation.
Settings can be loaded from:
- Environment variables (prefixed)
- YAML configuration files
- Command-line arguments
- Programmatic defaults
"""

from enum import Enum
from typing import Any, Optional

PYDANTIC_V2: Optional[bool]

try:
    # fmt: off
    # isort: off
    # Pydantic v1 imports
    from pydantic import BaseModel, BaseSettings as PydanticBaseSettings, Field  # noqa: I001
    from pydantic import root_validator, validator  # noqa: F401, I001
    # isort: on
    # fmt: on
    PYDANTIC_V2 = False
except ImportError:
    try:
        # fmt: off
        # isort: off
        # Pydantic v2 imports
        from pydantic import BaseModel, Field  # noqa: I001
        from pydantic import field_validator, model_validator  # noqa: F401, I001
        from pydantic_settings import BaseSettings as PydanticBaseSettings  # noqa: I001
        # isort: on
        # fmt: on
        PYDANTIC_V2 = True
    except ImportError:
        # Fallback for environments without pydantic
        PydanticBaseSettings = object  # type: ignore[misc,assignment]
        BaseModel = object  # type: ignore[misc,assignment]
        PYDANTIC_V2 = None

        def _fallback_field(default=None, **kwargs):  # noqa: N802
            """Fallback Field that just returns the default value."""
            return default

        Field = _fallback_field  # type: ignore[misc,assignment]  # noqa: F811


# =============================================================================
# Enums
# =============================================================================


class CameraType(str, Enum):
    """Available camera source types."""

    AUTO = "auto"
    PICAMERA = "picamera"
    USB = "usb"
    VIDEO = "video"
    MOCK = "mock"


class EngineType(str, Enum):
    """Available inference engine types."""

    AUTO = "auto"
    TFLITE = "tflite"
    ONNX = "onnx"
    CORAL = "coral"
    MOCK = "mock"


class TrackerType(str, Enum):
    """Available tracker types."""

    NONE = "none"
    CENTROID = "centroid"
    KALMAN = "kalman"


class LogLevel(str, Enum):
    """Logging levels."""

    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


# =============================================================================
# Settings Models
# =============================================================================


class CaptureSettings(BaseModel):
    """Camera capture configuration."""

    width: int = Field(640, ge=160, le=4096, description="Capture width in pixels")
    height: int = Field(480, ge=120, le=3072, description="Capture height in pixels")
    fps: int = Field(30, ge=1, le=120, description="Target frames per second")
    buffer_size: int = Field(1, ge=1, le=10, description="Frame buffer size (lower = less latency)")
    camera_index: int = Field(0, ge=0, le=10, description="Camera device index for USB cameras")
    video_path: Optional[str] = Field(None, description="Video file path (for video source)")
    video_loop: bool = Field(True, description="Loop video playback")

    class Config:
        env_prefix = "CAPTURE_"


class InferenceSettings(BaseModel):
    """ML inference configuration."""

    model_path: str = Field("", description="Path to model file (.tflite or .onnx)")
    input_size: int = Field(320, ge=128, le=640, description="Model input size (square)")
    confidence_threshold: float = Field(
        0.5, ge=0.0, le=1.0, description="Minimum detection confidence"
    )
    nms_threshold: float = Field(
        0.45, ge=0.0, le=1.0, description="Non-max suppression IoU threshold"
    )
    num_threads: int = Field(4, ge=1, le=16, description="CPU threads for inference")
    use_coral: bool = Field(False, description="Use Coral Edge TPU if available")

    class Config:
        env_prefix = "INFERENCE_"


class DroneScoreSettings(BaseModel):
    """Drone likelihood scoring configuration."""

    drone_class_id: int = Field(0, ge=0, description="Class ID for drone detection")
    model_weight: float = Field(
        0.7, ge=0.0, le=1.0, description="Weight for model confidence in scoring"
    )
    drone_threshold: float = Field(
        0.5, ge=0.0, le=1.0, description="Threshold for is_drone classification"
    )

    # Aspect ratio heuristics
    aspect_ratio_min: float = Field(
        0.8, ge=0.1, le=5.0, description="Minimum drone-like aspect ratio"
    )
    aspect_ratio_max: float = Field(
        2.5, ge=0.5, le=10.0, description="Maximum drone-like aspect ratio"
    )
    aspect_bonus: float = Field(
        0.15, ge=0.0, le=0.5, description="Score bonus for drone-like aspect ratio"
    )
    tall_object_ratio: float = Field(
        0.6, ge=0.1, le=1.0, description="Aspect ratio threshold for tall objects"
    )
    tall_penalty: float = Field(
        0.2, ge=0.0, le=0.5, description="Score penalty for tall/thin objects"
    )

    class Config:
        env_prefix = "DRONE_SCORE_"


class TrackerSettings(BaseModel):
    """Object tracking configuration."""

    max_disappeared: int = Field(30, ge=1, le=300, description="Frames before track is deleted")
    max_distance: float = Field(
        100.0, ge=10.0, le=1000.0, description="Max centroid distance for matching"
    )

    # Kalman filter specific
    process_noise: float = Field(1.0, ge=0.01, le=100.0, description="Kalman process noise")
    measurement_noise: float = Field(1.0, ge=0.01, le=100.0, description="Kalman measurement noise")

    class Config:
        env_prefix = "TRACKER_"


class TargetingSettings(BaseModel):
    """Targeting and engagement configuration."""

    # Distance estimation
    max_targeting_distance_m: float = Field(
        100.0, ge=10.0, le=1000.0, description="Maximum targeting distance (meters)"
    )
    assumed_drone_size_m: float = Field(
        0.3, ge=0.1, le=2.0, description="Assumed drone size for distance calc"
    )

    # Target lock
    min_confidence_for_lock: float = Field(
        0.7, ge=0.3, le=1.0, description="Minimum confidence to lock target"
    )
    lock_timeout_seconds: float = Field(
        5.0, ge=1.0, le=30.0, description="Seconds before lock is lost"
    )
    tracking_lead_factor: float = Field(
        1.2, ge=1.0, le=5.0, description="Lead factor for interception"
    )

    # Fire net trigger
    fire_net_enabled: bool = Field(False, description="Enable fire net system")
    fire_net_min_confidence: float = Field(
        0.85, ge=0.5, le=1.0, description="Minimum confidence to fire"
    )
    fire_net_min_track_frames: int = Field(
        10, ge=3, le=60, description="Minimum frames tracked before fire"
    )
    fire_net_max_distance_m: float = Field(
        50.0, ge=5.0, le=200.0, description="Maximum fire distance"
    )
    fire_net_min_distance_m: float = Field(
        5.0, ge=1.0, le=50.0, description="Minimum fire distance (safety)"
    )
    fire_net_velocity_threshold_ms: float = Field(
        30.0, ge=0.0, le=100.0, description="Max target velocity for fire"
    )
    fire_net_cooldown_seconds: float = Field(
        10.0, ge=1.0, le=60.0, description="Cooldown between fires"
    )
    fire_net_arm_required: bool = Field(True, description="Require explicit arming")
    fire_net_gpio_pin: int = Field(17, ge=2, le=27, description="GPIO pin for fire trigger (BCM)")

    if PYDANTIC_V2:

        @model_validator(mode="after")
        def validate_distance_envelope(self) -> "TargetingSettings":
            """Ensure fire_net_min_distance_m < fire_net_max_distance_m."""
            if self.fire_net_min_distance_m >= self.fire_net_max_distance_m:
                raise ValueError(
                    f"fire_net_min_distance_m ({self.fire_net_min_distance_m}) must be less than "
                    f"fire_net_max_distance_m ({self.fire_net_max_distance_m})"
                )
            return self

    elif PYDANTIC_V2 is False:

        @root_validator(pre=False, skip_on_failure=True)  # type: ignore[arg-type]
        def validate_distance_envelope(cls, values):
            """Ensure fire_net_min_distance_m < fire_net_max_distance_m."""
            min_dist = values.get("fire_net_min_distance_m", 5.0)
            max_dist = values.get("fire_net_max_distance_m", 50.0)
            if min_dist >= max_dist:
                raise ValueError(
                    f"fire_net_min_distance_m ({min_dist}) must be less than "
                    f"fire_net_max_distance_m ({max_dist})"
                )
            return values

    class Config:
        env_prefix = "TARGETING_"


class TurretControlSettings(BaseModel):
    """Turret pan/tilt control configuration."""

    # Transport
    transport_type: str = Field(
        "simulated", description="Transport backend: simulated, serial, wifi_udp, audio_pwm"
    )
    serial_port: str = Field("/dev/ttyUSB0", description="Serial port for serial transport")
    serial_baudrate: int = Field(115200, ge=9600, le=921600, description="Serial baud rate")
    wifi_host: str = Field("192.168.4.1", description="UDP target host for wifi transport")
    wifi_port: int = Field(
        4210, ge=1024, le=65535, description="UDP target port for wifi transport"
    )
    audio_device: Optional[int] = Field(
        None, description="Audio output device index (None=default). Use `python -m sounddevice`"
    )
    audio_buffer_size: int = Field(
        512, ge=128, le=2048, description="Audio buffer size (smaller=less latency, more CPU)"
    )

    # PID gains - yaw axis
    yaw_kp: float = Field(0.8, ge=0.0, le=5.0, description="Yaw proportional gain")
    yaw_ki: float = Field(0.05, ge=0.0, le=2.0, description="Yaw integral gain")
    yaw_kd: float = Field(0.15, ge=0.0, le=2.0, description="Yaw derivative gain")

    # PID gains - pitch axis
    pitch_kp: float = Field(0.6, ge=0.0, le=5.0, description="Pitch proportional gain")
    pitch_ki: float = Field(0.03, ge=0.0, le=2.0, description="Pitch integral gain")
    pitch_kd: float = Field(0.10, ge=0.0, le=2.0, description="Pitch derivative gain")

    # Safety limits
    max_yaw_rate: float = Field(1.0, ge=0.1, le=1.0, description="Max yaw rate (normalized)")
    max_pitch_rate: float = Field(1.0, ge=0.1, le=1.0, description="Max pitch rate (normalized)")
    max_slew_rate: float = Field(
        2.0, ge=0.1, le=10.0, description="Max rate change per second (smoothing)"
    )
    watchdog_timeout_ms: int = Field(
        500, ge=100, le=5000, description="Failsafe if no command within this time"
    )
    override_latch_seconds: float = Field(
        3.0, ge=1.0, le=30.0, description="Manual override latch duration"
    )
    command_ttl_ms: int = Field(
        200, ge=50, le=2000, description="Command time-to-live for hardware watchdog"
    )

    # PID dead zone
    dead_zone: float = Field(
        0.02,
        ge=0.0,
        le=0.2,
        description="Error threshold below which PID outputs zero (0-1 normalized)",
    )

    # Initial mode
    initial_mode: str = Field(
        "manual", description="Starting authority mode: manual, assisted, auto_track"
    )

    if PYDANTIC_V2:
        @model_validator(mode="after")  # type: ignore[misc]
        def _validate_ttl_vs_watchdog(self):
            if self.command_ttl_ms >= self.watchdog_timeout_ms:
                import warnings

                warnings.warn(
                    f"command_ttl_ms ({self.command_ttl_ms}) >= watchdog_timeout_ms "
                    f"({self.watchdog_timeout_ms}). Hardware TTL will expire before "
                    f"the software watchdog fires. Consider reducing command_ttl_ms.",
                    stacklevel=2,
                )
            return self

    else:
        # Pydantic v1 validator
        try:
            from pydantic import validator as _validator  # type: ignore[assignment,misc]

            @_validator("command_ttl_ms")  # type: ignore[misc]
            @classmethod
            def _validate_ttl_vs_watchdog_v1(cls, v, values):
                watchdog = values.get("watchdog_timeout_ms", 500)
                if v >= watchdog:
                    import warnings

                    warnings.warn(
                        f"command_ttl_ms ({v}) >= watchdog_timeout_ms ({watchdog}). "
                        f"Hardware TTL will expire before the software watchdog fires.",
                        stacklevel=2,
                    )
                return v

        except ImportError:
            pass

    class Config:
        env_prefix = "TURRET_"


class AlertSettings(BaseModel):
    """Alert and notification configuration."""

    # Webhook
    webhook_url: Optional[str] = Field(None, description="Webhook URL for alerts")
    webhook_timeout: float = Field(5.0, ge=1.0, le=30.0, description="Webhook request timeout")
    webhook_retry_count: int = Field(3, ge=0, le=10, description="Number of webhook retries")

    # Throttling
    cooldown_per_track: float = Field(
        5.0, ge=0.0, le=60.0, description="Alert cooldown per track ID"
    )
    global_cooldown: float = Field(1.0, ge=0.0, le=10.0, description="Global alert cooldown")

    # File logging
    save_detections_path: Optional[str] = Field(None, description="Path to save detection JSON")
    save_buffer_size: int = Field(10, ge=1, le=100, description="Buffer size before file write")

    class Config:
        env_prefix = "ALERT_"


class StreamingSettings(BaseModel):
    """Web streaming configuration."""

    enabled: bool = Field(False, description="Enable MJPEG streaming server")
    host: str = Field(
        "0.0.0.0", description="Streaming server host"
    )  # nosec B104 - intentional for LAN access
    port: int = Field(8080, ge=1024, le=65535, description="Streaming server port")
    quality: int = Field(80, ge=10, le=100, description="JPEG quality (10-100)")
    max_fps: int = Field(15, ge=1, le=60, description="Maximum stream FPS")

    # Authentication
    auth_enabled: bool = Field(False, description="Enable token authentication")
    auth_token: Optional[str] = Field(None, description="Bearer token for authentication")

    class Config:
        env_prefix = "STREAM_"


class LoggingSettings(BaseModel):
    """Logging configuration."""

    level: LogLevel = Field(LogLevel.INFO, description="Log level")
    json_format: bool = Field(False, description="Use JSON log format")
    log_file: Optional[str] = Field(None, description="Log file path")
    max_bytes: int = Field(
        10_000_000, ge=1_000_000, le=100_000_000, description="Max log file size"
    )
    backup_count: int = Field(5, ge=1, le=20, description="Number of log backups")

    class Config:
        env_prefix = "LOG_"


class DisplaySettings(BaseModel):
    """Display and rendering configuration."""

    headless: bool = Field(False, description="Run without display")
    window_name: str = Field("Drone Detection", description="Window title")
    show_fps: bool = Field(True, description="Show FPS overlay")
    show_drone_score: bool = Field(True, description="Show drone score bar")
    show_track_id: bool = Field(True, description="Show track IDs")
    show_distance: bool = Field(True, description="Show estimated distance")
    show_targeting_overlay: bool = Field(True, description="Show targeting status")
    log_interval_frames: int = Field(30, ge=1, le=300, description="Headless log interval")

    class Config:
        env_prefix = "DISPLAY_"


# =============================================================================
# Root Settings
# =============================================================================

if PydanticBaseSettings is not object:

    class Settings(PydanticBaseSettings):  # type: ignore[misc,valid-type]
        """
        Root configuration aggregating all settings.

        Can be loaded from:
        - Environment variables
        - .env file
        - YAML configuration file
        - Programmatic defaults
        """

        # Component settings
        capture: CaptureSettings = Field(default_factory=CaptureSettings)  # type: ignore[arg-type]
        inference: InferenceSettings = Field(default_factory=InferenceSettings)  # type: ignore[arg-type]
        drone_score: DroneScoreSettings = Field(default_factory=DroneScoreSettings)  # type: ignore[arg-type]
        tracker: TrackerSettings = Field(default_factory=TrackerSettings)  # type: ignore[arg-type]
        targeting: TargetingSettings = Field(default_factory=TargetingSettings)  # type: ignore[arg-type]
        turret_control: TurretControlSettings = Field(default_factory=TurretControlSettings)  # type: ignore[arg-type]
        alert: AlertSettings = Field(default_factory=AlertSettings)  # type: ignore[arg-type]
        streaming: StreamingSettings = Field(default_factory=StreamingSettings)  # type: ignore[arg-type]
        logging: LoggingSettings = Field(default_factory=LoggingSettings)  # type: ignore[arg-type]
        display: DisplaySettings = Field(default_factory=DisplaySettings)  # type: ignore[arg-type]

        # Top-level settings
        camera_type: CameraType = Field(CameraType.AUTO, description="Camera source type")
        engine_type: EngineType = Field(EngineType.AUTO, description="Inference engine type")
        tracker_type: TrackerType = Field(TrackerType.CENTROID, description="Object tracker type")

        class Config:
            env_file = ".env"
            env_file_encoding = "utf-8"
            env_nested_delimiter = "__"

        @classmethod
        def from_yaml(cls, path: str) -> "Settings":
            """Load settings from YAML file."""
            import yaml  # type: ignore[import-untyped]

            with open(path) as f:
                data: dict[str, Any] = yaml.safe_load(f) or {}
            return cls(**data)

        @classmethod
        def from_json(cls, path: str) -> "Settings":
            """Load settings from JSON file."""
            import json

            with open(path) as f:
                data: dict[str, Any] = json.load(f)
            return cls(**data)

        def _get_dict(self) -> dict[str, Any]:
            """Get dictionary representation (Pydantic v1/v2 compatible)."""
            if hasattr(self, "model_dump"):
                return dict(self.model_dump())  # Pydantic v2
            return dict(self.dict())  # Pydantic v1

        def to_yaml(self, path: str) -> None:
            """Save settings to YAML file."""
            import yaml  # type: ignore[import-untyped]

            with open(path, "w") as f:
                yaml.dump(self._get_dict(), f, default_flow_style=False, sort_keys=False)

        def to_json(self, path: str, indent: int = 2) -> None:
            """Save settings to JSON file."""
            import json

            with open(path, "w") as f:
                json.dump(self._get_dict(), f, indent=indent)

        def to_dict(self) -> dict[str, Any]:
            """Convert to dictionary."""
            return self._get_dict()

        def merge_cli_args(self, args) -> "Settings":
            """
            Merge command-line arguments into settings.

            CLI args take precedence over file/env settings.
            """
            updates: dict[str, Any] = {}

            # Map CLI args to nested settings
            if hasattr(args, "model") and args.model:
                updates.setdefault("inference", {})["model_path"] = args.model

            if hasattr(args, "confidence") and args.confidence is not None:
                updates.setdefault("inference", {})["confidence_threshold"] = args.confidence

            if hasattr(args, "coral") and args.coral:
                updates.setdefault("inference", {})["use_coral"] = True

            if hasattr(args, "width") and args.width:
                updates.setdefault("capture", {})["width"] = args.width

            if hasattr(args, "height") and args.height:
                updates.setdefault("capture", {})["height"] = args.height

            if hasattr(args, "fps") and args.fps:
                updates.setdefault("capture", {})["fps"] = args.fps

            if hasattr(args, "camera") and args.camera:
                updates["camera_type"] = CameraType(args.camera)

            if hasattr(args, "engine") and args.engine:
                updates["engine_type"] = EngineType(args.engine)

            if hasattr(args, "tracker") and args.tracker:
                updates["tracker_type"] = TrackerType(args.tracker)

            if hasattr(args, "headless") and args.headless:
                updates.setdefault("display", {})["headless"] = True

            if hasattr(args, "alert_webhook") and args.alert_webhook:
                updates.setdefault("alert", {})["webhook_url"] = args.alert_webhook

            if hasattr(args, "save_detections") and args.save_detections:
                updates.setdefault("alert", {})["save_detections_path"] = args.save_detections

            if hasattr(args, "stream") and args.stream:
                updates.setdefault("streaming", {})["enabled"] = True

            if hasattr(args, "stream_port") and args.stream_port:
                updates.setdefault("streaming", {})["port"] = args.stream_port

            # Create new settings with updates
            current = self._get_dict()
            for key, value in updates.items():
                if isinstance(value, dict) and key in current:
                    current[key].update(value)
                else:
                    current[key] = value

            return Settings(**current)

else:
    # Fallback for environments without pydantic
    # Use different names to avoid static analysis "class redefinition" warnings
    # These simple classes are only used when pydantic is not installed

    class _SimpleCaptureSettings:
        def __init__(self):
            self.width = 640
            self.height = 480
            self.fps = 30
            self.buffer_size = 1
            self.camera_index = 0
            self.video_path = None
            self.video_loop = True

    class _SimpleInferenceSettings:
        def __init__(self):
            self.model_path = ""
            self.input_size = 320
            self.confidence_threshold = 0.5
            self.nms_threshold = 0.45
            self.num_threads = 4
            self.use_coral = False

    class _SimpleDroneScoreSettings:
        def __init__(self):
            self.drone_class_id = 0
            self.model_weight = 0.7
            self.drone_threshold = 0.5
            self.aspect_ratio_min = 0.8
            self.aspect_ratio_max = 2.5
            self.aspect_bonus = 0.15
            self.tall_object_ratio = 0.6
            self.tall_penalty = 0.2

    class _SimpleTrackerSettings:
        def __init__(self):
            self.max_disappeared = 30
            self.max_distance = 100.0
            self.process_noise = 1.0
            self.measurement_noise = 1.0

    class _SimpleTargetingSettings:
        def __init__(self):
            self.max_targeting_distance_m = 100.0
            self.assumed_drone_size_m = 0.3
            self.min_confidence_for_lock = 0.7
            self.lock_timeout_seconds = 5.0
            self.tracking_lead_factor = 1.2
            self.fire_net_enabled = False
            self.fire_net_min_confidence = 0.85
            self.fire_net_min_track_frames = 10
            self.fire_net_max_distance_m = 50.0
            self.fire_net_min_distance_m = 5.0
            self.fire_net_velocity_threshold_ms = 30.0
            self.fire_net_cooldown_seconds = 10.0
            self.fire_net_arm_required = True
            self.fire_net_gpio_pin = 17

    class _SimpleTurretControlSettings:
        def __init__(self):
            self.transport_type = "simulated"
            self.serial_port = "/dev/ttyUSB0"
            self.serial_baudrate = 115200
            self.wifi_host = "192.168.4.1"
            self.wifi_port = 4210
            self.audio_device = None
            self.audio_buffer_size = 512
            self.yaw_kp = 0.8
            self.yaw_ki = 0.05
            self.yaw_kd = 0.15
            self.pitch_kp = 0.6
            self.pitch_ki = 0.03
            self.pitch_kd = 0.10
            self.max_yaw_rate = 1.0
            self.max_pitch_rate = 1.0
            self.max_slew_rate = 2.0
            self.watchdog_timeout_ms = 500
            self.override_latch_seconds = 3.0
            self.command_ttl_ms = 200
            self.dead_zone = 0.02
            self.initial_mode = "manual"

    class _SimpleAlertSettings:
        def __init__(self):
            self.webhook_url = None
            self.webhook_timeout = 5.0
            self.webhook_retry_count = 3
            self.cooldown_per_track = 5.0
            self.global_cooldown = 1.0
            self.save_detections_path = None
            self.save_buffer_size = 10

    class _SimpleStreamingSettings:
        def __init__(self):
            self.enabled = False
            self.host = "0.0.0.0"  # nosec B104 - intentional for LAN access
            self.port = 8080
            self.quality = 80
            self.max_fps = 15
            self.auth_enabled = False
            self.auth_token = None

    class _SimpleLoggingSettings:
        def __init__(self):
            self.level = LogLevel.INFO
            self.json_format = False
            self.log_file = None
            self.max_bytes = 10_000_000
            self.backup_count = 5

    class _SimpleDisplaySettings:
        def __init__(self):
            self.headless = False
            self.window_name = "Drone Detection"
            self.show_fps = True
            self.show_drone_score = True
            self.show_track_id = True
            self.show_distance = True
            self.show_targeting_overlay = True
            self.log_interval_frames = 30

    # Override the pydantic classes with simple fallbacks
    CaptureSettings = _SimpleCaptureSettings  # type: ignore[misc,assignment]  # noqa: F811
    InferenceSettings = _SimpleInferenceSettings  # type: ignore[misc,assignment]  # noqa: F811
    DroneScoreSettings = _SimpleDroneScoreSettings  # type: ignore[misc,assignment]  # noqa: F811
    TrackerSettings = _SimpleTrackerSettings  # type: ignore[misc,assignment]  # noqa: F811
    TargetingSettings = _SimpleTargetingSettings  # type: ignore[misc,assignment]  # noqa: F811
    TurretControlSettings = _SimpleTurretControlSettings  # type: ignore[misc,assignment]  # noqa: F811
    AlertSettings = _SimpleAlertSettings  # type: ignore[misc,assignment]  # noqa: F811
    StreamingSettings = _SimpleStreamingSettings  # type: ignore[misc,assignment]  # noqa: F811
    LoggingSettings = _SimpleLoggingSettings  # type: ignore[misc,assignment]  # noqa: F811
    DisplaySettings = _SimpleDisplaySettings  # type: ignore[misc,assignment]  # noqa: F811

    class Settings:  # type: ignore[no-redef]  # noqa: F811
        """Fallback settings class without pydantic validation."""

        def __init__(self, **kwargs):
            self.capture = (
                _SimpleCaptureSettings() if "capture" not in kwargs else kwargs["capture"]
            )
            self.inference = (
                _SimpleInferenceSettings() if "inference" not in kwargs else kwargs["inference"]
            )
            self.drone_score = (
                _SimpleDroneScoreSettings()
                if "drone_score" not in kwargs
                else kwargs["drone_score"]
            )
            self.tracker = (
                _SimpleTrackerSettings() if "tracker" not in kwargs else kwargs["tracker"]
            )
            self.targeting = (
                _SimpleTargetingSettings() if "targeting" not in kwargs else kwargs["targeting"]
            )
            self.turret_control = (
                _SimpleTurretControlSettings()
                if "turret_control" not in kwargs
                else kwargs["turret_control"]
            )
            self.alert = _SimpleAlertSettings() if "alert" not in kwargs else kwargs["alert"]
            self.streaming = (
                _SimpleStreamingSettings() if "streaming" not in kwargs else kwargs["streaming"]
            )
            self.logging = (
                _SimpleLoggingSettings() if "logging" not in kwargs else kwargs["logging"]
            )
            self.display = (
                _SimpleDisplaySettings() if "display" not in kwargs else kwargs["display"]
            )
            self.camera_type = kwargs.get("camera_type", CameraType.AUTO)
            self.engine_type = kwargs.get("engine_type", EngineType.AUTO)
            self.tracker_type = kwargs.get("tracker_type", TrackerType.CENTROID)


# =============================================================================
# Default configuration file template
# =============================================================================

DEFAULT_CONFIG_YAML = """
# Pi Drone Detector Configuration
# All values shown are defaults

camera_type: auto  # auto, picamera, usb, video, mock
engine_type: auto  # auto, tflite, onnx, coral, mock
tracker_type: centroid  # none, centroid, kalman

capture:
  width: 640
  height: 480
  fps: 30
  buffer_size: 1

inference:
  model_path: ""  # Required: path to .tflite or .onnx model
  input_size: 320
  confidence_threshold: 0.5
  nms_threshold: 0.45
  num_threads: 4
  use_coral: false

drone_score:
  drone_class_id: 0
  model_weight: 0.7
  drone_threshold: 0.5
  aspect_ratio_min: 0.8
  aspect_ratio_max: 2.5
  aspect_bonus: 0.15
  tall_penalty: 0.2

tracker:
  max_disappeared: 30
  max_distance: 100.0

targeting:
  max_targeting_distance_m: 100.0
  min_confidence_for_lock: 0.7
  lock_timeout_seconds: 5.0
  fire_net_enabled: false
  fire_net_min_confidence: 0.85
  fire_net_min_track_frames: 10
  fire_net_max_distance_m: 50.0
  fire_net_min_distance_m: 5.0
  fire_net_cooldown_seconds: 10.0
  fire_net_arm_required: true
  fire_net_gpio_pin: 17

turret_control:
  transport_type: simulated  # simulated, serial, wifi_udp, audio_pwm
  serial_port: "/dev/ttyUSB0"
  serial_baudrate: 115200
  wifi_host: "192.168.4.1"
  wifi_port: 4210
  audio_device: null  # null=default output. Run `python -m sounddevice` to list
  audio_buffer_size: 512  # 256=low latency, 1024=stable
  # PID gains (tune in simulation first)
  yaw_kp: 0.8
  yaw_ki: 0.05
  yaw_kd: 0.15
  pitch_kp: 0.6
  pitch_ki: 0.03
  pitch_kd: 0.10
  # Safety
  max_yaw_rate: 1.0
  max_pitch_rate: 1.0
  max_slew_rate: 2.0  # per second
  watchdog_timeout_ms: 500
  override_latch_seconds: 3.0
  command_ttl_ms: 200
  dead_zone: 0.02  # error below this → output zero (prevents hunting)
  initial_mode: manual  # manual, assisted, auto_track

alert:
  webhook_url: null
  cooldown_per_track: 5.0
  global_cooldown: 1.0
  save_detections_path: null

streaming:
  enabled: false
  host: "0.0.0.0"
  port: 8080
  quality: 80
  max_fps: 15

logging:
  level: INFO
  json_format: false
  log_file: null

display:
  headless: false
  show_fps: true
  show_drone_score: true
  show_track_id: true
"""


def create_default_config(path: str) -> None:
    """Create a default configuration file."""
    with open(path, "w") as f:
        f.write(DEFAULT_CONFIG_YAML)
