"""
Structured logging configuration for Pi Drone Detector.

Provides:
- JSON formatted logs for production
- Human-readable logs for development
- File rotation
- Performance metrics logging
"""

import json
import logging
import logging.handlers
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Optional


class JSONFormatter(logging.Formatter):
    """
    JSON formatter for structured logging.

    Outputs logs as single-line JSON objects for easy parsing
    by log aggregation systems (e.g., ELK, CloudWatch).
    """

    def __init__(self, include_extra: bool = True):
        super().__init__()
        self._include_extra = include_extra

    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
            log_data["exception_type"] = record.exc_info[0].__name__ if record.exc_info[0] else None

        # Add extra fields
        if self._include_extra:
            # Standard extra fields
            for key in [
                "frame_number",
                "inference_time_ms",
                "fps",
                "detections_count",
                "track_id",
                "confidence",
                "drone_score",
                "distance_m",
            ]:
                if hasattr(record, key):
                    log_data[key] = getattr(record, key)

            # Generic extra data
            if hasattr(record, "extra_data") and record.extra_data:
                log_data.update(record.extra_data)

        return json.dumps(log_data, default=str)


class ColoredFormatter(logging.Formatter):
    """
    Colored formatter for terminal output.

    Makes logs easier to read during development.
    """

    COLORS = {
        "DEBUG": "\033[36m",  # Cyan
        "INFO": "\033[32m",  # Green
        "WARNING": "\033[33m",  # Yellow
        "ERROR": "\033[31m",  # Red
        "CRITICAL": "\033[35m",  # Magenta
    }
    RESET = "\033[0m"

    def __init__(self, use_colors: bool = True):
        super().__init__(
            fmt="%(asctime)s [%(levelname)s] %(name)s: %(message)s", datefmt="%Y-%m-%d %H:%M:%S"
        )
        self._use_colors = use_colors and sys.stdout.isatty()

    def format(self, record: logging.LogRecord) -> str:
        if self._use_colors:
            color = self.COLORS.get(record.levelname, "")
            # Create a copy to avoid affecting other handlers
            original_levelname = record.levelname
            record.levelname = f"{color}{original_levelname}{self.RESET}"
            result = super().format(record)
            record.levelname = original_levelname
            return result
        return super().format(record)


class MetricsLogger:
    """
    Specialized logger for performance metrics.

    Tracks FPS, inference times, and detection statistics.
    """

    def __init__(self, logger: logging.Logger, log_interval: int = 30):
        self._logger = logger
        self._log_interval = log_interval
        self._frame_count = 0
        self._total_inference_time = 0.0
        self._total_detections = 0
        self._fps_samples: list = []

    def log_frame(
        self,
        frame_number: int,
        inference_time_ms: float,
        detections_count: int,
        fps: float,
    ) -> None:
        """Log frame processing metrics."""
        self._frame_count += 1
        self._total_inference_time += inference_time_ms
        self._total_detections += detections_count
        self._fps_samples.append(fps)

        if len(self._fps_samples) > 100:
            self._fps_samples.pop(0)

        # Periodic summary log
        if self._frame_count % self._log_interval == 0:
            avg_fps = sum(self._fps_samples) / len(self._fps_samples) if self._fps_samples else 0
            avg_inference = (
                self._total_inference_time / self._frame_count if self._frame_count else 0
            )

            self._logger.info(
                f"Frame {frame_number} | "
                f"Avg FPS: {avg_fps:.1f} | "
                f"Avg inference: {avg_inference:.1f}ms | "
                f"Total detections: {self._total_detections}",
                extra={
                    "frame_number": frame_number,
                    "avg_fps": avg_fps,
                    "avg_inference_ms": avg_inference,
                    "total_detections": self._total_detections,
                },
            )

    def log_detection(
        self,
        frame_number: int,
        class_name: str,
        confidence: float,
        drone_score: float,
        track_id: Optional[int] = None,
        distance_m: Optional[float] = None,
    ) -> None:
        """Log individual detection."""
        extra = {
            "frame_number": frame_number,
            "class_name": class_name,
            "confidence": confidence,
            "drone_score": drone_score,
        }

        if track_id is not None:
            extra["track_id"] = track_id
        if distance_m is not None:
            extra["distance_m"] = distance_m

        if drone_score > 0.5:
            self._logger.warning(
                f"DRONE DETECTED: conf={confidence:.2f} score={drone_score:.2f}",
                extra=extra,
            )
        else:
            self._logger.debug(
                f"Detection: {class_name} conf={confidence:.2f}",
                extra=extra,
            )

    def reset(self) -> None:
        """Reset metrics counters."""
        self._frame_count = 0
        self._total_inference_time = 0.0
        self._total_detections = 0
        self._fps_samples.clear()


