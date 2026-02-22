"""
Pytest configuration and fixtures for detector tests.
"""

import os

import pytest


def has_hardware(device: str = "camera") -> bool:
    """Check if specific hardware is available for testing."""
    if device == "camera":
        try:
            import cv2
            cap = cv2.VideoCapture(0)
            available = cap.isOpened()
            cap.release()
            return available
        except Exception:
            return False
    if device == "gpio":
        try:
            import RPi.GPIO  # noqa: F401
            return True
        except Exception:
            return False
    return False


skip_no_camera = pytest.mark.skipif(
    not has_hardware("camera"),
    reason="No camera hardware available",
)

skip_no_gpio = pytest.mark.skipif(
    not has_hardware("gpio"),
    reason="No GPIO hardware available (not a Raspberry Pi)",
)


@pytest.fixture(scope="session", autouse=True)
def clear_display_env():
    """
    Automatically remove DISPLAY environment variable during all tests.
    
    DISPLAY conflicts with the Settings.display field when Pydantic Settings
    tries to parse environment variables. This fixture ensures it's removed
    for the entire test session.
    """
    env_backup = os.environ.pop("DISPLAY", None)
    yield
    if env_backup:
        os.environ["DISPLAY"] = env_backup


@pytest.fixture
def temp_config_file(tmp_path):
    """Create a temporary config file for testing."""
    from config.settings import create_default_config
    
    config_file = tmp_path / "test_config.yaml"
    create_default_config(str(config_file))
    return config_file


@pytest.fixture
def sample_detection():
    """Create a sample Detection object for testing."""
    import sys
    from pathlib import Path

    # Add src to path if not already there
    src_path = Path(__file__).parent.parent / "src"
    if str(src_path) not in sys.path:
        sys.path.insert(0, str(src_path))
    
    from interfaces import BoundingBox, Detection
    
    bbox = BoundingBox(100, 100, 200, 200)
    return Detection(
        class_id=0,
        class_name="drone",
        confidence=0.85,
        bbox=bbox,
        drone_score=0.9,
    )
