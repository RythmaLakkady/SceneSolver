import torch
import torch.nn as nn
import torch.nn.functional as F

# 1. Canonical Evidence Classes
evidence_classes = [
    "Gun", "Knife", "Mask", "Car", "Fire", "Glass", "Crowd",
    "Blood", "Explosion", "Bag", "Money", "Weapon", "Smoke", "Person"
]

# 2. Canonical Crime Classes (Alphabetical order matching ImageFolder default)
crime_classes = [
    "Abuse", "Arrest", "Arson", "Assault", "Burglary", "Explosion", "Fighting",
    "NormalVideos", "RoadAccidents", "Robbery", "Shooting", "Shoplifting", "Stealing", "Vandalism"
]

# 3. Weakly-Supervised Pseudo-Label Mapping (Resolving Knife and Weapon)
crime_to_evidence = {
    "Abuse": ["Person"],
    "Arrest": ["Person", "Crowd"],
    "Arson": ["Fire", "Smoke"],
    "Assault": ["Blood", "Person", "Knife", "Weapon"],
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


def encode_evidence_labels(crime_target, dataset_classes=None):
    """
    Encode crime category into a multi-hot binary evidence vector.
    Derives class name dynamically from dataset_classes to guarantee zero index desynchronization.
    """
    if isinstance(crime_target, int):
        classes = dataset_classes if dataset_classes is not None else crime_classes
        crime_class = classes[crime_target]
    else:
        crime_class = str(crime_target)

    evidences = crime_to_evidence.get(crime_class, [])
    binary = [1.0 if ev in evidences else 0.0 for ev in evidence_classes]
    return torch.tensor(binary, dtype=torch.float32)


class VisionTransformer(nn.Module):
    def __init__(self, num_classes=14, dim=256, depth=6, heads=8, mlp_dim=512, patch_size=8, image_size=64):
        super().__init__()
        self.patch_size = patch_size
        self.dim = dim
        self.image_size = image_size

        self.conv = nn.Conv2d(3, dim, kernel_size=patch_size, stride=patch_size)
        self.num_patches = (image_size // patch_size) ** 2  # 64
        self.cls_token = nn.Parameter(torch.randn(1, 1, dim))
        self.pos_embedding = nn.Parameter(torch.randn(1, self.num_patches + 1, dim))  # 65

        self.transformer = nn.TransformerEncoder(
            nn.TransformerEncoderLayer(d_model=dim, nhead=heads, dim_feedforward=mlp_dim, batch_first=True),
            num_layers=depth
        )

        self.to_evidence = nn.Linear(dim, num_classes)

    def forward(self, x):
        x = self.conv(x)                  # (B, D, 8, 8)
        x = x.flatten(2).transpose(1, 2)  # (B, 64, D)
        cls_tokens = self.cls_token.expand(x.shape[0], -1, -1)  # (B, 1, D)
        x = torch.cat([cls_tokens, x], dim=1)                   # (B, 65, D)
        x = x + self.pos_embedding                              # Add fixed pos embeddings
        x = self.transformer(x)
        x = x[:, 0]  # CLS token
        return self.to_evidence(x)
