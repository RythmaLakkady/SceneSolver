import torch
torch.backends.cudnn.benchmark = True
torch.backends.cuda.matmul.allow_tf32 = True
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader, Dataset
from torchvision import transforms, datasets
import torch.optim as optim
import time

# Clear GPU memory if needed
torch.cuda.empty_cache()

# Set device for RTX 4050
device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")

# Dataset Class
class UCFCrimeDataset(Dataset):
    def __init__(self, root_dir, transform=None):
        self.dataset = datasets.ImageFolder(root=root_dir, transform=transform)
    
    def __len__(self):
        return len(self.dataset)
    
    def __getitem__(self, idx):
        return self.dataset[idx]

# Training Data Transformations
train_transform = transforms.Compose([
    transforms.RandomResizedCrop(64, scale=(0.8, 1.0)),
    transforms.RandomHorizontalFlip(p=0.5),
    transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.1),
    transforms.RandomAffine(degrees=10, translate=(0.1, 0.1)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5])
])

test_transform = transforms.Compose([
    transforms.Resize((64, 64)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5])
])


# Vision Transformer (ViT) Model for Evidence Extraction
class PatchEmbedding(nn.Module):
    def __init__(self, img_size=64, patch_size=16, in_channels=3, embed_dim=768):
        super().__init__()
        self.num_patches = (img_size // patch_size) ** 2
        self.proj = nn.Conv2d(in_channels, embed_dim, kernel_size=patch_size, stride=patch_size)
    
    def forward(self, x):
        x = self.proj(x)
        x = x.flatten(2).transpose(1, 2)
        return x


class ViT(nn.Module):
    def __init__(self, img_size=64, patch_size=16, in_channels=3, embed_dim=768, num_heads=8, depth=6, num_classes=14):
        super().__init__()
        self.patch_embed = PatchEmbedding(img_size, patch_size, in_channels, embed_dim)
        self.num_patches = self.patch_embed.num_patches
        self.cls_token = nn.Parameter(torch.randn(1, 1, embed_dim))
        self.pos_embed = nn.Parameter(torch.randn(1, self.num_patches + 1, embed_dim))
        nn.init.trunc_normal_(self.pos_embed, std=0.02)

        self.transformer = nn.TransformerEncoder(
            nn.TransformerEncoderLayer(d_model=embed_dim, nhead=num_heads, dim_feedforward=1024, dropout=0.1, batch_first=True),
            num_layers=depth
        )

        self.mlp_head = nn.Sequential(
            nn.LayerNorm(embed_dim),
            nn.Linear(embed_dim, 1024),
            nn.GELU(),
            nn.Linear(1024, num_classes)
        )

        self.labels = ["gun", "knife", "broken glass", "blood stains", "footprints", "bullet casing", "explosives", "rope", "handcuffs", "drugs", "documents", "fingerprints", "money", "jewelry"]

    def forward(self, x):
        B = x.shape[0]
        x = self.patch_embed(x)
        cls_tokens = self.cls_token.expand(B, -1, -1)
        x = torch.cat((cls_tokens, x), dim=1)
        x = x + self.pos_embed[:, : x.shape[1], :]
        x = self.transformer(x)
        evidence_features = self.mlp_head(x[:, 0])

        detected_evidence = {}
        for i, score in enumerate(evidence_features[0]):
            if score > 0.5:  # Threshold for detecting evidence
                detected_evidence[self.labels[i]] = float(score)

        return detected_evidence


if __name__ == "__main__":
    model = ViT().to(device)

    # Load Dataset
    dataset_path = "C:\\Users\\Tusha\\OneDrive\\Desktop\\SceneSolver\\dataset\\Test"
    test_dataset = UCFCrimeDataset(root_dir=dataset_path, transform=test_transform)
    test_loader = DataLoader(test_dataset, batch_size=1, shuffle=False)

    model.eval()

    # Run Evidence Extraction on the Dataset
    with torch.no_grad():
        for i, (images, _) in enumerate(test_loader):
            images = images.to(device)
            output = model(images)
            if output:  # Check if any evidence is detected
                print(f"Image {i + 1}: Detected Evidence -", output)
            '''else:
                print(f"Image {i + 1}: No Evidence Detected")
'''
    # Clear GPU memory after completion
    del model
    torch.cuda.empty_cache()