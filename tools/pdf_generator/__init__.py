"""
Phoenix Rooivalk PDF Generator Library

A modular, reusable PDF generation system using reportlab.
"""

from .styles import PhoenixStyles, Colors
from .components import (
    CoverPage,
    SectionHeader,
    MetricsRow,
    DataTable,
    Callout,
    BulletList,
    KeyValueTable,
)
from .builder import DocumentBuilder

__all__ = [
    "PhoenixStyles",
    "Colors",
    "CoverPage",
    "SectionHeader",
    "MetricsRow",
    "DataTable",
    "Callout",
    "BulletList",
    "KeyValueTable",
    "DocumentBuilder",
]

__version__ = "1.0.0"
