"""
Pluggable transport layer for turret actuator control.

Provides an abstraction over the physical link between the control
software and the pan/tilt hardware. Implementations:

- SimulatedTransport: Logs commands, updates virtual state (no hardware)
- SerialTransport: Sends commands over USB/UART serial
- WifiUdpTransport: Sends commands over UDP (ESP32 Wi-Fi, etc.)

The transport layer is intentionally kept separate from the control
logic so that hardware changes never require rewriting the AI pipeline.

NOTE: This module controls pan/tilt positioning only.
      It does NOT control any firing or engagement mechanism.
"""

import json
import logging
import socket
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Optional

logger = logging.getLogger("drone_detector.turret_transport")


# =============================================================================
# Data Contracts
# =============================================================================


@dataclass
class ControlOutput:
    """
    Command sent from the supervisor to the actuator.

    yaw_rate and pitch_rate are normalized to [-1.0, 1.0].
    The transport layer maps these to hardware-specific values
    (PWM pulse widths, servo angles, motor speeds, etc.).
    """

    yaw_rate: float = 0.0  # -1.0 (full left) to 1.0 (full right)
    pitch_rate: float = 0.0  # -1.0 (full down) to 1.0 (full up)
    ttl_ms: int = 200  # Time-to-live: hardware should stop if no update
    timestamp: float = field(default_factory=time.time)

    def is_neutral(self) -> bool:
        """Check if this is a neutral (zero) command."""
        return abs(self.yaw_rate) < 0.001 and abs(self.pitch_rate) < 0.001

    def to_dict(self) -> dict[str, Any]:
        return {
            "yaw_rate": round(self.yaw_rate, 4),
            "pitch_rate": round(self.pitch_rate, 4),
            "ttl_ms": self.ttl_ms,
            "timestamp": self.timestamp,
        }


class TransportHealth(Enum):
    """Health status of the transport link."""

    OK = "ok"
    DEGRADED = "degraded"  # High latency or packet loss
    DISCONNECTED = "disconnected"
    ERROR = "error"


@dataclass
class TransportStatus:
    """Current status of the transport link."""

    health: TransportHealth = TransportHealth.DISCONNECTED
    last_send_time: float = 0.0
    last_ack_time: float = 0.0
    commands_sent: int = 0
    errors: int = 0
    latency_ms: float = 0.0

    def to_dict(self) -> dict[str, Any]:
        return {
            "health": self.health.value,
            "last_send_time": self.last_send_time,
            "commands_sent": self.commands_sent,
            "errors": self.errors,
            "latency_ms": round(self.latency_ms, 2),
        }


# =============================================================================
# Abstract Transport Interface
# =============================================================================


class ActuatorTransport(ABC):
    """
    Abstract interface for sending control commands to turret hardware.

    All transports must implement:
    - connect/disconnect lifecycle
    - send() for control commands
    - health reporting
    - neutral fallback on disconnect/error
    """

    @abstractmethod
    def connect(self) -> bool:
        """Establish connection. Returns True on success."""

    @abstractmethod
    def disconnect(self) -> None:
        """Close connection and send neutral command."""

    @abstractmethod
    def send(self, output: ControlOutput) -> bool:
        """
        Send a control command. Returns True if sent successfully.

        Implementations should send a neutral command on failure
        or when the link is unhealthy.
        """

    @abstractmethod
    def send_neutral(self) -> bool:
        """Send a neutral (zero movement) command."""

    @property
    @abstractmethod
    def status(self) -> TransportStatus:
        """Current transport link status."""

    @property
    @abstractmethod
    def transport_info(self) -> dict[str, Any]:
        """Transport type and configuration for debugging."""


# =============================================================================
# Simulated Transport (No Hardware)
# =============================================================================


