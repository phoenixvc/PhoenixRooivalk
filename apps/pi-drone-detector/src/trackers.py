#!/usr/bin/env python3
"""
Object tracker implementations for maintaining identity across frames.

Supports hot-swapping between no tracking, centroid tracking, or Kalman filter
based on demo requirements.
"""

from typing import List, Dict, Any, Optional, Tuple
from collections import OrderedDict
import math

import numpy as np

from interfaces import (
    ObjectTracker,
    TrackedObject,
    Detection,
    BoundingBox,
)


class NoOpTracker(ObjectTracker):
    """
    No-op tracker - assigns new IDs to every detection, no persistence.

    Use when tracking isn't needed or for maximum simplicity.
    """

    def __init__(self):
        self._next_id = 0
        self._current_tracks: List[TrackedObject] = []

    def update(
        self,
        detections: List[Detection],
        frame: Optional[np.ndarray] = None
    ) -> List[TrackedObject]:
        self._current_tracks = []

        for det in detections:
            det.track_id = self._next_id
            self._next_id += 1

            self._current_tracks.append(TrackedObject(
                track_id=det.track_id,
                detection=det,
                frames_tracked=1,
                frames_since_seen=0,
            ))

        return self._current_tracks

    def reset(self) -> None:
        self._next_id = 0
        self._current_tracks = []

    @property
    def active_tracks(self) -> List[TrackedObject]:
        return self._current_tracks

    @property
    def tracker_info(self) -> Dict[str, Any]:
        return {
            'type': 'noop',
            'next_id': self._next_id,
            'active_count': len(self._current_tracks),
        }


class CentroidTracker(ObjectTracker):
    """
    Simple centroid-based tracker.

    Matches detections to existing tracks based on centroid distance.
    Good for slow-moving objects or when objects don't overlap much.
    """

    def __init__(
        self,
        max_disappeared: int = 30,
        max_distance: float = 100.0,
    ):
        """
        Args:
            max_disappeared: Frames before track is deleted
            max_distance: Maximum centroid distance for matching
        """
        self._max_disappeared = max_disappeared
        self._max_distance = max_distance
        self._next_id = 0
        self._objects: OrderedDict[int, TrackedObject] = OrderedDict()

    def update(
        self,
        detections: List[Detection],
        frame: Optional[np.ndarray] = None
    ) -> List[TrackedObject]:
        # No detections - increment disappeared count for all
        if len(detections) == 0:
            for track_id in list(self._objects.keys()):
                self._objects[track_id].frames_since_seen += 1
                if self._objects[track_id].frames_since_seen > self._max_disappeared:
                    del self._objects[track_id]
            return list(self._objects.values())

        # Get input centroids
        input_centroids = []
        for det in detections:
            cx, cy = det.bbox.center
            input_centroids.append((cx, cy, det))

        # No existing objects - register all
        if len(self._objects) == 0:
            for cx, cy, det in input_centroids:
                self._register(det)
            return list(self._objects.values())

        # Match existing objects to new detections
        object_ids = list(self._objects.keys())
        object_centroids = [
            self._objects[oid].detection.bbox.center
            for oid in object_ids
        ]

        # Compute distance matrix
        distances = np.zeros((len(object_centroids), len(input_centroids)))
        for i, (ox, oy) in enumerate(object_centroids):
            for j, (cx, cy, _) in enumerate(input_centroids):
                distances[i, j] = math.sqrt((ox - cx) ** 2 + (oy - cy) ** 2)

        # Match using greedy algorithm
        rows = distances.min(axis=1).argsort()
        cols = distances.argmin(axis=1)[rows]

        used_rows = set()
        used_cols = set()

        for row, col in zip(rows, cols):
            if row in used_rows or col in used_cols:
                continue

            if distances[row, col] > self._max_distance:
                continue

            object_id = object_ids[row]
            _, _, det = input_centroids[col]
            det.track_id = object_id

            # Update track
            old_track = self._objects[object_id]
            old_cx, old_cy = old_track.detection.bbox.center
            new_cx, new_cy = det.bbox.center

            self._objects[object_id] = TrackedObject(
                track_id=object_id,
                detection=det,
                frames_tracked=old_track.frames_tracked + 1,
                frames_since_seen=0,
                velocity=(new_cx - old_cx, new_cy - old_cy),
            )

            used_rows.add(row)
            used_cols.add(col)

        # Handle unmatched existing objects
        unused_rows = set(range(len(object_ids))) - used_rows
        for row in unused_rows:
            object_id = object_ids[row]
            self._objects[object_id].frames_since_seen += 1
            if self._objects[object_id].frames_since_seen > self._max_disappeared:
                del self._objects[object_id]

        # Register new detections
        unused_cols = set(range(len(input_centroids))) - used_cols
        for col in unused_cols:
            _, _, det = input_centroids[col]
            self._register(det)

        return list(self._objects.values())

    def _register(self, detection: Detection) -> None:
        """Register a new object."""
        detection.track_id = self._next_id
        self._objects[self._next_id] = TrackedObject(
            track_id=self._next_id,
            detection=detection,
            frames_tracked=1,
            frames_since_seen=0,
        )
        self._next_id += 1

    def reset(self) -> None:
        self._next_id = 0
        self._objects.clear()

    @property
    def active_tracks(self) -> List[TrackedObject]:
        return list(self._objects.values())

    @property
    def tracker_info(self) -> Dict[str, Any]:
        return {
            'type': 'centroid',
            'max_disappeared': self._max_disappeared,
            'max_distance': self._max_distance,
            'next_id': self._next_id,
            'active_count': len(self._objects),
        }


