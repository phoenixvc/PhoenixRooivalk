#!/usr/bin/env python3
"""
Adaptive frame rate controller for dynamic load balancing.

Automatically adjusts capture frame rate based on:
- Inference queue depth
- CPU load
- Memory pressure
- Thermal throttling

Prevents frame buildup and maintains real-time responsiveness.
"""

import logging
import threading
import time
from collections import deque
from dataclasses import dataclass
from enum import Enum
from typing import Deque, Optional, Callable

logger = logging.getLogger("drone_detector.adaptive_fps")


class DegradationLevel(Enum):
    """System degradation levels."""

    FULL = "full"  # All features enabled
    NO_STREAMING = "no_streaming"  # Disable streaming under memory pressure
    LOW_RES = "low_res"  # Reduce resolution under CPU pressure
    DETECT_ONLY = "detect_only"  # No tracking, just detection
    MINIMAL = "minimal"  # Minimum viable operation


@dataclass
class PerformanceMetrics:
    """Current performance metrics."""

    inference_latency_ms: float = 0.0
    frame_processing_ms: float = 0.0
    queue_depth: int = 0
    fps_actual: float = 0.0
    fps_target: float = 30.0
    cpu_percent: float = 0.0
    memory_percent: float = 0.0
    temperature_celsius: float = 0.0
    dropped_frames: int = 0
    degradation_level: DegradationLevel = DegradationLevel.FULL