class SimulatedTransport(ActuatorTransport):
    """
    Simulated transport for development and testing.

    Logs commands and maintains a virtual turret state.
    Use this to develop and tune the control pipeline
    before any hardware is connected.
    """

    def __init__(self, log_commands: bool = True):
        self._log_commands = log_commands
        self._connected = False
        self._status = TransportStatus()

        # Virtual turret state (degrees)
        self._virtual_yaw: float = 0.0
        self._virtual_pitch: float = 0.0
        self._yaw_speed_dps: float = 90.0  # degrees per second at rate=1.0
        self._pitch_speed_dps: float = 60.0
        self._last_update_time: float = 0.0

    @property
    def virtual_yaw(self) -> float:
        """Current virtual yaw angle (degrees)."""
        return self._virtual_yaw

    @property
    def virtual_pitch(self) -> float:
        """Current virtual pitch angle (degrees)."""
        return self._virtual_pitch

    def connect(self) -> bool:
        self._connected = True
        self._status.health = TransportHealth.OK
        self._last_update_time = time.time()
        logger.info("Simulated transport connected (virtual turret)")
        return True

    def disconnect(self) -> None:
        self.send_neutral()
        self._connected = False
        self._status.health = TransportHealth.DISCONNECTED
        logger.info("Simulated transport disconnected")

    def send(self, output: ControlOutput) -> bool:
        if not self._connected:
            return False

        now = time.time()
        dt = now - self._last_update_time if self._last_update_time > 0 else 0.033
        self._last_update_time = now

        # Update virtual position
        self._virtual_yaw += output.yaw_rate * self._yaw_speed_dps * dt
        self._virtual_pitch += output.pitch_rate * self._pitch_speed_dps * dt

        # Clamp to realistic bounds
        self._virtual_yaw = max(-180.0, min(180.0, self._virtual_yaw))
        self._virtual_pitch = max(-45.0, min(90.0, self._virtual_pitch))

        self._status.last_send_time = now
        self._status.commands_sent += 1
        self._status.latency_ms = 0.1  # Simulated

        if self._log_commands and not output.is_neutral():
            logger.debug(
                f"SIM turret: yaw_rate={output.yaw_rate:+.3f} "
                f"pitch_rate={output.pitch_rate:+.3f} "
                f"-> pos=({self._virtual_yaw:.1f}, {self._virtual_pitch:.1f})"
            )

        return True

    def send_neutral(self) -> bool:
        return self.send(ControlOutput(yaw_rate=0.0, pitch_rate=0.0))

    @property
    def status(self) -> TransportStatus:
        return self._status

    @property
    def transport_info(self) -> dict[str, Any]:
        return {
            "type": "simulated",
            "connected": self._connected,
            "virtual_yaw": round(self._virtual_yaw, 2),
            "virtual_pitch": round(self._virtual_pitch, 2),
        }


# =============================================================================
# Serial Transport (USB/UART)
# =============================================================================


class SerialTransport(ActuatorTransport):
    """
    Serial transport for USB/UART communication.

    Sends commands as simple text protocol:
        Y:<yaw_rate> P:<pitch_rate> T:<ttl_ms>\\n

    This is designed to work with Arduino/ESP32/STM32 firmware
    that reads serial and outputs servo PWM.

    Requires pyserial: pip install pyserial
    """

    def __init__(
        self,
        port: str = "/dev/ttyUSB0",
        baudrate: int = 115200,
        timeout: float = 0.1,
    ):
        self._port = port
        self._baudrate = baudrate
        self._timeout = timeout
        self._serial = None
        self._connected = False
        self._status = TransportStatus()

    def connect(self) -> bool:
        try:
            import serial

            self._serial = serial.Serial(
                port=self._port,
                baudrate=self._baudrate,
                timeout=self._timeout,
            )
            self._connected = True
            self._status.health = TransportHealth.OK
            logger.info(f"Serial transport connected: {self._port} @ {self._baudrate}")
            return True
        except ImportError:
            logger.error("pyserial not installed: pip install pyserial")
            self._status.health = TransportHealth.ERROR
            return False
        except Exception as e:
            logger.error(f"Serial connection failed: {e}")
            self._status.health = TransportHealth.ERROR
            return False

    def disconnect(self) -> None:
        self.send_neutral()
        if self._serial and self._serial.is_open:
            self._serial.close()
        self._connected = False
        self._status.health = TransportHealth.DISCONNECTED
        logger.info("Serial transport disconnected")

    def send(self, output: ControlOutput) -> bool:
        if not self._connected or not self._serial or not self._serial.is_open:
            self._status.errors += 1
            return False

        try:
            # Simple text protocol — easy to parse on microcontroller
            cmd = (
                f"Y:{output.yaw_rate:+.4f} "
                f"P:{output.pitch_rate:+.4f} "
                f"T:{output.ttl_ms}\n"
            )
            self._serial.write(cmd.encode("ascii"))
            self._serial.flush()

            self._status.last_send_time = time.time()
            self._status.commands_sent += 1
            return True
        except Exception as e:
            logger.error(f"Serial send failed: {e}")
            self._status.errors += 1
            self._status.health = TransportHealth.DEGRADED
            return False

    def send_neutral(self) -> bool:
        return self.send(ControlOutput(yaw_rate=0.0, pitch_rate=0.0))

    @property
    def status(self) -> TransportStatus:
        return self._status

    @property
    def transport_info(self) -> dict[str, Any]:
        return {
            "type": "serial",
            "port": self._port,
            "baudrate": self._baudrate,
            "connected": self._connected,
        }


