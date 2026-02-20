"""
Unit tests for turret factory module.

Tests controller creation from settings and pipeline integration (turret_update).
"""

import sys
from pathlib import Path
from unittest.mock import MagicMock, PropertyMock, patch

import pytest

# Add src to path for imports
src_path = Path(__file__).parent.parent.parent / "src"
sys.path.insert(0, str(src_path))

from turret_controller import AuthorityMode, TurretController
from turret_factory import create_turret_controller, turret_update
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
            "dead_zone": 0.02,
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

    def test_context_manager(self):
        settings = FakeSettings()
        with create_turret_controller(settings) as controller:
            assert controller.is_running is True
        assert controller.is_running is False


# =============================================================================
# turret_update Tests
# =============================================================================


def _make_mock_targeting(has_lock=True, center=(400, 300), lead_point=(420, 310)):
    """Create a mock TargetingSystem."""
    targeting = MagicMock()

    if has_lock:
        lock = MagicMock()
        lock.detection.bbox.center = center
        targeting.current_lock = lock
        targeting.get_lead_point.return_value = lead_point
    else:
        targeting.current_lock = None
        targeting.get_lead_point.return_value = None

    targeting.get_status.return_value = {
        "state": "locked" if has_lock else "searching",
        "lock": None,
    }
    return targeting


class TestTurretUpdate:
    @pytest.fixture
    def controller(self):
        settings = FakeSettings()
        ctrl = create_turret_controller(settings)
        ctrl.start()
        ctrl.set_mode(AuthorityMode.AUTO_TRACK)
        yield ctrl
        ctrl.stop()

    def test_returns_dict_with_expected_keys(self, controller):
        targeting = _make_mock_targeting(has_lock=False)
        result = turret_update(controller, targeting, 640, 480)

        assert "targeting" in result
        assert "turret" in result
        assert "last_output" in result

    def test_no_lock_sends_neutral(self, controller):
        targeting = _make_mock_targeting(has_lock=False)
        result = turret_update(controller, targeting, 640, 480)

        assert result["last_output"]["yaw_rate"] == 0.0
        assert result["last_output"]["pitch_rate"] == 0.0

    def test_lock_uses_lead_point(self, controller):
        targeting = _make_mock_targeting(
            has_lock=True,
            center=(320, 240),
            lead_point=(480, 360),  # Right and below center
        )
        result = turret_update(controller, targeting, 640, 480, use_lead_point=True)

        # Lead point is right of center -> positive yaw
        assert result["last_output"]["yaw_rate"] > 0.0
        targeting.get_lead_point.assert_called_once()

    def test_lock_falls_back_to_center_when_no_lead(self, controller):
        targeting = _make_mock_targeting(
            has_lock=True,
            center=(480, 240),
            lead_point=None,  # Lead point unavailable
        )
        result = turret_update(controller, targeting, 640, 480, use_lead_point=True)

        # Falls back to detection center (480 is right of 320 center)
        assert result["last_output"]["yaw_rate"] > 0.0

    def test_use_lead_point_false_uses_center(self, controller):
        targeting = _make_mock_targeting(
            has_lock=True,
            center=(480, 240),
            lead_point=(160, 240),  # Lead point is left, center is right
        )
        result = turret_update(controller, targeting, 640, 480, use_lead_point=False)

        # Should use center (480), not lead (160), so positive yaw
        assert result["last_output"]["yaw_rate"] > 0.0
        targeting.get_lead_point.assert_not_called()

    def test_targeting_status_included(self, controller):
        targeting = _make_mock_targeting(has_lock=True)
        result = turret_update(controller, targeting, 640, 480)

        assert result["targeting"]["state"] == "locked"
        targeting.get_status.assert_called_once()
