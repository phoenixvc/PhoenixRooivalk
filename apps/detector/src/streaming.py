#!/usr/bin/env python3
"""
Web streaming module for Pi Drone Detector.

Provides MJPEG streaming server and StreamingRenderer wrapper.

Endpoints:
    - GET /stream     - MJPEG video stream
    - GET /snapshot   - Single JPEG frame
    - GET /status     - JSON system status
    - GET /health     - Health check
"""

import asyncio
import logging
import threading
import time
from dataclasses import dataclass
from typing import Any, Optional

import numpy as np

# Import cv2 at module level for patchability in tests
try:
    import cv2
except ImportError:
    cv2 = None  # type: ignore[assignment]

from interfaces import Detection, FrameData, FrameRenderer, TrackedObject

logger = logging.getLogger(__name__)


# =============================================================================
# Frame Buffer
# =============================================================================


@dataclass
class StreamFrame:
    """Frame ready for streaming."""

    jpeg_data: bytes
    timestamp: float
    frame_number: int
    detection_count: int
    inference_time_ms: float


class FrameBuffer:
    """Thread-safe buffer for streaming frames."""

    def __init__(self, max_size: int = 2):
        self._buffer: Optional[StreamFrame] = None
        self._lock = threading.Lock()
        self._new_frame = threading.Event()
        self._subscribers: list[asyncio.Queue] = []
        self._subscribers_lock = threading.Lock()

    def put(self, frame: StreamFrame) -> None:
        """Put a new frame in the buffer."""
        with self._lock:
            self._buffer = frame
            self._new_frame.set()

        # Notify async subscribers
        with self._subscribers_lock:
            for queue in self._subscribers:
                try:
                    # Non-blocking put, drop old frames
                    if queue.full():
                        try:
                            queue.get_nowait()
                        except asyncio.QueueEmpty:
                            pass
                    queue.put_nowait(frame)
                except Exception:
                    pass

    def get(self, timeout: float = 1.0) -> Optional[StreamFrame]:
        """Get the latest frame."""
        if self._new_frame.wait(timeout):
            with self._lock:
                self._new_frame.clear()
                return self._buffer
        return None

    def get_latest(self) -> Optional[StreamFrame]:
        """Get the latest frame without waiting."""
        with self._lock:
            return self._buffer

    def subscribe(self) -> asyncio.Queue:
        """Subscribe to frame updates (async)."""
        queue: asyncio.Queue = asyncio.Queue(maxsize=2)
        with self._subscribers_lock:
            self._subscribers.append(queue)
        return queue

    def unsubscribe(self, queue: asyncio.Queue) -> None:
        """Unsubscribe from frame updates."""
        with self._subscribers_lock:
            if queue in self._subscribers:
                self._subscribers.remove(queue)


# =============================================================================
# Streaming Renderer
# =============================================================================


