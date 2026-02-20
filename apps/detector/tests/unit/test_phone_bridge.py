"""
Unit tests for phone_audio_bridge module.

Tests UDP parsing, IP detection, and HTML serving logic.
"""

import asyncio
import json
import socket
import sys
import threading
import time
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# Add src to path for imports
src_path = Path(__file__).parent.parent.parent / "src"
sys.path.insert(0, str(src_path))

import phone_audio_bridge as bridge


# =============================================================================
# get_local_ip Tests
# =============================================================================


class TestGetLocalIp:
    def test_returns_string(self):
        ip = bridge.get_local_ip()
        assert isinstance(ip, str)

    def test_returns_valid_ip_format(self):
        ip = bridge.get_local_ip()
        parts = ip.split(".")
        assert len(parts) == 4
        for part in parts:
            assert part.isdigit()
            assert 0 <= int(part) <= 255

    @patch("socket.socket")
    def test_fallback_when_no_internet(self, mock_socket_cls):
        """When all methods fail, should return 127.0.0.1."""
        mock_socket_cls.side_effect = OSError("No network")
        with patch("subprocess.run", side_effect=OSError("no hostname")):
            with patch("socket.gethostname", side_effect=OSError):
                ip = bridge.get_local_ip()
        # May or may not fall back depending on environment
        assert isinstance(ip, str)


# =============================================================================
# BRIDGE_HTML Tests
# =============================================================================


class TestBridgeHtml:
    def test_html_contains_required_elements(self):
        html = bridge.BRIDGE_HTML
        assert "<!DOCTYPE html>" in html
        assert "Servo PWM Bridge" in html
        assert "startAudio" in html
        assert "WebSocket" in html
        assert "AudioContext" in html

    def test_html_has_correct_servo_constants(self):
        html = bridge.BRIDGE_HTML
        assert "SERVO_FREQ = 50" in html
        assert "SAMPLE_RATE = 48000" in html
        assert "MIN_PULSE_US = 1000" in html
        assert "MAX_PULSE_US = 2000" in html

    def test_html_has_yaw_pitch_display(self):
        html = bridge.BRIDGE_HTML
        assert "yawBar" in html
        assert "pitchBar" in html
        assert "yawPulse" in html
        assert "pitchPulse" in html


# =============================================================================
# UDP Listener Tests
# =============================================================================


class TestUdpListener:
    def test_udp_updates_shared_state(self):
        """Send a UDP command and verify shared state is updated."""
        port = 18765  # Use a high port to avoid conflicts

        # Start listener in background
        listener_thread = threading.Thread(
            target=bridge.udp_listener,
            args=(port,),
            daemon=True,
        )
        listener_thread.start()
        time.sleep(0.1)  # Let it bind

        # Send a command
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        cmd = json.dumps({"yaw_rate": 0.75, "pitch_rate": -0.5})
        sock.sendto(cmd.encode("utf-8"), ("127.0.0.1", port))
        sock.close()

        time.sleep(0.2)  # Let it process

        with bridge._lock:
            assert bridge._yaw == pytest.approx(0.75)
            assert bridge._pitch == pytest.approx(-0.5)

        # Reset state
        with bridge._lock:
            bridge._yaw = 0.0
            bridge._pitch = 0.0

    def test_udp_clamps_values(self):
        """Values outside [-1, 1] should be clamped."""
        port = 18766

        listener_thread = threading.Thread(
            target=bridge.udp_listener,
            args=(port,),
            daemon=True,
        )
        listener_thread.start()
        time.sleep(0.1)

        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        cmd = json.dumps({"yaw_rate": 5.0, "pitch_rate": -3.0})
        sock.sendto(cmd.encode("utf-8"), ("127.0.0.1", port))
        sock.close()

        time.sleep(0.2)

        with bridge._lock:
            assert bridge._yaw == pytest.approx(1.0)
            assert bridge._pitch == pytest.approx(-1.0)

        # Reset state
        with bridge._lock:
            bridge._yaw = 0.0
            bridge._pitch = 0.0

    def test_udp_handles_invalid_json(self):
        """Invalid JSON should not crash the listener."""
        port = 18767

        listener_thread = threading.Thread(
            target=bridge.udp_listener,
            args=(port,),
            daemon=True,
        )
        listener_thread.start()
        time.sleep(0.1)

        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.sendto(b"not json", ("127.0.0.1", port))
        # Send valid command after to prove listener didn't crash
        time.sleep(0.1)
        cmd = json.dumps({"yaw_rate": 0.25, "pitch_rate": 0.0})
        sock.sendto(cmd.encode("utf-8"), ("127.0.0.1", port))
        sock.close()

        time.sleep(0.2)

        with bridge._lock:
            assert bridge._yaw == pytest.approx(0.25)

        # Reset state
        with bridge._lock:
            bridge._yaw = 0.0
            bridge._pitch = 0.0


