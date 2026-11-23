"""
ml/datasets.py
Video-Level Dataset Splitting and Transformations for SceneSolver.

Addresses Research Priority 3:
- Splits datasets at the VIDEO level (not individual frames) to prevent data leakage.
- Stratified by crime category.
- Strict separation of augmented training transforms from deterministic validation/test transforms.
- Generates reproducible dataset manifests with video-level split tracking.
"""

import os
import re
import csv
import random
from collections import defaultdict
from typing import List, Dict, Tuple, Optional
import torchvision.transforms as transforms
from torch.utils.data import Dataset
from PIL import Image

from ml.labels import CRIME_CLASSES, encode_evidence_labels


# Training Transforms: Stochastic data augmentation
train_transform = transforms.Compose([
    transforms.Resize((64, 64)),
    transforms.RandomHorizontalFlip(p=0.5),
    transforms.ColorJitter(brightness=0.15, contrast=0.15, saturation=0.15),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5]),
])

# Validation & Test Transforms: Strictly deterministic (NO RANDOM FLIP / JITTER)
eval_transform = transforms.Compose([
    transforms.Resize((64, 64)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5]),
])


def extract_video_id(filename: str) -> str:
    """
    Extract canonical source video ID from frame filename.
    Examples:
        'Robbery005_x264_00120.jpg' -> 'Robbery005_x264'
        'Explosion_012_frame_045.png' -> 'Explosion_012'
        'Arson001.mp4' -> 'Arson001'
    """
    base = os.path.splitext(os.path.basename(filename))[0]
    # Remove trailing frame index patterns like _frame_0001, _00123, -001, etc.
    cleaned = re.sub(r'(_frame[_-]?\d+|\bframe[_-]?\d+|[_-]\d{3,6})$', '', base, flags=re.IGNORECASE)
    return cleaned or base


def split_video_dataset(
    frame_records: List[Dict[str, str]],
    train_ratio: float = 0.70,
    val_ratio: float = 0.15,
    test_ratio: float = 0.15,
    seed: int = 42,
) -> Dict[str, List[Dict[str, str]]]:
    """
    Perform video-level stratified splitting across crime categories.

    Args:
        frame_records: List of dicts with keys 'path' and 'crime_class'.
        train_ratio: Fraction of videos for training.
        val_ratio: Fraction of videos for validation.
        test_ratio: Fraction of videos for testing.
        seed: Random seed for reproducibility.

    Returns:
        Dict with keys 'train', 'val', 'test', each containing frame records.
    """
    assert abs((train_ratio + val_ratio + test_ratio) - 1.0) < 1e-5, "Ratios must sum to 1.0"

    rng = random.Random(seed)

    # 1. Group frames by crime_class -> video_id -> list of frames
    class_video_map = defaultdict(lambda: defaultdict(list))
    for rec in frame_records:
        vid_id = rec.get("video_id") or extract_video_id(rec["path"])
        rec["video_id"] = vid_id
        class_video_map[rec["crime_class"]][vid_id].append(rec)

    splits = {"train": [], "val": [], "test": []}

    # 2. Stratify split video IDs per category
    for c_class, vids_dict in class_video_map.items():
        vids = sorted(list(vids_dict.keys()))
        rng.shuffle(vids)

        n_total = len(vids)
        n_train = max(1, int(round(n_total * train_ratio)))
        n_val = max(1 if n_total >= 3 else 0, int(round(n_total * val_ratio)))
        if n_train + n_val >= n_total and n_total >= 3:
            n_train = n_total - n_val - 1

        train_vids = set(vids[:n_train])
        val_vids = set(vids[n_train: n_train + n_val])
        test_vids = set(vids[n_train + n_val:])

        for vid in train_vids:
            for item in vids_dict[vid]:
                item_copy = dict(item)
                item_copy["split"] = "train"
                splits["train"].append(item_copy)

        for vid in val_vids:
            for item in vids_dict[vid]:
                item_copy = dict(item)
                item_copy["split"] = "val"
                splits["val"].append(item_copy)

        for vid in test_vids:
            for item in vids_dict[vid]:
                item_copy = dict(item)
                item_copy["split"] = "test"
                splits["test"].append(item_copy)

    return splits


def create_dataset_manifest(
    splits: Dict[str, List[Dict[str, str]]],
    output_csv_path: str,
) -> str:
    """Save dataset manifest CSV documenting every frame, video ID, category, and split."""
    os.makedirs(os.path.dirname(os.path.abspath(output_csv_path)), exist_ok=True)
    fieldnames = ["split", "crime_class", "video_id", "path"]

    with open(output_csv_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for split_name in ["train", "val", "test"]:
            for item in splits.get(split_name, []):
                writer.writerow({
                    "split": split_name,
                    "crime_class": item.get("crime_class", ""),
                    "video_id": item.get("video_id", ""),
                    "path": item.get("path", ""),
                })

    return output_csv_path


class EvidenceFrameDataset(Dataset):
    """PyTorch Dataset loading pre-split frames with multi-label evidence targets."""

    def __init__(self, records: List[Dict[str, str]], transform=None):
        self.records = records
        self.transform = transform

    def __len__(self):
        return len(self.records)

    def __getitem__(self, idx: int):
        rec = self.records[idx]
        image = Image.open(rec["path"]).convert("RGB")
        if self.transform:
            image = self.transform(image)
        target = encode_evidence_labels(rec["crime_class"])
        return image, target, rec["crime_class"]
