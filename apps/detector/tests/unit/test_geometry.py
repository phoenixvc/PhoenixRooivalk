"""
Unit tests for geometry utilities.

Tests IoU calculation, NMS, and bounding box operations.
"""

import pytest
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "src"))

from utils.geometry import (
    calculate_iou,
    non_max_suppression,
    scale_bbox,
    center_to_corners,
    corners_to_center,
    calculate_aspect_ratio,
    calculate_area,
    calculate_center,
    calculate_distance,
    expand_bbox,
    clip_bbox,
)
from interfaces import Detection, BoundingBox


class TestCalculateIoU:
    """Tests for IoU calculation."""

    def test_identical_boxes_returns_one(self):
        """Identical boxes should have IoU of 1.0."""
        box = (0, 0, 100, 100)
        assert calculate_iou(box, box) == 1.0

    def test_no_overlap_returns_zero(self):
        """Non-overlapping boxes should have IoU of 0.0."""
        box1 = (0, 0, 100, 100)
        box2 = (200, 200, 300, 300)
        assert calculate_iou(box1, box2) == 0.0

    def test_adjacent_boxes_returns_zero(self):
        """Adjacent (touching) boxes should have IoU of 0.0."""
        box1 = (0, 0, 100, 100)
        box2 = (100, 0, 200, 100)  # Touching on right edge
        assert calculate_iou(box1, box2) == 0.0

    def test_partial_overlap(self):
        """Partially overlapping boxes should have IoU between 0 and 1."""
        box1 = (0, 0, 100, 100)
        box2 = (50, 50, 150, 150)

        # Intersection: 50x50 = 2500
        # Union: 10000 + 10000 - 2500 = 17500
        expected_iou = 2500 / 17500

        iou = calculate_iou(box1, box2)
        assert abs(iou - expected_iou) < 0.001

    def test_contained_box(self):
        """Smaller box inside larger should have IoU = smaller_area / larger_area."""
        box1 = (0, 0, 100, 100)  # Area: 10000
        box2 = (25, 25, 75, 75)  # Area: 2500

        # Intersection = 2500 (smaller box)
        # Union = 10000 (larger box, since smaller is contained)
        expected_iou = 2500 / 10000

        iou = calculate_iou(box1, box2)
        assert abs(iou - expected_iou) < 0.001

    def test_symmetric(self):
        """IoU should be symmetric: IoU(a,b) == IoU(b,a)."""
        box1 = (0, 0, 100, 100)
        box2 = (50, 50, 150, 150)

        assert calculate_iou(box1, box2) == calculate_iou(box2, box1)

    def test_zero_area_box(self):
        """Zero area box should return 0."""
        box1 = (0, 0, 100, 100)
        box2 = (50, 50, 50, 50)  # Zero area (point)

        assert calculate_iou(box1, box2) == 0.0


class TestNonMaxSuppression:
    """Tests for NMS algorithm."""

    def test_empty_list_returns_empty(self):
        """Empty input should return empty output."""
        assert non_max_suppression([]) == []

    def test_single_detection_kept(self, sample_detection):
        """Single detection should be kept."""
        result = non_max_suppression([sample_detection])
        assert len(result) == 1
        assert result[0] == sample_detection

    def test_overlapping_detections_suppressed(self):
        """Highly overlapping detections should be suppressed, keeping highest confidence."""
        det1 = Detection(0, 'drone', 0.9, BoundingBox(100, 100, 200, 200), 0.9)
        det2 = Detection(0, 'drone', 0.7, BoundingBox(110, 110, 210, 210), 0.7)

        result = non_max_suppression([det1, det2], iou_threshold=0.3)

        assert len(result) == 1
        assert result[0].confidence == 0.9  # Kept higher confidence

    def test_non_overlapping_kept(self):
        """Non-overlapping detections should both be kept."""
        det1 = Detection(0, 'drone', 0.9, BoundingBox(100, 100, 200, 200), 0.9)
        det2 = Detection(0, 'drone', 0.8, BoundingBox(300, 300, 400, 400), 0.8)

        result = non_max_suppression([det1, det2], iou_threshold=0.5)

        assert len(result) == 2

    def test_preserves_order_by_confidence(self):
        """Results should be ordered by confidence (highest first)."""
        det1 = Detection(0, 'drone', 0.5, BoundingBox(0, 0, 50, 50), 0.5)
        det2 = Detection(0, 'drone', 0.9, BoundingBox(200, 200, 250, 250), 0.9)
        det3 = Detection(0, 'drone', 0.7, BoundingBox(400, 400, 450, 450), 0.7)

        result = non_max_suppression([det1, det2, det3])

        assert result[0].confidence == 0.9
        assert result[1].confidence == 0.7
        assert result[2].confidence == 0.5

    def test_high_threshold_keeps_more(self):
        """Higher IoU threshold should keep more detections."""
        det1 = Detection(0, 'drone', 0.9, BoundingBox(100, 100, 200, 200), 0.9)
        det2 = Detection(0, 'drone', 0.8, BoundingBox(120, 120, 220, 220), 0.8)

        result_low = non_max_suppression([det1, det2], iou_threshold=0.3)
        result_high = non_max_suppression([det1, det2], iou_threshold=0.9)

        assert len(result_high) >= len(result_low)