def setup_logging(
    level: str = "INFO",
    log_file: Optional[str] = None,
    json_format: bool = False,
    max_bytes: int = 10_000_000,
    backup_count: int = 5,
    logger_name: str = "drone_detector",
) -> logging.Logger:
    """
    Configure application logging.

    Args:
        level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_file: Optional log file path
        json_format: Use JSON format for logs
        max_bytes: Maximum log file size before rotation
        backup_count: Number of backup log files to keep
        logger_name: Name for the logger

    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(logger_name)
    logger.setLevel(getattr(logging, level.upper()))

    # Remove existing handlers
    logger.handlers.clear()

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    if json_format:
        console_handler.setFormatter(JSONFormatter())
    else:
        console_handler.setFormatter(ColoredFormatter())
    logger.addHandler(console_handler)

    # File handler (with rotation)
    if log_file:
        log_path = Path(log_file)
        log_path.parent.mkdir(parents=True, exist_ok=True)

        file_handler = logging.handlers.RotatingFileHandler(
            log_file,
            maxBytes=max_bytes,
            backupCount=backup_count,
        )
        # Always use JSON format for file logs
        file_handler.setFormatter(JSONFormatter())
        logger.addHandler(file_handler)

    # Prevent propagation to root logger
    logger.propagate = False

    return logger


def get_logger(name: str = "drone_detector") -> logging.Logger:
    """
    Get or create a logger with the given name.

    Args:
        name: Logger name (will be prefixed with 'drone_detector.')

    Returns:
        Logger instance
    """
    if not name.startswith("drone_detector"):
        name = f"drone_detector.{name}"
    return logging.getLogger(name)


def log_hardware_info(logger: logging.Logger, hardware_info: dict[str, Any]) -> None:
    """Log hardware detection results."""
    logger.info(
        f"Hardware: {hardware_info.get('platform', 'unknown')} | "
        f"RAM: {hardware_info.get('ram_mb', 0)}MB | "
        f"Camera: {hardware_info.get('camera_type', 'unknown')} | "
        f"Accelerator: {hardware_info.get('accelerator', 'none')}",
        extra={"hardware_info": hardware_info},
    )


def log_config(logger: logging.Logger, config: dict[str, Any]) -> None:
    """Log configuration summary."""
    logger.info(
        f"Config: {config.get('capture', {}).get('width', 0)}x"
        f"{config.get('capture', {}).get('height', 0)} @ "
        f"{config.get('capture', {}).get('fps', 0)}fps | "
        f"Model: {Path(config.get('inference', {}).get('model_path', '')).name}",
        extra={"config": config},
    )


def log_startup(logger: logging.Logger, version: str) -> None:
    """Log application startup."""
    logger.info(
        f"Pi Drone Detector v{version} starting",
        extra={"event": "startup", "version": version},
    )


def log_shutdown(logger: logging.Logger, frame_count: int, runtime_seconds: float) -> None:
    """Log application shutdown."""
    logger.info(
        f"Shutting down after {frame_count} frames ({runtime_seconds:.1f}s)",
        extra={
            "event": "shutdown",
            "frame_count": frame_count,
            "runtime_seconds": runtime_seconds,
        },
    )
