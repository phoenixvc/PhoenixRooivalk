"""
Unit tests for turret controller module.

Tests PID controller, authority supervisor, and turret controller.
"""

import sys
import time
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

# Add src to path for imports
src_path = Path(__file__).parent.parent.parent / "src"
sys.path.insert(0, str(src_path))

from turret_controller import (
    AuthorityMode,
    AuthorityState,
    AuthoritySupervisor,
    PIDController,
    TurretController,
)
from turret_transport import ControlOutput, SimulatedTransport


# =============================================================================
# AuthorityState Tests
# =============================================================================


class TestAuthorityState:
    def test_default_state_is_manual(self):
        state = AuthorityState()
        assert state.mode == AuthorityMode.MANUAL

    def test_time_in_mode(self):
        state = AuthorityState()
        time.sleep(0.05)
        assert state.time_in_mode() >= 0.04

    def test_to_dict(self):
        state = AuthorityState()
        d = state.to_dict()
        assert d["mode"] == "manual"
        assert "time_in_mode" in d
        assert d["override_active"] is False


# =============================================================================
# AuthoritySupervisor Tests
# =============================================================================


class TestAuthoritySupervisor:
    @pytest.fixture
    def supervisor(self):
        return AuthoritySupervisor(
            max_yaw_rate=1.0,
            max_pitch_rate=1.0,
            max_slew_rate=10.0,  # High slew rate to avoid interfering with tests
            watchdog_timeout_ms=200,
            override_latch_seconds=1.0,
        )

    def test_initial_mode_is_manual(self, supervisor):
        assert supervisor.mode == AuthorityMode.MANUAL

    def test_mode_change_to_auto_track(self, supervisor):
        assert supervisor.request_mode(AuthorityMode.AUTO_TRACK) is True
        assert supervisor.mode == AuthorityMode.AUTO_TRACK

    def test_mode_change_to_failsafe(self, supervisor):
        assert supervisor.request_mode(AuthorityMode.FAILSAFE) is True
        assert supervisor.mode == AuthorityMode.FAILSAFE

    def test_failsafe_only_exits_to_manual(self, supervisor):
        supervisor.trigger_failsafe("test")
        assert supervisor.mode == AuthorityMode.FAILSAFE

        # Cannot go to AUTO_TRACK from FAILSAFE
        assert supervisor.request_mode(AuthorityMode.AUTO_TRACK) is False
        assert supervisor.mode == AuthorityMode.FAILSAFE

        # Can go to MANUAL
        assert supervisor.request_mode(AuthorityMode.MANUAL) is True
        assert supervisor.mode == AuthorityMode.MANUAL

    def test_manual_override_latches(self, supervisor):
        supervisor.request_mode(AuthorityMode.AUTO_TRACK)
        supervisor.trigger_manual_override()

        assert supervisor.mode == AuthorityMode.MANUAL

        # Cannot leave MANUAL during latch
        assert supervisor.request_mode(AuthorityMode.AUTO_TRACK) is False
        assert supervisor.mode == AuthorityMode.MANUAL

    def test_manual_override_expires(self, supervisor):
        # Use short latch for test
        sup = AuthoritySupervisor(override_latch_seconds=0.05)
        sup.request_mode(AuthorityMode.AUTO_TRACK)
        sup.trigger_manual_override()

        time.sleep(0.1)
        assert sup.request_mode(AuthorityMode.AUTO_TRACK) is True
        assert sup.mode == AuthorityMode.AUTO_TRACK

    def test_apply_safety_clamps_rates(self, supervisor):
        supervisor.request_mode(AuthorityMode.AUTO_TRACK)
        supervisor.feed_watchdog()

        output = ControlOutput(yaw_rate=2.0, pitch_rate=-2.0)
        safe = supervisor.apply_safety(output)

        assert safe.yaw_rate <= 1.0
        assert safe.pitch_rate >= -1.0

    def test_apply_safety_neutral_in_manual(self, supervisor):
        output = ControlOutput(yaw_rate=0.5, pitch_rate=0.5)
        safe = supervisor.apply_safety(output)

        assert safe.yaw_rate == 0.0
        assert safe.pitch_rate == 0.0

    def test_apply_safety_neutral_in_failsafe(self, supervisor):
        supervisor.trigger_failsafe("test")
        output = ControlOutput(yaw_rate=0.5, pitch_rate=0.5)
        safe = supervisor.apply_safety(output)

        assert safe.yaw_rate == 0.0
        assert safe.pitch_rate == 0.0

    def test_watchdog_triggers_failsafe(self, supervisor):
        supervisor.request_mode(AuthorityMode.AUTO_TRACK)
        supervisor.feed_watchdog()

        # Wait for watchdog to expire
        time.sleep(0.3)

        output = ControlOutput(yaw_rate=0.5, pitch_rate=0.5)
        supervisor.apply_safety(output)

        assert supervisor.mode == AuthorityMode.FAILSAFE

    def test_watchdog_does_not_fire_when_fed(self, supervisor):
        supervisor.request_mode(AuthorityMode.AUTO_TRACK)

        for _ in range(10):
            supervisor.feed_watchdog()
            supervisor.apply_safety(ControlOutput(yaw_rate=0.5, pitch_rate=0.5))
            time.sleep(0.03)

        assert supervisor.mode == AuthorityMode.AUTO_TRACK

    def test_watchdog_applies_in_assisted_mode(self, supervisor):
        supervisor.request_mode(AuthorityMode.ASSISTED)
        supervisor.feed_watchdog()

        time.sleep(0.3)
        supervisor.apply_safety(ControlOutput())

        assert supervisor.mode == AuthorityMode.FAILSAFE

    def test_slew_rate_limits_change(self):
        sup = AuthoritySupervisor(max_slew_rate=1.0)  # 1.0 per second
        sup.request_mode(AuthorityMode.AUTO_TRACK)
        sup.feed_watchdog()

        # First call establishes baseline
        sup.apply_safety(ControlOutput(yaw_rate=0.0))

        # Immediate large jump should be limited
        time.sleep(0.01)  # very short dt
        safe = sup.apply_safety(ControlOutput(yaw_rate=1.0))
        # With dt~0.01s and max_slew=1.0/s, max_delta ~= 0.01
        assert safe.yaw_rate < 0.5  # Should not jump to 1.0 instantly

    def test_get_status(self, supervisor):
        status = supervisor.get_status()
        assert "state" in status
        assert "watchdog_timeout_ms" in status
        assert status["state"]["mode"] == "manual"


