"""
Turret controller: PID tracking, authority supervision, and pan/tilt control.

This module bridges the existing detection/tracking pipeline to the
turret transport layer. It converts tracking data (target position in
image space) into bounded pan/tilt rates via PID control.

Architecture:
    TargetingSystem (existing)
        -> TurretController (this module)
            -> PIDController (image error -> rates)
            -> AuthoritySupervisor (safety, mode, override)
        -> ActuatorTransport (turret_transport.py)

Design principles:
    1. AI never drives actuators directly. AI emits intent;
       the supervisor converts intent to bounded motion.
    2. Manual override always wins, immediately, no delay.
    3. No fresh command within TTL -> neutral output (watchdog).
    4. Rate limits and angle bounds enforced in supervisor,
       not in hardware (defense in depth).

NOTE: This module controls pan/tilt positioning only.
      It does NOT control any firing or engagement mechanism.
"""

import logging
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Optional

from turret_transport import ActuatorTransport, ControlOutput, SimulatedTransport

logger = logging.getLogger("drone_detector.turret_controller")


# =============================================================================
# Authority / Mode Management
# =============================================================================


class AuthorityMode(Enum):
    """
    Who is in control of the turret.

    Transitions:
        MANUAL -> ASSISTED -> AUTO_TRACK
           ^         |            |
         FAILSAFE <--+------------+

    MANUAL always wins. Any mode can go to FAILSAFE.
    FAILSAFE can only return to MANUAL.
    """

    MANUAL = "manual"  # Operator drives pan/tilt directly
    ASSISTED = "assisted"  # Operator + AI suggestions shown
    AUTO_TRACK = "auto_track"  # AI drives pan/tilt to keep target centered
    FAILSAFE = "failsafe"  # Error state: stop motion, return to neutral


@dataclass
class AuthorityState:
    """Current authority state with timing metadata."""

    mode: AuthorityMode = AuthorityMode.MANUAL
    mode_since: float = field(default_factory=time.time)
    override_until: float = 0.0  # Manual override latch expiry
    failsafe_reason: str = ""

    def time_in_mode(self) -> float:
        """Seconds in current mode."""
        return time.time() - self.mode_since

    def to_dict(self) -> dict[str, Any]:
        return {
            "mode": self.mode.value,
            "time_in_mode": round(self.time_in_mode(), 2),
            "override_active": time.time() < self.override_until,
            "failsafe_reason": self.failsafe_reason,
        }