class StreamingRenderer(FrameRenderer):
    """
    Renderer wrapper that encodes frames for streaming.

    Wraps another renderer (e.g., OpenCVRenderer) and pushes
    encoded frames to a FrameBuffer for the streaming server.
    """

    def __init__(
        self,
        base_renderer: Optional[FrameRenderer] = None,
        quality: int = 80,
        max_fps: int = 15,
    ):
        self._base_renderer = base_renderer
        self._quality = quality
        self._max_fps = max_fps
        self._min_frame_interval = 1.0 / max_fps
        self._last_encode_time = 0.0
        self._frame_buffer = FrameBuffer()
        self._encode_count = 0
        self._skip_count = 0

    @property
    def frame_buffer(self) -> FrameBuffer:
        """Get the frame buffer for the streaming server."""
        return self._frame_buffer

    def render(
        self,
        frame_data: FrameData,
        detections: list[Detection],
        tracked_objects: list[TrackedObject],
        inference_time_ms: float,
    ) -> Optional[np.ndarray]:
        # Call base renderer if available
        rendered_frame = None
        if self._base_renderer:
            rendered_frame = self._base_renderer.render(
                frame_data, detections, tracked_objects, inference_time_ms
            )

        # Use rendered frame or original
        frame_to_encode = rendered_frame if rendered_frame is not None else frame_data.frame

        # Rate limit encoding
        current_time = time.time()
        if current_time - self._last_encode_time >= self._min_frame_interval:
            self._encode_frame(
                frame_to_encode,
                frame_data.timestamp,
                frame_data.frame_number,
                len(detections),
                inference_time_ms,
            )
            self._last_encode_time = current_time
            self._encode_count += 1
        else:
            self._skip_count += 1

        return rendered_frame

    def _encode_frame(
        self,
        frame: np.ndarray,
        timestamp: float,
        frame_number: int,
        detection_count: int,
        inference_time_ms: float,
    ) -> None:
        """Encode frame to JPEG and put in buffer."""
        if cv2 is None:
            logger.warning("cv2 not available, cannot encode frame")
            return

        try:
            # Encode to JPEG
            encode_params = [cv2.IMWRITE_JPEG_QUALITY, self._quality]
            success, jpeg_data = cv2.imencode(".jpg", frame, encode_params)

            if success:
                stream_frame = StreamFrame(
                    jpeg_data=jpeg_data.tobytes(),
                    timestamp=timestamp,
                    frame_number=frame_number,
                    detection_count=detection_count,
                    inference_time_ms=inference_time_ms,
                )
                self._frame_buffer.put(stream_frame)

        except Exception as e:
            logger.warning(f"Failed to encode frame: {e}")

    def show(self, rendered_frame: np.ndarray) -> bool:
        """Delegate to base renderer if available."""
        if self._base_renderer and rendered_frame is not None:
            return self._base_renderer.show(rendered_frame)
        return True

    def close(self) -> None:
        """Clean up resources."""
        if self._base_renderer:
            self._base_renderer.close()

    @property
    def renderer_info(self) -> dict[str, Any]:
        base_info = {}
        if self._base_renderer:
            base_info = self._base_renderer.renderer_info

        return {
            "type": "streaming",
            "quality": self._quality,
            "max_fps": self._max_fps,
            "encode_count": self._encode_count,
            "skip_count": self._skip_count,
            "base_renderer": base_info,
        }


# =============================================================================
# MJPEG Streaming Server
# =============================================================================


