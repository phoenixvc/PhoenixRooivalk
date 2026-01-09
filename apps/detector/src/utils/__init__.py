"""
Utility modules for Detector.

Provides shared functionality:
- geometry: IoU, NMS, bounding box operations
- logging_config: Structured logging setup
"""

from .geometry import calculate_iou, non_max_suppression, scale_bbox
from .logging_config import setup_logging, get_logger

__all__ = [
    'calculate_iou',
    'non_max_suppression',
    'scale_bbox',
    'setup_logging',
    'get_logger',
]
