"""
Targeting and engagement system for drone interception.

Provides:
- Distance estimation using pinhole camera model
- Target acquisition and lock management
- Fire net controller with safety interlocks

WARNING: This module can control physical hardware (GPIO).
Ensure proper safety measures are in place before enabling.
"""

import logging
import time
import math
from enum import Enum
from dataclasses import dataclass, field
from typing import Optional, List, Tuple, Dict, Any

from interfaces import Detection, BoundingBox, TrackedObject
from config.settings import TargetingSettings
from config.constants import (
    DRONE_SIZE_DEFAULT,
    DEFAULT_FOCAL_LENGTH_MM,
    DEFAULT_SENSOR_WIDTH_MM,
    FIRE_NET_PULSE_DURATION,
)

logger = logging.getLogger("drone_detector.targeting")


# =============================================================================
# Enums and Data Classes
# =============================================================================

class TargetState(Enum):
    """Target engagement states."""
    SEARCHING = "searching"      # Looking for targets
    TRACKING = "tracking"        # Target acquired, building confidence
    LOCKED = "locked"            # Target locked, ready to engage
    ENGAGING = "engaging"        # Active engagement
    COOLDOWN = "cooldown"        # Post-engagement cooldown


class EngagementResult(Enum):
    """Result of engagement attempt."""
    SUCCESS = "success"
    FAILED_NOT_ARMED = "failed_not_armed"
    FAILED_NOT_ENABLED = "failed_not_enabled"
    FAILED_IN_COOLDOWN = "failed_in_cooldown"
    FAILED_LOW_CONFIDENCE = "failed_low_confidence"
    FAILED_INSUFFICIENT_TRACK = "failed_insufficient_track"
    FAILED_OUT_OF_RANGE = "failed_out_of_range"
    FAILED_TOO_FAST = "failed_too_fast"
    FAILED_HARDWARE = "failed_hardware"


