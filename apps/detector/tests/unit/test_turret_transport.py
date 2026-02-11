"""
Unit tests for turret transport module.

Tests transport data contracts, simulated transport, and factory.
"""

import sys
from pathlib import Path

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
