"""
backend/models/vit_new.py
Canonical ViT re-export pointing to canonical architecture.
Resolves duplicate divergent implementation between Flask backend and Express backend models.
"""

import sys
import os

# Add root directory to sys.path so ml package can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from ml.models.evidence_vit import VisionTransformer
from ml.labels import EVIDENCE_CLASSES, CRIME_CLASSES, DEFAULT_EVIDENCE_THRESHOLDS

# Backwards compatibility aliases
ViT = VisionTransformer
evidence_classes = EVIDENCE_CLASSES
crime_classes = CRIME_CLASSES
labels = [e.lower() for e in EVIDENCE_CLASSES]

__all__ = [
    "VisionTransformer",
    "ViT",
    "EVIDENCE_CLASSES",
    "CRIME_CLASSES",
    "DEFAULT_EVIDENCE_THRESHOLDS",
]
