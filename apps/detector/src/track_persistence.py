#!/usr/bin/env python3
"""
Track state persistence for session continuity.

Enables tracks to survive process restarts:
- Serialize active tracks to disk on graceful shutdown
- Reload tracks on startup if recent enough
- Maintain track ID continuity across restarts

Use cases:
- Config hot-reload without losing tracks
- Quick restart after crash
- Handoff between detector versions
"""

import json
import logging
import signal
import threading
import time
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Optional

from interfaces import BoundingBox, Detection, TrackedObject

logger = logging.getLogger("drone_detector.track_persistence")


@dataclass
class PersistedTrack:
    """Serializable representation of a tracked object."""

    track_id: int
    class_id: int
    class_name: str
    confidence: float
    drone_score: float
    bbox: tuple[int, int, int, int]  # x1, y1, x2, y2
    frames_tracked: int
    frames_since_seen: int
    velocity: tuple[float, float]
    predicted_position: Optional[tuple[int, int]]
    first_seen_time: float
    last_seen_time: float
    metadata: dict[str, Any]


@dataclass
class PersistenceState:
    """Complete persistence state."""

    version: int = 1
    saved_at: float = 0.0
    next_track_id: int = 0
    tracks: list[PersistedTrack] = None
    metadata: dict[str, Any] = None

    def __post_init__(self):
        if self.tracks is None:
            self.tracks = []
        if self.metadata is None:
            self.metadata = {}


