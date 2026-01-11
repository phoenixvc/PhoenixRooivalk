#!/usr/bin/env python3
"""
Prometheus-compatible metrics endpoint for edge detector.

Provides observability into:
- Frame processing throughput and latency
- Inference performance
- Tracking statistics
- Alert delivery
- System health

Exposes metrics in Prometheus text format at /metrics endpoint.
"""

import logging
import threading
import time
from collections import deque
from dataclasses import dataclass, field
from http.server import BaseHTTPRequestHandler, HTTPServer
from typing import Any, Optional

logger = logging.getLogger("drone_detector.metrics")


# =============================================================================
# Metric Types
# =============================================================================


@dataclass
class Counter:
    """Monotonically increasing counter."""

    name: str
    help: str
    value: float = 0.0
    labels: dict[str, str] = field(default_factory=dict)
    _lock: threading.Lock = field(default_factory=threading.Lock)

    def inc(self, amount: float = 1.0) -> None:
        """Increment counter."""
        with self._lock:
            self.value += amount

    def get(self) -> float:
        """Get current value."""
        with self._lock:
            return self.value

    def to_prometheus(self) -> str:
        """Format as Prometheus text."""
        label_str = ""
        if self.labels:
            pairs = [f'{k}="{v}"' for k, v in self.labels.items()]
            label_str = "{" + ",".join(pairs) + "}"
        return f"{self.name}{label_str} {self.value}"


@dataclass
class Gauge:
    """Gauge that can go up and down."""

    name: str
    help: str
    value: float = 0.0
    labels: dict[str, str] = field(default_factory=dict)
    _lock: threading.Lock = field(default_factory=threading.Lock)

    def set(self, value: float) -> None:
        """Set gauge value."""
        with self._lock:
            self.value = value

    def inc(self, amount: float = 1.0) -> None:
        """Increment gauge."""
        with self._lock:
            self.value += amount

    def dec(self, amount: float = 1.0) -> None:
        """Decrement gauge."""
        with self._lock:
            self.value -= amount

    def get(self) -> float:
        """Get current value."""
        with self._lock:
            return self.value

    def to_prometheus(self) -> str:
        """Format as Prometheus text."""
        label_str = ""
        if self.labels:
            pairs = [f'{k}="{v}"' for k, v in self.labels.items()]
            label_str = "{" + ",".join(pairs) + "}"
        return f"{self.name}{label_str} {self.value}"


# Default buckets for histograms (exposed as module constant for default fallback)
DEFAULT_HISTOGRAM_BUCKETS = (0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0)


@dataclass
class Histogram:
    """
    Histogram for latency/duration measurements.

    Uses exponential buckets by default. Implements Prometheus-style cumulative
    bucket counting where each bucket contains the count of observations <= bucket value.
    """

    name: str
    help: str
    buckets: tuple = DEFAULT_HISTOGRAM_BUCKETS
    labels: dict[str, str] = field(default_factory=dict)
    _counts: dict[float, int] = field(default_factory=dict)
    _sum: float = 0.0
    _count: int = 0
    _lock: threading.Lock = field(default_factory=threading.Lock)

    def __post_init__(self):
        # Initialize bucket counts (non-cumulative storage)
        for bucket in self.buckets:
            self._counts[bucket] = 0
        self._counts[float("inf")] = 0

    def observe(self, value: float) -> None:
        """Record an observation.

        Stores non-cumulative counts per bucket. The cumulative values
        are computed at export time in to_prometheus().
        """
        with self._lock:
            self._sum += value
            self._count += 1
            # Find the first bucket that value fits in
            placed = False
            for bucket in self.buckets:
                if value <= bucket:
                    self._counts[bucket] += 1
                    placed = True
                    break
            # If value doesn't fit in any bucket, count in +Inf only
            if not placed:
                self._counts[float("inf")] += 1

    def to_prometheus(self) -> str:
        """Format as Prometheus text with cumulative bucket counts."""
        lines = []
        label_str = ""
        if self.labels:
            pairs = [f'{k}="{v}"' for k, v in self.labels.items()]
            label_str = ",".join(pairs) + ","

        with self._lock:
            # Compute cumulative counts from non-cumulative storage
            cumulative = 0
            for bucket in self.buckets:
                cumulative += self._counts.get(bucket, 0)
                lines.append(f'{self.name}_bucket{{{label_str}le="{bucket}"}} {cumulative}')
            # +Inf bucket includes all observations
            lines.append(f'{self.name}_bucket{{{label_str}le="+Inf"}} {self._count}')
            lines.append(f"{self.name}_sum {self._sum}")
            lines.append(f"{self.name}_count {self._count}")

        return "\n".join(lines)


