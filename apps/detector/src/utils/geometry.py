"""
Geometric utilities for bounding boxes, IoU, and NMS.

Centralized geometry operations to avoid code duplication.
"""

from typing import Callable, Optional, Protocol, TypeVar

# Type variable for generic detection objects
T = TypeVar('T')


class HasBBox(Protocol):
    """Protocol for objects with a bounding box."""
    @property
    def bbox(self) -> "BoundingBoxLike":
        ...

    @property
    def confidence(self) -> float:
        ...


class BoundingBoxLike(Protocol):
    """Protocol for bounding box objects."""
    def to_tuple(self) -> tuple[int, int, int, int]:
        ...


# =============================================================================
# Core Functions
# =============================================================================

def calculate_iou(
    box1: tuple[int, int, int, int],
    box2: tuple[int, int, int, int],
) -> float:
    """
    Calculate Intersection over Union (IoU) for two bounding boxes.

    Args:
        box1: First box as (x1, y1, x2, y2)
        box2: Second box as (x1, y1, x2, y2)

    Returns:
        IoU value between 0.0 and 1.0
    """
    # Calculate intersection coordinates
    x1 = max(box1[0], box2[0])
    y1 = max(box1[1], box2[1])
    x2 = min(box1[2], box2[2])
    y2 = min(box1[3], box2[3])

    # Calculate intersection area
    intersection = max(0, x2 - x1) * max(0, y2 - y1)

    # Calculate individual areas
    area1 = (box1[2] - box1[0]) * (box1[3] - box1[1])
    area2 = (box2[2] - box2[0]) * (box2[3] - box2[1])

    # Calculate union
    union = area1 + area2 - intersection

    return intersection / union if union > 0 else 0.0


def non_max_suppression(
    detections: list[T],
    iou_threshold: float = 0.45,
    confidence_key: Optional[Callable[[T], float]] = None,
    bbox_key: Optional[Callable[[T], tuple[int, int, int, int]]] = None,
) -> list[T]:
    """
    Apply Non-Maximum Suppression to a list of detections.

    Args:
        detections: List of detection objects
        iou_threshold: IoU threshold for suppression
        confidence_key: Function to extract confidence from detection
        bbox_key: Function to extract bbox tuple from detection

    Returns:
        Filtered list of detections after NMS
    """
    if not detections:
        return []

    # Default key functions for Detection-like objects
    if confidence_key is None:
        def confidence_key(d):
            return d.confidence
    if bbox_key is None:
        def bbox_key(d):
            return d.bbox.to_tuple() if hasattr(d.bbox, 'to_tuple') else d.bbox

    # Sort by confidence (descending)
    sorted_dets = sorted(detections, key=confidence_key, reverse=True)

    keep = []
    while sorted_dets:
        # Keep the highest confidence detection
        best = sorted_dets.pop(0)
        keep.append(best)

        # Remove detections with high IoU overlap
        best_bbox = bbox_key(best)
        sorted_dets = [
            d for d in sorted_dets
            if calculate_iou(best_bbox, bbox_key(d)) < iou_threshold
        ]

    return keep


def scale_bbox(
    bbox: tuple[float, float, float, float],
    x_scale: float,
    y_scale: float,
    clamp_min: int = 0,
    clamp_max_x: Optional[int] = None,
    clamp_max_y: Optional[int] = None,
) -> tuple[int, int, int, int]:
    """
    Scale a bounding box and convert to integer coordinates.

    Args:
        bbox: Box as (x1, y1, x2, y2) or (x_center, y_center, w, h)
        x_scale: Scale factor for x coordinates
        y_scale: Scale factor for y coordinates
        clamp_min: Minimum coordinate value
        clamp_max_x: Maximum x coordinate (optional)
        clamp_max_y: Maximum y coordinate (optional)

    Returns:
        Scaled box as (x1, y1, x2, y2) integers
    """
    x1 = int(bbox[0] * x_scale)
    y1 = int(bbox[1] * y_scale)
    x2 = int(bbox[2] * x_scale)
    y2 = int(bbox[3] * y_scale)

    # Clamp coordinates
    x1 = max(clamp_min, x1)
    y1 = max(clamp_min, y1)

    if clamp_max_x is not None:
        x2 = min(clamp_max_x, x2)
    if clamp_max_y is not None:
        y2 = min(clamp_max_y, y2)

    return (x1, y1, x2, y2)


