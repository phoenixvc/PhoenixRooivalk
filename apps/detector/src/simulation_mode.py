#!/usr/bin/env python3
"""
Simulation mode for training and testing without live threats.

Provides:
- Synthetic drone injection into real or simulated camera feeds
- Configurable flight patterns (hover, approach, evasive, swarm)
- Ground truth labels for accuracy measurement
- Operator training scenarios
- Stress testing with edge cases

Use cases:
- Operator training without live threats
- System validation and testing
- Detection accuracy benchmarking
- Edge case testing (swarms, fast movement, occlusion)
"""

import logging
import math
import random
import threading
import time
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, Optional

import numpy as np

from interfaces import BoundingBox, Detection

logger = logging.getLogger("drone_detector.simulation")


class FlightPattern(Enum):
    """Simulated flight patterns."""

    HOVER = "hover"  # Stationary
    LINEAR = "linear"  # Straight line
    APPROACH = "approach"  # Moving toward camera
    RETREAT = "retreat"  # Moving away from camera
    ORBIT = "orbit"  # Circular path
    FIGURE_EIGHT = "figure_eight"  # Figure-8 pattern
    RANDOM = "random"  # Random walk
    EVASIVE = "evasive"  # Quick direction changes
    SWARM = "swarm"  # Coordinated group movement


class DroneAppearance(Enum):
    """Visual appearance of simulated drones."""

    QUADCOPTER_SMALL = "quadcopter_small"  # DJI Mini style
    QUADCOPTER_MEDIUM = "quadcopter_medium"  # Phantom style
    QUADCOPTER_LARGE = "quadcopter_large"  # M600 style
    FIXED_WING = "fixed_wing"  # Wing-shaped
    HELICOPTER = "helicopter"  # Single rotor
    FPV_RACER = "fpv_racer"  # Small, fast
    CUSTOM = "custom"  # User-defined


@dataclass
class SimulatedDrone:
    """A simulated drone in the scene."""

    drone_id: int
    appearance: DroneAppearance
    flight_pattern: FlightPattern

    # Position in world coordinates (meters)
    position: tuple[float, float, float] = (0.0, 0.0, 50.0)  # x, y, z
    velocity: tuple[float, float, float] = (0.0, 0.0, 0.0)  # m/s
    rotation: float = 0.0  # degrees

    # Size parameters
    size_m: float = 0.3  # Real-world size in meters
    size_variance: float = 0.1  # Random size variation

    # Visual parameters
    brightness: float = 1.0  # Relative brightness
    blur: float = 0.0  # Motion blur amount
    occlusion: float = 0.0  # Partial occlusion (0-1)

    # Flight pattern parameters
    pattern_params: dict[str, Any] = field(default_factory=dict)

    # State
    is_active: bool = True
    spawn_time: float = 0.0
    lifetime: float = float("inf")


@dataclass
class SimulationScenario:
    """A complete simulation scenario."""

    name: str
    description: str
    duration_seconds: float
    drones: list[SimulatedDrone] = field(default_factory=list)

    # Environment
    time_of_day: str = "day"  # "day", "dusk", "night"
    weather: str = "clear"  # "clear", "cloudy", "rain"
    wind_speed_ms: float = 0.0

    # Camera
    camera_position: tuple[float, float, float] = (0.0, 0.0, 0.0)
    camera_rotation: tuple[float, float, float] = (0.0, 0.0, 0.0)  # yaw, pitch, roll

    # Ground truth
    expected_detections: int = 0
    difficulty: str = "medium"  # "easy", "medium", "hard", "extreme"


@dataclass
class GroundTruth:
    """Ground truth for a single frame."""

    frame_number: int
    timestamp: float
    drones: list[dict[str, Any]] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "frame_number": self.frame_number,
            "timestamp": self.timestamp,
            "drone_count": len(self.drones),
            "drones": self.drones,
        }


