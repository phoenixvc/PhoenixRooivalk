"""
Factory for creating and wiring turret control components.

Creates a TurretController from configuration settings and
integrates it with the existing detection pipeline.

Usage:
    from turret_factory import create_turret_controller, turret_update

    # Create from settings
    controller = create_turret_controller(settings.turret_control)
    controller.start()

    # In detection loop (after targeting update):
    turret_update(controller, targeting_system, frame_width, frame_height)

    # Cleanup:
    controller.stop()

NOTE: This module controls pan/tilt positioning only.
      It does NOT control any firing or engagement mechanism.
"""

import logging
from typing import Optional

from targeting import TargetingSystem
from turret_controller import (
    AuthorityMode,
    AuthoritySupervisor,
    PIDController,
    TurretController,
)
from turret_transport import ActuatorTransport, create_transport

logger = logging.getLogger("drone_detector.turret_factory")


def create_turret_controller(settings) -> TurretController:
    """
    Create a TurretController from TurretControlSettings.

    Args:
        settings: TurretControlSettings instance (pydantic or simple)

    Returns:
        Configured TurretController ready to start()
    """
    # Create transport
    transport_kwargs = {}
    transport_type = getattr(settings, "transport_type", "simulated")

    if transport_type == "serial":
        transport_kwargs["port"] = getattr(settings, "serial_port", "/dev/ttyUSB0")
        transport_kwargs["baudrate"] = getattr(settings, "serial_baudrate", 115200)
    elif transport_type == "wifi_udp":
        transport_kwargs["host"] = getattr(settings, "wifi_host", "192.168.4.1")
        transport_kwargs["port"] = getattr(settings, "wifi_port", 4210)
    elif transport_type == "audio_pwm":
        transport_kwargs["device"] = getattr(settings, "audio_device", None)
        transport_kwargs["buffer_size"] = getattr(settings, "audio_buffer_size", 512)

    transport = create_transport(transport_type, **transport_kwargs)

    # Create PID controllers
    yaw_pid = PIDController(
        kp=getattr(settings, "yaw_kp", 0.8),
        ki=getattr(settings, "yaw_ki", 0.05),
        kd=getattr(settings, "yaw_kd", 0.15),
    )
    pitch_pid = PIDController(
        kp=getattr(settings, "pitch_kp", 0.6),
        ki=getattr(settings, "pitch_ki", 0.03),
        kd=getattr(settings, "pitch_kd", 0.10),
    )

    # Create authority supervisor
    supervisor = AuthoritySupervisor(
        max_yaw_rate=getattr(settings, "max_yaw_rate", 1.0),
        max_pitch_rate=getattr(settings, "max_pitch_rate", 1.0),
        max_slew_rate=getattr(settings, "max_slew_rate", 0.1),
        watchdog_timeout_ms=getattr(settings, "watchdog_timeout_ms", 500),
        override_latch_seconds=getattr(settings, "override_latch_seconds", 3.0),
    )

    # Create controller
    controller = TurretController(
        transport=transport,
        yaw_pid=yaw_pid,
        pitch_pid=pitch_pid,
        supervisor=supervisor,
        command_ttl_ms=getattr(settings, "command_ttl_ms", 200),
    )

    # Set initial mode
    initial_mode = getattr(settings, "initial_mode", "manual")
    mode_map = {
        "manual": AuthorityMode.MANUAL,
        "assisted": AuthorityMode.ASSISTED,
        "auto_track": AuthorityMode.AUTO_TRACK,
    }
    if initial_mode in mode_map:
        controller.set_mode(mode_map[initial_mode])

    logger.info(
        f"Turret controller created: transport={transport_type}, "
        f"mode={initial_mode}"
    )
    return controller


def turret_update(
    controller: TurretController,
    targeting: TargetingSystem,
    frame_width: int,
    frame_height: int,
    use_lead_point: bool = True,
) -> dict:
    """
    Single-call integration: feed targeting state into turret controller.

    Call this once per frame, after targeting.update().

    Args:
        controller: Active TurretController
        targeting: TargetingSystem with current state
        frame_width: Current frame width
        frame_height: Current frame height
        use_lead_point: Use predicted lead point instead of current position

    Returns:
        Combined status dict (targeting + turret)
    """
    target_point: Optional[tuple[int, int]] = None

    if targeting.current_lock is not None:
        if use_lead_point:
            target_point = targeting.get_lead_point()
        if target_point is None:
            # Fall back to direct position
            target_point = targeting.current_lock.detection.bbox.center

    output = controller.update_from_target_lock(
        target_center=target_point,
        frame_width=frame_width,
        frame_height=frame_height,
    )

    return {
        "targeting": targeting.get_status(),
        "turret": controller.get_status(),
        "last_output": output.to_dict(),
    }
