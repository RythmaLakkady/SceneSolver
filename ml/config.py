"""
ml/config.py
Configuration and reproducible hyperparameter defaults for SceneSolver ML research.
Replaces machine-specific paths with environment variables and programmatic config.
"""

import os
from dataclasses import dataclass, field
import torch


@dataclass
class MLConfig:
    # Model architecture parameters (matches trained vit_model.pth weights)
    image_size: int = 64
    patch_size: int = 8
    dim: int = 256
    depth: int = 6
    heads: int = 8
    mlp_dim: int = 512
    num_evidence_classes: int = 14
    num_crime_classes: int = 14

    # Sampling defaults
    max_frames: int = 50
    min_frame_diff: float = 30.0
    sampling_method: str = "adaptive"  # 'adaptive' or 'uniform'

    # Training & Split defaults
    random_seed: int = 42
    train_ratio: float = 0.70
    val_ratio: float = 0.15
    test_ratio: float = 0.15
    batch_size: int = 32
    learning_rate: float = 1e-4

    # Paths (configurable via environment variables or CLI)
    checkpoint_path: str = field(
        default_factory=lambda: os.getenv(
            "VIT_CHECKPOINT_PATH",
            os.path.join(os.path.dirname(__file__), "..", "backendflask", "vit_model.pth"),
        )
    )
    dataset_root: str = field(
        default_factory=lambda: os.getenv("UCF_CRIME_DATASET_ROOT", "")
    )
    results_dir: str = field(
        default_factory=lambda: os.getenv(
            "EXPERIMENT_RESULTS_DIR",
            os.path.join(os.path.dirname(__file__), "..", "experiments", "results"),
        )
    )

    # Hardware
    device: str = field(
        default_factory=lambda: "cuda" if torch.cuda.is_available() else "cpu"
    )


# Global singleton configuration
config = MLConfig()
