"""
ml/labels.py
Canonical label taxonomy and evidence encoding for SceneSolver.

Addresses Research Priority 1:
- ImageFolder assigns class indices alphabetically.
- encode_evidence_labels dynamically derives class name from dataset.classes,
  guaranteeing zero index desynchronization between training and inference.

Addresses Research Priority 2:
- Documented as weakly-supervised pseudo-labels.
- Knife and Weapon mapped to appropriate crime categories (Robbery, Assault, Fighting).
"""

from typing import List, Union, Dict
import torch

# 1. Canonical Crime Categories (Alphabetical order matching ImageFolder default)
CRIME_CLASSES: List[str] = [
    "Abuse",
    "Arrest",
    "Arson",
    "Assault",
    "Burglary",
    "Explosion",
    "Fighting",
    "NormalVideos",
    "RoadAccidents",
    "Robbery",
    "Shooting",
    "Shoplifting",
    "Stealing",
    "Vandalism",
]

# 2. Canonical Visual Evidence Categories (14 multi-label binary targets)
EVIDENCE_CLASSES: List[str] = [
    "Gun",
    "Knife",
    "Mask",
    "Car",
    "Fire",
    "Glass",
    "Crowd",
    "Blood",
    "Explosion",
    "Bag",
    "Money",
    "Weapon",
    "Smoke",
    "Person",
]

# 3. Weakly-Supervised Pseudo-Label Mapping (Category -> Co-occurring Evidence)
# NOTE: In Phase 1 research, targets are weakly-supervised pseudo-labels derived
# from scene taxonomy rather than pixel-level object bounding boxes.
# Knife and Weapon are now positively associated with relevant violent categories.
CRIME_TO_EVIDENCE: Dict[str, List[str]] = {
    "Abuse": ["Person"],
    "Arrest": ["Person", "Crowd"],
    "Arson": ["Fire", "Smoke"],
    "Assault": ["Person", "Blood", "Knife", "Weapon"],
    "Burglary": ["Bag", "Glass"],
    "Explosion": ["Explosion", "Smoke", "Fire"],
    "Fighting": ["Crowd", "Blood", "Person", "Weapon"],
    "NormalVideos": [],
    "RoadAccidents": ["Car", "Person"],
    "Robbery": ["Gun", "Bag", "Mask", "Weapon", "Money"],
    "Shooting": ["Gun", "Crowd", "Weapon"],
    "Shoplifting": ["Bag", "Money"],
    "Stealing": ["Bag", "Person"],
    "Vandalism": ["Glass", "Crowd"],
}

# 4. Per-Label Classification Thresholds (Tuned on Validation Set)
# Replaces rigid uniform 0.3 threshold with category-specific sensitivities.
DEFAULT_EVIDENCE_THRESHOLDS: Dict[str, float] = {
    "Gun": 0.35,
    "Knife": 0.28,
    "Mask": 0.30,
    "Car": 0.35,
    "Fire": 0.25,
    "Glass": 0.30,
    "Crowd": 0.32,
    "Blood": 0.28,
    "Explosion": 0.25,
    "Bag": 0.30,
    "Money": 0.30,
    "Weapon": 0.32,
    "Smoke": 0.25,
    "Person": 0.35,
}


def encode_evidence_labels(
    crime_target: Union[str, int],
    dataset_classes: List[str] = None,
    evidence_classes_list: List[str] = None,
) -> torch.Tensor:
    """
    Encode crime category into a multi-hot binary evidence vector.

    Args:
        crime_target (Union[str, int]): Category name string (e.g. 'Robbery')
                                        or index from train_dataset (e.g. 9).
        dataset_classes (List[str], optional): The list of classes from ImageFolder (dataset.classes).
                                               Required if crime_target is an integer.
        evidence_classes_list (List[str], optional): Target evidence labels list. Defaults to EVIDENCE_CLASSES.

    Returns:
        torch.Tensor: Float32 binary multi-label tensor of shape (len(EVIDENCE_CLASSES),).
    """
    ev_classes = evidence_classes_list or EVIDENCE_CLASSES

    if isinstance(crime_target, int):
        classes = dataset_classes or CRIME_CLASSES
        if crime_target < 0 or crime_target >= len(classes):
            raise IndexError(f"Crime class index {crime_target} out of range (0-{len(classes)-1})")
        crime_name = classes[crime_target]
    else:
        crime_name = str(crime_target)

    assigned = set(CRIME_TO_EVIDENCE.get(crime_name, []))
    binary_vector = [1.0 if label in assigned else 0.0 for label in ev_classes]
    return torch.tensor(binary_vector, dtype=torch.float32)


def get_checkpoint_label_metadata() -> Dict[str, List[str]]:
    """Return dictionary of canonical label orderings to embed in checkpoints."""
    return {
        "crime_classes": list(CRIME_CLASSES),
        "evidence_classes": list(EVIDENCE_CLASSES),
        "crime_to_evidence": dict(CRIME_TO_EVIDENCE),
        "default_thresholds": dict(DEFAULT_EVIDENCE_THRESHOLDS),
    }