class KalmanTracker(ObjectTracker):
    """
    Kalman filter-based tracker for smoother tracking and prediction.

    Better for fast-moving objects as it predicts where the object will be.
    """

    def __init__(
        self,
        max_disappeared: int = 30,
        max_distance: float = 150.0,
        process_noise: float = 1.0,
        measurement_noise: float = 1.0,
    ):
        self._max_disappeared = max_disappeared
        self._max_distance = max_distance
        self._process_noise = process_noise
        self._measurement_noise = measurement_noise
        self._next_id = 0
        self._tracks: Dict[int, '_KalmanTrack'] = {}

    def update(
        self,
        detections: List[Detection],
        frame: Optional[np.ndarray] = None
    ) -> List[TrackedObject]:
        # Predict step for all existing tracks
        for track in self._tracks.values():
            track.predict()

        # No detections - just predict and age
        if len(detections) == 0:
            for track_id in list(self._tracks.keys()):
                self._tracks[track_id].frames_since_seen += 1
                if self._tracks[track_id].frames_since_seen > self._max_disappeared:
                    del self._tracks[track_id]
            return self._get_tracked_objects()

        # Get predicted positions and input centroids
        if len(self._tracks) == 0:
            # Register all new detections
            for det in detections:
                self._register(det)
            return self._get_tracked_objects()

        # Match predictions to detections
        track_ids = list(self._tracks.keys())
        predicted_positions = [
            self._tracks[tid].predicted_position()
            for tid in track_ids
        ]

        input_centroids = [
            (det.bbox.center[0], det.bbox.center[1], det)
            for det in detections
        ]

        # Compute distance matrix
        distances = np.zeros((len(predicted_positions), len(input_centroids)))
        for i, (px, py) in enumerate(predicted_positions):
            for j, (cx, cy, _) in enumerate(input_centroids):
                distances[i, j] = math.sqrt((px - cx) ** 2 + (py - cy) ** 2)

        # Greedy matching
        rows = distances.min(axis=1).argsort()
        cols = distances.argmin(axis=1)[rows]

        used_rows = set()
        used_cols = set()

        for row, col in zip(rows, cols):
            if row in used_rows or col in used_cols:
                continue

            if distances[row, col] > self._max_distance:
                continue

            track_id = track_ids[row]
            cx, cy, det = input_centroids[col]

            # Update track with measurement
            self._tracks[track_id].update(cx, cy, det)
            det.track_id = track_id

            used_rows.add(row)
            used_cols.add(col)

        # Age unmatched tracks
        unused_rows = set(range(len(track_ids))) - used_rows
        for row in unused_rows:
            track_id = track_ids[row]
            self._tracks[track_id].frames_since_seen += 1
            if self._tracks[track_id].frames_since_seen > self._max_disappeared:
                del self._tracks[track_id]

        # Register new detections
        unused_cols = set(range(len(input_centroids))) - used_cols
        for col in unused_cols:
            _, _, det = input_centroids[col]
            self._register(det)

        return self._get_tracked_objects()

    def _register(self, detection: Detection) -> None:
        """Register new track with Kalman filter."""
        cx, cy = detection.bbox.center
        detection.track_id = self._next_id

        self._tracks[self._next_id] = _KalmanTrack(
            track_id=self._next_id,
            initial_x=cx,
            initial_y=cy,
            detection=detection,
            process_noise=self._process_noise,
            measurement_noise=self._measurement_noise,
        )
        self._next_id += 1

    def _get_tracked_objects(self) -> List[TrackedObject]:
        """Convert internal tracks to TrackedObject list."""
        result = []
        for track in self._tracks.values():
            px, py = track.predicted_position()
            vx, vy = track.velocity()

            result.append(TrackedObject(
                track_id=track.track_id,
                detection=track.detection,
                frames_tracked=track.frames_tracked,
                frames_since_seen=track.frames_since_seen,
                velocity=(vx, vy),
                predicted_position=(int(px), int(py)),
            ))
        return result

    def reset(self) -> None:
        self._next_id = 0
        self._tracks.clear()

    @property
    def active_tracks(self) -> List[TrackedObject]:
        return self._get_tracked_objects()

    @property
    def tracker_info(self) -> Dict[str, Any]:
        return {
            'type': 'kalman',
            'max_disappeared': self._max_disappeared,
            'max_distance': self._max_distance,
            'process_noise': self._process_noise,
            'measurement_noise': self._measurement_noise,
            'next_id': self._next_id,
            'active_count': len(self._tracks),
        }