class MJPEGStreamServer:
    """
    Async MJPEG streaming server using aiohttp.

    Provides endpoints:
        - GET /stream     - MJPEG video stream
        - GET /snapshot   - Single JPEG frame
        - GET /status     - JSON system status
        - GET /health     - Health check
    """

    def __init__(
        self,
        frame_buffer: FrameBuffer,
        host: str = "0.0.0.0",  # nosec B104 - intentional for LAN access
        port: int = 8080,
        auth_enabled: bool = False,
        auth_token: Optional[str] = None,
    ):
        self._frame_buffer = frame_buffer
        self._host = host
        self._port = port
        self._auth_enabled = auth_enabled
        self._auth_token = auth_token

        self._app = None
        self._runner = None
        self._site = None
        self._is_running = False

        # Stats
        self._start_time = 0.0
        self._stream_clients = 0
        self._total_requests = 0

        # System status (updated externally)
        self._system_status: dict[str, Any] = {}

    def set_system_status(self, status: dict[str, Any]) -> None:
        """Update system status for /status endpoint."""
        self._system_status = status

    async def _check_auth(self, request) -> bool:
        """Check authorization if enabled."""
        if not self._auth_enabled:
            return True

        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
            return token == self._auth_token

        # Check query param fallback
        token = request.query.get("token", "")
        return token == self._auth_token

    async def _handle_stream(self, request):
        """Handle MJPEG stream request."""
        from aiohttp import web

        self._total_requests += 1

        if not await self._check_auth(request):
            return web.Response(status=401, text="Unauthorized")

        response = web.StreamResponse(
            status=200,
            headers={
                "Content-Type": "multipart/x-mixed-replace; boundary=frame",
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0",
                "Connection": "close",
            },
        )
        await response.prepare(request)

        self._stream_clients += 1
        queue = self._frame_buffer.subscribe()

        try:
            while True:
                try:
                    frame = await asyncio.wait_for(queue.get(), timeout=5.0)

                    # Write MJPEG frame
                    await response.write(
                        b"--frame\r\n"
                        b"Content-Type: image/jpeg\r\n"
                        b"Content-Length: " + str(len(frame.jpeg_data)).encode() + b"\r\n"
                        b"\r\n" + frame.jpeg_data + b"\r\n"
                    )

                except asyncio.TimeoutError:
                    # Send keepalive
                    continue
                except asyncio.CancelledError:
                    break

        except Exception as e:
            logger.debug(f"Stream client disconnected: {e}")
        finally:
            self._stream_clients -= 1
            self._frame_buffer.unsubscribe(queue)

        return response

    async def _handle_snapshot(self, request):
        """Handle single snapshot request."""
        from aiohttp import web

        self._total_requests += 1

        if not await self._check_auth(request):
            return web.Response(status=401, text="Unauthorized")

        frame = self._frame_buffer.get_latest()
        if frame is None:
            return web.Response(status=503, text="No frame available")

        return web.Response(
            body=frame.jpeg_data,
            content_type="image/jpeg",
            headers={
                "Cache-Control": "no-cache",
                "X-Frame-Number": str(frame.frame_number),
                "X-Detection-Count": str(frame.detection_count),
                "X-Inference-Time-Ms": f"{frame.inference_time_ms:.1f}",
            },
        )

    async def _handle_status(self, request):
        """Handle status request."""
        from aiohttp import web

        self._total_requests += 1

        if not await self._check_auth(request):
            return web.Response(status=401, text="Unauthorized")

        frame = self._frame_buffer.get_latest()

        status = {
            "server": {
                "uptime_seconds": time.time() - self._start_time if self._start_time else 0,
                "stream_clients": self._stream_clients,
                "total_requests": self._total_requests,
            },
            "stream": {
                "available": frame is not None,
                "frame_number": frame.frame_number if frame else 0,
                "detection_count": frame.detection_count if frame else 0,
                "inference_time_ms": frame.inference_time_ms if frame else 0,
            },
            "system": self._system_status,
        }

        return web.json_response(status)

    async def _handle_health(self, request):
        """Handle health check request."""
        from aiohttp import web

        self._total_requests += 1

        frame = self._frame_buffer.get_latest()
        healthy = frame is not None and (time.time() - frame.timestamp) < 10.0

        status = {
            "status": "healthy" if healthy else "unhealthy",
            "timestamp": time.time(),
        }

        return web.json_response(status, status=200 if healthy else 503)

    async def start(self) -> None:
        """Start the streaming server."""
        from aiohttp import web

        self._app = web.Application()
        self._app.router.add_get("/stream", self._handle_stream)
        self._app.router.add_get("/snapshot", self._handle_snapshot)
        self._app.router.add_get("/status", self._handle_status)
        self._app.router.add_get("/health", self._handle_health)

        # Add index page
        self._app.router.add_get("/", self._handle_index)

        self._runner = web.AppRunner(self._app)
        await self._runner.setup()

        self._site = web.TCPSite(self._runner, self._host, self._port)
        await self._site.start()

        self._start_time = time.time()
        self._is_running = True

        logger.info(f"Streaming server started at http://{self._host}:{self._port}")

    async def _handle_index(self, request):
        """Serve simple HTML page with stream viewer."""
        from aiohttp import web

        html = """
<!DOCTYPE html>
<html>
<head>
    <title>Pi Drone Detector Stream</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: #1a1a1a;
            color: #fff;
            margin: 0;
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        h1 { color: #4CAF50; }
        .stream-container {
            border: 2px solid #4CAF50;
            border-radius: 8px;
            overflow: hidden;
            margin: 20px 0;
        }
        #stream { max-width: 100%; height: auto; }
        .status {
            background: #2a2a2a;
            padding: 10px 20px;
            border-radius: 4px;
            font-family: monospace;
        }
        .links { margin-top: 20px; }
        .links a {
            color: #4CAF50;
            margin: 0 10px;
        }
    </style>
</head>
<body>
    <h1>Pi Drone Detector</h1>
    <div class="stream-container">
        <img id="stream" src="/stream" alt="Live Stream">
    </div>
    <div class="status" id="status">Loading status...</div>
    <div class="links">
        <a href="/snapshot">Snapshot</a>
        <a href="/status">Status API</a>
        <a href="/health">Health Check</a>
    </div>
    <script>
        async function updateStatus() {
            try {
                const resp = await fetch('/status');
                const data = await resp.json();
                document.getElementById('status').innerHTML =
                    `Frame: ${data.stream.frame_number} | ` +
                    `Detections: ${data.stream.detection_count} | ` +
                    `Inference: ${data.stream.inference_time_ms.toFixed(1)}ms | ` +
                    `Clients: ${data.server.stream_clients}`;
            } catch (e) {
                document.getElementById('status').innerHTML = 'Status unavailable';
            }
        }
        setInterval(updateStatus, 1000);
        updateStatus();
    </script>
</body>
</html>
"""
        return web.Response(text=html, content_type="text/html")

    async def stop(self) -> None:
        """Stop the streaming server."""
        self._is_running = False

        if self._site:
            await self._site.stop()

        if self._runner:
            await self._runner.cleanup()

        logger.info("Streaming server stopped")

    @property
    def is_running(self) -> bool:
        return self._is_running

    @property
    def url(self) -> str:
        return f"http://{self._host}:{self._port}"


