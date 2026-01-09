"""
Utility modules for Pi Drone Detector.

Provides shared functionality:
- geometry: IoU, NMS, bounding box operations
- image: Preprocessing, color conversion
- logging_config: Structured logging setup
- distance: Distance estimation calculations
"""

from utils.geometry import calculate_iou, non_max_suppression, scale_bbox
from utils.logging_config import setup_logging, get_logger

__all__ = [
    'calculate_iou',
    'non_max_suppression',
    'scale_bbox',
    'setup_logging',
    'get_logger',
]
