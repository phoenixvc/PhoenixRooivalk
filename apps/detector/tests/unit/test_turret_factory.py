"""
Unit tests for turret factory module.

Tests controller creation from settings and pipeline integration.
"""

import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

# Add src to path for imports
src_path = Path(__file__).parent.parent.parent / "src"
sys.path.insert(0, str(src_path))

from turret_controller import AuthorityMode, TurretController
from turret_factory import create_turret_controller
from turret_transport import SimulatedTransport


class FakeSettings:
    """Minimal settings object for testing."""

    def __init__(self, **kwargs):
        defaults = {
            "transport_type": "simulated",
            "serial_port": "/dev/ttyUSB0",
            "serial_baudrate": 115200,
            "wifi_host": "192.168.4.1",
            "wifi_port": 4210,
            "audio_device": None,
            "audio_buffer_size": 512,
            "yaw_kp": 0.8,
            "yaw_ki": 0.05,
            "yaw_kd": 0.15,
            "pitch_kp": 0.6,
            "pitch_ki": 0.03,
            "pitch_kd": 0.10,
            "max_yaw_rate": 1.0,
            "max_pitch_rate": 1.0,
            "max_slew_rate": 2.0,
            "watchdog_timeout_ms": 500,
            "override_latch_seconds": 3.0,
            "command_ttl_ms": 200,
            "initial_mode": "manual",
        }
        defaults.update(kwargs)
        for k, v in defaults.items():
            setattr(self, k, v)


# =============================================================================
# create_turret_controller Tests
# =============================================================================


class TestCreateTurretController:
    def test_creates_controller_with_defaults(self):
        settings = FakeSettings()
        controller = create_turret_controller(settings)
        assert isinstance(controller, TurretController)

    def test_initial_mode_manual(self):
        settings = FakeSettings(initial_mode="manual")
        controller = create_turret_controller(settings)
        assert controller.supervisor.mode == AuthorityMode.MANUAL

    def test_initial_mode_auto_track(self):
        settings = FakeSettings(initial_mode="auto_track")
        controller = create_turret_controller(settings)
        assert controller.supervisor.mode == AuthorityMode.AUTO_TRACK

    def test_initial_mode_assisted(self):
        settings = FakeSettings(initial_mode="assisted")
        controller = create_turret_controller(settings)
        assert controller.supervisor.mode == AuthorityMode.ASSISTED

    def test_invalid_initial_mode_warns_and_defaults(self):
        settings = FakeSettings(initial_mode="bogus")
        controller = create_turret_controller(settings)
        # Should default to MANUAL
        assert controller.supervisor.mode == AuthorityMode.MANUAL

    def test_simulated_transport_created(self):
        settings = FakeSettings(transport_type="simulated")
        controller = create_turret_controller(settings)
        assert isinstance(controller.transport, SimulatedTransport)

    def test_controller_starts_and_stops(self):
        settings = FakeSettings()
        controller = create_turret_controller(settings)
        assert controller.start() is True
        assert controller.is_running is True
        controller.stop()
        assert controller.is_running is False

    def test_pid_gains_from_settings(self):
        settings = FakeSettings(yaw_kp=1.5, pitch_kp=2.0)
        controller = create_turret_controller(settings)
        status = controller.get_status()
        assert status["pid_yaw"]["kp"] == 1.5
        assert status["pid_pitch"]["kp"] == 2.0

    def test_invalid_transport_type_raises(self):
        settings = FakeSettings(transport_type="nonexistent")
        with pytest.raises(ValueError):
            create_turret_controller(settings)
