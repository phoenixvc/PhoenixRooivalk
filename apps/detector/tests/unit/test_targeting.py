"""
Unit tests for targeting module.

Tests distance estimation, target locking, and fire net controller.
"""

import pytest
import time
import sys
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "src"))

from targeting import (
    DistanceEstimator,
    TargetingSystem,
    FireNetController,
    EngagementSystem,
    TargetState,
    EngagementResult,
    TargetLock,
)
from interfaces import Detection, BoundingBox, TrackedObject
from config.settings import TargetingSettings


# =============================================================================
# Distance Estimator Tests
# =============================================================================

class TestDistanceEstimator:
    """Tests for distance estimation using pinhole camera model."""

    @pytest.fixture
    def estimator(self):
        """Create default distance estimator."""
        return DistanceEstimator(
            focal_length_mm=3.04,  # Pi Camera v2
            sensor_width_mm=3.68,
            assumed_object_size_m=0.3,  # 30cm drone
        )

    def test_small_bbox_is_far(self, estimator):
        """Small bounding box should indicate far distance."""
        bbox = BoundingBox(300, 200, 320, 220)  # 20x20 pixels
        distance = estimator.estimate(bbox, frame_width=640)

        # Small box = far away
        assert distance > 50.0

    def test_large_bbox_is_close(self, estimator):
        """Large bounding box should indicate close distance."""
        bbox = BoundingBox(100, 100, 300, 300)  # 200x200 pixels
        distance = estimator.estimate(bbox, frame_width=640)

        # Large box = close
        assert distance < 10.0

    def test_larger_bbox_is_closer(self, estimator):
        """Larger bbox should result in smaller distance."""
        small_bbox = BoundingBox(0, 0, 50, 50)
        large_bbox = BoundingBox(0, 0, 200, 200)

        dist_small = estimator.estimate(small_bbox, frame_width=640)
        dist_large = estimator.estimate(large_bbox, frame_width=640)

        assert dist_small > dist_large

    def test_zero_size_returns_infinity(self, estimator):
        """Zero size bbox should return infinity."""
        bbox = BoundingBox(100, 100, 100, 100)  # Zero size
        distance = estimator.estimate(bbox, frame_width=640)

        assert distance == float('inf')

    def test_negative_size_returns_infinity(self, estimator):
        """Negative size bbox should return infinity."""
        bbox = BoundingBox(200, 200, 100, 100)  # Inverted
        distance = estimator.estimate(bbox, frame_width=640)

        assert distance == float('inf')

    def test_frame_width_affects_estimate(self, estimator):
        """Wider frame should change distance estimate (same pixel size = different fov)."""
        bbox = BoundingBox(0, 0, 100, 100)

        dist_640 = estimator.estimate(bbox, frame_width=640)
        dist_1280 = estimator.estimate(bbox, frame_width=1280)

        # Higher resolution = more pixels per degree = different estimate
        assert dist_640 != dist_1280

    def test_estimate_from_tuple(self, estimator):
        """Should work with tuple input."""
        bbox_tuple = (100, 100, 200, 200)
        distance = estimator.estimate_from_tuple(bbox_tuple, frame_width=640)

        assert distance > 0
        assert distance != float('inf')

    def test_set_assumed_size(self, estimator):
        """Changing assumed size should change estimates."""
        bbox = BoundingBox(100, 100, 200, 200)

        dist_small_drone = estimator.estimate(bbox, frame_width=640)

        estimator.set_assumed_size(0.6)  # Larger drone
        dist_large_drone = estimator.estimate(bbox, frame_width=640)

        # Larger assumed size = larger distance for same bbox
        assert dist_large_drone > dist_small_drone


# =============================================================================
# Targeting System Tests
# =============================================================================