# =============================================================================
# Streaming Manager
# =============================================================================


class StreamingManager:
    """
    Manages the streaming server lifecycle.

    Runs the async server in a background thread.
    """

    def __init__(
        self,
        frame_buffer: FrameBuffer,
        host: str = "0.0.0.0",  # nosec B104 - intentional for LAN access
        port: int = 8080,
        auth_enabled: bool = False,
        auth_token: Optional[str] = None,
    ):
        self._frame_buffer = frame_buffer
        self._host = host
        self._port = port
        self._auth_enabled = auth_enabled
        self._auth_token = auth_token

        self._server: Optional[MJPEGStreamServer] = None
        self._thread: Optional[threading.Thread] = None
        self._loop: Optional[asyncio.AbstractEventLoop] = None
        self._stop_event = threading.Event()

    def _run_server(self) -> None:
        """Run server in background thread."""
        self._loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self._loop)

        self._server = MJPEGStreamServer(
            frame_buffer=self._frame_buffer,
            host=self._host,
            port=self._port,
            auth_enabled=self._auth_enabled,
            auth_token=self._auth_token,
        )

        async def run():
            await self._server.start()
            while not self._stop_event.is_set():
                await asyncio.sleep(0.1)
            await self._server.stop()

        try:
            self._loop.run_until_complete(run())
        except Exception as e:
            logger.error(f"Streaming server error: {e}")
        finally:
            self._loop.close()

    def start(self) -> None:
        """Start the streaming manager."""
        if self._thread is not None and self._thread.is_alive():
            logger.warning("Streaming manager already running")
            return

        self._stop_event.clear()
        self._thread = threading.Thread(target=self._run_server, daemon=True)
        self._thread.start()

        # Wait for server to start
        time.sleep(0.5)
        logger.info(f"Streaming available at http://{self._host}:{self._port}")

    def stop(self) -> None:
        """Stop the streaming manager."""
        self._stop_event.set()

        if self._thread is not None:
            self._thread.join(timeout=5.0)
            self._thread = None

    def set_system_status(self, status: dict[str, Any]) -> None:
        """Update system status for /status endpoint."""
        if self._server:
            self._server.set_system_status(status)

    @property
    def is_running(self) -> bool:
        return self._thread is not None and self._thread.is_alive()

    @property
    def url(self) -> str:
        return f"http://{self._host}:{self._port}"


# =============================================================================
# Factory Functions
# =============================================================================


def create_streaming_renderer(
    base_renderer: Optional[FrameRenderer] = None,
    streaming_settings: Optional[Any] = None,
) -> StreamingRenderer:
    """
    Create a StreamingRenderer with optional base renderer.

    Args:
        base_renderer: Renderer to wrap (e.g., OpenCVRenderer)
        streaming_settings: StreamingSettings from config

    Returns:
        Configured StreamingRenderer
    """
    quality = 80
    max_fps = 15

    if streaming_settings:
        quality = getattr(streaming_settings, "quality", 80)
        max_fps = getattr(streaming_settings, "max_fps", 15)

    return StreamingRenderer(
        base_renderer=base_renderer,
        quality=quality,
        max_fps=max_fps,
    )


def create_streaming_manager(
    streaming_renderer: StreamingRenderer,
    streaming_settings: Optional[Any] = None,
) -> StreamingManager:
    """
    Create a StreamingManager for the given renderer.

    Args:
        streaming_renderer: StreamingRenderer with frame buffer
        streaming_settings: StreamingSettings from config

    Returns:
        Configured StreamingManager
    """
    host = "0.0.0.0"  # nosec B104 - intentional for LAN access
    port = 8080
    auth_enabled = False
    auth_token = None

    if streaming_settings:
        host = getattr(streaming_settings, "host", "0.0.0.0")  # nosec B104
        port = getattr(streaming_settings, "port", 8080)
        auth_enabled = getattr(streaming_settings, "auth_enabled", False)
        auth_token = getattr(streaming_settings, "auth_token", None)

    return StreamingManager(
        frame_buffer=streaming_renderer.frame_buffer,
        host=host,
        port=port,
        auth_enabled=auth_enabled,
        auth_token=auth_token,
    )
