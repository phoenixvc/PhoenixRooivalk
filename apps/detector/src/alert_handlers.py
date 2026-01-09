#!/usr/bin/env python3
"""
Alert handler implementations for different output methods.

Supports hot-swapping between console, webhook, file logging, or combinations.
"""

import json
import time
from datetime import datetime
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

from interfaces import AlertHandler, Detection, FrameData


class ConsoleAlertHandler(AlertHandler):
    """Print alerts to console/stdout."""

    def __init__(
        self,
        prefix: str = "[DRONE DETECTED]",
        include_bbox: bool = True,
        include_score: bool = True,
    ):
        self._prefix = prefix
        self._include_bbox = include_bbox
        self._include_score = include_score
        self._alert_count = 0

    def send_alert(self, detection: Detection, frame_data: FrameData) -> bool:
        self._alert_count += 1

        parts = [
            self._prefix,
            f"conf={detection.confidence:.2f}",
        ]

        if self._include_score:
            parts.append(f"score={detection.drone_score:.2f}")

        if self._include_bbox:
            parts.append(f"bbox={detection.bbox.to_tuple()}")

        if detection.track_id is not None:
            parts.append(f"track={detection.track_id}")

        parts.append(f"frame={frame_data.frame_number}")

        print(" ".join(parts))
        return True

    def flush(self) -> None:
        pass

    @property
    def handler_info(self) -> dict[str, Any]:
        return {
            "type": "console",
            "prefix": self._prefix,
            "alert_count": self._alert_count,
        }


class WebhookAlertHandler(AlertHandler):
    """Send alerts via HTTP webhook."""

    def __init__(
        self,
        webhook_url: str,
        timeout_seconds: float = 5.0,
        cooldown_seconds: float = 1.0,
        batch_alerts: bool = False,
        batch_size: int = 10,
    ):
        # Validate URL
        parsed = urlparse(webhook_url)
        if parsed.scheme not in ("http", "https"):
            raise ValueError(f"Invalid URL scheme: {parsed.scheme}")

        self._webhook_url = webhook_url
        self._timeout = timeout_seconds
        self._cooldown = cooldown_seconds
        self._batch_alerts = batch_alerts
        self._batch_size = batch_size

        self._last_alert_time = 0.0
        self._alert_count = 0
        self._failed_count = 0
        self._pending_batch: list[dict] = []

    def send_alert(self, detection: Detection, frame_data: FrameData) -> bool:
        # Cooldown check
        now = time.time()
        if now - self._last_alert_time < self._cooldown:
            return False

        alert_data = {
            "event": "drone_detected",
            "timestamp": datetime.now().isoformat(),
            "frame_number": frame_data.frame_number,
            "detection": detection.to_dict(),
            "source_id": frame_data.source_id,
        }

        if self._batch_alerts:
            self._pending_batch.append(alert_data)
            if len(self._pending_batch) >= self._batch_size:
                return self._send_batch()
            return True

        return self._send_single(alert_data)

    def _send_single(self, alert_data: dict) -> bool:
        try:
            import urllib.error
            import urllib.request

            data = json.dumps(alert_data).encode("utf-8")

            req = urllib.request.Request(
                self._webhook_url,
                data=data,
                headers={"Content-Type": "application/json"},
            )
            urllib.request.urlopen(
                req, timeout=self._timeout
            )  # nosec B310 - URL scheme validated in __init__

            self._alert_count += 1
            self._last_alert_time = time.time()
            return True

        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as e:
            self._failed_count += 1
            print(f"Webhook error: {e}")
            return False

    def _send_batch(self) -> bool:
        if not self._pending_batch:
            return True

        try:
            import urllib.error
            import urllib.request

            batch_data = {
                "event": "drone_alerts_batch",
                "timestamp": datetime.now().isoformat(),
                "alerts": self._pending_batch,
            }

            data = json.dumps(batch_data).encode("utf-8")

            req = urllib.request.Request(
                self._webhook_url,
                data=data,
                headers={"Content-Type": "application/json"},
            )
            urllib.request.urlopen(
                req, timeout=self._timeout
            )  # nosec B310 - URL scheme validated in __init__

            self._alert_count += len(self._pending_batch)
            self._pending_batch = []
            self._last_alert_time = time.time()
            return True

        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as e:
            self._failed_count += 1
            self._pending_batch = []
            print(f"Webhook batch error: {e}")
            return False

    def flush(self) -> None:
        if self._pending_batch:
            self._send_batch()

    @property
    def handler_info(self) -> dict[str, Any]:
        return {
            "type": "webhook",
            "url": self._webhook_url,
            "alert_count": self._alert_count,
            "failed_count": self._failed_count,
            "cooldown": self._cooldown,
            "batch_mode": self._batch_alerts,
        }


class FileAlertHandler(AlertHandler):
    """Log alerts to a JSON file."""

    def __init__(
        self,
        file_path: str,
        append: bool = True,
        buffer_size: int = 10,
    ):
        self._file_path = Path(file_path)
        self._append = append
        self._buffer_size = buffer_size
        self._buffer: list[dict] = []
        self._alert_count = 0

        # Load existing if appending
        self._existing_data: list[dict] = []
        if self._append and self._file_path.exists():
            try:
                with open(self._file_path) as f:
                    self._existing_data = json.load(f)
            except (OSError, json.JSONDecodeError):
                self._existing_data = []

    def send_alert(self, detection: Detection, frame_data: FrameData) -> bool:
        alert_data = {
            "timestamp": datetime.now().isoformat(),
            "frame_number": frame_data.frame_number,
            "source_id": frame_data.source_id,
            **detection.to_dict(),
        }

        self._buffer.append(alert_data)
        self._alert_count += 1

        if len(self._buffer) >= self._buffer_size:
            self._write_buffer()

        return True

    def _write_buffer(self) -> None:
        if not self._buffer:
            return

        try:
            all_data = self._existing_data + self._buffer
            with open(self._file_path, "w") as f:
                json.dump(all_data, f, indent=2)

            self._existing_data = all_data
            self._buffer = []

        except OSError as e:
            print(f"File write error: {e}")

    def flush(self) -> None:
        self._write_buffer()

    @property
    def handler_info(self) -> dict[str, Any]:
        return {
            "type": "file",
            "file_path": str(self._file_path),
            "alert_count": self._alert_count,
            "buffered": len(self._buffer),
        }