class TestTargetingSystem:
    """Tests for target acquisition and lock management."""

    @pytest.fixture
    def targeting_settings(self):
        """Create targeting settings for testing."""
        return TargetingSettings(
            max_targeting_distance_m=100.0,
            min_confidence_for_lock=0.7,
            lock_timeout_seconds=5.0,
            assumed_drone_size_m=0.3,
        )

    @pytest.fixture
    def targeting(self, targeting_settings):
        """Create targeting system."""
        return TargetingSystem(targeting_settings)

    @pytest.fixture
    def drone_track(self):
        """Create a valid drone track."""
        return TrackedObject(
            track_id=1,
            detection=Detection(
                class_id=0,
                class_name='drone',
                confidence=0.85,
                bbox=BoundingBox(200, 200, 300, 300),  # 100x100 = fairly close
                drone_score=0.9,
            ),
            frames_tracked=15,
            velocity=(5.0, -2.0),
        )

    @pytest.fixture
    def low_confidence_track(self):
        """Create a low confidence track."""
        return TrackedObject(
            track_id=2,
            detection=Detection(
                class_id=0,
                class_name='drone',
                confidence=0.4,  # Below threshold
                bbox=BoundingBox(200, 200, 300, 300),
                drone_score=0.5,
            ),
            frames_tracked=10,
        )

    @pytest.fixture
    def non_drone_track(self):
        """Create a non-drone track."""
        return TrackedObject(
            track_id=3,
            detection=Detection(
                class_id=1,
                class_name='bird',
                confidence=0.85,
                bbox=BoundingBox(200, 200, 300, 300),
                drone_score=0.2,  # Low drone score
            ),
            frames_tracked=10,
        )

    def test_initial_state_is_searching(self, targeting):
        """Initial state should be SEARCHING."""
        assert targeting.state == TargetState.SEARCHING
        assert targeting.current_lock is None

    def test_acquire_target(self, targeting, drone_track):
        """Should acquire target when valid drone track is provided."""
        targeting.update([drone_track], frame_width=640)

        assert targeting.state == TargetState.TRACKING
        assert targeting.current_lock is not None
        assert targeting.current_lock.track_id == drone_track.track_id

    def test_reject_low_confidence(self, targeting, low_confidence_track):
        """Should not acquire target with confidence below threshold."""
        targeting.update([low_confidence_track], frame_width=640)

        assert targeting.state == TargetState.SEARCHING
        assert targeting.current_lock is None

    def test_reject_non_drone(self, targeting, non_drone_track):
        """Should not acquire non-drone targets."""
        targeting.update([non_drone_track], frame_width=640)

        assert targeting.state == TargetState.SEARCHING
        assert targeting.current_lock is None

    def test_lock_upgrade_after_stable_tracking(self, targeting, drone_track):
        """Should upgrade to LOCKED after stable tracking."""
        # Need 10+ frames with good confidence to lock
        for _ in range(12):
            targeting.update([drone_track], frame_width=640)

        assert targeting.state == TargetState.LOCKED
        assert targeting.is_locked

    def test_lock_lost_on_no_target(self, targeting, drone_track):
        """Lock should be lost after timeout without target."""
        # Acquire and lock
        for _ in range(12):
            targeting.update([drone_track], frame_width=640)

        assert targeting.is_locked

        # Simulate timeout by manipulating lock time
        targeting._current_lock.lock_time = time.time() - 10.0

        # Update with no targets
        targeting.update([], frame_width=640)

        assert targeting.state == TargetState.SEARCHING
        assert targeting.current_lock is None

    def test_select_best_target(self, targeting):
        """Should select highest priority target when multiple available."""
        close_drone = TrackedObject(
            track_id=1,
            detection=Detection(0, 'drone', 0.9, BoundingBox(200, 200, 350, 350), 0.95),
            frames_tracked=20,
        )
        far_drone = TrackedObject(
            track_id=2,
            detection=Detection(0, 'drone', 0.75, BoundingBox(300, 300, 320, 320), 0.8),
            frames_tracked=5,
        )

        targeting.update([far_drone, close_drone], frame_width=640)

        # Should lock onto close_drone (higher confidence, closer, more tracked)
        assert targeting.current_lock.track_id == 1

    def test_get_lead_point(self, targeting, drone_track):
        """Lead point should account for velocity."""
        for _ in range(12):
            targeting.update([drone_track], frame_width=640)

        lead_point = targeting.get_lead_point()

        assert lead_point is not None
        # Lead point should be ahead of current position based on velocity
        current_center = drone_track.detection.bbox.center
        # With positive velocity, lead should be ahead
        assert lead_point[0] >= current_center[0]

    def test_reset(self, targeting, drone_track):
        """Reset should clear lock and return to SEARCHING."""
        for _ in range(12):
            targeting.update([drone_track], frame_width=640)

        targeting.reset()

        assert targeting.state == TargetState.SEARCHING
        assert targeting.current_lock is None


