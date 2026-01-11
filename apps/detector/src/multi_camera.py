#!/usr/bin/env python3
"""
Multi-camera fusion for unified situational awareness.

Provides:
- Detection fusion from multiple camera sources
- Geometric calibration for overlapping fields of view
- Track handoff between non-overlapping cameras
- 3D position estimation from stereo pairs
- Unified track management across all cameras

Architecture:
    Camera1 ─┐
    Camera2 ─┼─► CameraFusionManager ─► Unified Tracks
    Camera3 ─┘
"""

import logging
import math
import threading
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Tuple

import numpy as np

from interfaces import BoundingBox, Detection, FrameData, TrackedObject

logger = logging.getLogger("drone_detector.multi_camera")


class CameraRelation(Enum):
    """Relationship between two cameras."""

    OVERLAPPING = "overlapping"  # Shared field of view
    ADJACENT = "adjacent"  # Non-overlapping but nearby
    STEREO = "stereo"  # Stereo pair for depth estimation
    INDEPENDENT = "independent"  # No spatial relationship


@dataclass
class CameraConfig:
    """Configuration for a single camera in the fusion system."""

    camera_id: str
    source_type: str  # "picamera", "usb", etc.
    source_config: Dict[str, Any] = field(default_factory=dict)

    # Geometric calibration
    position_meters: Tuple[float, float, float] = (0.0, 0.0, 0.0)  # x, y, z
    rotation_degrees: Tuple[float, float, float] = (0.0, 0.0, 0.0)  # yaw, pitch, roll
    fov_horizontal_degrees: float = 70.0
    fov_vertical_degrees: float = 50.0

    # Lens parameters (for undistortion)
    focal_length_mm: float = 3.04
    sensor_width_mm: float = 3.68
    distortion_coeffs: Optional[np.ndarray] = None  # k1, k2, p1, p2, k3

    # Coverage zone (world coordinates)
    coverage_min_xy: Tuple[float, float] = (-100.0, -100.0)
    coverage_max_xy: Tuple[float, float] = (100.0, 100.0)


@dataclass
class CameraCalibration:
    """Calibration data between two cameras."""

    camera_a: str
    camera_b: str
    relation: CameraRelation

    # Homography matrix for image-to-image mapping (for overlapping)
    homography: Optional[np.ndarray] = None

    # Fundamental matrix for stereo (for depth estimation)
    fundamental_matrix: Optional[np.ndarray] = None

    # Baseline distance for stereo pairs (meters)
    baseline_meters: float = 0.0

    # Overlap region in each camera's image space
    overlap_a: Optional[Tuple[int, int, int, int]] = None  # x1, y1, x2, y2
    overlap_b: Optional[Tuple[int, int, int, int]] = None


@dataclass
class FusedDetection:
    """Detection fused from multiple cameras."""

    fused_id: int
    confidence: float  # Combined confidence
    position_3d: Optional[Tuple[float, float, float]] = None  # x, y, z in meters
    velocity_3d: Optional[Tuple[float, float, float]] = None  # m/s
    contributing_cameras: List[str] = field(default_factory=list)
    detections: Dict[str, Detection] = field(default_factory=dict)  # camera_id → Detection
    drone_score: float = 0.0
    first_seen_camera: str = ""
    last_seen_time: float = 0.0


@dataclass
class CameraState:
    """Runtime state for a camera in the fusion system."""

    camera_id: str
    is_active: bool = False
    last_frame_time: float = 0.0
    frame_count: int = 0
    current_detections: List[Detection] = field(default_factory=list)
    current_tracks: List[TrackedObject] = field(default_factory=list)
    fps_actual: float = 0.0