class _KalmanTrack:
    """Internal Kalman filter state for a single track."""

    def __init__(
        self,
        track_id: int,
        initial_x: float,
        initial_y: float,
        detection: Detection,
        process_noise: float = 1.0,
        measurement_noise: float = 1.0,
    ):
        self.track_id = track_id
        self.detection = detection
        self.frames_tracked = 1
        self.frames_since_seen = 0

        # State: [x, y, vx, vy]
        self._state = np.array([initial_x, initial_y, 0.0, 0.0], dtype=np.float64)

        # State covariance
        self._P = np.eye(4) * 100

        # State transition matrix (constant velocity model)
        self._F = np.array([
            [1, 0, 1, 0],
            [0, 1, 0, 1],
            [0, 0, 1, 0],
            [0, 0, 0, 1],
        ], dtype=np.float64)

        # Measurement matrix (we only observe position)
        self._H = np.array([
            [1, 0, 0, 0],
            [0, 1, 0, 0],
        ], dtype=np.float64)

        # Process noise
        self._Q = np.eye(4) * process_noise

        # Measurement noise
        self._R = np.eye(2) * measurement_noise

    def predict(self) -> None:
        """Predict step."""
        self._state = self._F @ self._state
        self._P = self._F @ self._P @ self._F.T + self._Q

    def update(self, x: float, y: float, detection: Detection) -> None:
        """Update step with measurement."""
        self.detection = detection
        self.frames_tracked += 1
        self.frames_since_seen = 0

        z = np.array([x, y])

        # Kalman gain
        S = self._H @ self._P @ self._H.T + self._R
        K = self._P @ self._H.T @ np.linalg.inv(S)

        # Update state
        y_residual = z - self._H @ self._state
        self._state = self._state + K @ y_residual

        # Update covariance
        I = np.eye(4)
        self._P = (I - K @ self._H) @ self._P

    def predicted_position(self) -> Tuple[float, float]:
        """Get predicted position."""
        return (self._state[0], self._state[1])

    def velocity(self) -> Tuple[float, float]:
        """Get estimated velocity."""
        return (self._state[2], self._state[3])


def create_tracker(
    tracker_type: str = "centroid",
    **kwargs
) -> ObjectTracker:
    """
    Factory function to create appropriate tracker.

    Args:
        tracker_type: "none", "centroid", "kalman"
        **kwargs: Arguments passed to tracker constructor

    Returns:
        Configured ObjectTracker instance
    """
    if tracker_type == "none" or tracker_type == "noop":
        return NoOpTracker()

    if tracker_type == "centroid":
        return CentroidTracker(
            max_disappeared=kwargs.get('max_disappeared', 30),
            max_distance=kwargs.get('max_distance', 100.0),
        )

    if tracker_type == "kalman":
        return KalmanTracker(
            max_disappeared=kwargs.get('max_disappeared', 30),
            max_distance=kwargs.get('max_distance', 150.0),
            process_noise=kwargs.get('process_noise', 1.0),
            measurement_noise=kwargs.get('measurement_noise', 1.0),
        )

    raise ValueError(f"Unknown tracker type: {tracker_type}")