class TestScaleBbox:
    """Tests for bounding box scaling."""

    def test_no_scale(self):
        """Scale of 1.0 should not change coordinates."""
        bbox = (100.0, 100.0, 200.0, 200.0)
        result = scale_bbox(bbox, 1.0, 1.0)
        assert result == (100, 100, 200, 200)

    def test_double_scale(self):
        """Scale of 2.0 should double coordinates."""
        bbox = (50.0, 50.0, 100.0, 100.0)
        result = scale_bbox(bbox, 2.0, 2.0)
        assert result == (100, 100, 200, 200)

    def test_clamp_negative(self):
        """Negative coordinates should be clamped to 0."""
        bbox = (-50.0, -50.0, 100.0, 100.0)
        result = scale_bbox(bbox, 1.0, 1.0, clamp_min=0)
        assert result[0] >= 0
        assert result[1] >= 0

    def test_clamp_max(self):
        """Coordinates should be clamped to max values."""
        bbox = (100.0, 100.0, 1000.0, 1000.0)
        result = scale_bbox(bbox, 1.0, 1.0, clamp_max_x=640, clamp_max_y=480)
        assert result[2] <= 640
        assert result[3] <= 480


class TestCenterCornerConversion:
    """Tests for center <-> corner format conversion."""

    def test_center_to_corners(self):
        """Convert center format to corner format."""
        x1, y1, x2, y2 = center_to_corners(100, 100, 50, 50)
        assert (x1, y1, x2, y2) == (75, 75, 125, 125)

    def test_corners_to_center(self):
        """Convert corner format to center format."""
        cx, cy, w, h = corners_to_center(75, 75, 125, 125)
        assert (cx, cy, w, h) == (100, 100, 50, 50)

    def test_round_trip(self):
        """Converting back and forth should preserve values."""
        original = (100, 100, 50, 50)
        corners = center_to_corners(*original)
        back = corners_to_center(*corners)
        assert back == original


class TestBboxProperties:
    """Tests for bounding box property calculations."""

    def test_calculate_aspect_ratio_wide(self):
        """Wide box should have aspect ratio > 1."""
        bbox = (0, 0, 200, 100)  # 200x100
        assert calculate_aspect_ratio(bbox) == 2.0

    def test_calculate_aspect_ratio_tall(self):
        """Tall box should have aspect ratio < 1."""
        bbox = (0, 0, 100, 200)  # 100x200
        assert calculate_aspect_ratio(bbox) == 0.5

    def test_calculate_aspect_ratio_square(self):
        """Square box should have aspect ratio = 1."""
        bbox = (0, 0, 100, 100)
        assert calculate_aspect_ratio(bbox) == 1.0

    def test_calculate_aspect_ratio_zero_height(self):
        """Zero height should return 0 (avoid division by zero)."""
        bbox = (0, 0, 100, 0)
        assert calculate_aspect_ratio(bbox) == 0.0

    def test_calculate_area(self):
        """Area calculation should be width * height."""
        bbox = (0, 0, 100, 50)
        assert calculate_area(bbox) == 5000

    def test_calculate_area_zero(self):
        """Zero size box should have area 0."""
        bbox = (50, 50, 50, 50)
        assert calculate_area(bbox) == 0

    def test_calculate_center(self):
        """Center should be midpoint of corners."""
        bbox = (100, 100, 200, 200)
        assert calculate_center(bbox) == (150, 150)


class TestCalculateDistance:
    """Tests for Euclidean distance calculation."""

    def test_same_point(self):
        """Distance from point to itself is 0."""
        assert calculate_distance((0, 0), (0, 0)) == 0.0

    def test_horizontal_distance(self):
        """Horizontal distance should be |x2 - x1|."""
        assert calculate_distance((0, 0), (100, 0)) == 100.0

    def test_vertical_distance(self):
        """Vertical distance should be |y2 - y1|."""
        assert calculate_distance((0, 0), (0, 100)) == 100.0

    def test_diagonal_distance(self):
        """Diagonal distance should follow Pythagorean theorem."""
        # 3-4-5 triangle
        assert calculate_distance((0, 0), (3, 4)) == 5.0

    def test_symmetric(self):
        """Distance should be symmetric."""
        p1, p2 = (10, 20), (30, 40)
        assert calculate_distance(p1, p2) == calculate_distance(p2, p1)


class TestExpandBbox:
    """Tests for bounding box expansion."""

    def test_no_expansion(self):
        """Factor 1.0 and padding 0 should not change box."""
        bbox = (100, 100, 200, 200)
        result = expand_bbox(bbox, factor=1.0, padding=0)
        assert result == bbox

    def test_expand_by_factor(self):
        """Factor > 1 should expand the box."""
        bbox = (100, 100, 200, 200)  # 100x100 centered at 150,150
        result = expand_bbox(bbox, factor=2.0, padding=0)

        # Should be 200x200 centered at 150,150
        assert result == (50, 50, 250, 250)

    def test_expand_by_padding(self):
        """Padding should add pixels to each side."""
        bbox = (100, 100, 200, 200)
        result = expand_bbox(bbox, factor=1.0, padding=10)

        # Should add 10 to each side
        assert result == (90, 90, 210, 210)


class TestClipBbox:
    """Tests for clipping bounding box to image boundaries."""

    def test_no_clipping_needed(self):
        """Box inside image should not change."""
        bbox = (100, 100, 200, 200)
        result = clip_bbox(bbox, width=640, height=480)
        assert result == bbox

    def test_clip_negative(self):
        """Negative coordinates should be clipped to 0."""
        bbox = (-50, -50, 100, 100)
        result = clip_bbox(bbox, width=640, height=480)
        assert result == (0, 0, 100, 100)

    def test_clip_overflow(self):
        """Coordinates exceeding image size should be clipped."""
        bbox = (500, 400, 700, 600)
        result = clip_bbox(bbox, width=640, height=480)
        assert result == (500, 400, 640, 480)

    def test_clip_both(self):
        """Both negative and overflow should be handled."""
        bbox = (-50, -50, 700, 600)
        result = clip_bbox(bbox, width=640, height=480)
        assert result == (0, 0, 640, 480)