def center_to_corners(
    x_center: float,
    y_center: float,
    width: float,
    height: float,
) -> tuple[float, float, float, float]:
    """
    Convert center format (x_center, y_center, w, h) to corner format (x1, y1, x2, y2).

    Args:
        x_center: Box center x coordinate
        y_center: Box center y coordinate
        width: Box width
        height: Box height

    Returns:
        Box as (x1, y1, x2, y2)
    """
    x1 = x_center - width / 2
    y1 = y_center - height / 2
    x2 = x_center + width / 2
    y2 = y_center + height / 2
    return (x1, y1, x2, y2)


def corners_to_center(
    x1: float,
    y1: float,
    x2: float,
    y2: float,
) -> tuple[float, float, float, float]:
    """
    Convert corner format (x1, y1, x2, y2) to center format (x_center, y_center, w, h).

    Args:
        x1, y1: Top-left corner
        x2, y2: Bottom-right corner

    Returns:
        Box as (x_center, y_center, width, height)
    """
    width = x2 - x1
    height = y2 - y1
    x_center = x1 + width / 2
    y_center = y1 + height / 2
    return (x_center, y_center, width, height)


def calculate_aspect_ratio(
    bbox: tuple[int, int, int, int],
) -> float:
    """
    Calculate aspect ratio (width / height) of a bounding box.

    Args:
        bbox: Box as (x1, y1, x2, y2)

    Returns:
        Aspect ratio (width / height), or 0 if height is 0
    """
    width = bbox[2] - bbox[0]
    height = bbox[3] - bbox[1]
    return width / height if height > 0 else 0.0


def calculate_area(
    bbox: tuple[int, int, int, int],
) -> int:
    """
    Calculate area of a bounding box.

    Args:
        bbox: Box as (x1, y1, x2, y2)

    Returns:
        Area in pixels
    """
    width = bbox[2] - bbox[0]
    height = bbox[3] - bbox[1]
    return max(0, width) * max(0, height)


def calculate_center(
    bbox: tuple[int, int, int, int],
) -> tuple[int, int]:
    """
    Calculate center point of a bounding box.

    Args:
        bbox: Box as (x1, y1, x2, y2)

    Returns:
        Center as (x, y)
    """
    x = (bbox[0] + bbox[2]) // 2
    y = (bbox[1] + bbox[3]) // 2
    return (x, y)


def calculate_distance(
    point1: tuple[float, float],
    point2: tuple[float, float],
) -> float:
    """
    Calculate Euclidean distance between two points.

    Args:
        point1: First point as (x, y)
        point2: Second point as (x, y)

    Returns:
        Euclidean distance
    """
    import math
    dx = point2[0] - point1[0]
    dy = point2[1] - point1[1]
    return math.sqrt(dx * dx + dy * dy)


def expand_bbox(
    bbox: tuple[int, int, int, int],
    factor: float = 1.0,
    padding: int = 0,
) -> tuple[int, int, int, int]:
    """
    Expand a bounding box by a factor and/or padding.

    Args:
        bbox: Box as (x1, y1, x2, y2)
        factor: Scale factor (1.0 = no change, 1.5 = 50% larger)
        padding: Additional pixels to add on each side

    Returns:
        Expanded box as (x1, y1, x2, y2)
    """
    x1, y1, x2, y2 = bbox
    cx, cy = (x1 + x2) / 2, (y1 + y2) / 2
    w, h = x2 - x1, y2 - y1

    # Apply factor
    w *= factor
    h *= factor

    # Apply padding
    w += 2 * padding
    h += 2 * padding

    # Convert back to corners
    x1 = int(cx - w / 2)
    y1 = int(cy - h / 2)
    x2 = int(cx + w / 2)
    y2 = int(cy + h / 2)

    return (x1, y1, x2, y2)


def clip_bbox(
    bbox: tuple[int, int, int, int],
    width: int,
    height: int,
) -> tuple[int, int, int, int]:
    """
    Clip a bounding box to image boundaries.

    Args:
        bbox: Box as (x1, y1, x2, y2)
        width: Image width
        height: Image height

    Returns:
        Clipped box as (x1, y1, x2, y2)
    """
    x1 = max(0, min(bbox[0], width))
    y1 = max(0, min(bbox[1], height))
    x2 = max(0, min(bbox[2], width))
    y2 = max(0, min(bbox[3], height))
    return (x1, y1, x2, y2)