@dataclass
class Summary:
    """
    Summary with sliding window for percentile calculation.

    Approximates percentiles using a fixed-size window.
    """

    name: str
    help: str
    max_age_seconds: float = 60.0
    window_size: int = 1000
    labels: dict[str, str] = field(default_factory=dict)
    _observations: deque = field(default_factory=lambda: deque(maxlen=1000))
    _lock: threading.Lock = field(default_factory=threading.Lock)

    def observe(self, value: float) -> None:
        """Record an observation."""
        with self._lock:
            self._observations.append((time.time(), value))
            # Prune old observations
            cutoff = time.time() - self.max_age_seconds
            while self._observations and self._observations[0][0] < cutoff:
                self._observations.popleft()

    def get_percentile(self, percentile: float) -> Optional[float]:
        """Get approximate percentile value."""
        with self._lock:
            if not self._observations:
                return None
            values = sorted([v for _, v in self._observations])
            idx = int(len(values) * percentile / 100)
            return values[min(idx, len(values) - 1)]

    def to_prometheus(self) -> str:
        """Format as Prometheus text."""
        lines = []
        label_str = ""
        if self.labels:
            pairs = [f'{k}="{v}"' for k, v in self.labels.items()]
            label_str = ",".join(pairs) + ","

        with self._lock:
            if not self._observations:
                return ""

            values = [v for _, v in self._observations]
            sorted_values = sorted(values)
            count = len(values)

            for quantile in [0.5, 0.9, 0.95, 0.99]:
                idx = int(count * quantile)
                value = sorted_values[min(idx, count - 1)]
                lines.append(f'{self.name}{{{label_str}quantile="{quantile}"}} {value}')
            lines.append(f"{self.name}_sum {sum(values)}")
            lines.append(f"{self.name}_count {count}")

        return "\n".join(lines)


# =============================================================================
# Metrics Registry
# =============================================================================