class AuthoritySupervisor:
    """
    Manages who has control and enforces safety constraints.

    Rules (non-negotiable):
    - Manual override is always immediate.
    - Override latches for a configurable duration.
    - No fresh command within watchdog timeout -> FAILSAFE.
    - Rate limits enforced on every output.
    - FAILSAFE can only exit to MANUAL.
    """

    def __init__(
        self,
        max_yaw_rate: float = 1.0,
        max_pitch_rate: float = 1.0,
        max_slew_rate: float = 2.0,  # Max rate change per second
        watchdog_timeout_ms: int = 500,
        override_latch_seconds: float = 3.0,
    ):
        self._max_yaw_rate = max_yaw_rate
        self._max_pitch_rate = max_pitch_rate
        self._max_slew_rate = max_slew_rate
        self._watchdog_timeout_ms = watchdog_timeout_ms
        self._override_latch_seconds = override_latch_seconds

        self._state = AuthorityState()
        self._last_command_time: float = time.time()
        self._last_output = ControlOutput()
        self._last_safety_time: float = 0.0

    @property
    def mode(self) -> AuthorityMode:
        return self._state.mode

    @property
    def state(self) -> AuthorityState:
        return self._state

    def request_mode(self, mode: AuthorityMode) -> bool:
        """
        Request a mode change.

        Returns True if mode was changed.
        FAILSAFE can only exit to MANUAL.
        Override latch blocks mode changes away from MANUAL.
        """
        now = time.time()

        # Always allow transition to MANUAL
        if mode == AuthorityMode.MANUAL:
            self._set_mode(mode)
            return True

        # Always allow transition to FAILSAFE
        if mode == AuthorityMode.FAILSAFE:
            self._set_mode(mode)
            return True

        # Cannot leave FAILSAFE except to MANUAL
        if self._state.mode == AuthorityMode.FAILSAFE:
            logger.warning("Cannot leave FAILSAFE except to MANUAL")
            return False

        # Override latch blocks transitions away from MANUAL
        if now < self._state.override_until:
            logger.debug("Override latch active, staying in MANUAL")
            return False

        self._set_mode(mode)
        # Feed watchdog when entering autonomous modes so it doesn't
        # fire immediately from a stale __init__ timestamp.
        if mode in (AuthorityMode.AUTO_TRACK, AuthorityMode.ASSISTED):
            self.feed_watchdog()
        return True

    def trigger_manual_override(self) -> None:
        """
        Immediately switch to MANUAL and latch for override duration.

        This is the "deadman switch" — always works, no conditions.
        """
        now = time.time()
        self._state.override_until = now + self._override_latch_seconds
        self._set_mode(AuthorityMode.MANUAL)
        logger.info(
            f"MANUAL OVERRIDE: latched for {self._override_latch_seconds}s"
        )

    def feed_watchdog(self) -> None:
        """
        Feed the watchdog timer.

        Call this when a genuine tracking command arrives (i.e., when
        there IS a target). Do NOT call on every frame — that defeats
        the watchdog's purpose.
        """
        self._last_command_time = time.time()

    def trigger_failsafe(self, reason: str) -> None:
        """Enter FAILSAFE state."""
        self._state.failsafe_reason = reason
        self._set_mode(AuthorityMode.FAILSAFE)
        logger.warning(f"FAILSAFE: {reason}")

    def apply_safety(self, output: ControlOutput) -> ControlOutput:
        """
        Apply safety constraints to a control output.

        Enforces:
        - Rate clamping
        - Slew rate limiting (smooth transitions, time-aware)
        - Watchdog timeout check (AUTO_TRACK and ASSISTED only)
        - Neutral output in FAILSAFE/MANUAL mode

        Returns a new (safe) ControlOutput.

        NOTE: The watchdog is only *checked* here, not fed.
        Call feed_watchdog() when a genuine tracking command arrives.
        """
        now = time.time()

        # Watchdog: if no command recently in autonomous modes, go to failsafe
        if self._state.mode in (AuthorityMode.AUTO_TRACK, AuthorityMode.ASSISTED):
            elapsed_ms = (now - self._last_command_time) * 1000
            if elapsed_ms > self._watchdog_timeout_ms:
                self.trigger_failsafe(
                    f"Watchdog timeout: {elapsed_ms:.0f}ms > {self._watchdog_timeout_ms}ms"
                )

        # FAILSAFE -> neutral
        if self._state.mode == AuthorityMode.FAILSAFE:
            self._last_output = ControlOutput(yaw_rate=0.0, pitch_rate=0.0, ttl_ms=output.ttl_ms)
            return self._last_output

        # MANUAL -> neutral (AI output suppressed, operator drives via separate input)
        if self._state.mode == AuthorityMode.MANUAL:
            self._last_output = ControlOutput(yaw_rate=0.0, pitch_rate=0.0, ttl_ms=output.ttl_ms)
            return self._last_output

        # ASSISTED -> scale AI output to 50% (suggestion, not full authority)
        # Operator sees the turret nudging toward target, can override at any time
        if self._state.mode == AuthorityMode.ASSISTED:
            output = ControlOutput(
                yaw_rate=output.yaw_rate * 0.5,
                pitch_rate=output.pitch_rate * 0.5,
                ttl_ms=output.ttl_ms,
            )

        # Clamp rates
        yaw = max(-self._max_yaw_rate, min(self._max_yaw_rate, output.yaw_rate))
        pitch = max(-self._max_pitch_rate, min(self._max_pitch_rate, output.pitch_rate))

        # Time-aware slew rate limiting (prevent sudden jumps)
        dt = now - self._last_safety_time if self._last_safety_time > 0 else 0.033
        dt = min(dt, 0.5)  # Cap to prevent huge jumps after pause
        self._last_safety_time = now

        max_delta = self._max_slew_rate * dt
        yaw_delta = yaw - self._last_output.yaw_rate
        pitch_delta = pitch - self._last_output.pitch_rate

        if abs(yaw_delta) > max_delta:
            yaw = self._last_output.yaw_rate + max_delta * (
                1.0 if yaw_delta > 0 else -1.0
            )
        if abs(pitch_delta) > max_delta:
            pitch = self._last_output.pitch_rate + max_delta * (
                1.0 if pitch_delta > 0 else -1.0
            )

        safe_output = ControlOutput(
            yaw_rate=yaw,
            pitch_rate=pitch,
            ttl_ms=output.ttl_ms,
        )
        self._last_output = safe_output
        return safe_output

    def _set_mode(self, mode: AuthorityMode) -> None:
        if mode != self._state.mode:
            old = self._state.mode.value
            self._state.mode = mode
            self._state.mode_since = time.time()
            if mode != AuthorityMode.FAILSAFE:
                self._state.failsafe_reason = ""
            logger.info(f"Authority: {old} -> {mode.value}")

    def get_status(self) -> dict[str, Any]:
        return {
            "state": self._state.to_dict(),
            "watchdog_timeout_ms": self._watchdog_timeout_ms,
            "max_yaw_rate": self._max_yaw_rate,
            "max_pitch_rate": self._max_pitch_rate,
        }