class DroneRenderer:
    """
    Renders simulated drones onto camera frames.

    Supports various appearance types and visual effects.
    """

    # Drone sprite templates (would be loaded from assets in production)
    SPRITE_SIZES = {
        DroneAppearance.QUADCOPTER_SMALL: (40, 40),
        DroneAppearance.QUADCOPTER_MEDIUM: (60, 60),
        DroneAppearance.QUADCOPTER_LARGE: (80, 80),
        DroneAppearance.FIXED_WING: (70, 30),
        DroneAppearance.HELICOPTER: (50, 50),
        DroneAppearance.FPV_RACER: (30, 30),
        DroneAppearance.CUSTOM: (50, 50),
    }

    def __init__(
        self,
        sprite_path: Optional[str] = None,
        use_3d_rendering: bool = False,
    ):
        """
        Initialize drone renderer.

        Args:
            sprite_path: Path to drone sprite images
            use_3d_rendering: Use 3D rendering (requires OpenGL)
        """
        self._sprite_path = Path(sprite_path) if sprite_path else None
        self._use_3d = use_3d_rendering
        self._sprites: dict[DroneAppearance, np.ndarray] = {}

        self._load_sprites()

    def _load_sprites(self) -> None:
        """Load drone sprite images."""
        for appearance in DroneAppearance:
            if self._sprite_path:
                sprite_file = self._sprite_path / f"{appearance.value}.png"
                if sprite_file.exists():
                    # Load actual sprite (would use cv2.imread in production)
                    pass

            # Create placeholder sprite
            size = self.SPRITE_SIZES.get(appearance, (50, 50))
            sprite = self._create_placeholder_sprite(size, appearance)
            self._sprites[appearance] = sprite

    def _create_placeholder_sprite(
        self,
        size: tuple[int, int],
        appearance: DroneAppearance,
    ) -> np.ndarray:
        """Create a placeholder drone sprite."""
        w, h = size
        sprite = np.zeros((h, w, 4), dtype=np.uint8)

        # Draw based on appearance type
        if appearance in [
            DroneAppearance.QUADCOPTER_SMALL,
            DroneAppearance.QUADCOPTER_MEDIUM,
            DroneAppearance.QUADCOPTER_LARGE,
        ]:
            # X-shaped quadcopter
            center = (w // 2, h // 2)
            for angle in [45, 135, 225, 315]:
                rad = math.radians(angle)
                arm_len = min(w, h) // 2 - 5
                end_x = int(center[0] + arm_len * math.cos(rad))
                int(center[1] + arm_len * math.sin(rad))
                # Draw arm (simplified)
                sprite[
                    center[1] - 1 : center[1] + 2, min(center[0], end_x) : max(center[0], end_x) + 1
                ] = [50, 50, 50, 255]

            # Center body
            sprite[center[1] - 3 : center[1] + 4, center[0] - 3 : center[0] + 4] = [80, 80, 80, 255]

        elif appearance == DroneAppearance.FIXED_WING:
            # Wing shape
            sprite[h // 2 - 2 : h // 2 + 3, 5 : w - 5] = [60, 60, 60, 255]  # Wing
            sprite[h // 2 - 5 : h // 2 + 6, w // 2 - 3 : w // 2 + 4] = [50, 50, 50, 255]  # Body

        else:
            # Generic circle
            center = (w // 2, h // 2)
            radius = min(w, h) // 3
            for y in range(h):
                for x in range(w):
                    if (x - center[0]) ** 2 + (y - center[1]) ** 2 <= radius**2:
                        sprite[y, x] = [70, 70, 70, 255]

        return sprite

    def render(
        self,
        frame: np.ndarray,
        drone: SimulatedDrone,
        camera_params: dict[str, Any],
    ) -> tuple[np.ndarray, Optional[BoundingBox]]:
        """
        Render a drone onto a frame.

        Args:
            frame: Input frame (modified in place)
            drone: Drone to render
            camera_params: Camera intrinsic/extrinsic parameters

        Returns:
            (modified frame, bounding box) or (frame, None) if not visible
        """
        # Project 3D position to 2D image coordinates
        bbox = self._project_to_image(drone, camera_params)

        if bbox is None:
            return frame, None

        # Get sprite
        sprite = self._sprites.get(drone.appearance)
        if sprite is None:
            return frame, bbox

        # Scale sprite based on distance
        scale = self._calculate_scale(drone, camera_params)
        scaled_sprite = self._scale_sprite(sprite, scale)

        # Apply visual effects
        if drone.blur > 0:
            scaled_sprite = self._apply_motion_blur(scaled_sprite, drone.velocity, drone.blur)

        if drone.occlusion > 0:
            scaled_sprite = self._apply_occlusion(scaled_sprite, drone.occlusion)

        # Composite onto frame
        frame = self._composite(frame, scaled_sprite, bbox)

        return frame, bbox

    def _project_to_image(
        self,
        drone: SimulatedDrone,
        camera_params: dict[str, Any],
    ) -> Optional[BoundingBox]:
        """Project drone position to image coordinates."""
        # Simple pinhole camera projection
        focal_length = camera_params.get("focal_length_px", 500)
        center_x = camera_params.get("center_x", 320)
        center_y = camera_params.get("center_y", 240)
        frame_width = camera_params.get("width", 640)
        frame_height = camera_params.get("height", 480)

        x, y, z = drone.position
        if z <= 0:
            return None

        # Project to image plane
        img_x = int(focal_length * x / z + center_x)
        img_y = int(focal_length * y / z + center_y)

        # Calculate apparent size
        apparent_size = int(focal_length * drone.size_m / z)
        apparent_size = max(10, apparent_size)  # Minimum size

        # Apply size variance
        variance = int(apparent_size * drone.size_variance * (random.random() - 0.5))
        apparent_size += variance

        # Compute bounding box
        half_size = apparent_size // 2
        x1 = img_x - half_size
        y1 = img_y - half_size
        x2 = img_x + half_size
        y2 = img_y + half_size

        # Check if visible
        if x2 < 0 or x1 > frame_width or y2 < 0 or y1 > frame_height:
            return None

        # Clamp to frame
        x1 = max(0, x1)
        y1 = max(0, y1)
        x2 = min(frame_width, x2)
        y2 = min(frame_height, y2)

        return BoundingBox(x1, y1, x2, y2)

    def _calculate_scale(
        self,
        drone: SimulatedDrone,
        camera_params: dict[str, Any],
    ) -> float:
        """Calculate sprite scale based on distance."""
        z = drone.position[2]
        focal_length = camera_params.get("focal_length_px", 500)

        # Scale based on distance
        scale = (focal_length * drone.size_m / z) / 50  # 50px reference

        return max(0.1, min(3.0, scale))

    def _scale_sprite(self, sprite: np.ndarray, scale: float) -> np.ndarray:
        """Scale sprite by given factor."""
        if abs(scale - 1.0) < 0.01:
            return sprite

        h, w = sprite.shape[:2]
        new_w = max(1, int(w * scale))
        new_h = max(1, int(h * scale))

        # Simple nearest-neighbor resize (would use cv2.resize in production)
        scaled = np.zeros((new_h, new_w, sprite.shape[2]), dtype=sprite.dtype)
        for y in range(new_h):
            for x in range(new_w):
                src_x = int(x / scale)
                src_y = int(y / scale)
                if src_x < w and src_y < h:
                    scaled[y, x] = sprite[src_y, src_x]

        return scaled

    def _apply_motion_blur(
        self,
        sprite: np.ndarray,
        velocity: tuple[float, float, float],
        blur_amount: float,
    ) -> np.ndarray:
        """Apply motion blur effect."""
        # Simplified blur (would use cv2.filter2D in production)
        return sprite

    def _apply_occlusion(
        self,
        sprite: np.ndarray,
        occlusion: float,
    ) -> np.ndarray:
        """Apply partial occlusion."""
        # Remove part of sprite
        h, w = sprite.shape[:2]
        occlude_height = int(h * occlusion)

        sprite[:occlude_height, :] = 0
        return sprite

    def _composite(
        self,
        frame: np.ndarray,
        sprite: np.ndarray,
        bbox: BoundingBox,
    ) -> np.ndarray:
        """Composite sprite onto frame."""
        # Get region of interest
        x1, y1, x2, y2 = bbox.to_tuple()
        roi_h = y2 - y1
        roi_w = x2 - x1

        # Resize sprite to match ROI if needed
        sprite_h, sprite_w = sprite.shape[:2]
        if sprite_h != roi_h or sprite_w != roi_w:
            sprite = self._scale_sprite(
                sprite,
                min(roi_h / sprite_h, roi_w / sprite_w),
            )
            sprite_h, sprite_w = sprite.shape[:2]

        # Composite with alpha
        if sprite.shape[2] == 4:  # RGBA
            alpha = sprite[:, :, 3:4] / 255.0
            for c in range(3):
                frame[y1 : y1 + sprite_h, x1 : x1 + sprite_w, c] = (
                    alpha[:, :, 0] * sprite[:sprite_h, :sprite_w, c]
                    + (1 - alpha[:, :, 0]) * frame[y1 : y1 + sprite_h, x1 : x1 + sprite_w, c]
                ).astype(np.uint8)
        else:
            frame[y1 : y1 + sprite_h, x1 : x1 + sprite_w] = sprite[:sprite_h, :sprite_w]

        return frame


class FlightSimulator:
    """
    Simulates drone flight patterns.

    Updates drone positions based on their flight patterns.
    """

    def __init__(self):
        """Initialize flight simulator."""
        self._frame_time = 0.0
        self._last_update_time: float = 0.0

    def advance_time(self, dt: float) -> None:
        """
        Advance simulation time for the current frame.

        Call this once per frame before updating any drones.

        Args:
            dt: Time delta in seconds since last frame
        """
        self._frame_time += dt

    def update(self, drone: SimulatedDrone, dt: float) -> None:
        """
        Update drone position based on flight pattern.

        Args:
            drone: Drone to update
            dt: Time delta in seconds (used for position integration)
        """
        # Use frame time for time-dependent patterns (shared across all drones)
        simulation_time = self._frame_time

        pattern = drone.flight_pattern
        params = drone.pattern_params

        if pattern == FlightPattern.HOVER:
            # Small random perturbations
            drone.position = (
                drone.position[0] + random.gauss(0, 0.1),
                drone.position[1] + random.gauss(0, 0.1),
                drone.position[2] + random.gauss(0, 0.05),
            )
            drone.velocity = (0, 0, 0)

        elif pattern == FlightPattern.LINEAR:
            direction = params.get("direction", (1, 0, 0))
            speed = params.get("speed", 5.0)
            drone.velocity = (
                direction[0] * speed,
                direction[1] * speed,
                direction[2] * speed,
            )
            drone.position = (
                drone.position[0] + drone.velocity[0] * dt,
                drone.position[1] + drone.velocity[1] * dt,
                drone.position[2] + drone.velocity[2] * dt,
            )

        elif pattern == FlightPattern.APPROACH:
            target = params.get("target", (0, 0, 0))
            speed = params.get("speed", 10.0)

            # Direction to target
            dx = target[0] - drone.position[0]
            dy = target[1] - drone.position[1]
            dz = target[2] - drone.position[2]
            dist = (dx**2 + dy**2 + dz**2) ** 0.5

            if dist > 1:
                drone.velocity = (
                    dx / dist * speed,
                    dy / dist * speed,
                    dz / dist * speed,
                )
                drone.position = (
                    drone.position[0] + drone.velocity[0] * dt,
                    drone.position[1] + drone.velocity[1] * dt,
                    drone.position[2] + drone.velocity[2] * dt,
                )

        elif pattern == FlightPattern.ORBIT:
            center = params.get("center", (0, 0, 30))
            radius = params.get("radius", 20.0)
            angular_speed = params.get("angular_speed", 0.5)  # rad/s

            angle = simulation_time * angular_speed
            drone.position = (
                center[0] + radius * math.cos(angle),
                center[1] + radius * math.sin(angle),
                center[2],
            )
            # Tangential velocity
            drone.velocity = (
                -radius * angular_speed * math.sin(angle),
                radius * angular_speed * math.cos(angle),
                0,
            )

        elif pattern == FlightPattern.EVASIVE:
            base_speed = params.get("speed", 15.0)
            change_interval = params.get("change_interval", 0.5)

            prev_time = simulation_time - dt
            if int(simulation_time / change_interval) != int(prev_time / change_interval):
                # Change direction
                drone.velocity = (
                    random.uniform(-base_speed, base_speed),
                    random.uniform(-base_speed, base_speed),
                    random.uniform(-base_speed / 2, base_speed / 2),
                )

            drone.position = (
                drone.position[0] + drone.velocity[0] * dt,
                drone.position[1] + drone.velocity[1] * dt,
                drone.position[2] + drone.velocity[2] * dt,
            )

        elif pattern == FlightPattern.SWARM:
            # Would coordinate with other drones
            # Simplified: follow leader with offset
            leader_pos = params.get("leader_position", (0, 0, 30))
            offset = params.get("offset", (5, 0, 0))
            speed = params.get("speed", 5.0)

            target = (
                leader_pos[0] + offset[0],
                leader_pos[1] + offset[1],
                leader_pos[2] + offset[2],
            )

            dx = target[0] - drone.position[0]
            dy = target[1] - drone.position[1]
            dz = target[2] - drone.position[2]
            dist = (dx**2 + dy**2 + dz**2) ** 0.5

            if dist > 0.5:
                move_speed = min(speed, dist)
                drone.position = (
                    drone.position[0] + dx / dist * move_speed * dt,
                    drone.position[1] + dy / dist * move_speed * dt,
                    drone.position[2] + dz / dist * move_speed * dt,
                )


class SimulationManager:
    """
    Manages simulation scenarios and drone injection.

    Coordinates between flight simulation, rendering, and ground truth.
    """

    def __init__(
        self,
        camera_params: Optional[dict[str, Any]] = None,
        sprite_path: Optional[str] = None,
    ):
        """
        Initialize simulation manager.

        Args:
            camera_params: Camera intrinsic parameters
            sprite_path: Path to drone sprite images
        """
        self._camera_params = camera_params or {
            "focal_length_px": 500,
            "center_x": 320,
            "center_y": 240,
            "width": 640,
            "height": 480,
        }

        self._renderer = DroneRenderer(sprite_path)
        self._flight_sim = FlightSimulator()

        self._drones: dict[int, SimulatedDrone] = {}
        self._ground_truth: list[GroundTruth] = []
        self._scenario: Optional[SimulationScenario] = None
        self._start_time = 0.0
        self._frame_count = 0
        self._next_drone_id = 1

        self._running = False
        self._lock = threading.Lock()

    def load_scenario(self, scenario: SimulationScenario) -> None:
        """Load a simulation scenario."""
        with self._lock:
            self._scenario = scenario
            self._drones.clear()
            self._ground_truth.clear()

            for drone in scenario.drones:
                drone.spawn_time = time.time()
                self._drones[drone.drone_id] = drone

            logger.info(f"Loaded scenario: {scenario.name} with {len(scenario.drones)} drones")

    def add_drone(
        self,
        appearance: DroneAppearance = DroneAppearance.QUADCOPTER_MEDIUM,
        flight_pattern: FlightPattern = FlightPattern.HOVER,
        position: tuple[float, float, float] = (0, 0, 30),
        **kwargs,
    ) -> int:
        """
        Add a drone to the simulation.

        Returns:
            Drone ID
        """
        drone_id = self._next_drone_id
        self._next_drone_id += 1

        drone = SimulatedDrone(
            drone_id=drone_id,
            appearance=appearance,
            flight_pattern=flight_pattern,
            position=position,
            spawn_time=time.time(),
            **kwargs,
        )

        with self._lock:
            self._drones[drone_id] = drone

        logger.info(f"Added drone {drone_id} at {position}")
        return drone_id

    def remove_drone(self, drone_id: int) -> bool:
        """Remove a drone from the simulation."""
        with self._lock:
            if drone_id in self._drones:
                del self._drones[drone_id]
                return True
        return False

    def process_frame(
        self,
        frame: np.ndarray,
        timestamp: float,
    ) -> tuple[np.ndarray, GroundTruth]:
        """
        Process a frame, injecting simulated drones.

        Args:
            frame: Input frame
            timestamp: Frame timestamp

        Returns:
            (processed frame, ground truth)
        """
        self._frame_count += 1

        with self._lock:
            # Update flight simulation
            dt = 1.0 / 30.0  # Assume 30 FPS
            for drone in self._drones.values():
                if drone.is_active:
                    self._flight_sim.update(drone, dt)

            # Render drones and collect ground truth
            gt_drones = []
            for drone in self._drones.values():
                if not drone.is_active:
                    continue

                frame, bbox = self._renderer.render(frame, drone, self._camera_params)

                if bbox is not None:
                    gt_drones.append(
                        {
                            "drone_id": drone.drone_id,
                            "appearance": drone.appearance.value,
                            "flight_pattern": drone.flight_pattern.value,
                            "position_3d": drone.position,
                            "velocity_3d": drone.velocity,
                            "bbox": bbox.to_tuple(),
                            "is_visible": True,
                        }
                    )

            ground_truth = GroundTruth(
                frame_number=self._frame_count,
                timestamp=timestamp,
                drones=gt_drones,
            )
            self._ground_truth.append(ground_truth)

        return frame, ground_truth

    def get_accuracy_report(
        self,
        detections_by_frame: dict[int, list[Detection]],
    ) -> dict[str, Any]:
        """
        Compare detections against ground truth.

        Args:
            detections_by_frame: Detected objects per frame

        Returns:
            Accuracy report
        """
        true_positives = 0
        false_positives = 0
        false_negatives = 0
        total_gt = 0
        total_detected = 0

        for gt in self._ground_truth:
            frame_detections = detections_by_frame.get(gt.frame_number, [])
            gt_drones = gt.drones

            total_gt += len(gt_drones)
            total_detected += len(frame_detections)

            # Match detections to ground truth
            matched_gt = set()
            for det in frame_detections:
                det_bbox = det.bbox

                # Find best matching GT
                best_iou = 0
                best_gt_idx = -1

                for idx, gt_drone in enumerate(gt_drones):
                    if idx in matched_gt:
                        continue

                    gt_bbox = BoundingBox(*gt_drone["bbox"])
                    iou = self._calculate_iou(det_bbox, gt_bbox)

                    if iou > best_iou:
                        best_iou = iou
                        best_gt_idx = idx

                if best_iou >= 0.5:  # IoU threshold
                    true_positives += 1
                    matched_gt.add(best_gt_idx)
                else:
                    false_positives += 1

            false_negatives += len(gt_drones) - len(matched_gt)

        precision = (
            true_positives / (true_positives + false_positives)
            if (true_positives + false_positives) > 0
            else 0
        )
        recall = (
            true_positives / (true_positives + false_negatives)
            if (true_positives + false_negatives) > 0
            else 0
        )
        f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0

        return {
            "true_positives": true_positives,
            "false_positives": false_positives,
            "false_negatives": false_negatives,
            "precision": precision,
            "recall": recall,
            "f1_score": f1,
            "total_ground_truth": total_gt,
            "total_detected": total_detected,
            "frames_evaluated": len(self._ground_truth),
        }

    def _calculate_iou(self, box1: BoundingBox, box2: BoundingBox) -> float:
        """Calculate intersection over union."""
        x1 = max(box1.x1, box2.x1)
        y1 = max(box1.y1, box2.y1)
        x2 = min(box1.x2, box2.x2)
        y2 = min(box1.y2, box2.y2)

        if x2 <= x1 or y2 <= y1:
            return 0.0

        intersection = (x2 - x1) * (y2 - y1)
        area1 = box1.area
        area2 = box2.area
        union = area1 + area2 - intersection

        return intersection / union if union > 0 else 0.0

    def get_ground_truth(self) -> list[GroundTruth]:
        """Get all collected ground truth."""
        return self._ground_truth.copy()

    def clear(self) -> None:
        """Clear simulation state."""
        with self._lock:
            self._drones.clear()
            self._ground_truth.clear()
            self._frame_count = 0


# =============================================================================
# Predefined Scenarios
# =============================================================================


def create_training_scenario_basic() -> SimulationScenario:
    """Create a basic training scenario with single drone."""
    return SimulationScenario(
        name="Basic Training",
        description="Single drone, slow movement, clear conditions",
        duration_seconds=60,
        drones=[
            SimulatedDrone(
                drone_id=1,
                appearance=DroneAppearance.QUADCOPTER_MEDIUM,
                flight_pattern=FlightPattern.ORBIT,
                position=(0, 0, 30),
                pattern_params={"radius": 20, "angular_speed": 0.3},
            ),
        ],
        difficulty="easy",
    )


def create_training_scenario_swarm() -> SimulationScenario:
    """Create a swarm scenario with multiple coordinated drones."""
    drones = []
    for i in range(5):
        drones.append(
            SimulatedDrone(
                drone_id=i + 1,
                appearance=DroneAppearance.QUADCOPTER_SMALL,
                flight_pattern=FlightPattern.SWARM,
                position=(i * 3 - 6, 0, 40 + i * 2),
                pattern_params={
                    "leader_position": (0, 0, 30),
                    "offset": (i * 3 - 6, (i % 2) * 3, 0),
                    "speed": 8,
                },
            )
        )

    return SimulationScenario(
        name="Swarm Attack",
        description="Five coordinated drones approaching target",
        duration_seconds=120,
        drones=drones,
        difficulty="hard",
    )


def create_training_scenario_evasive() -> SimulationScenario:
    """Create scenario with evasive maneuvering drone."""
    return SimulationScenario(
        name="Evasive Target",
        description="Fast drone with unpredictable movement",
        duration_seconds=90,
        drones=[
            SimulatedDrone(
                drone_id=1,
                appearance=DroneAppearance.FPV_RACER,
                flight_pattern=FlightPattern.EVASIVE,
                position=(20, 0, 25),
                size_m=0.2,
                pattern_params={"speed": 20, "change_interval": 0.3},
            ),
        ],
        difficulty="extreme",
    )