class MetricsRegistry:
    """
    Central registry for all metrics.

    Thread-safe singleton pattern.
    """

    _instance: Optional["MetricsRegistry"] = None
    _lock = threading.Lock()

    def __new__(cls) -> "MetricsRegistry":
        with cls._lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self):
        if self._initialized:
            return

        self._initialized = True
        self._metrics: dict[str, Any] = {}
        self._start_time = time.time()

        # Initialize standard metrics
        self._init_standard_metrics()

    def _init_standard_metrics(self) -> None:
        """Initialize standard detector metrics."""
        # Frame processing
        self.frames_processed_total = self.counter(
            "detector_frames_processed_total",
            "Total number of frames processed",
        )
        self.frames_dropped_total = self.counter(
            "detector_frames_dropped_total",
            "Total number of frames dropped",
        )
        self.frame_processing_seconds = self.histogram(
            "detector_frame_processing_seconds",
            "Frame processing duration in seconds",
            buckets=(0.01, 0.025, 0.05, 0.075, 0.1, 0.15, 0.2, 0.3, 0.5, 1.0),
        )

        # Inference
        self.inference_total = self.counter(
            "detector_inference_total",
            "Total number of inference runs",
        )
        self.inference_seconds = self.histogram(
            "detector_inference_seconds",
            "Inference duration in seconds",
            buckets=(0.005, 0.01, 0.025, 0.05, 0.1, 0.2, 0.5, 1.0),
        )
        self.detections_total = self.counter(
            "detector_detections_total",
            "Total number of detections",
        )
        self.drone_detections_total = self.counter(
            "detector_drone_detections_total",
            "Total number of drone detections",
        )

        # Tracking
        self.tracks_created_total = self.counter(
            "detector_tracks_created_total",
            "Total number of tracks created",
        )
        self.tracks_lost_total = self.counter(
            "detector_tracks_lost_total",
            "Total number of tracks lost",
        )
        self.active_tracks = self.gauge(
            "detector_active_tracks",
            "Current number of active tracks",
        )

        # Alerts
        self.alerts_sent_total = self.counter(
            "detector_alerts_sent_total",
            "Total number of alerts sent successfully",
        )
        self.alerts_failed_total = self.counter(
            "detector_alerts_failed_total",
            "Total number of failed alert attempts",
        )
        self.alerts_queued = self.gauge(
            "detector_alerts_queued",
            "Current number of alerts in retry queue",
        )

        # Targeting
        self.target_locks_total = self.counter(
            "detector_target_locks_total",
            "Total number of target locks acquired",
        )
        self.engagements_total = self.counter(
            "detector_engagements_total",
            "Total number of engagement attempts",
        )
        self.target_state = self.gauge(
            "detector_target_state",
            "Current targeting state (0=searching, 1=tracking, 2=locked)",
        )

        # System
        self.fps_current = self.gauge(
            "detector_fps_current",
            "Current frames per second",
        )
        self.cpu_temperature = self.gauge(
            "detector_cpu_temperature_celsius",
            "CPU temperature in Celsius",
        )
        self.memory_used_bytes = self.gauge(
            "detector_memory_used_bytes",
            "Memory used by detector process",
        )
        self.uptime_seconds = self.gauge(
            "detector_uptime_seconds",
            "Detector uptime in seconds",
        )

    def counter(self, name: str, help: str, labels: Optional[dict] = None) -> Counter:
        """Create or get a counter."""
        if name in self._metrics:
            return self._metrics[name]
        counter = Counter(name=name, help=help, labels=labels or {})
        self._metrics[name] = counter
        return counter

    def gauge(self, name: str, help: str, labels: Optional[dict] = None) -> Gauge:
        """Create or get a gauge."""
        if name in self._metrics:
            return self._metrics[name]
        gauge = Gauge(name=name, help=help, labels=labels or {})
        self._metrics[name] = gauge
        return gauge

    def histogram(
        self,
        name: str,
        help: str,
        buckets: Optional[tuple] = None,
        labels: Optional[dict] = None,
    ) -> Histogram:
        """Create or get a histogram."""
        if name in self._metrics:
            return self._metrics[name]
        histogram = Histogram(
            name=name,
            help=help,
            buckets=buckets or DEFAULT_HISTOGRAM_BUCKETS,
            labels=labels or {},
        )
        self._metrics[name] = histogram
        return histogram

    def summary(
        self,
        name: str,
        help: str,
        max_age_seconds: float = 60.0,
        labels: Optional[dict] = None,
    ) -> Summary:
        """Create or get a summary."""
        if name in self._metrics:
            return self._metrics[name]
        summary = Summary(
            name=name,
            help=help,
            max_age_seconds=max_age_seconds,
            labels=labels or {},
        )
        self._metrics[name] = summary
        return summary

    def update_uptime(self) -> None:
        """Update uptime gauge."""
        self.uptime_seconds.set(time.time() - self._start_time)

    def update_system_metrics(self) -> None:
        """Update system metrics (CPU temp, memory)."""
        try:
            # CPU temperature (Raspberry Pi)
            try:
                with open("/sys/class/thermal/thermal_zone0/temp") as f:
                    temp_millicelsius = int(f.read().strip())
                    self.cpu_temperature.set(temp_millicelsius / 1000.0)
            except (FileNotFoundError, ValueError):
                pass

            # Memory usage
            try:
                import resource

                usage = resource.getrusage(resource.RUSAGE_SELF)
                # maxrss is in KB on Linux
                self.memory_used_bytes.set(usage.ru_maxrss * 1024)
            except Exception:
                pass

        except Exception as e:
            logger.debug(f"Failed to update system metrics: {e}")

    def to_prometheus(self) -> str:
        """Export all metrics in Prometheus text format."""
        self.update_uptime()
        self.update_system_metrics()

        lines = []
        for name, metric in self._metrics.items():
            if hasattr(metric, "help"):
                lines.append(f"# HELP {name} {metric.help}")
            if isinstance(metric, Counter):
                lines.append("# TYPE " + name + " counter")
            elif isinstance(metric, Gauge):
                lines.append("# TYPE " + name + " gauge")
            elif isinstance(metric, Histogram):
                lines.append("# TYPE " + name + " histogram")
            elif isinstance(metric, Summary):
                lines.append("# TYPE " + name + " summary")

            lines.append(metric.to_prometheus())

        return "\n".join(lines) + "\n"

    def get_all_values(self) -> dict[str, Any]:
        """Get all metric values as a dictionary."""
        result = {}
        for name, metric in self._metrics.items():
            if hasattr(metric, "get"):
                result[name] = metric.get()
            elif hasattr(metric, "_count"):
                result[name] = metric._count
        return result


