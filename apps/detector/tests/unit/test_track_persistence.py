"""
Unit tests for the TrackPersistence module.

These tests verify that track state is correctly serialized to disk,
can survive process restarts, and respects staleness and version constraints.
"""

import json
import signal
import sys
import time
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

# Add src to path for imports
src_path = Path(__file__).parent.parent.parent / "src"
if str(src_path) not in sys.path:
    sys.path.insert(0, str(src_path))

from interfaces import BoundingBox, Detection, TrackedObject  # noqa: E402
from track_persistence import TrackPersistence  # noqa: E402


@pytest.fixture
def temp_state_file(tmp_path):
    """Fixture providing a temporary state file path."""
    return tmp_path / "test_track_state.json"


@pytest.fixture
def mock_signal():
    """Fixture to mock signal registration to prevent test runner interference."""
    with patch("signal.signal") as mock_sig:
        yield mock_sig


@pytest.fixture
def persistence(temp_state_file, mock_signal):
    """Fixture providing a TrackPersistence instance with mocked signals."""
    p = TrackPersistence(
        state_file=str(temp_state_file),
        save_interval=0.1,  # Fast for testing
        max_state_age=1.0,  # Short age for testing
        auto_save_on_shutdown=True,
    )
    yield p
    p.stop()
    p.delete_state_file()


@pytest.fixture
def sample_tracks():
    """Fixture providing a list of real TrackedObject instances."""
    bbox1 = BoundingBox(10, 20, 110, 120)
    det1 = Detection(
        class_id=0,
        class_name="drone",
        confidence=0.95,
        bbox=bbox1,
        drone_score=0.99,
        track_id=1,
        metadata={"source": "camera1"},
    )
    track1 = TrackedObject(
        track_id=1,
        detection=det1,
        frames_tracked=10,
        frames_since_seen=0,
        velocity=(5.0, -2.5),
        predicted_position=(60, 70),
    )

    bbox2 = BoundingBox(200, 200, 250, 250)
    det2 = Detection(
        class_id=1,
        class_name="bird",
        confidence=0.80,
        bbox=bbox2,
        drone_score=0.1,
        track_id=2,
        metadata={},
    )
    track2 = TrackedObject(
        track_id=2,
        detection=det2,
        frames_tracked=5,
        frames_since_seen=2,
        velocity=(-1.0, 1.0),
        predicted_position=None,
    )

    return [track1, track2]


def test_save_sync_creates_file(persistence, temp_state_file, sample_tracks):
    """Test that save_sync creates a JSON file with correct data."""
    # Update state
    persistence.update(sample_tracks, next_id=3)

    # Save
    assert persistence.save_sync() is True

    # Verify file
    assert temp_state_file.exists()

    with open(temp_state_file) as f:
        data = json.load(f)

    assert data["version"] == TrackPersistence.VERSION
    assert data["next_track_id"] == 3
    assert len(data["tracks"]) == 2

    # Verify track 1 serialization
    track1_data = next(t for t in data["tracks"] if t["track_id"] == 1)
    assert track1_data["class_name"] == "drone"
    assert track1_data["bbox"] == [10, 20, 110, 120]
    assert track1_data["predicted_position"] == [60, 70]
    assert "source" in track1_data["metadata"]


def test_load_restores_tracks(persistence, sample_tracks):
    """Test that load correctly rebuilds TrackedObject instances."""
    # Setup state
    persistence.update(sample_tracks, next_id=3)
    persistence.save_sync()

    # Reset internal state to simulate restart
    persistence._current_tracks = {}
    persistence._next_track_id = 0

    # Load
    restored_tracks, next_id = persistence.load()

    assert next_id == 3
    assert len(restored_tracks) == 2

    # Verify track 1 restoration
    track1 = next(t for t in restored_tracks if t.track_id == 1)
    assert track1.detection.class_name == "drone"
    assert isinstance(track1.detection.bbox, BoundingBox)
    assert track1.detection.bbox.to_tuple() == (10, 20, 110, 120)
    assert track1.velocity == (5.0, -2.5)
    assert track1.predicted_position == (60, 70)

    # Verify track 2 restoration (handling None predicted_position)
    track2 = next(t for t in restored_tracks if t.track_id == 2)
    assert track2.detection.class_name == "bird"
    assert track2.predicted_position is None


def test_load_no_file(persistence):
    """Test loading when no state file exists."""
    tracks, next_id = persistence.load()
    assert tracks == []
    assert next_id == 0


