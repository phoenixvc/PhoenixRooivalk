"""
Unit tests for test_audio_pwm utility functions.

Tests the _position_bar display function.
"""

import sys
from pathlib import Path

# Add src to path for imports
src_path = Path(__file__).parent.parent.parent / "src"
sys.path.insert(0, str(src_path))

from test_audio_pwm import _position_bar


class TestPositionBar:
    def test_center_shows_plus(self):
        """Value 0.0 should show '+' at center position."""
        bar = _position_bar(0.0)
        assert "+" in bar
        assert "#" not in bar

    def test_full_left(self):
        """Value -1.0 should show '#' at left edge."""
        bar = _position_bar(-1.0)
        assert bar.startswith("[#")

    def test_full_right(self):
        """Value +1.0 should show '#' at right edge."""
        bar = _position_bar(1.0)
        assert bar.endswith("#]")

    def test_off_center_shows_hash_and_pipe(self):
        """Non-center value should show both '#' and '|'."""
        bar = _position_bar(0.5)
        assert "#" in bar
        assert "|" in bar
        assert "+" not in bar

    def test_negative_value(self):
        bar = _position_bar(-0.5)
        assert "#" in bar
        assert "|" in bar

    def test_bar_length(self):
        """Default bar should be [21 chars] = 23 total with brackets."""
        bar = _position_bar(0.0)
        assert len(bar) == 23  # [ + 21 + ]

    def test_custom_width(self):
        bar = _position_bar(0.0, width=11)
        assert len(bar) == 13  # [ + 11 + ]

    def test_clamped_beyond_range(self):
        """Values beyond [-1, 1] should be clamped."""
        bar_left = _position_bar(-5.0)
        bar_right = _position_bar(5.0)
        assert bar_left.startswith("[#")
        assert bar_right.endswith("#]")