@dataclass
class TargetLock:
    """Information about a locked target."""
    track_id: int
    detection: Detection
    lock_time: float
    estimated_distance_m: float
    estimated_velocity_ms: Tuple[float, float] = (0.0, 0.0)
    confidence_history: List[float] = field(default_factory=list)
    position_history: List[Tuple[int, int]] = field(default_factory=list)

    @property
    def average_confidence(self) -> float:
        """Average confidence over history."""
        if not self.confidence_history:
            return 0.0
        return sum(self.confidence_history) / len(self.confidence_history)

    @property
    def lock_duration(self) -> float:
        """Seconds since lock was acquired."""
        return time.time() - self.lock_time

    @property
    def frames_locked(self) -> int:
        """Number of frames with this lock."""
        return len(self.confidence_history)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for logging."""
        return {
            'track_id': self.track_id,
            'lock_duration': self.lock_duration,
            'frames_locked': self.frames_locked,
            'estimated_distance_m': self.estimated_distance_m,
            'average_confidence': self.average_confidence,
            'velocity_ms': self.estimated_velocity_ms,
        }


# =============================================================================
# Distance Estimation
# =============================================================================

class DistanceEstimator:
    """
    Estimate distance to detected objects using pinhole camera model.

    Uses known (assumed) object size and camera focal length to estimate
    distance based on apparent size in the image.

    Formula:
        distance = (real_size * focal_length_px) / apparent_size_px

    Where:
        focal_length_px = (focal_length_mm / sensor_width_mm) * image_width_px
    """

    def __init__(
        self,
        focal_length_mm: float = DEFAULT_FOCAL_LENGTH_MM,
        sensor_width_mm: float = DEFAULT_SENSOR_WIDTH_MM,
        assumed_object_size_m: float = DRONE_SIZE_DEFAULT,
    ):
        """
        Initialize distance estimator.

        Args:
            focal_length_mm: Camera focal length in mm
            sensor_width_mm: Camera sensor width in mm
            assumed_object_size_m: Assumed real-world size of detected object
        """
        self._focal_length_mm = focal_length_mm
        self._sensor_width_mm = sensor_width_mm
        self._assumed_size_m = assumed_object_size_m

    def estimate(
        self,
        bbox: BoundingBox,
        frame_width: int,
    ) -> float:
        """
        Estimate distance to object.

        Args:
            bbox: Detected object bounding box
            frame_width: Frame width in pixels

        Returns:
            Estimated distance in meters
        """
        # Use larger dimension for more stable estimate
        bbox_size_px = max(bbox.width, bbox.height)

        if bbox_size_px <= 0:
            return float('inf')

        # Convert focal length to pixels
        focal_length_px = (self._focal_length_mm / self._sensor_width_mm) * frame_width

        # Distance estimation using pinhole model
        distance_m = (self._assumed_size_m * focal_length_px) / bbox_size_px

        return distance_m

    def estimate_from_tuple(
        self,
        bbox: Tuple[int, int, int, int],
        frame_width: int,
    ) -> float:
        """
        Estimate distance from bbox tuple.

        Args:
            bbox: (x1, y1, x2, y2) bounding box
            frame_width: Frame width in pixels

        Returns:
            Estimated distance in meters
        """
        width = bbox[2] - bbox[0]
        height = bbox[3] - bbox[1]
        bbox_size_px = max(width, height)

        if bbox_size_px <= 0:
            return float('inf')

        focal_length_px = (self._focal_length_mm / self._sensor_width_mm) * frame_width
        distance_m = (self._assumed_size_m * focal_length_px) / bbox_size_px

        return distance_m

    def set_assumed_size(self, size_m: float) -> None:
        """Update assumed object size."""
        self._assumed_size_m = size_m


# =============================================================================
# Targeting System
# =============================================================================

class TargetingSystem:
    """
    Target acquisition and tracking system.

    Manages target locks, distance estimation, and engagement decisions.
    """

    def __init__(self, settings: TargetingSettings):
        """
        Initialize targeting system.

        Args:
            settings: Targeting configuration
        """
        self._settings = settings
        self._distance_estimator = DistanceEstimator(
            assumed_object_size_m=settings.assumed_drone_size_m,
        )
        self._current_lock: Optional[TargetLock] = None
        self._state = TargetState.SEARCHING
        self._last_state_change = time.time()

    @property
    def state(self) -> TargetState:
        """Current targeting state."""
        return self._state

    @property
    def current_lock(self) -> Optional[TargetLock]:
        """Current target lock, if any."""
        return self._current_lock

    @property
    def is_locked(self) -> bool:
        """Whether a target is locked."""
        return self._state == TargetState.LOCKED

    def update(
        self,
        tracked_objects: List[TrackedObject],
        frame_width: int,
    ) -> Optional[TargetLock]:
        """
        Update targeting system with latest tracks.

        Args:
            tracked_objects: List of tracked objects from tracker
            frame_width: Frame width for distance estimation

        Returns:
            Current target lock if any
        """
        # Find best target candidate
        best_target = self._select_best_target(tracked_objects, frame_width)

        if best_target is None:
            self._handle_no_target()
            return None

        track, distance = best_target

        # Update or create lock
        if self._current_lock and self._current_lock.track_id == track.track_id:
            self._update_existing_lock(track, distance)
        else:
            self._create_new_lock(track, distance)

        return self._current_lock

    def _select_best_target(
        self,
        tracked_objects: List[TrackedObject],
        frame_width: int,
    ) -> Optional[Tuple[TrackedObject, float]]:
        """Select best target based on confidence, distance, and track quality."""
        candidates = []

        for track in tracked_objects:
            det = track.detection

            # Must be classified as drone
            if not det.is_drone:
                continue

            # Must meet minimum confidence for lock
            if det.confidence < self._settings.min_confidence_for_lock:
                continue

            # Estimate distance
            distance = self._distance_estimator.estimate(det.bbox, frame_width)

            # Must be within targeting range
            if distance > self._settings.max_targeting_distance_m:
                continue

            # Calculate target priority score
            # Higher is better: prefer closer, higher confidence, longer tracked
            score = (
                det.confidence * 0.4 +
                (1 - min(distance / self._settings.max_targeting_distance_m, 1.0)) * 0.3 +
                min(track.frames_tracked / 30, 1.0) * 0.3
            )

            candidates.append((track, distance, score))

        if not candidates:
            return None

        # Return highest scoring target
        candidates.sort(key=lambda x: x[2], reverse=True)
        return (candidates[0][0], candidates[0][1])

    def _handle_no_target(self) -> None:
        """Handle loss of target."""
        if self._current_lock:
            if self._current_lock.lock_duration > self._settings.lock_timeout_seconds:
                logger.info(
                    f"Target lock lost: track {self._current_lock.track_id} "
                    f"(timeout after {self._current_lock.lock_duration:.1f}s)"
                )
                self._current_lock = None
                self._set_state(TargetState.SEARCHING)

    def _update_existing_lock(self, track: TrackedObject, distance: float) -> None:
        """Update existing target lock with new data."""
        self._current_lock.detection = track.detection
        self._current_lock.estimated_distance_m = distance
        self._current_lock.estimated_velocity_ms = track.velocity
        self._current_lock.confidence_history.append(track.detection.confidence)
        self._current_lock.position_history.append(track.detection.bbox.center)

        # Keep history bounded
        max_history = 60
        if len(self._current_lock.confidence_history) > max_history:
            self._current_lock.confidence_history.pop(0)
        if len(self._current_lock.position_history) > max_history:
            self._current_lock.position_history.pop(0)

        # Upgrade to LOCKED if stable enough
        if self._state == TargetState.TRACKING:
            if (
                len(self._current_lock.confidence_history) >= 10 and
                self._current_lock.average_confidence >= self._settings.min_confidence_for_lock
            ):
                self._set_state(TargetState.LOCKED)
                logger.warning(
                    f"TARGET LOCKED: track {track.track_id}, "
                    f"distance {distance:.1f}m, "
                    f"confidence {self._current_lock.average_confidence:.2f}"
                )

    def _create_new_lock(self, track: TrackedObject, distance: float) -> None:
        """Create new target lock."""
        self._current_lock = TargetLock(
            track_id=track.track_id,
            detection=track.detection,
            lock_time=time.time(),
            estimated_distance_m=distance,
            estimated_velocity_ms=track.velocity,
            confidence_history=[track.detection.confidence],
            position_history=[track.detection.bbox.center],
        )
        self._set_state(TargetState.TRACKING)
        logger.info(
            f"Target acquired: track {track.track_id}, distance {distance:.1f}m"
        )

    def _set_state(self, new_state: TargetState) -> None:
        """Update targeting state."""
        if new_state != self._state:
            logger.debug(f"Targeting state: {self._state.value} -> {new_state.value}")
            self._state = new_state
            self._last_state_change = time.time()

    def can_engage(self) -> bool:
        """Check if current target can be engaged."""
        return self._state == TargetState.LOCKED and self._current_lock is not None

    def get_lead_point(self) -> Optional[Tuple[int, int]]:
        """
        Calculate lead point for interception.

        Returns predicted target position accounting for velocity
        and lead factor for interception.

        Returns:
            (x, y) pixel coordinates of lead point, or None
        """
        if not self._current_lock:
            return None

        det = self._current_lock.detection
        cx, cy = det.bbox.center
        vx, vy = self._current_lock.estimated_velocity_ms

        # Apply lead factor
        lead_x = int(cx + vx * self._settings.tracking_lead_factor)
        lead_y = int(cy + vy * self._settings.tracking_lead_factor)

        return (lead_x, lead_y)

    def reset(self) -> None:
        """Reset targeting system."""
        self._current_lock = None
        self._set_state(TargetState.SEARCHING)

    def get_status(self) -> Dict[str, Any]:
        """Get targeting system status for display/logging."""
        return {
            'state': self._state.value,
            'locked': self.is_locked,
            'lock': self._current_lock.to_dict() if self._current_lock else None,
            'state_duration': time.time() - self._last_state_change,
        }


# =============================================================================
# Fire Net Controller
# =============================================================================

class FireNetController:
    """
    Controller for fire net deployment system.

    SAFETY CRITICAL: This controls physical hardware.
    Multiple safety interlocks are implemented:

    1. System must be explicitly armed
    2. Fire net must be enabled in settings
    3. Cooldown period between fires
    4. Minimum target confidence
    5. Minimum track duration
    6. Distance envelope (not too far, not too close)
    7. Velocity threshold (don't fire at very fast targets)
    """

    def __init__(self, settings: TargetingSettings):
        """
        Initialize fire net controller.

        Args:
            settings: Targeting configuration
        """
        self._settings = settings
        self._is_armed = False
        self._last_fire_time = 0.0
        self._fire_count = 0
        self._gpio_initialized = False
        self._gpio = None

    @property
    def is_armed(self) -> bool:
        """Whether the fire net is armed."""
        return self._is_armed

    @property
    def is_enabled(self) -> bool:
        """Whether fire net is enabled in settings."""
        return self._settings.fire_net_enabled

    @property
    def in_cooldown(self) -> bool:
        """Whether system is in post-fire cooldown."""
        elapsed = time.time() - self._last_fire_time
        return elapsed < self._settings.fire_net_cooldown_seconds

    @property
    def cooldown_remaining(self) -> float:
        """Seconds remaining in cooldown."""
        elapsed = time.time() - self._last_fire_time
        remaining = self._settings.fire_net_cooldown_seconds - elapsed
        return max(0.0, remaining)

    @property
    def fire_count(self) -> int:
        """Total number of fires."""
        return self._fire_count

    def arm(self) -> bool:
        """
        Arm the fire net system.

        Returns:
            True if successfully armed
        """
        if not self._settings.fire_net_enabled:
            logger.warning("Cannot arm: fire net is disabled in settings")
            return False

        if not self._settings.fire_net_arm_required:
            logger.warning("WARNING: Arm requirement bypassed in settings")

        self._init_gpio()
        self._is_armed = True
        logger.warning("FIRE NET ARMED")
        return True

    def disarm(self) -> None:
        """Disarm the fire net system."""
        self._is_armed = False
        logger.info("Fire net disarmed")

    def check_engagement(
        self,
        track: TrackedObject,
        estimated_distance: float,
    ) -> Tuple[bool, EngagementResult]:
        """
        Check if all conditions are met for firing.

        Args:
            track: Target track
            estimated_distance: Estimated distance to target

        Returns:
            (can_fire, reason)
        """
        # Safety interlock checks
        if not self._settings.fire_net_enabled:
            return (False, EngagementResult.FAILED_NOT_ENABLED)

        if not self._is_armed:
            return (False, EngagementResult.FAILED_NOT_ARMED)

        if self.in_cooldown:
            return (False, EngagementResult.FAILED_IN_COOLDOWN)

        det = track.detection

        # Confidence check
        if det.drone_score < self._settings.fire_net_min_confidence:
            return (False, EngagementResult.FAILED_LOW_CONFIDENCE)

        # Track stability check
        if track.frames_tracked < self._settings.fire_net_min_track_frames:
            return (False, EngagementResult.FAILED_INSUFFICIENT_TRACK)

        # Distance envelope check - not too far
        if estimated_distance > self._settings.fire_net_max_distance_m:
            return (False, EngagementResult.FAILED_OUT_OF_RANGE)

        # Distance envelope check - not too close (safety)
        if estimated_distance < self._settings.fire_net_min_distance_m:
            return (False, EngagementResult.FAILED_OUT_OF_RANGE)

        # Velocity check - don't fire at very fast targets
        velocity = math.sqrt(track.velocity[0]**2 + track.velocity[1]**2)
        if velocity > self._settings.fire_net_velocity_threshold_ms:
            return (False, EngagementResult.FAILED_TOO_FAST)

        return (True, EngagementResult.SUCCESS)

    def fire(self, track: TrackedObject, estimated_distance: float) -> EngagementResult:
        """
        Deploy fire net.

        Args:
            track: Target track
            estimated_distance: Estimated distance to target

        Returns:
            Engagement result
        """
        can_fire, result = self.check_engagement(track, estimated_distance)

        if not can_fire:
            logger.debug(f"Fire rejected: {result.value}")
            return result

        logger.warning(
            f"FIRE NET DEPLOYED at track {track.track_id}, "
            f"distance {estimated_distance:.1f}m, "
            f"confidence {track.detection.drone_score:.2f}"
        )

        if not self._trigger_gpio():
            return EngagementResult.FAILED_HARDWARE

        self._last_fire_time = time.time()
        self._fire_count += 1

        return EngagementResult.SUCCESS

    def _init_gpio(self) -> None:
        """Initialize GPIO for fire net trigger."""
        if self._gpio_initialized:
            return

        try:
            import RPi.GPIO as GPIO
            self._gpio = GPIO
            GPIO.setmode(GPIO.BCM)
            GPIO.setup(self._settings.fire_net_gpio_pin, GPIO.OUT)
            GPIO.output(self._settings.fire_net_gpio_pin, GPIO.LOW)
            self._gpio_initialized = True
            logger.info(f"GPIO pin {self._settings.fire_net_gpio_pin} initialized")
        except ImportError:
            logger.warning("RPi.GPIO not available - fire net will be simulated")
        except Exception as e:
            logger.error(f"GPIO initialization failed: {e}")

    def _trigger_gpio(self) -> bool:
        """
        Send trigger pulse to GPIO.

        Returns:
            True if pulse sent successfully
        """
        if self._gpio is None:
            logger.info("GPIO trigger simulated (no hardware)")
            return True

        try:
            self._gpio.output(self._settings.fire_net_gpio_pin, self._gpio.HIGH)
            time.sleep(FIRE_NET_PULSE_DURATION)
            self._gpio.output(self._settings.fire_net_gpio_pin, self._gpio.LOW)
            return True
        except Exception as e:
            logger.error(f"GPIO trigger failed: {e}")
            return False

    def cleanup(self) -> None:
        """Clean up GPIO resources."""
        self.disarm()
        if self._gpio_initialized and self._gpio is not None:
            try:
                self._gpio.cleanup(self._settings.fire_net_gpio_pin)
            except Exception:
                pass
            self._gpio_initialized = False
            self._gpio = None

    def get_status(self) -> Dict[str, Any]:
        """Get fire net status for display/logging."""
        return {
            'enabled': self.is_enabled,
            'armed': self.is_armed,
            'in_cooldown': self.in_cooldown,
            'cooldown_remaining': self.cooldown_remaining,
            'fire_count': self.fire_count,
            'gpio_initialized': self._gpio_initialized,
        }


# =============================================================================
# Combined Engagement System
# =============================================================================

class EngagementSystem:
    """
    Combined targeting and fire net system.

    Integrates target acquisition, tracking, and engagement control
    into a single cohesive system.
    """

    def __init__(self, settings: TargetingSettings):
        """
        Initialize engagement system.

        Args:
            settings: Targeting configuration
        """
        self._settings = settings
        self._targeting = TargetingSystem(settings)
        self._fire_net = FireNetController(settings)

    @property
    def targeting(self) -> TargetingSystem:
        """Targeting subsystem."""
        return self._targeting

    @property
    def fire_net(self) -> FireNetController:
        """Fire net subsystem."""
        return self._fire_net

    def update(
        self,
        tracked_objects: List[TrackedObject],
        frame_width: int,
        auto_engage: bool = False,
    ) -> Dict[str, Any]:
        """
        Update engagement system.

        Args:
            tracked_objects: Current tracked objects
            frame_width: Frame width for distance estimation
            auto_engage: Automatically fire when conditions met

        Returns:
            Status dictionary
        """
        # Update targeting
        lock = self._targeting.update(tracked_objects, frame_width)

        engagement_result = None

        # Check for auto-engagement
        if auto_engage and lock and self._targeting.can_engage():
            can_fire, result = self._fire_net.check_engagement(
                TrackedObject(
                    track_id=lock.track_id,
                    detection=lock.detection,
                    frames_tracked=lock.frames_locked,
                    velocity=lock.estimated_velocity_ms,
                ),
                lock.estimated_distance_m,
            )

            if can_fire:
                engagement_result = self._fire_net.fire(
                    TrackedObject(
                        track_id=lock.track_id,
                        detection=lock.detection,
                        frames_tracked=lock.frames_locked,
                        velocity=lock.estimated_velocity_ms,
                    ),
                    lock.estimated_distance_m,
                )

        return {
            'targeting': self._targeting.get_status(),
            'fire_net': self._fire_net.get_status(),
            'engagement_result': engagement_result.value if engagement_result else None,
        }

    def arm(self) -> bool:
        """Arm the fire net."""
        return self._fire_net.arm()

    def disarm(self) -> None:
        """Disarm the fire net."""
        self._fire_net.disarm()

    def reset(self) -> None:
        """Reset entire engagement system."""
        self._targeting.reset()
        self._fire_net.disarm()

    def cleanup(self) -> None:
        """Clean up resources."""
        self._fire_net.cleanup()