def test_save_sync_empty_tracks(persistence, temp_state_file):
    """Test saving when there are no tracks."""
    # Empty by default
    assert persistence.save_sync() is True

    # File should not be created if there were no tracks to begin with
    assert not temp_state_file.exists()


def test_load_ignores_old_state(persistence, sample_tracks):
    """Test that staleness detection works."""
    persistence.update(sample_tracks, next_id=3)
    persistence.save_sync()

    # Mock time to simulate staleness
    with patch("time.time", return_value=time.time() + 2.0):
        # max_state_age is set to 1.0 in the fixture
        tracks, next_id = persistence.load()
        assert tracks == []
        assert next_id == 0


def test_load_ignores_version_mismatch(persistence, temp_state_file, sample_tracks):
    """Test that load ignores state files with mismatched versions."""
    persistence.update(sample_tracks, next_id=3)
    persistence.save_sync()

    # Mutate the file to have a bad version
    with open(temp_state_file) as f:
        data = json.load(f)
    data["version"] = 999
    with open(temp_state_file, "w") as f:
        json.dump(data, f)

    tracks, next_id = persistence.load()
    assert tracks == []
    assert next_id == 0


def test_load_handles_corrupt_json(persistence, temp_state_file):
    """Test that load handles malformed JSON files gracefully."""
    # Write corrupt JSON
    with open(temp_state_file, "w") as f:
        f.write("{ invalid json data }")

    tracks, next_id = persistence.load()
    assert tracks == []
    assert next_id == 0


def test_load_handles_missing_fields(persistence, temp_state_file):
    """Test that load handles JSON files missing required track fields."""
    # Write valid JSON but missing track fields (e.g. bbox)
    data = {
        "version": TrackPersistence.VERSION,
        "saved_at": time.time(),
        "next_track_id": 5,
        "tracks": [{"track_id": 1, "class_name": "drone"}],  # Missing bbox, etc.
    }
    with open(temp_state_file, "w") as f:
        json.dump(data, f)

    tracks, next_id = persistence.load()
    assert tracks == []
    assert next_id == 5


def test_delete_state_file(persistence, temp_state_file, sample_tracks):
    """Test that delete_state_file actually removes the file."""
    persistence.update(sample_tracks, next_id=3)
    persistence.save_sync()
    assert temp_state_file.exists()

    assert persistence.delete_state_file() is True
    assert not temp_state_file.exists()


def test_background_save_loop(persistence, temp_state_file, sample_tracks):
    """
    Test that the background thread correctly saves data.
    """
    persistence.update(sample_tracks, next_id=3)

    # We want to patch time.sleep in the module where it's used
    with patch("track_persistence.time.sleep") as mock_sleep:
        # We need sleep to do nothing so the loop runs instantly
        # But we need it to run exactly once and then stop

        def mock_save_sync():
            # This runs after sleep inside the loop. Let's write a dummy file
            # and stop the loop so it only runs once.
            persistence._running = False
            with open(temp_state_file, "w") as f:
                f.write("saved")
            return True

        with patch.object(persistence, "save_sync", side_effect=mock_save_sync) as mock_save:
            persistence.start()

            if persistence._save_thread:
                persistence._save_thread.join(timeout=2.0)

            assert mock_sleep.called
            assert mock_save.called
            assert temp_state_file.exists()


def test_stop_performs_final_save(persistence, temp_state_file, sample_tracks):
    """Test that calling stop() triggers a final synchronous save."""
    persistence.update(sample_tracks, next_id=3)

    # Start it, but we won't wait for the loop.
    # We'll immediately call stop() to verify the flush behavior.
    persistence.start()
    persistence.stop()

    # Verify file was created during the final save
    assert temp_state_file.exists()


def test_signal_handler(persistence, sample_tracks):
    """Test that the signal handler calls save_sync and the original handler."""
    persistence.update(sample_tracks, next_id=3)

    # Mock save_sync so we can verify it was called
    persistence.save_sync = MagicMock(return_value=True)

    # Create a mock for the original signal handler
    mock_original_handler = MagicMock()
    persistence._original_handlers[signal.SIGTERM] = mock_original_handler

    # Call the shutdown handler directly
    persistence._shutdown_handler(signal.SIGTERM, None)

    # Verify save_sync was called
    persistence.save_sync.assert_called_once()

    # Verify original handler was called
    mock_original_handler.assert_called_once_with(signal.SIGTERM, None)