# =============================================================================
# Wi-Fi UDP Transport
# =============================================================================


class WifiUdpTransport(ActuatorTransport):
    """
    UDP transport for Wi-Fi-connected microcontrollers.

    Sends JSON commands to an ESP32/similar over UDP.
    No connection state — UDP is fire-and-forget.
    The microcontroller must implement its own TTL watchdog.
    """

    def __init__(
        self,
        host: str = "192.168.4.1",  # ESP32 AP default
        port: int = 4210,
    ):
        self._host = host
        self._port = port
        self._sock: Optional[socket.socket] = None
        self._connected = False
        self._status = TransportStatus()

    def connect(self) -> bool:
        try:
            self._sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            self._sock.settimeout(0.1)
            self._connected = True
            self._status.health = TransportHealth.OK
            logger.info(f"UDP transport ready: {self._host}:{self._port}")
            return True
        except Exception as e:
            logger.error(f"UDP socket creation failed: {e}")
            self._status.health = TransportHealth.ERROR
            return False

    def disconnect(self) -> None:
        self.send_neutral()
        if self._sock:
            self._sock.close()
        self._sock = None
        self._connected = False
        self._status.health = TransportHealth.DISCONNECTED
        logger.info("UDP transport disconnected")

    def send(self, output: ControlOutput) -> bool:
        if not self._connected or not self._sock:
            return False

        try:
            payload = json.dumps(output.to_dict()).encode("utf-8")
            self._sock.sendto(payload, (self._host, self._port))

            self._status.last_send_time = time.time()
            self._status.commands_sent += 1
            return True
        except Exception as e:
            logger.error(f"UDP send failed: {e}")
            self._status.errors += 1
            self._status.health = TransportHealth.DEGRADED
            return False

    def send_neutral(self) -> bool:
        return self.send(ControlOutput(yaw_rate=0.0, pitch_rate=0.0))

    @property
    def status(self) -> TransportStatus:
        return self._status

    @property
    def transport_info(self) -> dict[str, Any]:
        return {
            "type": "wifi_udp",
            "host": self._host,
            "port": self._port,
            "connected": self._connected,
        }


# =============================================================================
# Factory
# =============================================================================


def create_transport(
    transport_type: str = "simulated",
    **kwargs,
) -> ActuatorTransport:
    """
    Factory function to create a transport backend.

    Args:
        transport_type: "simulated", "serial", "wifi_udp"
        **kwargs: Passed to the transport constructor

    Returns:
        Configured ActuatorTransport instance
    """
    if transport_type == "simulated":
        return SimulatedTransport(
            log_commands=kwargs.get("log_commands", True),
        )

    if transport_type == "serial":
        return SerialTransport(
            port=kwargs.get("port", "/dev/ttyUSB0"),
            baudrate=kwargs.get("baudrate", 115200),
            timeout=kwargs.get("timeout", 0.1),
        )

    if transport_type == "wifi_udp":
        return WifiUdpTransport(
            host=kwargs.get("host", "192.168.4.1"),
            port=kwargs.get("port", 4210),
        )

    raise ValueError(f"Unknown transport type: {transport_type}")