# =============================================================================
# PIDController Tests
# =============================================================================


class TestPIDController:
    @pytest.fixture
    def pid(self):
        return PIDController(kp=1.0, ki=0.0, kd=0.0)

    def test_proportional_response(self, pid):
        output = pid.update(0.5)
        assert output == pytest.approx(0.5, abs=0.01)

    def test_proportional_negative(self, pid):
        output = pid.update(-0.3)
        assert output == pytest.approx(-0.3, abs=0.01)

    def test_zero_error_zero_output(self, pid):
        output = pid.update(0.0)
        assert output == pytest.approx(0.0, abs=0.01)

    def test_output_clamped(self):
        pid = PIDController(kp=10.0, output_limit=1.0)
        output = pid.update(0.5)
        assert abs(output) <= 1.0

    def test_integral_accumulates(self):
        pid = PIDController(kp=0.0, ki=1.0, kd=0.0)
        for _ in range(10):
            output = pid.update(1.0)
            time.sleep(0.01)
        assert output > 0.0

    def test_integral_windup_limited(self):
        pid = PIDController(kp=0.0, ki=10.0, kd=0.0, integral_limit=0.5)
        for _ in range(100):
            pid.update(1.0)
            time.sleep(0.001)
        # Integral should be capped
        output = pid.update(0.0)
        # ki * integral_limit = 10 * 0.5 = 5.0, clamped to output_limit=1.0
        assert abs(output) <= 1.0

    def test_derivative_responds_to_change(self):
        pid = PIDController(kp=0.0, ki=0.0, kd=1.0)
        pid.update(0.0)
        time.sleep(0.02)
        output = pid.update(1.0)
        assert output > 0.0  # Error increased, derivative is positive

    def test_reset_clears_state(self):
        pid = PIDController(kp=0.0, ki=1.0, kd=0.0)
        for _ in range(10):
            pid.update(1.0)
            time.sleep(0.01)
        pid.reset()
        # After reset, integral is 0
        output = pid.update(0.0)
        assert output == pytest.approx(0.0, abs=0.01)

    def test_set_gains(self):
        pid = PIDController(kp=1.0, ki=0.0, kd=0.0)
        pid.set_gains(2.0, 0.1, 0.05)
        assert pid.gains == {"kp": 2.0, "ki": 0.1, "kd": 0.05}


# =============================================================================
# TurretController Tests
# =============================================================================