class TrackPersistence:
    """
    Manages track state persistence to disk.

    Features:
    - Automatic save on shutdown signal
    - Periodic background saves
    - Atomic file operations (temp + rename)
    - Staleness detection
    - Track ID continuity
    """

    DEFAULT_SAVE_INTERVAL = 10.0  # seconds
    DEFAULT_MAX_AGE = 30.0  # seconds
    VERSION = 1

    def __init__(
        self,
        state_file: str = "track_state.json",
        save_interval: float = DEFAULT_SAVE_INTERVAL,
        max_state_age: float = DEFAULT_MAX_AGE,
        auto_save_on_shutdown: bool = True,
    ):
        """
        Initialize track persistence.

        Args:
            state_file: Path to state file
            save_interval: Seconds between auto-saves
            max_state_age: Maximum age of state to restore (seconds)
            auto_save_on_shutdown: Register signal handlers for graceful save
        """
        self._state_file = Path(state_file)
        self._save_interval = save_interval
        self._max_age = max_state_age
        self._auto_save = auto_save_on_shutdown

        self._current_tracks: dict[int, TrackedObject] = {}
        self._next_track_id = 0
        self._first_seen_times: dict[int, float] = {}
        self._last_save_time = 0.0
        self._lock = threading.Lock()

        self._running = False
        self._save_thread: Optional[threading.Thread] = None
        self._original_handlers: dict[int, Any] = {}

        if self._auto_save:
            self._register_signal_handlers()

    def _register_signal_handlers(self) -> None:
        """Register handlers for graceful shutdown."""
        for sig in (signal.SIGTERM, signal.SIGINT):
            try:
                self._original_handlers[sig] = signal.getsignal(sig)
                signal.signal(sig, self._shutdown_handler)
            except (ValueError, OSError):
                # Can't set signal handler in this context
                pass

    def _shutdown_handler(self, signum: int, frame) -> None:
        """Handle shutdown signal by saving state."""
        logger.info(f"Received signal {signum}, saving track state...")
        self.save_sync()

        # Call original handler
        original = self._original_handlers.get(signum)
        if callable(original):
            original(signum, frame)

    def start(self) -> None:
        """Start background save thread."""
        if self._running:
            return

        self._running = True
        self._save_thread = threading.Thread(
            target=self._save_loop,
            name="TrackPersistence",
            daemon=True,
        )
        self._save_thread.start()
        logger.info("Track persistence started")

    def stop(self) -> None:
        """Stop background save thread."""
        self._running = False
        if self._save_thread and self._save_thread.is_alive():
            self._save_thread.join(timeout=5.0)

        # Final save
        self.save_sync()
        logger.info("Track persistence stopped")

    def _save_loop(self) -> None:
        """Background thread for periodic saves."""
        while self._running:
            time.sleep(self._save_interval)
            if self._running:
                try:
                    self.save_sync()
                except Exception as e:
                    logger.error(f"Periodic save failed: {e}")

    def update(
        self,
        tracks: list[TrackedObject],
        next_id: int,
    ) -> None:
        """
        Update current track state.

        Args:
            tracks: Current tracked objects
            next_id: Next track ID to use
        """
        now = time.time()

        with self._lock:
            self._current_tracks = {t.track_id: t for t in tracks}
            self._next_track_id = next_id

            # Update first-seen times for new tracks
            for track in tracks:
                if track.track_id not in self._first_seen_times:
                    self._first_seen_times[track.track_id] = now

    def save_sync(self) -> bool:
        """
        Synchronously save current state to disk.

        Uses atomic write (temp file + rename).

        Returns:
            True if save succeeded
        """
        with self._lock:
            tracks = list(self._current_tracks.values())
            next_id = self._next_track_id
            first_seen = self._first_seen_times.copy()

        if not tracks:
            # Nothing to save
            return True

        now = time.time()

        # Convert to serializable format
        persisted_tracks = []
        for track in tracks:
            persisted_tracks.append(
                PersistedTrack(
                    track_id=track.track_id,
                    class_id=track.detection.class_id,
                    class_name=track.detection.class_name,
                    confidence=track.detection.confidence,
                    drone_score=track.detection.drone_score,
                    bbox=track.detection.bbox.to_tuple(),
                    frames_tracked=track.frames_tracked,
                    frames_since_seen=track.frames_since_seen,
                    velocity=track.velocity,
                    predicted_position=track.predicted_position,
                    first_seen_time=first_seen.get(track.track_id, now),
                    last_seen_time=now,
                    metadata=track.detection.metadata,
                )
            )

        state = PersistenceState(
            version=self.VERSION,
            saved_at=now,
            next_track_id=next_id,
            tracks=persisted_tracks,
            metadata={
                "track_count": len(persisted_tracks),
            },
        )

        try:
            # Atomic write
            temp_file = self._state_file.with_suffix(".tmp")

            # Serialize
            state_dict = {
                "version": state.version,
                "saved_at": state.saved_at,
                "next_track_id": state.next_track_id,
                "tracks": [asdict(t) for t in state.tracks],
                "metadata": state.metadata,
            }

            with open(temp_file, "w") as f:
                json.dump(state_dict, f, indent=2)

            # Rename (atomic on POSIX)
            temp_file.rename(self._state_file)

            self._last_save_time = now
            logger.debug(f"Saved {len(tracks)} tracks to {self._state_file}")
            return True

        except Exception as e:
            logger.error(f"Failed to save track state: {e}")
            return False

    def load(self) -> tuple[list[TrackedObject], int]:
        """
        Load tracks from disk.

        Returns:
            (tracks, next_track_id) or ([], 0) if no valid state
        """
        if not self._state_file.exists():
            logger.info("No track state file found")
            return [], 0

        try:
            with open(self._state_file) as f:
                data = json.load(f)

            # Version check
            version = data.get("version", 0)
            if version != self.VERSION:
                logger.warning(
                    f"State version mismatch: {version} != {self.VERSION}, ignoring"
                )
                return [], 0

            # Age check
            saved_at = data.get("saved_at", 0)
            age = time.time() - saved_at
            if age > self._max_age:
                logger.info(
                    f"Track state too old ({age:.1f}s > {self._max_age}s), ignoring"
                )
                return [], 0

            # Deserialize tracks
            tracks = []
            for track_data in data.get("tracks", []):
                try:
                    bbox = BoundingBox(*track_data["bbox"])
                    detection = Detection(
                        class_id=track_data["class_id"],
                        class_name=track_data["class_name"],
                        confidence=track_data["confidence"],
                        bbox=bbox,
                        drone_score=track_data["drone_score"],
                        track_id=track_data["track_id"],
                        metadata=track_data.get("metadata", {}),
                    )

                    track = TrackedObject(
                        track_id=track_data["track_id"],
                        detection=detection,
                        frames_tracked=track_data["frames_tracked"],
                        frames_since_seen=track_data["frames_since_seen"],
                        velocity=tuple(track_data["velocity"]),
                        predicted_position=(
                            tuple(track_data["predicted_position"])
                            if track_data.get("predicted_position")
                            else None
                        ),
                    )
                    tracks.append(track)

                    # Restore first-seen time
                    with self._lock:
                        self._first_seen_times[track.track_id] = track_data.get(
                            "first_seen_time", time.time()
                        )

                except (KeyError, TypeError) as e:
                    logger.warning(f"Failed to deserialize track: {e}")
                    continue

            next_id = data.get("next_track_id", 0)

            logger.info(
                f"Restored {len(tracks)} tracks from state "
                f"({age:.1f}s old, next_id={next_id})"
            )

            return tracks, next_id

        except json.JSONDecodeError as e:
            logger.error(f"Invalid state file: {e}")
            return [], 0
        except Exception as e:
            logger.error(f"Failed to load track state: {e}")
            return [], 0

    def delete_state_file(self) -> bool:
        """Delete the state file."""
        try:
            if self._state_file.exists():
                self._state_file.unlink()
            return True
        except Exception as e:
            logger.error(f"Failed to delete state file: {e}")
            return False