# =============================================================================
# PID Controller
# =============================================================================


class PIDController:
    """
    Simple PID controller for one axis.

    Converts image error (normalized offset from center)
    into a rate command for the turret axis.
    """

    def __init__(
        self,
        kp: float = 1.0,
        ki: float = 0.0,
        kd: float = 0.1,
        output_limit: float = 1.0,
        integral_limit: float = 0.5,
        dead_zone: float = 0.0,
    ):
        self._kp = kp
        self._ki = ki
        self._kd = kd
        self._output_limit = output_limit
        self._integral_limit = integral_limit
        self._dead_zone = dead_zone

        self._integral: float = 0.0
        self._prev_error: float = 0.0
        self._last_time: float = 0.0

    def reset(self) -> None:
        """Reset integral and derivative state."""
        self._integral = 0.0
        self._prev_error = 0.0
        self._last_time = 0.0

    def update(self, error: float) -> float:
        """
        Compute PID output for current error.

        Args:
            error: Normalized error in [-1, 1] where 0 = centered

        Returns:
            Rate command in [-output_limit, output_limit]
        """
        now = time.time()
        dt = now - self._last_time if self._last_time > 0 else 0.033
        self._last_time = now

        # Prevent huge dt from corrupting integral
        dt = min(dt, 0.5)

        # Dead zone: if error is within threshold, output zero
        # and let the integral decay. Prevents hunting near center.
        # Reset prev_error to 0 so the derivative term doesn't spike
        # when exiting the dead zone (avoids large (error-prev)/dt).
        if abs(error) < self._dead_zone:
            self._integral *= 0.9  # Gentle decay
            self._prev_error = 0.0
            return 0.0

        # Proportional
        p = self._kp * error

        # Integral with anti-windup
        self._integral += error * dt
        self._integral = max(
            -self._integral_limit,
            min(self._integral_limit, self._integral),
        )
        i = self._ki * self._integral

        # Derivative (on error, not on setpoint)
        d = self._kd * (error - self._prev_error) / dt if dt > 0 else 0.0
        self._prev_error = error

        # Sum and clamp
        output = p + i + d
        return max(-self._output_limit, min(self._output_limit, output))

    @property
    def gains(self) -> dict[str, float]:
        return {"kp": self._kp, "ki": self._ki, "kd": self._kd}

    def set_gains(self, kp: float, ki: float, kd: float) -> None:
        """Update PID gains (useful for live tuning)."""
        self._kp = kp
        self._ki = ki
        self._kd = kd
        self.reset()


# =============================================================================
# Turret Controller (main integration point)
# =============================================================================