class AdaptiveFrameRateController:
    """
    Dynamically adjusts frame rate based on system load.

    Uses a PID-like control loop to maintain stable performance:
    - When queue builds up → reduce FPS
    - When queue is empty and system is idle → increase FPS
    - When temperature is high → reduce FPS
    - When memory is low → reduce features

    Features:
    - Smooth transitions (no sudden FPS jumps)
    - Configurable bounds (min/max FPS)
    - Graceful degradation under load
    - Automatic recovery when load decreases
    """

    # Default configuration
    DEFAULT_MIN_FPS = 5
    DEFAULT_MAX_FPS = 60
    DEFAULT_TARGET_FPS = 30
    DEFAULT_ADJUSTMENT_INTERVAL = 1.0  # seconds
    DEFAULT_QUEUE_HIGH_WATERMARK = 3
    DEFAULT_QUEUE_LOW_WATERMARK = 1
    DEFAULT_TEMP_HIGH = 75.0  # Celsius
    DEFAULT_TEMP_CRITICAL = 85.0  # Celsius
    DEFAULT_MEMORY_HIGH = 80.0  # percent
    DEFAULT_CPU_HIGH = 90.0  # percent

    def __init__(
        self,
        min_fps: int = DEFAULT_MIN_FPS,
        max_fps: int = DEFAULT_MAX_FPS,
        target_fps: int = DEFAULT_TARGET_FPS,
        adjustment_interval: float = DEFAULT_ADJUSTMENT_INTERVAL,
        queue_high_watermark: int = DEFAULT_QUEUE_HIGH_WATERMARK,
        queue_low_watermark: int = DEFAULT_QUEUE_LOW_WATERMARK,
        on_fps_change: Optional[Callable[[int], None]] = None,
        on_degradation_change: Optional[Callable[[DegradationLevel], None]] = None,
    ):
        """
        Initialize adaptive frame rate controller.

        Args:
            min_fps: Minimum allowed FPS
            max_fps: Maximum allowed FPS
            target_fps: Initial target FPS
            adjustment_interval: Seconds between adjustments
            queue_high_watermark: Queue depth that triggers FPS reduction
            queue_low_watermark: Queue depth that allows FPS increase
            on_fps_change: Callback when FPS changes
            on_degradation_change: Callback when degradation level changes
        """
        self._min_fps = min_fps
        self._max_fps = max_fps
        self._current_fps = target_fps
        self._target_fps = target_fps
        self._adjustment_interval = adjustment_interval
        self._queue_high = queue_high_watermark
        self._queue_low = queue_low_watermark
        self._on_fps_change = on_fps_change
        self._on_degradation_change = on_degradation_change

        # State
        self._degradation_level = DegradationLevel.FULL
        self._running = False
        self._lock = threading.Lock()
        self._adjustment_thread: Optional[threading.Thread] = None

        # Metrics history (for smoothing)
        self._latency_history: Deque[float] = deque(maxlen=30)
        self._queue_depth_history: Deque[int] = deque(maxlen=10)
        self._fps_history: Deque[float] = deque(maxlen=30)

        # External metrics (set by caller)
        self._current_queue_depth = 0
        self._current_latency_ms = 0.0
        self._current_temperature = 0.0
        self._current_memory_percent = 0.0
        self._current_cpu_percent = 0.0
        self._dropped_frames = 0

        # Timestamps
        self._last_adjustment_time = 0.0
        self._last_frame_time = 0.0
        self._frame_count = 0

    @property
    def current_fps(self) -> int:
        """Current target FPS."""
        with self._lock:
            return self._current_fps

    @property
    def degradation_level(self) -> DegradationLevel:
        """Current degradation level."""
        with self._lock:
            return self._degradation_level

    def start(self) -> None:
        """Start the adaptive controller."""
        if self._running:
            return

        self._running = True
        self._last_adjustment_time = time.time()
        self._adjustment_thread = threading.Thread(
            target=self._adjustment_loop,
            name="AdaptiveFPSController",
            daemon=True,
        )
        self._adjustment_thread.start()
        logger.info(
            f"Adaptive frame rate controller started "
            f"(range: {self._min_fps}-{self._max_fps} FPS)"
        )

    def stop(self) -> None:
        """Stop the adaptive controller."""
        self._running = False
        if self._adjustment_thread and self._adjustment_thread.is_alive():
            self._adjustment_thread.join(timeout=2.0)
        logger.info("Adaptive frame rate controller stopped")

    def report_metrics(
        self,
        queue_depth: int = 0,
        latency_ms: float = 0.0,
        temperature: float = 0.0,
        memory_percent: float = 0.0,
        cpu_percent: float = 0.0,
    ) -> None:
        """
        Report current metrics for adaptation.

        Args:
            queue_depth: Current inference queue depth
            latency_ms: Last inference latency in milliseconds
            temperature: CPU temperature in Celsius
            memory_percent: Memory usage percentage
            cpu_percent: CPU usage percentage
        """
        with self._lock:
            self._current_queue_depth = queue_depth
            self._current_latency_ms = latency_ms
            self._current_temperature = temperature
            self._current_memory_percent = memory_percent
            self._current_cpu_percent = cpu_percent

            self._queue_depth_history.append(queue_depth)
            self._latency_history.append(latency_ms)

    def report_frame_processed(self) -> None:
        """Report that a frame was processed (for FPS calculation)."""
        now = time.time()
        with self._lock:
            if self._last_frame_time > 0:
                frame_interval = now - self._last_frame_time
                if frame_interval > 0:
                    instant_fps = 1.0 / frame_interval
                    self._fps_history.append(instant_fps)
            self._last_frame_time = now
            self._frame_count += 1

    def report_frame_dropped(self) -> None:
        """Report that a frame was dropped."""
        with self._lock:
            self._dropped_frames += 1

    def get_metrics(self) -> PerformanceMetrics:
        """Get current performance metrics."""
        with self._lock:
            avg_latency = (
                sum(self._latency_history) / len(self._latency_history)
                if self._latency_history
                else 0.0
            )
            avg_fps = (
                sum(self._fps_history) / len(self._fps_history)
                if self._fps_history
                else 0.0
            )

            return PerformanceMetrics(
                inference_latency_ms=avg_latency,
                frame_processing_ms=avg_latency,  # Approximation
                queue_depth=self._current_queue_depth,
                fps_actual=avg_fps,
                fps_target=float(self._current_fps),
                cpu_percent=self._current_cpu_percent,
                memory_percent=self._current_memory_percent,
                temperature_celsius=self._current_temperature,
                dropped_frames=self._dropped_frames,
                degradation_level=self._degradation_level,
            )

    def _adjustment_loop(self) -> None:
        """Background thread for periodic adjustments."""
        while self._running:
            try:
                self._adjust()
            except Exception as e:
                logger.error(f"Error in adaptive FPS adjustment: {e}")

            time.sleep(self._adjustment_interval)

    def _adjust(self) -> None:
        """Perform a single adjustment cycle."""
        with self._lock:
            metrics = self._gather_metrics()
            new_fps = self._calculate_target_fps(metrics)
            new_degradation = self._calculate_degradation_level(metrics)

            # Apply FPS change
            if new_fps != self._current_fps:
                old_fps = self._current_fps
                self._current_fps = new_fps
                logger.info(f"FPS adjusted: {old_fps} -> {new_fps}")

                if self._on_fps_change:
                    try:
                        self._on_fps_change(new_fps)
                    except Exception as e:
                        logger.error(f"FPS change callback failed: {e}")

            # Apply degradation change
            if new_degradation != self._degradation_level:
                old_level = self._degradation_level
                self._degradation_level = new_degradation
                logger.warning(
                    f"Degradation level changed: {old_level.value} -> {new_degradation.value}"
                )

                if self._on_degradation_change:
                    try:
                        self._on_degradation_change(new_degradation)
                    except Exception as e:
                        logger.error(f"Degradation change callback failed: {e}")

    def _gather_metrics(self) -> dict:
        """Gather current metrics for decision making."""
        avg_queue = (
            sum(self._queue_depth_history) / len(self._queue_depth_history)
            if self._queue_depth_history
            else 0
        )
        avg_latency = (
            sum(self._latency_history) / len(self._latency_history)
            if self._latency_history
            else 0
        )

        return {
            "avg_queue_depth": avg_queue,
            "current_queue_depth": self._current_queue_depth,
            "avg_latency_ms": avg_latency,
            "temperature": self._current_temperature,
            "memory_percent": self._current_memory_percent,
            "cpu_percent": self._current_cpu_percent,
            "current_fps": self._current_fps,
        }

    def _calculate_target_fps(self, metrics: dict) -> int:
        """Calculate new target FPS based on metrics."""
        current = self._current_fps
        avg_queue = metrics["avg_queue_depth"]
        temp = metrics["temperature"]
        cpu = metrics["cpu_percent"]

        # Start with current FPS
        new_fps = current

        # Queue-based adjustment
        if avg_queue >= self._queue_high:
            # Queue is building up - reduce FPS
            reduction = min(5, max(1, int(avg_queue - self._queue_high)))
            new_fps = max(self._min_fps, current - reduction)
            logger.debug(f"Queue high ({avg_queue:.1f}), reducing FPS by {reduction}")

        elif avg_queue <= self._queue_low and current < self._max_fps:
            # Queue is empty - can increase FPS
            # But only if other metrics are healthy
            if temp < self.DEFAULT_TEMP_HIGH and cpu < self.DEFAULT_CPU_HIGH:
                increase = 2  # Gradual increase
                new_fps = min(self._max_fps, current + increase)
                logger.debug(f"Queue low ({avg_queue:.1f}), increasing FPS by {increase}")

        # Temperature-based throttling
        if temp >= self.DEFAULT_TEMP_CRITICAL:
            # Critical temperature - aggressive reduction
            new_fps = max(self._min_fps, min(new_fps, self._min_fps + 5))
            logger.warning(f"Critical temperature ({temp:.1f}°C), throttling to {new_fps} FPS")

        elif temp >= self.DEFAULT_TEMP_HIGH:
            # High temperature - moderate reduction
            max_allowed = max(self._min_fps, self._max_fps // 2)
            new_fps = min(new_fps, max_allowed)
            logger.debug(f"High temperature ({temp:.1f}°C), capping at {max_allowed} FPS")

        # CPU-based throttling
        if cpu >= self.DEFAULT_CPU_HIGH:
            # High CPU - reduce load
            reduction = max(1, int((cpu - self.DEFAULT_CPU_HIGH) / 10))
            new_fps = max(self._min_fps, new_fps - reduction)
            logger.debug(f"High CPU ({cpu:.1f}%), reducing FPS by {reduction}")

        return new_fps

    def _calculate_degradation_level(self, metrics: dict) -> DegradationLevel:
        """Calculate degradation level based on metrics."""
        memory = metrics["memory_percent"]
        cpu = metrics["cpu_percent"]
        temp = metrics["temperature"]
        fps = metrics["current_fps"]

        # Check for critical conditions
        if temp >= self.DEFAULT_TEMP_CRITICAL:
            return DegradationLevel.MINIMAL

        if memory >= 95:
            return DegradationLevel.MINIMAL

        if memory >= self.DEFAULT_MEMORY_HIGH:
            return DegradationLevel.NO_STREAMING

        if cpu >= self.DEFAULT_CPU_HIGH and fps <= self._min_fps + 5:
            return DegradationLevel.LOW_RES

        if cpu >= 95 or (temp >= self.DEFAULT_TEMP_HIGH and fps <= self._min_fps):
            return DegradationLevel.DETECT_ONLY

        # Normal operation
        return DegradationLevel.FULL

    def get_recommended_settings(self) -> dict:
        """
        Get recommended settings based on current degradation level.

        Returns:
            Dictionary of recommended settings adjustments
        """
        level = self.degradation_level

        if level == DegradationLevel.FULL:
            return {
                "streaming_enabled": True,
                "tracking_enabled": True,
                "resolution_scale": 1.0,
                "inference_threads": 4,
            }

        if level == DegradationLevel.NO_STREAMING:
            return {
                "streaming_enabled": False,
                "tracking_enabled": True,
                "resolution_scale": 1.0,
                "inference_threads": 4,
            }

        if level == DegradationLevel.LOW_RES:
            return {
                "streaming_enabled": False,
                "tracking_enabled": True,
                "resolution_scale": 0.5,
                "inference_threads": 2,
            }

        if level == DegradationLevel.DETECT_ONLY:
            return {
                "streaming_enabled": False,
                "tracking_enabled": False,
                "resolution_scale": 0.5,
                "inference_threads": 2,
            }

        # MINIMAL
        return {
            "streaming_enabled": False,
            "tracking_enabled": False,
            "resolution_scale": 0.25,
            "inference_threads": 1,
        }


class FrameRateLimiter:
    """
    Simple frame rate limiter.

    Ensures frames are processed at a consistent rate.
    """

    def __init__(self, target_fps: float = 30.0):
        """
        Initialize frame rate limiter.

        Args:
            target_fps: Target frames per second
        """
        self._target_fps = target_fps
        self._frame_interval = 1.0 / target_fps
        self._last_frame_time = 0.0
        self._lock = threading.Lock()

    @property
    def target_fps(self) -> float:
        """Current target FPS."""
        with self._lock:
            return self._target_fps

    @target_fps.setter
    def target_fps(self, value: float) -> None:
        """Set target FPS."""
        with self._lock:
            self._target_fps = max(1.0, value)
            self._frame_interval = 1.0 / self._target_fps

    def wait_for_next_frame(self) -> float:
        """
        Wait until it's time for the next frame.

        Returns:
            Actual time waited in seconds
        """
        with self._lock:
            now = time.time()
            elapsed = now - self._last_frame_time
            wait_time = max(0, self._frame_interval - elapsed)

            if wait_time > 0:
                time.sleep(wait_time)

            self._last_frame_time = time.time()
            return wait_time

    def should_process_frame(self) -> bool:
        """
        Check if enough time has passed to process another frame.

        Non-blocking alternative to wait_for_next_frame.

        Returns:
            True if a frame should be processed
        """
        with self._lock:
            now = time.time()
            if now - self._last_frame_time >= self._frame_interval:
                self._last_frame_time = now
                return True
            return False