class CameraFusionManager:
    """
    Manages multi-camera detection fusion.

    Responsibilities:
    - Track objects across multiple cameras
    - Fuse overlapping detections
    - Handle track handoffs between cameras
    - Estimate 3D positions from stereo pairs
    - Maintain unified track IDs
    """

    def __init__(
        self,
        cameras: List[CameraConfig],
        calibrations: Optional[List[CameraCalibration]] = None,
        fusion_distance_threshold: float = 50.0,  # pixels
        handoff_timeout_seconds: float = 2.0,
        min_overlap_iou: float = 0.3,
    ):
        """
        Initialize multi-camera fusion manager.

        Args:
            cameras: List of camera configurations
            calibrations: Pairwise camera calibrations
            fusion_distance_threshold: Max distance for detection fusion
            handoff_timeout_seconds: Time window for track handoffs
            min_overlap_iou: Minimum IoU for overlapping detections
        """
        self._cameras = {c.camera_id: c for c in cameras}
        self._calibrations = calibrations or []
        self._fusion_threshold = fusion_distance_threshold
        self._handoff_timeout = handoff_timeout_seconds
        self._min_overlap_iou = min_overlap_iou

        # Build calibration lookup
        self._calibration_map: Dict[Tuple[str, str], CameraCalibration] = {}
        for cal in self._calibrations:
            self._calibration_map[(cal.camera_a, cal.camera_b)] = cal
            self._calibration_map[(cal.camera_b, cal.camera_a)] = cal

        # Runtime state
        self._camera_states: Dict[str, CameraState] = {
            cid: CameraState(camera_id=cid) for cid in self._cameras
        }
        self._fused_tracks: Dict[int, FusedDetection] = {}
        self._next_fused_id = 1
        self._lock = threading.Lock()

        # Track handoff buffer (camera_id → list of recently lost tracks)
        self._handoff_buffer: Dict[str, List[Tuple[float, TrackedObject]]] = {
            cid: [] for cid in self._cameras
        }

    @property
    def camera_count(self) -> int:
        """Number of cameras in the fusion system."""
        return len(self._cameras)

    @property
    def active_cameras(self) -> List[str]:
        """List of currently active camera IDs."""
        return [
            cid for cid, state in self._camera_states.items() if state.is_active
        ]

    def update_camera(
        self,
        camera_id: str,
        detections: List[Detection],
        tracks: List[TrackedObject],
        frame_data: FrameData,
    ) -> List[FusedDetection]:
        """
        Update fusion state with data from a single camera.

        Args:
            camera_id: Camera identifier
            detections: Raw detections from this camera
            tracks: Tracked objects from this camera
            frame_data: Frame metadata

        Returns:
            List of fused detections (unified view)
        """
        with self._lock:
            # Update camera state
            state = self._camera_states.get(camera_id)
            if state is None:
                logger.warning(f"Unknown camera: {camera_id}")
                return []

            state.is_active = True
            state.last_frame_time = frame_data.timestamp
            state.frame_count = frame_data.frame_number
            state.current_detections = detections
            state.current_tracks = tracks
            state.fps_actual = 1.0 / max(
                0.001, frame_data.timestamp - state.last_frame_time
            )

            # Perform fusion
            self._fuse_detections(camera_id, detections)
            self._update_tracks(camera_id, tracks)
            self._handle_handoffs(camera_id, tracks)
            self._prune_stale_tracks()

            return list(self._fused_tracks.values())

    def _fuse_detections(self, camera_id: str, detections: List[Detection]) -> None:
        """Fuse detections from this camera with existing fused tracks."""
        camera_config = self._cameras.get(camera_id)
        if camera_config is None:
            return

        for det in detections:
            # Check if detection matches any existing fused track
            matched = False
            for fused_id, fused in self._fused_tracks.items():
                if self._should_fuse(camera_id, det, fused):
                    self._merge_detection(camera_id, det, fused)
                    matched = True
                    break

            if not matched:
                # Create new fused track
                self._create_fused_track(camera_id, det)

    def _should_fuse(
        self, camera_id: str, det: Detection, fused: FusedDetection
    ) -> bool:
        """Determine if a detection should be fused with an existing track."""
        # Check if cameras have spatial relationship
        for other_cam in fused.contributing_cameras:
            if other_cam == camera_id:
                continue

            cal = self._calibration_map.get((camera_id, other_cam))
            if cal is None or cal.relation == CameraRelation.INDEPENDENT:
                continue

            # For overlapping cameras, check projected position
            if cal.relation == CameraRelation.OVERLAPPING:
                other_det = fused.detections.get(other_cam)
                if other_det and self._check_overlap(camera_id, det, other_cam, other_det, cal):
                    return True

            # For adjacent cameras, check handoff proximity
            elif cal.relation == CameraRelation.ADJACENT:
                if self._check_handoff_match(camera_id, det, fused):
                    return True

        return False

    def _check_overlap(
        self,
        cam_a: str,
        det_a: Detection,
        cam_b: str,
        det_b: Detection,
        cal: CameraCalibration,
    ) -> bool:
        """Check if two detections from overlapping cameras match."""
        if cal.homography is None:
            return False

        # Project detection A center to camera B space
        center_a = np.array([det_a.bbox.center[0], det_a.bbox.center[1], 1.0])
        projected = cal.homography @ center_a
        if projected[2] != 0:
            projected = projected / projected[2]

        # Check distance to detection B center
        center_b = det_b.bbox.center
        distance = math.sqrt(
            (projected[0] - center_b[0]) ** 2 + (projected[1] - center_b[1]) ** 2
        )

        return distance < self._fusion_threshold

    def _check_handoff_match(
        self, camera_id: str, det: Detection, fused: FusedDetection
    ) -> bool:
        """Check if detection matches a track being handed off."""
        # Check if detection is near the edge of the camera's FOV
        # and matches timing/velocity of a recently lost track from another camera
        now = time.time()
        age = now - fused.last_seen_time

        # Must be within handoff window
        if age > self._handoff_timeout:
            return False

        # Check if detection is near expected position based on velocity
        if fused.velocity_3d and fused.position_3d:
            predicted_pos = (
                fused.position_3d[0] + fused.velocity_3d[0] * age,
                fused.position_3d[1] + fused.velocity_3d[1] * age,
                fused.position_3d[2] + fused.velocity_3d[2] * age,
            )
            # Project to this camera and check distance
            # (Simplified - actual implementation would use full projection)
            return True  # Placeholder

        return False

    def _merge_detection(
        self, camera_id: str, det: Detection, fused: FusedDetection
    ) -> None:
        """Merge a detection into an existing fused track."""
        fused.detections[camera_id] = det
        if camera_id not in fused.contributing_cameras:
            fused.contributing_cameras.append(camera_id)

        # Update confidence (average across cameras)
        confidences = [d.confidence for d in fused.detections.values()]
        fused.confidence = sum(confidences) / len(confidences)

        # Update drone score (max across cameras)
        drone_scores = [d.drone_score for d in fused.detections.values()]
        fused.drone_score = max(drone_scores)

        fused.last_seen_time = time.time()

        # Attempt 3D position estimation from stereo pairs
        self._estimate_3d_position(fused)

    def _create_fused_track(self, camera_id: str, det: Detection) -> None:
        """Create a new fused track from a detection."""
        fused_id = self._next_fused_id
        self._next_fused_id += 1

        self._fused_tracks[fused_id] = FusedDetection(
            fused_id=fused_id,
            confidence=det.confidence,
            drone_score=det.drone_score,
            contributing_cameras=[camera_id],
            detections={camera_id: det},
            first_seen_camera=camera_id,
            last_seen_time=time.time(),
        )

    def _update_tracks(self, camera_id: str, tracks: List[TrackedObject]) -> None:
        """Update fused tracks with tracker information."""
        for track in tracks:
            det = track.detection
            for fused in self._fused_tracks.values():
                if camera_id in fused.detections:
                    cam_det = fused.detections[camera_id]
                    if cam_det.track_id == track.track_id:
                        # Update velocity from tracker
                        if fused.velocity_3d is None:
                            fused.velocity_3d = (track.velocity[0], track.velocity[1], 0.0)

    def _handle_handoffs(self, camera_id: str, tracks: List[TrackedObject]) -> None:
        """Handle track handoffs between cameras."""
        now = time.time()

        # Clean up old handoff candidates
        for cam, buffer in self._handoff_buffer.items():
            self._handoff_buffer[cam] = [
                (t, track)
                for t, track in buffer
                if now - t < self._handoff_timeout
            ]

        # Check for tracks that disappeared from this camera
        state = self._camera_states[camera_id]
        current_track_ids = {t.track_id for t in tracks}

        for fused in list(self._fused_tracks.values()):
            if camera_id in fused.detections:
                det = fused.detections[camera_id]
                if det.track_id not in current_track_ids:
                    # Track lost - add to handoff buffer
                    # Find corresponding TrackedObject
                    for track in state.current_tracks:
                        if track.track_id == det.track_id:
                            self._handoff_buffer[camera_id].append((now, track))
                            break

    def _estimate_3d_position(self, fused: FusedDetection) -> None:
        """Estimate 3D position from stereo camera pairs."""
        # Find stereo pairs among contributing cameras
        for i, cam_a in enumerate(fused.contributing_cameras):
            for cam_b in fused.contributing_cameras[i + 1 :]:
                cal = self._calibration_map.get((cam_a, cam_b))
                if cal is None or cal.relation != CameraRelation.STEREO:
                    continue

                det_a = fused.detections.get(cam_a)
                det_b = fused.detections.get(cam_b)
                if det_a is None or det_b is None:
                    continue

                # Triangulate position
                pos_3d = self._triangulate(det_a, det_b, cal)
                if pos_3d is not None:
                    fused.position_3d = pos_3d
                    return

    def _triangulate(
        self,
        det_a: Detection,
        det_b: Detection,
        cal: CameraCalibration,
    ) -> Optional[Tuple[float, float, float]]:
        """
        Triangulate 3D position from stereo detections.

        Uses the disparity between the two detection centers and
        the known baseline to compute depth.
        """
        if cal.baseline_meters <= 0:
            return None

        # Simple stereo triangulation
        # Assumes cameras are horizontally aligned
        cx_a = det_a.bbox.center[0]
        cx_b = det_b.bbox.center[0]
        disparity = abs(cx_a - cx_b)

        if disparity < 1:
            return None

        cam_a_config = self._cameras.get(cal.camera_a)
        if cam_a_config is None:
            return None

        # Depth from disparity
        focal_px = (
            cam_a_config.focal_length_mm / cam_a_config.sensor_width_mm
        ) * 640  # Assume 640px width
        depth = (cal.baseline_meters * focal_px) / disparity

        # X position (relative to camera A center)
        cam_a = self._cameras.get(cal.camera_a)
        if cam_a is None:
            return None
        x = (cx_a - 320) * depth / focal_px  # Assume 640px width, center at 320

        # Y position (from vertical center)
        cy_a = det_a.bbox.center[1]
        y = (cy_a - 240) * depth / focal_px  # Assume 480px height, center at 240

        # Apply camera position offset
        x += cam_a.position_meters[0]
        y += cam_a.position_meters[1]
        z = depth + cam_a.position_meters[2]

        return (x, y, z)

    def _prune_stale_tracks(self, max_age_seconds: float = 5.0) -> None:
        """Remove fused tracks that haven't been updated recently."""
        now = time.time()
        stale_ids = [
            fid
            for fid, fused in self._fused_tracks.items()
            if now - fused.last_seen_time > max_age_seconds
        ]
        for fid in stale_ids:
            del self._fused_tracks[fid]

    def get_unified_tracks(self) -> List[FusedDetection]:
        """Get all current fused tracks."""
        with self._lock:
            return list(self._fused_tracks.values())

    def get_camera_state(self, camera_id: str) -> Optional[CameraState]:
        """Get state for a specific camera."""
        return self._camera_states.get(camera_id)

    def get_stats(self) -> Dict[str, Any]:
        """Get fusion statistics."""
        with self._lock:
            return {
                "total_cameras": len(self._cameras),
                "active_cameras": len(self.active_cameras),
                "fused_tracks": len(self._fused_tracks),
                "calibrations": len(self._calibrations),
                "cameras": {
                    cid: {
                        "active": state.is_active,
                        "fps": state.fps_actual,
                        "frame_count": state.frame_count,
                        "detections": len(state.current_detections),
                        "tracks": len(state.current_tracks),
                    }
                    for cid, state in self._camera_states.items()
                },
            }