class TurretController:
    """
    Integrates detection/tracking with turret pan/tilt control.

    This is the main entry point for turret control. It:
    1. Takes tracking data from the existing TargetingSystem
    2. Computes image-space error (target offset from frame center)
    3. Runs PID to get yaw/pitch rates
    4. Applies safety via AuthoritySupervisor
    5. Sends bounded commands via ActuatorTransport

    Usage:
        controller = TurretController(transport=SimulatedTransport())
        controller.start()

        # In detection loop:
        controller.update_from_target_lock(lock, frame_width, frame_height)

        # Manual override:
        controller.manual_override()

        # Cleanup:
        controller.stop()
    """

    def __init__(
        self,
        transport: Optional[ActuatorTransport] = None,
        yaw_pid: Optional[PIDController] = None,
        pitch_pid: Optional[PIDController] = None,
        supervisor: Optional[AuthoritySupervisor] = None,
        command_ttl_ms: int = 200,
    ):
        self._transport = transport or SimulatedTransport()
        self._yaw_pid = yaw_pid or PIDController(kp=0.8, ki=0.05, kd=0.15)
        self._pitch_pid = pitch_pid or PIDController(kp=0.6, ki=0.03, kd=0.10)
        self._supervisor = supervisor or AuthoritySupervisor()
        self._command_ttl_ms = command_ttl_ms

        self._running = False
        self._last_error: tuple[float, float] = (0.0, 0.0)
        self._commands_sent: int = 0

    def __enter__(self):
        self.start()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.stop()
        return False

    @property
    def supervisor(self) -> AuthoritySupervisor:
        return self._supervisor

    @property
    def transport(self) -> ActuatorTransport:
        return self._transport

    @property
    def is_running(self) -> bool:
        return self._running

    def start(self) -> bool:
        """Start the controller and connect transport."""
        if self._running:
            return True

        if not self._transport.connect():
            logger.error("Failed to connect transport")
            return False

        self._running = True
        self._yaw_pid.reset()
        self._pitch_pid.reset()
        logger.info("Turret controller started")
        return True

    def stop(self) -> None:
        """Stop controller and disconnect transport."""
        if not self._running:
            return

        # disconnect() sends neutral internally before closing
        self._transport.disconnect()
        self._running = False
        logger.info("Turret controller stopped")

    def update_from_target_lock(
        self,
        target_center: Optional[tuple[int, int]],
        frame_width: int,
        frame_height: int,
    ) -> ControlOutput:
        """
        Update turret position based on target position in frame.

        This is the main control loop entry point. Call this every frame.

        Args:
            target_center: (x, y) pixel position of target center,
                          or None if no target
            frame_width: Frame width in pixels
            frame_height: Frame height in pixels

        Returns:
            The control output that was sent (after safety clamping)
        """
        if not self._running:
            return ControlOutput()

        if target_center is None:
            # No target: send neutral but do NOT reset PID —
            # preserving state avoids a snap if target reappears quickly.
            raw_output = ControlOutput(
                yaw_rate=0.0,
                pitch_rate=0.0,
                ttl_ms=self._command_ttl_ms,
            )
        elif frame_width <= 0 or frame_height <= 0:
            logger.warning(f"Invalid frame dimensions: {frame_width}x{frame_height}")
            raw_output = ControlOutput(
                yaw_rate=0.0,
                pitch_rate=0.0,
                ttl_ms=self._command_ttl_ms,
            )
        else:
            # Feed watchdog: a genuine tracking command is being processed
            self._supervisor.feed_watchdog()

            # Compute normalized error
            # Positive dx = target is right of center -> yaw right
            # Positive dy = target is below center -> pitch down
            dx = (target_center[0] - frame_width / 2) / (frame_width / 2)
            dy = (target_center[1] - frame_height / 2) / (frame_height / 2)

            # Clamp to [-1, 1]
            dx = max(-1.0, min(1.0, dx))
            dy = max(-1.0, min(1.0, dy))

            self._last_error = (dx, dy)

            # PID
            yaw_rate = self._yaw_pid.update(dx)
            pitch_rate = self._pitch_pid.update(dy)

            raw_output = ControlOutput(
                yaw_rate=yaw_rate,
                pitch_rate=pitch_rate,
                ttl_ms=self._command_ttl_ms,
            )

        # Apply safety
        safe_output = self._supervisor.apply_safety(raw_output)

        # Send
        if self._transport.send(safe_output):
            self._commands_sent += 1

        return safe_output

    def update_from_lead_point(
        self,
        lead_point: Optional[tuple[int, int]],
        frame_width: int,
        frame_height: int,
    ) -> ControlOutput:
        """
        Update turret position targeting a lead (predicted) point.

        Use this with TargetingSystem.get_lead_point() for predictive tracking.
        """
        return self.update_from_target_lock(lead_point, frame_width, frame_height)

    def manual_override(self) -> None:
        """Trigger immediate manual override (deadman switch)."""
        self._supervisor.trigger_manual_override()
        self._transport.send_neutral()
        self._yaw_pid.reset()
        self._pitch_pid.reset()

    def set_mode(self, mode: AuthorityMode) -> bool:
        """Request a mode change."""
        return self._supervisor.request_mode(mode)

    def set_pid_gains(
        self,
        yaw_kp: float,
        yaw_ki: float,
        yaw_kd: float,
        pitch_kp: float,
        pitch_ki: float,
        pitch_kd: float,
    ) -> None:
        """Update PID gains for live tuning."""
        self._yaw_pid.set_gains(yaw_kp, yaw_ki, yaw_kd)
        self._pitch_pid.set_gains(pitch_kp, pitch_ki, pitch_kd)

    def get_status(self) -> dict[str, Any]:
        """Get full controller status for display/logging."""
        return {
            "running": self._running,
            "commands_sent": self._commands_sent,
            "last_error": {
                "dx": round(self._last_error[0], 4),
                "dy": round(self._last_error[1], 4),
            },
            "authority": self._supervisor.get_status(),
            "transport": self._transport.transport_info,
            "transport_status": self._transport.status.to_dict(),
            "pid_yaw": self._yaw_pid.gains,
            "pid_pitch": self._pitch_pid.gains,
        }