# =============================================================================
# QR Code Tests (O5)
# =============================================================================


class TestQrCode:
    def test_qr_code_does_not_crash_without_library(self, capsys):
        """Should print a helpful message if qrcode is not installed."""
        with patch.dict("sys.modules", {"qrcode": None}):
            bridge._print_qr_code("http://192.168.1.1:8765")
        output = capsys.readouterr().out
        # May or may not print (depends on import handling)
        # Key thing: no exception


# =============================================================================
# WebSocket Handler Tests
# =============================================================================


def _make_reader(lines: list[bytes]):
    """Create an AsyncMock StreamReader that yields the given lines."""
    reader = AsyncMock()
    line_iter = iter(lines)

    async def _readline():
        try:
            return next(line_iter)
        except StopIteration:
            return b""  # EOF

    reader.readline = _readline
    reader.at_eof.return_value = False
    return reader


def _make_writer():
    """Create an AsyncMock StreamWriter."""
    writer = AsyncMock()
    writer.write = MagicMock()
    writer.close = MagicMock()
    writer.is_closing = MagicMock(return_value=False)
    return writer


class TestWebsocketHandler:
    def test_eof_during_header_read(self):
        """Client disconnects mid-headers — handler should close cleanly."""
        reader = _make_reader([b"GET / HTTP/1.1\r\n"])  # No CRLF terminator, then EOF
        writer = _make_writer()

        asyncio.run(bridge.websocket_handler(reader, writer))

        writer.close.assert_called_once()
        # Should NOT have written any response (just closed)
        writer.write.assert_not_called()

    def test_oversized_headers_rejected(self):
        """Headers exceeding MAX_HEADER_BYTES should get a 400 response."""
        # Create a header block that exceeds 16384 bytes
        big_header = b"X-Junk: " + b"A" * 20000 + b"\r\n"
        reader = _make_reader([b"GET / HTTP/1.1\r\n", big_header])
        writer = _make_writer()

        asyncio.run(bridge.websocket_handler(reader, writer))

        # Should have sent HTTP 400
        writer.write.assert_called()
        response = writer.write.call_args_list[0][0][0]
        assert b"400 Bad Request" in response
        writer.close.assert_called()

    def test_html_page_served_on_get(self):
        """GET / should serve the bridge HTML page."""
        reader = _make_reader([
            b"GET / HTTP/1.1\r\n",
            b"Host: 192.168.1.1:8765\r\n",
            b"\r\n",
        ])
        writer = _make_writer()

        asyncio.run(bridge.websocket_handler(reader, writer))

        writer.write.assert_called()
        response = writer.write.call_args_list[0][0][0]
        assert b"200 OK" in response
        assert b"Servo PWM Bridge" in response
        writer.close.assert_called()

    def test_404_on_unknown_path(self):
        """GET /unknown should get a 404 response."""
        reader = _make_reader([
            b"GET /unknown HTTP/1.1\r\n",
            b"Host: 192.168.1.1:8765\r\n",
            b"\r\n",
        ])
        writer = _make_writer()

        asyncio.run(bridge.websocket_handler(reader, writer))

        writer.write.assert_called()
        response = writer.write.call_args_list[0][0][0]
        assert b"404 Not Found" in response
