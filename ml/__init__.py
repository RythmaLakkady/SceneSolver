"""
SceneSolver Machine Learning Research Package
Canonical implementations for evidence extraction, video-level splitting, evaluation metrics, and inference.
"""

from ml.config import MLConfig
from ml.labels import (
    CRIME_CLASSES,
    EVIDENCE_CLASSES,
    CRIME_TO_EVIDENCE,
    DEFAULT_EVIDENCE_THRESHOLDS,
    encode_evidence_labels,
)
from ml.models.evidence_vit import VisionTransformer

__all__ = [
    "MLConfig",
    "CRIME_CLASSES",
    "EVIDENCE_CLASSES",
    "CRIME_TO_EVIDENCE",
    "DEFAULT_EVIDENCE_THRESHOLDS",
    "encode_evidence_labels",
    "VisionTransformer",
]
