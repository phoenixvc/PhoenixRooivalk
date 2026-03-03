"""
Unit test configuration: ensures apps/detector/src is on sys.path
so unit tests can import from src without per-file path manipulation.
"""

import sys
from pathlib import Path

# Add the detector src directory to the Python path for all unit tests
src_path = str(Path(__file__).parent.parent.parent / "src")
if src_path not in sys.path:
    sys.path.insert(0, src_path)
