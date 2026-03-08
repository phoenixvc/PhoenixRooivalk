"""
Unit tests for turret transport module.

Tests transport data contracts, simulated transport, and factory.
"""

import json
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

# Add src to path for imports
src_path = Path(__file__).parent.parent.parent / "src"
sys.path.insert(0, str(src_path))

from turret_transport import (
    ActuatorTransport,
    AudioPwmTransport,
    ControlOutput,
    SerialTransport,
    SimulatedTransport,
    TransportHealth,
    TransportStatus,
    TransportType,
    WifiUdpTransport,
    create_transport,
)


# =============================================================================
# ControlOutput Tests
# =============================================================================


class TestControlOutput:
    def test_default_is_neutral(self):
        output = ControlOutput()
        assert output.yaw_rate == 0.0
        assert output.pitch_rate == 0.0
        assert output.is_neutral() is True

    def test_non_neutral(self):
        output = ControlOutput(yaw_rate=0.5, pitch_rate=-0.3)
        assert output.is_neutral() is False

    def test_near_zero_is_neutral(self):
        output = ControlOutput(yaw_rate=0.0005, pitch_rate=-0.0005)
        assert output.is_neutral() is True

    def test_to_dict(self):
        output = ControlOutput(yaw_rate=0.5, pitch_rate=-0.3, ttl_ms=100)
        d = output.to_dict()
        assert d["yaw_rate"] == 0.5
        assert d["pitch_rate"] == -0.3
        assert d["ttl_ms"] == 100
        assert "timestamp" in d


# =============================================================================
# TransportStatus Tests
# =============================================================================


class TestTransportStatus:
    def test_default_is_disconnected(self):
        status = TransportStatus()
        assert status.health == TransportHealth.DISCONNECTED

    def test_to_dict(self):
        status = TransportStatus()
        d = status.to_dict()
        assert d["health"] == "disconnected"
        assert "last_send_time" in d
        assert "last_ack_time" in d
        assert "commands_sent" in d
        assert "errors" in d
        assert "latency_ms" in d


# =============================================================================
# TransportType Enum Tests
# =============================================================================


class TestTransportType:
    def test_all_types(self):
        assert TransportType.SIMULATED.value == "simulated"
        assert TransportType.SERIAL.value == "serial"
        assert TransportType.WIFI_UDP.value == "wifi_udp"
        assert TransportType.AUDIO_PWM.value == "audio_pwm"

    def test_invalid_type_raises(self):
        with pytest.raises(ValueError):
            TransportType("nonexistent")


# =============================================================================
# SimulatedTransport Tests
# =============================================================================


class TestSimulatedTransport:
    @pytest.fixture
    def transport(self):
        return SimulatedTransport(log_commands=False)

    def test_connect_disconnect(self, transport):
        assert transport.connect() is True
        assert transport.status.health == TransportHealth.OK
        transport.disconnect()
        assert transport.status.health == TransportHealth.DISCONNECTED

    def test_send_fails_when_disconnected(self, transport):
        output = ControlOutput(yaw_rate=0.5)
        assert transport.send(output) is False

    def test_send_succeeds_when_connected(self, transport):
        transport.connect()
        output = ControlOutput(yaw_rate=0.5)
        assert transport.send(output) is True
        assert transport.status.commands_sent == 1
        transport.disconnect()

    def test_virtual_position_updates(self, transport):
        transport.connect()
        # Send positive yaw rate
        transport.send(ControlOutput(yaw_rate=1.0))
        import time
        time.sleep(0.05)
        transport.send(ControlOutput(yaw_rate=1.0))

        assert transport.virtual_yaw > 0.0
        transport.disconnect()

    def test_send_neutral(self, transport):
        transport.connect()
        assert transport.send_neutral() is True
        transport.disconnect()

    def test_transport_info(self, transport):
        info = transport.transport_info
        assert info["type"] == "simulated"
        assert info["connected"] is False

    def test_virtual_position_clamped(self, transport):
        transport.connect()
        # Send extreme yaw to hit the clamp
        for _ in range(1000):
            transport.send(ControlOutput(yaw_rate=1.0))
        assert transport.virtual_yaw <= 180.0
        transport.disconnect()


# =============================================================================
# Factory Tests
# =============================================================================


class TestCreateTransport:
    def test_create_simulated(self):
        t = create_transport("simulated")
        assert isinstance(t, SimulatedTransport)

    def test_create_serial(self):
        t = create_transport("serial", port="/dev/ttyUSB0")
        assert isinstance(t, SerialTransport)

    def test_create_wifi_udp(self):
        t = create_transport("wifi_udp", host="192.168.1.1", port=5000)
        assert isinstance(t, WifiUdpTransport)

    def test_create_audio_pwm(self):
        t = create_transport("audio_pwm", device=None, buffer_size=512)
        assert isinstance(t, AudioPwmTransport)

    def test_invalid_type_raises(self):
        with pytest.raises(ValueError, match="Unknown transport type"):
            create_transport("nonexistent")

    def test_typo_gives_helpful_error(self):
        with pytest.raises(ValueError, match="Valid types"):
            create_transport("seria")  # Typo


# =============================================================================
# Context Manager Tests (O1)
# =============================================================================


class TestContextManager:
    def test_simulated_context_manager(self):
        with SimulatedTransport() as t:
            t.connect()
            assert t.status.health == TransportHealth.OK
        assert t.status.health == TransportHealth.DISCONNECTED

    def test_factory_context_manager(self):
        with create_transport("simulated") as t:
            t.connect()
            assert t.send(ControlOutput(yaw_rate=0.5)) is True
        assert t.status.health == TransportHealth.DISCONNECTED


