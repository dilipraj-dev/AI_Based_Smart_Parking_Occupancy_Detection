"""
Data preprocessing utility module.

Re-exports core dataset loading and preprocessing routines
from src.preprocessing for backward compatibility.
"""

from src.preprocessing import load_dataset, prepare_datasets

__all__ = ["load_dataset", "prepare_datasets"]