class PersistentTracker:
    """
    Wrapper around any tracker that adds persistence.

    Automatically saves and restores track state.
    """

    def __init__(
        self,
        inner_tracker,  # ObjectTracker implementation
        persistence: TrackPersistence,
        restore_on_init: bool = True,
    ):
        """
        Initialize persistent tracker.

        Args:
            inner_tracker: The actual tracker implementation
            persistence: TrackPersistence instance
            restore_on_init: Whether to restore state immediately
        """
        self._inner = inner_tracker
        self._persistence = persistence

        if restore_on_init:
            self.restore()

    def update(self, detections, frame=None):
        """Update tracker and persist state."""
        result = self._inner.update(detections, frame)

        # Update persistence with current state
        self._persistence.update(
            tracks=result,
            next_id=getattr(self._inner, "_next_id", 0),
        )

        return result

    def reset(self) -> None:
        """Reset tracker and delete persisted state."""
        self._inner.reset()
        self._persistence.delete_state_file()

    def restore(self) -> int:
        """
        Restore tracks from persistence.

        Returns:
            Number of tracks restored
        """
        tracks, next_id = self._persistence.load()

        if not tracks:
            return 0

        # Inject restored tracks into inner tracker
        # This depends on the tracker implementation
        if hasattr(self._inner, "_objects"):
            # CentroidTracker
            for track in tracks:
                self._inner._objects[track.track_id] = track
            self._inner._next_id = next_id

        elif hasattr(self._inner, "_tracks"):
            # KalmanTracker
            # Would need to recreate Kalman state
            logger.warning("KalmanTracker restore not fully implemented")

        return len(tracks)

    @property
    def active_tracks(self):
        """Get active tracks from inner tracker."""
        return self._inner.active_tracks

    @property
    def tracker_info(self):
        """Get tracker info from inner tracker."""
        info = self._inner.tracker_info
        info["persistence_enabled"] = True
        return info

    def __getattr__(self, name):
        """Forward other attributes to inner tracker."""
        return getattr(self._inner, name)


def create_persistent_tracker(
    tracker_type: str = "centroid",
    state_file: str = "track_state.json",
    **tracker_kwargs,
):
    """
    Create a tracker with persistence enabled.

    Args:
        tracker_type: Type of tracker ("centroid", "kalman", etc.)
        state_file: Path to persistence file
        **tracker_kwargs: Arguments for the tracker

    Returns:
        PersistentTracker instance
    """
    from trackers import create_tracker

    inner = create_tracker(tracker_type, **tracker_kwargs)
    persistence = TrackPersistence(state_file=state_file)
    persistence.start()

    return PersistentTracker(inner, persistence)