# =============================================================================
# Fire Net Controller Tests
# =============================================================================

class TestFireNetController:
    """Tests for fire net controller with safety interlocks."""

    @pytest.fixture
    def fire_settings(self):
        """Create fire net settings."""
        return TargetingSettings(
            fire_net_enabled=True,
            fire_net_min_confidence=0.85,
            fire_net_min_track_frames=10,
            fire_net_max_distance_m=50.0,
            fire_net_min_distance_m=5.0,
            fire_net_velocity_threshold_ms=30.0,
            fire_net_cooldown_seconds=10.0,
            fire_net_arm_required=True,
        )

    @pytest.fixture
    def fire_settings_disabled(self):
        """Create settings with fire net disabled."""
        return TargetingSettings(fire_net_enabled=False)

    @pytest.fixture
    def fire_net(self, fire_settings):
        """Create fire net controller."""
        return FireNetController(fire_settings)

    @pytest.fixture
    def valid_target(self):
        """Create a target that meets all fire conditions."""
        return TrackedObject(
            track_id=1,
            detection=Detection(0, 'drone', 0.9, BoundingBox(200, 200, 300, 300), 0.95),
            frames_tracked=15,
            velocity=(5.0, 5.0),  # ~7 m/s, below threshold
        )

    def test_initial_state_not_armed(self, fire_net):
        """Fire net should not be armed initially."""
        assert not fire_net.is_armed
        assert fire_net.is_enabled

    def test_arm_when_enabled(self, fire_net):
        """Should be able to arm when enabled."""
        result = fire_net.arm()
        assert result is True
        assert fire_net.is_armed

    def test_cannot_arm_when_disabled(self, fire_settings_disabled):
        """Should not be able to arm when disabled."""
        fire_net = FireNetController(fire_settings_disabled)
        result = fire_net.arm()
        assert result is False
        assert not fire_net.is_armed

    def test_disarm(self, fire_net):
        """Should be able to disarm."""
        fire_net.arm()
        fire_net.disarm()
        assert not fire_net.is_armed

    def test_cannot_fire_when_not_armed(self, fire_net, valid_target):
        """Should not fire when not armed."""
        can_fire, result = fire_net.check_engagement(valid_target, 25.0)

        assert not can_fire
        assert result == EngagementResult.FAILED_NOT_ARMED

    def test_cannot_fire_low_confidence(self, fire_net, valid_target):
        """Should not fire with low confidence."""
        fire_net.arm()

        # Modify target to have low confidence
        valid_target.detection.drone_score = 0.5

        can_fire, result = fire_net.check_engagement(valid_target, 25.0)

        assert not can_fire
        assert result == EngagementResult.FAILED_LOW_CONFIDENCE

    def test_cannot_fire_insufficient_track(self, fire_net, valid_target):
        """Should not fire without enough tracked frames."""
        fire_net.arm()

        valid_target.frames_tracked = 3  # Below threshold

        can_fire, result = fire_net.check_engagement(valid_target, 25.0)

        assert not can_fire
        assert result == EngagementResult.FAILED_INSUFFICIENT_TRACK

    def test_cannot_fire_too_far(self, fire_net, valid_target):
        """Should not fire if target is too far."""
        fire_net.arm()

        can_fire, result = fire_net.check_engagement(valid_target, 75.0)  # Beyond max

        assert not can_fire
        assert result == EngagementResult.FAILED_OUT_OF_RANGE

    def test_cannot_fire_too_close(self, fire_net, valid_target):
        """Should not fire if target is too close (safety)."""
        fire_net.arm()

        can_fire, result = fire_net.check_engagement(valid_target, 3.0)  # Below min

        assert not can_fire
        assert result == EngagementResult.FAILED_OUT_OF_RANGE

    def test_cannot_fire_too_fast(self, fire_net, valid_target):
        """Should not fire at fast-moving targets."""
        fire_net.arm()

        valid_target.velocity = (50.0, 50.0)  # ~70 m/s, above threshold

        can_fire, result = fire_net.check_engagement(valid_target, 25.0)

        assert not can_fire
        assert result == EngagementResult.FAILED_TOO_FAST

    def test_can_fire_valid_conditions(self, fire_net, valid_target):
        """Should be able to fire when all conditions met."""
        fire_net.arm()

        can_fire, result = fire_net.check_engagement(valid_target, 25.0)

        assert can_fire
        assert result == EngagementResult.SUCCESS

    def test_fire_triggers_cooldown(self, fire_net, valid_target):
        """Firing should trigger cooldown period."""
        fire_net.arm()

        result = fire_net.fire(valid_target, 25.0)
        assert result == EngagementResult.SUCCESS

        # Should now be in cooldown
        assert fire_net.in_cooldown

        can_fire, result = fire_net.check_engagement(valid_target, 25.0)
        assert not can_fire
        assert result == EngagementResult.FAILED_IN_COOLDOWN

    def test_fire_count_increments(self, fire_net, valid_target):
        """Fire count should increment on successful fire."""
        fire_net.arm()

        assert fire_net.fire_count == 0

        fire_net.fire(valid_target, 25.0)

        assert fire_net.fire_count == 1

    def test_get_status(self, fire_net, valid_target):
        """Status should reflect current state."""
        status = fire_net.get_status()

        assert 'enabled' in status
        assert 'armed' in status
        assert 'in_cooldown' in status
        assert 'fire_count' in status

        assert status['enabled'] is True
        assert status['armed'] is False
        assert status['fire_count'] == 0


