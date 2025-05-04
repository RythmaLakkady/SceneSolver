
# import torch
# import torch.nn as nn
# import torch.nn.functional as F
# from transforms import test_transform

# device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# class PatchEmbedding(nn.Module):
#     def __init__(self, in_channels=3, patch_size=16, emb_size=768, img_size=224):
#         super(PatchEmbedding, self).__init__()
#         self.projection = nn.Conv2d(in_channels, emb_size, kernel_size=patch_size, stride=patch_size)
#         self.cls_token = nn.Parameter(torch.randn(1, 1, emb_size))
#         self.pos_embedding = nn.Parameter(torch.randn(1, (img_size // patch_size) ** 2 + 1, emb_size))

#     def forward(self, x):
#         B = x.shape[0]
#         x = self.projection(x).flatten(2).transpose(1, 2)
#         cls_tokens = self.cls_token.expand(B, -1, -1)
#         x = torch.cat((cls_tokens, x), dim=1)
#         x = x + self.pos_embedding
#         return x

# class TransformerEncoder(nn.Module):
#     def __init__(self, emb_size=768, num_heads=8, expansion=4, dropout=0.1):
#         super(TransformerEncoder, self).__init__()
#         self.ln1 = nn.LayerNorm(emb_size)
#         self.msa = nn.MultiheadAttention(emb_size, num_heads, dropout=dropout, batch_first=True)
#         self.ln2 = nn.LayerNorm(emb_size)
#         self.ff = nn.Sequential(
#             nn.Linear(emb_size, emb_size * expansion),
#             nn.GELU(),
#             nn.Linear(emb_size * expansion, emb_size)
#         )

#     def forward(self, x):
#         x = x + self.msa(self.ln1(x), self.ln1(x), self.ln1(x))[0]
#         x = x + self.ff(self.ln2(x))
#         return x

# class VisionTransformer(nn.Module):
#     def __init__(self, img_size=224, patch_size=16, in_channels=3, emb_size=768, depth=6, num_heads=8, num_classes=14):
#         super(VisionTransformer, self).__init__()
#         self.patch_embedding = PatchEmbedding(in_channels, patch_size, emb_size, img_size)
#         self.encoder = nn.ModuleList([TransformerEncoder(emb_size, num_heads) for _ in range(depth)])
#         self.ln = nn.LayerNorm(emb_size)
#         self.fc = nn.Linear(emb_size, num_classes)
        

#     def forward(self, x):
#         x = self.patch_embedding(x)
#         for layer in self.encoder:
#             x = layer(x)
#         x = self.ln(x)
#         cls_token = x[:, 0]
#         return self.fc(cls_token)

# def extract_evidence(vit_model, image, transform, evidence_classes):
#     img_tensor = transform(image).unsqueeze(0).to(device)  # <--- This line is important
#     vit_model.eval()
    
#     with torch.no_grad():
#         output = vit_model(img_tensor)
#         probs = F.softmax(output, dim=1)
#         top_probs, top_idxs = probs.topk(3, dim=1)

#         evidences = []
#         for prob, idx in zip(top_probs[0], top_idxs[0]):
#             evidences.append({
#                 "evidence": evidence_classes[idx.item()],
#                 "confidence": prob.item()
#             })

#     return evidences

# import torch
# import torch.nn as nn
# import torch.nn.functional as F
# from torchvision import models

# class VisionTransformer(nn.Module):
#     def __init__(self, num_classes):
#         super(VisionTransformer, self).__init__()
#         self.patch_embedding = nn.Conv2d(3, 768, kernel_size=16, stride=16)
#         encoder_layer = nn.TransformerEncoderLayer(d_model=768, nhead=8, batch_first=True)
#         self.transformer_encoder = nn.TransformerEncoder(encoder_layer, num_layers=6)
#         self.classifier = nn.Linear(768, num_classes)

#     def forward(self, x):
#         x = self.patch_embedding(x)  # [B, 768, H/16, W/16]
#         x = x.flatten(2).transpose(1, 2)  # [B, N, 768]
#         x = self.transformer_encoder(x)
#         x = x.mean(dim=1)
#         x = self.classifier(x)
#         return x


# # Evidence Extraction Logic
# def extract_evidence(model, image, transform, evidence_classes, threshold=0.3):
#     image = transform(image).unsqueeze(0).to(next(model.parameters()).device)
#     outputs = model(image)
#     probs = torch.sigmoid(outputs).squeeze(0).detach().cpu()

#     evidence = []
#     for idx, prob in enumerate(probs):
#         if prob.item() > threshold:
#             evidence.append(evidence_classes[idx])
#     return evidence

import torch
import torch.nn as nn
import torch.nn.functional as F

# Evidence classes
evidence_classes = [
    "Gun", "Knife", "Mask", "Car", "Fire", "Glass", "Crowd",
    "Blood", "Explosion", "Bag", "Money", "Weapon", "Smoke", "Person"
]

# Crime-to-evidence mapping
crime_to_evidence = {
    "Arrest": ["Person", "Crowd"],
    "Arson": ["Fire", "Smoke"],
    "Assault": ["Blood", "Person"],
    "Burglary": ["Bag", "Glass"],
    "Explosion": ["Explosion", "Smoke"],
    "Fighting": ["Crowd", "Blood"],
    "RoadAccidents": ["Car", "Person"],
    "Robbery": ["Gun", "Bag", "Mask"],
    "Shooting": ["Gun", "Crowd"],
    "Shoplifting": ["Bag", "Money"],
    "Stealing": ["Bag", "Person"],
    "Vandalism": ["Glass", "Crowd"],
    "Abuse": ["Person"],
    "NormalVideos": []
}

def encode_evidence_labels(crime_label_idx):
    index_to_class = {
        0: "Arrest", 1: "Arson", 2: "Assault", 3: "Burglary", 4: "Explosion",
        5: "Fighting", 6: "RoadAccidents", 7: "Robbery", 8: "Shooting",
        9: "Shoplifting", 10: "Stealing", 11: "Vandalism", 12: "Abuse", 13: "NormalVideos"
    }
    crime_class = index_to_class[crime_label_idx]
    evidences = crime_to_evidence.get(crime_class, [])
    binary = [1 if ev in evidences else 0 for ev in evidence_classes]
    return torch.tensor(binary, dtype=torch.float32)

import torch
import torch.nn as nn
import torch.nn.functional as F

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