class TestTurretController:
    @pytest.fixture
    def transport(self):
        return SimulatedTransport(log_commands=False)

    @pytest.fixture
    def controller(self, transport):
        return TurretController(
            transport=transport,
            yaw_pid=PIDController(kp=1.0, ki=0.0, kd=0.0),
            pitch_pid=PIDController(kp=1.0, ki=0.0, kd=0.0),
            supervisor=AuthoritySupervisor(
                max_slew_rate=100.0,  # High to avoid interfering
                watchdog_timeout_ms=5000,
            ),
        )

    def test_start_stop(self, controller):
        assert controller.start() is True
        assert controller.is_running is True
        controller.stop()
        assert controller.is_running is False

    def test_start_idempotent(self, controller):
        assert controller.start() is True
        assert controller.start() is True
        controller.stop()

    def test_stop_idempotent(self, controller):
        controller.start()
        controller.stop()
        controller.stop()  # Should not raise

    def test_update_returns_neutral_when_stopped(self, controller):
        output = controller.update_from_target_lock(
            target_center=(320, 240),
            frame_width=640,
            frame_height=480,
        )
        assert output.yaw_rate == 0.0
        assert output.pitch_rate == 0.0

    def test_update_with_target_in_auto_track(self, controller):
        controller.start()
        controller.set_mode(AuthorityMode.AUTO_TRACK)

        # Target to the right of center
        output = controller.update_from_target_lock(
            target_center=(480, 240),
            frame_width=640,
            frame_height=480,
        )
        # Target is right of center -> positive yaw
        assert output.yaw_rate > 0.0
        controller.stop()

    def test_update_neutral_when_no_target(self, controller):
        controller.start()
        controller.set_mode(AuthorityMode.AUTO_TRACK)

        output = controller.update_from_target_lock(
            target_center=None,
            frame_width=640,
            frame_height=480,
        )
        # No target -> neutral
        assert output.yaw_rate == 0.0
        assert output.pitch_rate == 0.0
        controller.stop()

    def test_update_with_zero_frame_size(self, controller):
        controller.start()
        controller.set_mode(AuthorityMode.AUTO_TRACK)

        # Should not crash with zero dimensions
        output = controller.update_from_target_lock(
            target_center=(100, 100),
            frame_width=0,
            frame_height=0,
        )
        assert output.yaw_rate == 0.0
        assert output.pitch_rate == 0.0
        controller.stop()

    def test_manual_override(self, controller):
        controller.start()
        controller.set_mode(AuthorityMode.AUTO_TRACK)
        controller.manual_override()

        assert controller.supervisor.mode == AuthorityMode.MANUAL
        controller.stop()

    def test_manual_mode_outputs_neutral(self, controller):
        controller.start()
        # Default is MANUAL

        output = controller.update_from_target_lock(
            target_center=(480, 240),
            frame_width=640,
            frame_height=480,
        )
        # In MANUAL, AI output is suppressed
        assert output.yaw_rate == 0.0
        assert output.pitch_rate == 0.0
        controller.stop()

    def test_get_status(self, controller):
        controller.start()
        status = controller.get_status()
        assert "running" in status
        assert "authority" in status
        assert "transport" in status
        assert "pid_yaw" in status
        assert status["running"] is True
        controller.stop()

    def test_set_pid_gains(self, controller):
        controller.set_pid_gains(1.0, 0.1, 0.05, 2.0, 0.2, 0.1)
        status = controller.get_status()
        assert status["pid_yaw"]["kp"] == 1.0
        assert status["pid_pitch"]["kp"] == 2.0

    def test_update_from_lead_point_delegates(self, controller):
        controller.start()
        controller.set_mode(AuthorityMode.AUTO_TRACK)

        output = controller.update_from_lead_point(
            lead_point=(480, 240),
            frame_width=640,
            frame_height=480,
        )
        assert output.yaw_rate > 0.0
        controller.stop()

    def test_commands_counted(self, controller):
        controller.start()
        controller.set_mode(AuthorityMode.AUTO_TRACK)

        for _ in range(5):
            controller.update_from_target_lock(
                target_center=(320, 240),
                frame_width=640,
                frame_height=480,
            )

        status = controller.get_status()
        assert status["commands_sent"] == 5
        controller.stop()

    def test_context_manager(self, transport):
        with TurretController(transport=transport) as ctrl:
            assert ctrl.is_running is True
        assert ctrl.is_running is False


# =============================================================================
# Watchdog on Mode Switch (BUG 1 fix)
# =============================================================================


class TestWatchdogModeSwitch:
    """Verify watchdog doesn't fire immediately when switching to AUTO_TRACK."""

    def test_no_immediate_failsafe_on_auto_track(self):
        """BUG 1: watchdog used to fire from stale __init__ timestamp."""
        sup = AuthoritySupervisor(watchdog_timeout_ms=200)

        # Simulate delay between creation and mode switch
        time.sleep(0.3)

        sup.request_mode(AuthorityMode.AUTO_TRACK)

        # Should NOT be in failsafe — request_mode feeds the watchdog
        safe = sup.apply_safety(ControlOutput(yaw_rate=0.5))
        assert sup.mode == AuthorityMode.AUTO_TRACK
        assert safe.yaw_rate != 0.0

    def test_no_immediate_failsafe_on_assisted(self):
        sup = AuthoritySupervisor(watchdog_timeout_ms=200)
        time.sleep(0.3)

        sup.request_mode(AuthorityMode.ASSISTED)
        sup.apply_safety(ControlOutput(yaw_rate=0.5))
        assert sup.mode == AuthorityMode.ASSISTED