# =============================================================================
# Engagement System Tests
# =============================================================================

class TestEngagementSystem:
    """Tests for combined engagement system."""

    @pytest.fixture
    def settings(self):
        """Create combined settings."""
        return TargetingSettings(
            max_targeting_distance_m=100.0,
            min_confidence_for_lock=0.7,
            fire_net_enabled=True,
            fire_net_min_confidence=0.85,
            fire_net_min_track_frames=10,
            fire_net_max_distance_m=50.0,
            fire_net_min_distance_m=5.0,
        )

    @pytest.fixture
    def engagement(self, settings):
        """Create engagement system."""
        return EngagementSystem(settings)

    def test_subsystems_accessible(self, engagement):
        """Should expose targeting and fire_net subsystems."""
        assert engagement.targeting is not None
        assert engagement.fire_net is not None

    def test_arm_delegates_to_fire_net(self, engagement):
        """Arm should delegate to fire net controller."""
        result = engagement.arm()
        assert result is True
        assert engagement.fire_net.is_armed

    def test_reset_clears_both(self, engagement):
        """Reset should clear both targeting and fire net."""
        engagement.arm()
        # Would need to simulate some tracking state
        engagement.reset()

        assert engagement.targeting.state == TargetState.SEARCHING
        assert not engagement.fire_net.is_armed


# =============================================================================
# Target Lock Tests
# =============================================================================

class TestTargetLock:
    """Tests for TargetLock data class."""

    @pytest.fixture
    def lock(self):
        """Create a sample target lock."""
        return TargetLock(
            track_id=1,
            detection=Detection(0, 'drone', 0.9, BoundingBox(100, 100, 200, 200), 0.95),
            lock_time=time.time() - 5.0,  # Locked 5 seconds ago
            estimated_distance_m=25.0,
            confidence_history=[0.85, 0.87, 0.9, 0.88, 0.91],
        )

    def test_average_confidence(self, lock):
        """Average confidence should be computed correctly."""
        expected = sum(lock.confidence_history) / len(lock.confidence_history)
        assert abs(lock.average_confidence - expected) < 0.001

    def test_average_confidence_empty(self):
        """Empty history should return 0."""
        lock = TargetLock(
            track_id=1,
            detection=Detection(0, 'drone', 0.9, BoundingBox(0, 0, 100, 100), 0.9),
            lock_time=time.time(),
            estimated_distance_m=25.0,
        )
        assert lock.average_confidence == 0.0

    def test_lock_duration(self, lock):
        """Lock duration should be time since lock_time."""
        duration = lock.lock_duration
        assert 4.9 < duration < 5.5  # About 5 seconds

    def test_frames_locked(self, lock):
        """Frames locked should be length of history."""
        assert lock.frames_locked == 5

    def test_to_dict(self, lock):
        """to_dict should include all relevant fields."""
        d = lock.to_dict()

        assert 'track_id' in d
        assert 'lock_duration' in d
        assert 'frames_locked' in d
        assert 'estimated_distance_m' in d
        assert 'average_confidence' in d
