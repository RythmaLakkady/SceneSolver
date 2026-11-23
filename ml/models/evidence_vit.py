"""
ml/models/evidence_vit.py
Canonical Vision Transformer (ViT) implementation for evidence extraction.
Consolidates duplicated definitions and maintains full compatibility with vit_model.pth.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import List, Dict, Any, Optional

from ml.labels import EVIDENCE_CLASSES, DEFAULT_EVIDENCE_THRESHOLDS


class VisionTransformer(nn.Module):
    """
    Vision Transformer for Multi-Label Forensic Evidence Detection.

    Architecture (matching trained checkpoint weights):
    - Input: (B, 3, 64, 64)
    - Conv2D Patch Projection: 8x8 patches, stride 8 -> 64 patches of dim 256
    - Learned CLS token prepended -> 65 tokens
    - 1D Position Embedding (1, 65, 256)
    - 6-Layer TransformerEncoder (8 heads, dim_feedforward=512)
    - Multi-label classification head projecting CLS token to 14 evidence classes
    """

    def __init__(
        self,
        num_classes: int = 14,
        dim: int = 256,
        depth: int = 6,
        heads: int = 8,
        mlp_dim: int = 512,
        patch_size: int = 8,
        image_size: int = 64,
    ):
        super().__init__()
        self.patch_size = patch_size
        self.dim = dim
        self.image_size = image_size
        self.num_classes = num_classes

        # Patch projection
        self.conv = nn.Conv2d(3, dim, kernel_size=patch_size, stride=patch_size)
        self.num_patches = (image_size // patch_size) ** 2  # (64 // 8)^2 = 64
        self.cls_token = nn.Parameter(torch.randn(1, 1, dim))
        self.pos_embedding = nn.Parameter(torch.randn(1, self.num_patches + 1, dim))

        # Transformer encoder
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=dim,
            nhead=heads,
            dim_feedforward=mlp_dim,
            batch_first=True,
            dropout=0.0,
        )
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=depth)

        # Classification projection
        self.to_evidence = nn.Linear(dim, num_classes)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Forward pass returning raw unnormalized logits.

        Args:
            x (torch.Tensor): Image tensor of shape (B, 3, 64, 64)

        Returns:
            torch.Tensor: Multi-label logits of shape (B, num_classes)
        """
        x = self.conv(x)  # (B, D, 8, 8)
        x = x.flatten(2).transpose(1, 2)  # (B, 64, D)
        cls_tokens = self.cls_token.expand(x.shape[0], -1, -1)  # (B, 1, D)
        x = torch.cat([cls_tokens, x], dim=1)  # (B, 65, D)
        x = x + self.pos_embedding  # Add positional embedding
        x = self.transformer(x)
        cls_output = x[:, 0]  # CLS token output (B, D)
        return self.to_evidence(cls_output)

    def predict_probabilities(self, x: torch.Tensor) -> torch.Tensor:
        """Compute sigmoid probabilities for each evidence class."""
        logits = self.forward(x)
        return torch.sigmoid(logits)

    def extract_evidence(
        self,
        image_tensor: torch.Tensor,
        thresholds: Optional[Dict[str, float]] = None,
        evidence_classes_list: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Run inference on a single image tensor and return structured detected evidence.

        Args:
            image_tensor (torch.Tensor): Preprocessed image of shape (1, 3, 64, 64) or (3, 64, 64)
            thresholds (Optional[Dict[str, float]]): Thresholds per evidence class.
            evidence_classes_list (Optional[List[str]]): Class label list.

        Returns:
            List[Dict[str, Any]]: List of dicts with label, confidence, threshold, and detected status.
        """
        labels = evidence_classes_list or EVIDENCE_CLASSES
        thresh_dict = thresholds or DEFAULT_EVIDENCE_THRESHOLDS

        if image_tensor.ndim == 3:
            image_tensor = image_tensor.unsqueeze(0)

        self.eval()
        with torch.no_grad():
            probs = self.predict_probabilities(image_tensor).squeeze(0).cpu().tolist()

        detected = []
        for i, prob in enumerate(probs):
            label = labels[i]
            t = thresh_dict.get(label, 0.3)
            detected.append({
                "label": label,
                "confidence": round(float(prob), 4),
                "threshold": t,
                "detected": prob >= t,
            })

        return detected