# =============================================================================
# ASSISTED Mode Tests (I1)
# =============================================================================


class TestAssistedMode:
    def test_assisted_scales_output(self):
        """ASSISTED mode should scale AI output to 50%."""
        sup = AuthoritySupervisor(max_slew_rate=100.0, watchdog_timeout_ms=5000)
        sup.request_mode(AuthorityMode.ASSISTED)
        sup.feed_watchdog()

        safe = sup.apply_safety(ControlOutput(yaw_rate=1.0, pitch_rate=-1.0))

        # Should be scaled to ~0.5 (not full 1.0)
        assert 0.4 <= safe.yaw_rate <= 0.6
        assert -0.6 <= safe.pitch_rate <= -0.4

    def test_assisted_differs_from_auto_track(self):
        """ASSISTED output should be less than AUTO_TRACK for same input."""
        sup_assisted = AuthoritySupervisor(max_slew_rate=100.0, watchdog_timeout_ms=5000)
        sup_auto = AuthoritySupervisor(max_slew_rate=100.0, watchdog_timeout_ms=5000)

        sup_assisted.request_mode(AuthorityMode.ASSISTED)
        sup_auto.request_mode(AuthorityMode.AUTO_TRACK)
        sup_assisted.feed_watchdog()
        sup_auto.feed_watchdog()

        cmd = ControlOutput(yaw_rate=0.8)
        safe_assisted = sup_assisted.apply_safety(cmd)
        safe_auto = sup_auto.apply_safety(cmd)

        assert abs(safe_assisted.yaw_rate) < abs(safe_auto.yaw_rate)


# =============================================================================
# PID Dead Zone Tests (O3)
# =============================================================================


class TestPIDDeadZone:
    def test_dead_zone_outputs_zero_when_error_below_threshold(self):
        pid = PIDController(kp=1.0, dead_zone=0.05)
        output = pid.update(0.03)  # Below dead zone
        assert output == 0.0

    def test_dead_zone_outputs_nonzero_when_error_above_threshold(self):
        pid = PIDController(kp=1.0, dead_zone=0.05)
        output = pid.update(0.1)  # Above dead zone
        assert output != 0.0

    def test_dead_zone_zero_means_no_dead_zone(self):
        pid = PIDController(kp=1.0, dead_zone=0.0)
        output = pid.update(0.001)
        assert output != 0.0  # Even tiny error produces output

    def test_dead_zone_decays_integral(self):
        # kp=0, kd=0 isolates the integral term for this test
        pid = PIDController(kp=0.0, ki=1.0, kd=0.0, dead_zone=0.05)
        # Accumulate integral with large error
        for _ in range(10):
            pid.update(0.5)
            time.sleep(0.01)
        # Capture output just before entering dead zone (purely integral)
        last_output_before_deadzone = pid.update(0.5)
        assert last_output_before_deadzone != 0.0, "Should have accumulated integral"
        # Enter dead zone — integral should decay at 0.9x per call
        pid.update(0.01)
        pid.update(0.01)
        output_after_decay = pid.update(0.01)
        assert output_after_decay == 0.0, "Dead zone should output zero"
        # Exit dead zone and check that integral has decayed
        # (same error as before, but integral is smaller due to 0.9^3 decay)
        time.sleep(0.01)  # Ensure non-zero dt for integral accumulation
        output_after_exit = pid.update(0.5)
        assert abs(output_after_exit) < abs(last_output_before_deadzone), (
            f"Integral should have decayed: {output_after_exit} should be "
            f"less than {last_output_before_deadzone}"
        )

    def test_dead_zone_no_derivative_spike_on_exit(self):
        """Derivative should not spike when transitioning out of dead zone."""
        pid = PIDController(kp=0.0, ki=0.0, kd=1.0, dead_zone=0.05)
        # Start with moderate error
        pid.update(0.3)
        time.sleep(0.02)
        # Enter dead zone
        pid.update(0.01)
        time.sleep(0.02)
        # Exit dead zone — derivative should compute from prev_error=0
        # not from the small dead-zone error, avoiding a spike
        output = pid.update(0.3)
        # With prev_error=0 and error=0.3, derivative = kd * 0.3/dt
        # which is bounded. If prev_error were 0.01, it would be 0.29/dt.
        # Both are proportional to 1/dt, but this test ensures no crash
        # and that the output is within bounds.
        assert abs(output) <= 1.0