def create_stereo_calibration(
    camera_a: str,
    camera_b: str,
    baseline_meters: float,
    image_size: Tuple[int, int] = (640, 480),
) -> CameraCalibration:
    """
    Create a simple stereo calibration for two horizontally aligned cameras.

    Args:
        camera_a: First camera ID
        camera_b: Second camera ID
        baseline_meters: Distance between cameras in meters
        image_size: Image dimensions

    Returns:
        CameraCalibration for stereo pair
    """
    return CameraCalibration(
        camera_a=camera_a,
        camera_b=camera_b,
        relation=CameraRelation.STEREO,
        baseline_meters=baseline_meters,
    )


def create_overlap_calibration(
    camera_a: str,
    camera_b: str,
    homography: np.ndarray,
    overlap_a: Tuple[int, int, int, int],
    overlap_b: Tuple[int, int, int, int],
) -> CameraCalibration:
    """
    Create calibration for two overlapping cameras.

    Args:
        camera_a: First camera ID
        camera_b: Second camera ID
        homography: 3x3 homography matrix (A → B)
        overlap_a: Overlap region in camera A (x1, y1, x2, y2)
        overlap_b: Overlap region in camera B

    Returns:
        CameraCalibration for overlapping pair
    """
    return CameraCalibration(
        camera_a=camera_a,
        camera_b=camera_b,
        relation=CameraRelation.OVERLAPPING,
        homography=homography,
        overlap_a=overlap_a,
        overlap_b=overlap_b,
    )
