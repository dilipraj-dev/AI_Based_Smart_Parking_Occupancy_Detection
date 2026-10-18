"""
General utility helper functions for Smart Parking AI.
"""

from pathlib import Path


def get_project_root() -> Path:
    """Return the absolute path to the project root directory."""
    return Path(__file__).resolve().parent.parent