class CompositeAlertHandler(AlertHandler):
    """Combine multiple alert handlers."""

    def __init__(self, handlers: list[AlertHandler]):
        self._handlers = handlers

    def add_handler(self, handler: AlertHandler) -> None:
        self._handlers.append(handler)

    def send_alert(self, detection: Detection, frame_data: FrameData) -> bool:
        success = True
        for handler in self._handlers:
            if not handler.send_alert(detection, frame_data):
                success = False
        return success

    def flush(self) -> None:
        for handler in self._handlers:
            handler.flush()

    @property
    def handler_info(self) -> dict[str, Any]:
        return {
            "type": "composite",
            "handler_count": len(self._handlers),
            "handlers": [h.handler_info for h in self._handlers],
        }


class ThrottledAlertHandler(AlertHandler):
    """
    Wrapper that throttles alerts per track ID.

    Prevents flooding when a drone is continuously detected.
    """

    def __init__(
        self,
        inner_handler: AlertHandler,
        cooldown_per_track: float = 5.0,
        global_cooldown: float = 1.0,
    ):
        self._inner = inner_handler
        self._cooldown_per_track = cooldown_per_track
        self._global_cooldown = global_cooldown
        self._last_alert_per_track: dict[int, float] = {}
        self._last_global_alert = 0.0
        self._throttled_count = 0

    def _prune_stale_entries(self, now: float) -> None:
        """Remove stale track entries to prevent memory leak."""
        # Prune entries older than 10x the cooldown period
        stale_threshold = now - (self._cooldown_per_track * 10)
        self._last_alert_per_track = {
            k: v for k, v in self._last_alert_per_track.items() if v > stale_threshold
        }

    def send_alert(self, detection: Detection, frame_data: FrameData) -> bool:
        now = time.time()

        # Periodically prune stale entries to prevent unbounded growth
        self._prune_stale_entries(now)

        # Global cooldown
        if now - self._last_global_alert < self._global_cooldown:
            self._throttled_count += 1
            return False

        # Per-track cooldown
        track_id = detection.track_id or -1
        last_for_track = self._last_alert_per_track.get(track_id, 0)

        if now - last_for_track < self._cooldown_per_track:
            self._throttled_count += 1
            return False

        # Send alert
        result = self._inner.send_alert(detection, frame_data)

        if result:
            self._last_global_alert = now
            self._last_alert_per_track[track_id] = now

        return result

    def flush(self) -> None:
        self._inner.flush()

    @property
    def handler_info(self) -> dict[str, Any]:
        return {
            "type": "throttled",
            "cooldown_per_track": self._cooldown_per_track,
            "global_cooldown": self._global_cooldown,
            "throttled_count": self._throttled_count,
            "inner": self._inner.handler_info,
        }


class NullAlertHandler(AlertHandler):
    """No-op handler for when alerts are disabled."""

    def send_alert(self, detection: Detection, frame_data: FrameData) -> bool:
        return True

    def flush(self) -> None:
        pass

    @property
    def handler_info(self) -> dict[str, Any]:
        return {"type": "null"}


def create_alert_handler(handler_type: str = "console", **kwargs) -> AlertHandler:
    """
    Factory function to create appropriate alert handler.

    Args:
        handler_type: "console", "webhook", "file", "null"
        **kwargs: Arguments passed to handler constructor

    Returns:
        Configured AlertHandler instance
    """
    if handler_type == "null" or handler_type == "none":
        return NullAlertHandler()

    if handler_type == "console":
        return ConsoleAlertHandler(
            prefix=kwargs.get("prefix", "[DRONE DETECTED]"),
            include_bbox=kwargs.get("include_bbox", True),
            include_score=kwargs.get("include_score", True),
        )

    if handler_type == "webhook":
        webhook_url = kwargs.get("webhook_url", "")
        if not webhook_url:
            raise ValueError("webhook_url required for webhook handler")

        handler = WebhookAlertHandler(
            webhook_url=webhook_url,
            timeout_seconds=kwargs.get("timeout_seconds", 5.0),
            cooldown_seconds=kwargs.get("cooldown_seconds", 1.0),
        )

        # Optionally wrap with throttling
        if kwargs.get("throttle", True):
            handler = ThrottledAlertHandler(
                handler,
                cooldown_per_track=kwargs.get("cooldown_per_track", 5.0),
                global_cooldown=kwargs.get("global_cooldown", 1.0),
            )

        return handler

    if handler_type == "file":
        file_path = kwargs.get("file_path", "")
        if not file_path:
            raise ValueError("file_path required for file handler")

        return FileAlertHandler(
            file_path=file_path,
            append=kwargs.get("append", True),
            buffer_size=kwargs.get("buffer_size", 10),
        )

    raise ValueError(f"Unknown handler type: {handler_type}")