# =============================================================================
# HTTP Server
# =============================================================================


class MetricsHandler(BaseHTTPRequestHandler):
    """HTTP handler for /metrics endpoint."""

    def log_message(self, format, *args):
        """Suppress default logging."""
        pass

    def do_GET(self):
        """Handle GET requests."""
        if self.path == "/metrics":
            registry = MetricsRegistry()
            content = registry.to_prometheus()

            self.send_response(200)
            self.send_header("Content-Type", "text/plain; version=0.0.4; charset=utf-8")
            self.send_header("Content-Length", len(content))
            self.end_headers()
            self.wfile.write(content.encode("utf-8"))

        elif self.path == "/health":
            content = '{"status": "ok"}'
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(content.encode("utf-8"))

        else:
            self.send_response(404)
            self.end_headers()


class MetricsServer:
    """
    HTTP server for metrics endpoint.

    Runs in a background thread.
    """

    def __init__(self, host: str = "0.0.0.0", port: int = 9090):  # nosec B104
        """
        Initialize metrics server.

        Args:
            host: Bind address
            port: Port number
        """
        self._host = host
        self._port = port
        self._server: Optional[HTTPServer] = None
        self._thread: Optional[threading.Thread] = None

    def start(self) -> None:
        """Start the metrics server."""
        self._server = HTTPServer((self._host, self._port), MetricsHandler)
        self._thread = threading.Thread(
            target=self._server.serve_forever,
            name="MetricsServer",
            daemon=True,
        )
        self._thread.start()
        logger.info(f"Metrics server started at http://{self._host}:{self._port}/metrics")

    def stop(self) -> None:
        """Stop the metrics server."""
        if self._server:
            self._server.shutdown()
            self._server = None
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=5.0)
        logger.info("Metrics server stopped")


# =============================================================================
# Convenience Functions
# =============================================================================


def get_metrics() -> MetricsRegistry:
    """Get the global metrics registry."""
    return MetricsRegistry()


def start_metrics_server(host: str = "0.0.0.0", port: int = 9090) -> MetricsServer:  # nosec B104
    """Start the metrics HTTP server."""
    server = MetricsServer(host=host, port=port)
    server.start()
    return server


# =============================================================================
# Context Managers for Timing
# =============================================================================


class Timer:
    """Context manager for timing operations."""

    def __init__(self, histogram: Histogram):
        self._histogram = histogram
        self._start: Optional[float] = None

    def __enter__(self) -> "Timer":
        self._start = time.perf_counter()
        return self

    def __exit__(self, *args) -> None:
        if self._start is not None:
            duration = time.perf_counter() - self._start
            self._histogram.observe(duration)


def time_histogram(histogram: Histogram) -> Timer:
    """Create a timer context manager for a histogram."""
    return Timer(histogram)