# =============================================================================
# Reconnect Tests (O7)
# =============================================================================


class TestReconnect:
    def test_reconnect_simulated(self):
        t = SimulatedTransport()
        t.connect()
        assert t.status.health == TransportHealth.OK

        result = t.reconnect()
        assert result is True
        assert t.status.health == TransportHealth.OK
        t.disconnect()

    def test_reconnect_sends_neutral_then_reconnects(self):
        t = SimulatedTransport(log_commands=False)
        t.connect()
        t.send(ControlOutput(yaw_rate=1.0))
        import time
        time.sleep(0.05)
        t.send(ControlOutput(yaw_rate=1.0))

        assert t.virtual_yaw > 0.0

        # Reconnect resets connection (disconnect sends neutral)
        t.reconnect()
        assert t.status.health == TransportHealth.OK
        t.disconnect()


# =============================================================================
# SerialTransport Tests (with mock serial)
# =============================================================================


class TestSerialTransport:
    def test_connect_with_mock_serial(self):
        """SerialTransport.connect() should open a serial port."""
        mock_serial_cls = MagicMock()
        mock_serial_inst = MagicMock()
        mock_serial_cls.return_value = mock_serial_inst

        with patch.dict("sys.modules", {"serial": MagicMock(Serial=mock_serial_cls)}):
            t = SerialTransport(port="/dev/ttyTest", baudrate=9600)
            assert t.connect() is True
            assert t.status.health == TransportHealth.OK

    def test_connect_fails_without_pyserial(self):
        """Should fail gracefully when pyserial is not installed."""
        t = SerialTransport()
        with patch.dict("sys.modules", {"serial": None}):
            # Force reimport failure
            import importlib
            with patch("builtins.__import__", side_effect=ImportError("no serial")):
                result = t.connect()
        assert result is False
        assert t.status.health == TransportHealth.ERROR

    def test_send_format(self):
        """Verify the serial protocol format: Y:<yaw> P:<pitch> T:<ttl>"""
        mock_serial = MagicMock()
        mock_serial.is_open = True
        mock_serial.in_waiting = 0

        t = SerialTransport()
        t._serial = mock_serial
        t._connected = True
        t._status.health = TransportHealth.OK

        t.send(ControlOutput(yaw_rate=0.5, pitch_rate=-0.3, ttl_ms=150))

        mock_serial.write.assert_called_once()
        written = mock_serial.write.call_args[0][0].decode("ascii")
        assert written.startswith("Y:+0.5000")
        assert "P:-0.3000" in written
        assert "T:150" in written
        assert written.endswith("\n")

    def test_send_fails_when_disconnected(self):
        t = SerialTransport()
        assert t.send(ControlOutput(yaw_rate=0.5)) is False

    def test_transport_info(self):
        t = SerialTransport(port="/dev/ttyACM0", baudrate=57600)
        info = t.transport_info
        assert info["type"] == "serial"
        assert info["port"] == "/dev/ttyACM0"
        assert info["baudrate"] == 57600

    def test_disconnect_when_never_connected(self):
        """Disconnect when never connected should not crash."""
        t = SerialTransport()
        t.disconnect()  # Should not raise
        assert t.status.health == TransportHealth.DISCONNECTED


# =============================================================================
# WifiUdpTransport Tests
# =============================================================================


class TestWifiUdpTransport:
    def test_connect_creates_socket(self):
        t = WifiUdpTransport(host="10.0.0.1", port=5000)
        assert t.connect() is True
        assert t.status.health == TransportHealth.OK
        t.disconnect()

    def test_send_json_payload_format(self):
        """Verify the UDP payload is valid JSON with expected fields."""
        t = WifiUdpTransport(host="127.0.0.1", port=19999)

        # Use a mock socket to capture the payload
        mock_sock = MagicMock()
        t._sock = mock_sock
        t._connected = True
        t._status.health = TransportHealth.OK

        t.send(ControlOutput(yaw_rate=0.75, pitch_rate=-0.25, ttl_ms=100))

        mock_sock.sendto.assert_called_once()
        data, addr = mock_sock.sendto.call_args[0]
        payload = json.loads(data.decode("utf-8"))
        assert payload["yaw_rate"] == 0.75
        assert payload["pitch_rate"] == -0.25
        assert payload["ttl_ms"] == 100
        assert "timestamp" in payload
        assert addr == ("127.0.0.1", 19999)

    def test_send_fails_when_disconnected(self):
        t = WifiUdpTransport()
        assert t.send(ControlOutput()) is False

    def test_transport_info(self):
        t = WifiUdpTransport(host="192.168.1.50", port=4210)
        info = t.transport_info
        assert info["type"] == "wifi_udp"
        assert info["host"] == "192.168.1.50"
        assert info["port"] == 4210

    def test_disconnect_when_never_connected(self):
        t = WifiUdpTransport()
        t.disconnect()  # Should not raise
        assert t.status.health == TransportHealth.DISCONNECTED


# =============================================================================
# AudioPwmTransport transport_info device=0 Test
# =============================================================================


class TestAudioPwmDeviceZero:
    def test_device_zero_preserved_in_transport_info(self):
        """Device index 0 should show as 0, not 'default'."""
        t = AudioPwmTransport(device=0)
        info = t.transport_info
        assert info["device"] == 0

    def test_device_none_shows_default(self):
        t = AudioPwmTransport(device=None)
        info = t.transport_info
        assert info["device"] == "default"
