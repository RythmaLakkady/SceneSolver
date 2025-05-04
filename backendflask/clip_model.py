# # clip_new.py

# import torch
# import torch.nn as nn
# import torch.nn.functional as F

# # Hyperparameters
# IMAGE_PATCH_SIZE = 16
# TEXT_CONTEXT_LENGTH = 77
# EMBED_DIM = 512
# NUM_CLASSES = 14


# class PatchEmbed(nn.Module):
#     def __init__(self, img_size, patch_size, in_chans, embed_dim):
#         super().__init__()
#         self.proj = nn.Conv2d(in_chans, embed_dim, kernel_size=patch_size, stride=patch_size)
#         self.cls_token = nn.Parameter(torch.zeros(1, 1, embed_dim))
#         self.pos_embed = nn.Parameter(torch.zeros(1, (img_size // patch_size) ** 2 + 1, embed_dim))

#     def forward(self, x):
#         B = x.size(0)
#         x = self.proj(x).flatten(2).transpose(1, 2)  # [B, N, embed_dim]
#         cls_tokens = self.cls_token.expand(B, -1, -1)
#         x = torch.cat((cls_tokens, x), dim=1)
#         x = x + self.pos_embed
#         return x


# class TransformerEncoder(nn.Module):
#     def __init__(self, embed_dim, depth, heads, mlp_ratio=4.0):
#         super().__init__()
#         self.layers = nn.ModuleList([
#             nn.TransformerEncoderLayer(
#                 d_model=embed_dim,
#                 nhead=heads,
#                 dim_feedforward=int(embed_dim * mlp_ratio),
#                 dropout=0.1,
#                 batch_first=True
#             )
#             for _ in range(depth)
#         ])

#     def forward(self, x):
#         for layer in self.layers:
#             x = layer(x)
#         return x


# class ImageEncoder(nn.Module):
#     def __init__(self, img_size=224, patch_size=IMAGE_PATCH_SIZE, in_chans=3, embed_dim=EMBED_DIM):
#         super().__init__()
#         self.patch_embed = PatchEmbed(img_size, patch_size, in_chans, embed_dim)
#         self.transformer = TransformerEncoder(embed_dim, depth=6, heads=8)
#         self.ln = nn.LayerNorm(embed_dim)

#     def forward(self, x):
#         x = self.patch_embed(x)
#         x = self.transformer(x)
#         x = self.ln(x[:, 0])  # Use CLS token only
#         return x


# class TextEncoder(nn.Module):
#     def __init__(self, vocab_size, context_length=TEXT_CONTEXT_LENGTH, embed_dim=EMBED_DIM):
#         super().__init__()
#         self.token_embedding = nn.Embedding(vocab_size, embed_dim)
#         self.pos_embedding = nn.Parameter(torch.zeros(1, context_length, embed_dim))
#         self.transformer = TransformerEncoder(embed_dim, depth=6, heads=8)
#         self.ln = nn.LayerNorm(embed_dim)

#     def forward(self, x):
#         x = self.token_embedding(x) + self.pos_embedding
#         x = self.transformer(x)
#         x = self.ln(x[:, 0])  # Use first token
#         return x


# class ProjectionHead(nn.Module):
#     def __init__(self, embed_dim=EMBED_DIM, proj_dim=EMBED_DIM):
#         super().__init__()
#         self.proj = nn.Linear(embed_dim, proj_dim)

#     def forward(self, x):
#         return self.proj(x)


# class CustomCLIP(nn.Module):
#     def __init__(self, vocab_size, img_size=224, patch_size=IMAGE_PATCH_SIZE, embed_dim=EMBED_DIM, proj_dim=EMBED_DIM):
#         super().__init__()
#         self.image_encoder = ImageEncoder(img_size, patch_size, 3, embed_dim)
#         self.text_encoder = TextEncoder(vocab_size, TEXT_CONTEXT_LENGTH, embed_dim)
#         self.image_proj = ProjectionHead(embed_dim, proj_dim)
#         self.text_proj = ProjectionHead(embed_dim, proj_dim)

#     def forward(self, image, text):
#         image_features = self.image_proj(self.image_encoder(image))
#         text_features = self.text_proj(self.text_encoder(text))

#         image_features = F.normalize(image_features, dim=-1)
#         text_features = F.normalize(text_features, dim=-1)

#         return image_features, text_features

# import torch
# import torch.nn as nn
# import torch.nn.functional as F
# from transforms import test_transform  # importing your transforms

# # Hyperparameters
# IMAGE_PATCH_SIZE = 16
# TEXT_CONTEXT_LENGTH = 77
# EMBED_DIM = 512
# NUM_CLASSES = 14


# class PatchEmbed(nn.Module):
#     def __init__(self, img_size, patch_size, in_chans, embed_dim):
#         super().__init__()
#         self.proj = nn.Conv2d(in_chans, embed_dim, kernel_size=patch_size, stride=patch_size)
#         self.cls_token = nn.Parameter(torch.zeros(1, 1, embed_dim))
#         self.pos_embed = nn.Parameter(torch.zeros(1, (img_size // patch_size) ** 2 + 1, embed_dim))

#     def forward(self, x):
#         B = x.size(0)
#         x = self.proj(x).flatten(2).transpose(1, 2)
#         cls_tokens = self.cls_token.expand(B, -1, -1)
#         x = torch.cat((cls_tokens, x), dim=1)
#         x = x + self.pos_embed
#         return x


# class TransformerEncoder(nn.Module):
#     def __init__(self, embed_dim, depth, heads, mlp_ratio=4.0):
#         super().__init__()
#         self.layers = nn.ModuleList([
#             nn.TransformerEncoderLayer(
#                 d_model=embed_dim,
#                 nhead=heads,
#                 dim_feedforward=int(embed_dim * mlp_ratio),
#                 dropout=0.1,
#                 batch_first=True
#             )
#             for _ in range(depth)
#         ])

#     def forward(self, x):
#         for layer in self.layers:
#             x = layer(x)
#         return x


# class ImageEncoder(nn.Module):
#     def __init__(self, img_size=224, patch_size=IMAGE_PATCH_SIZE, in_chans=3, embed_dim=EMBED_DIM):
#         super().__init__()
#         self.patch_embed = PatchEmbed(img_size, patch_size, in_chans, embed_dim)
#         self.transformer = TransformerEncoder(embed_dim, depth=6, heads=8)
#         self.ln = nn.LayerNorm(embed_dim)

#     def forward(self, x):
#         x = self.patch_embed(x)
#         x = self.transformer(x)
#         x = self.ln(x[:, 0])  # Only CLS token
#         return x


# class TextEncoder(nn.Module):
#     def __init__(self, vocab_size, context_length=TEXT_CONTEXT_LENGTH, embed_dim=EMBED_DIM):
#         super().__init__()
#         self.token_embedding = nn.Embedding(vocab_size, embed_dim)
#         self.pos_embedding = nn.Parameter(torch.zeros(1, context_length, embed_dim))
#         self.transformer = TransformerEncoder(embed_dim, depth=6, heads=8)
#         self.ln = nn.LayerNorm(embed_dim)

#     def forward(self, x):
#         x = self.token_embedding(x) + self.pos_embedding
#         x = self.transformer(x)
#         x = self.ln(x[:, 0])
#         return x


# class ProjectionHead(nn.Module):
#     def __init__(self, embed_dim=EMBED_DIM, proj_dim=EMBED_DIM):
#         super().__init__()
#         self.proj = nn.Linear(embed_dim, proj_dim)

#     def forward(self, x):
#         return self.proj(x)


# class CustomCLIP(nn.Module):
#     def __init__(self, vocab_size, img_size=224, patch_size=IMAGE_PATCH_SIZE, embed_dim=EMBED_DIM, proj_dim=EMBED_DIM):
#         super().__init__()
#         self.image_encoder = ImageEncoder(img_size, patch_size, 3, embed_dim)
#         self.text_encoder = TextEncoder(vocab_size, TEXT_CONTEXT_LENGTH, embed_dim)
#         self.image_proj = ProjectionHead(embed_dim, proj_dim)
#         self.text_proj = ProjectionHead(embed_dim, proj_dim)

#     def forward(self, image, text):
#         # Apply transform to image batch
#         image = torch.stack([test_transform(img) for img in image])

#         image_features = self.image_proj(self.image_encoder(image))
#         text_features = self.text_proj(self.text_encoder(text))

#         image_features = F.normalize(image_features, dim=-1)
#         text_features = F.normalize(text_features, dim=-1)

#         return image_features, text_features
# import torch
# import torch.nn as nn
# import torch.nn.functional as F
# from transforms import test_transform

# # Hyperparameters
# IMAGE_PATCH_SIZE = 16
# TEXT_CONTEXT_LENGTH = 77
# EMBED_DIM = 512
# NUM_CLASSES = 14

# class PatchEmbed(nn.Module):
#     def __init__(self, img_size, patch_size, in_chans, embed_dim):
#         super().__init__()
#         self.proj = nn.Conv2d(in_chans, embed_dim, kernel_size=patch_size, stride=patch_size)
#         self.cls_token = nn.Parameter(torch.zeros(1, 1, embed_dim))
#         self.pos_embed = nn.Parameter(torch.zeros(1, (img_size // patch_size) ** 2 + 1, embed_dim))

#     def forward(self, x):
#         B = x.size(0)
#         x = self.proj(x).flatten(2).transpose(1, 2)
#         cls_tokens = self.cls_token.expand(B, -1, -1)
#         x = torch.cat((cls_tokens, x), dim=1)
#         x = x + self.pos_embed
#         return x

# class TransformerEncoder(nn.Module):
#     def __init__(self, embed_dim, depth, heads, mlp_ratio=4.0):
#         super().__init__()
#         self.layers = nn.ModuleList([
#             nn.TransformerEncoderLayer(
#                 d_model=embed_dim,
#                 nhead=heads,
#                 dim_feedforward=int(embed_dim * mlp_ratio),
#                 dropout=0.1,
#                 batch_first=True
#             )
#             for _ in range(depth)
#         ])

#     def forward(self, x):
#         for layer in self.layers:
#             x = layer(x)
#         return x

# class ImageEncoder(nn.Module):
#     def __init__(self, img_size=224, patch_size=IMAGE_PATCH_SIZE, in_chans=3, embed_dim=EMBED_DIM):
#         super().__init__()
#         self.patch_embed = PatchEmbed(img_size, patch_size, in_chans, embed_dim)
#         self.transformer = TransformerEncoder(embed_dim, depth=6, heads=8)
#         self.ln = nn.LayerNorm(embed_dim)

#     def forward(self, x):
#         x = self.patch_embed(x)
#         x = self.transformer(x)
#         x = self.ln(x[:, 0])  # Only CLS token
#         return x

# class TextEncoder(nn.Module):
#     def __init__(self, vocab_size, context_length=TEXT_CONTEXT_LENGTH, embed_dim=EMBED_DIM):
#         super().__init__()
#         self.token_embedding = nn.Embedding(vocab_size, embed_dim)
#         self.pos_embedding = nn.Parameter(torch.zeros(1, context_length, embed_dim))
#         self.transformer = TransformerEncoder(embed_dim, depth=6, heads=8)
#         self.ln = nn.LayerNorm(embed_dim)

#     def forward(self, x):
#         x = self.token_embedding(x) + self.pos_embedding
#         x = self.transformer(x)
#         x = self.ln(x[:, 0])
#         return x

# class ProjectionHead(nn.Module):
#     def __init__(self, embed_dim=EMBED_DIM, proj_dim=EMBED_DIM):
#         super().__init__()
#         self.proj = nn.Linear(embed_dim, proj_dim)

#     def forward(self, x):
#         return self.proj(x)

# class ImprovedCNN(nn.Module):
#     def __init__(self, num_classes):
#         super().__init__()
#         self.image_encoder = ImageEncoder(img_size=224, patch_size=16, in_chans=3, embed_dim=512)
#         self.image_proj = ProjectionHead(embed_dim=512, proj_dim=512)
#         self.classifier = nn.Linear(512, num_classes)

#     def classify_image(self, image):
#         features = self.image_proj(self.image_encoder(image))
#         return self.classifier(features)

#     def forward(self, image):
#         return self.classify_image(image)


# import torch
# import torch.nn as nn
# import torch.nn.functional as F

# class PatchEmbed(nn.Module):
#     def __init__(self, img_size=64, patch_size=16, in_chans=3, embed_dim=512):
#         super().__init__()
#         self.proj = nn.Conv2d(in_chans, embed_dim, kernel_size=patch_size, stride=patch_size)
#         num_patches = (img_size // patch_size) ** 2
#         self.cls_token = nn.Parameter(torch.zeros(1, 1, embed_dim))
#         self.pos_embed = nn.Parameter(torch.zeros(1, 17, embed_dim))  # 16 + 1 = 17

#     def forward(self, x):
#         B = x.size(0)
#         x = self.proj(x).flatten(2).transpose(1, 2)  # [B, N, embed_dim]
#         cls_tokens = self.cls_token.expand(B, -1, -1)
#         x = torch.cat((cls_tokens, x), dim=1)
#         x = x + self.pos_embed
#         return x

# class TransformerEncoder(nn.Module):
#     def __init__(self, embed_dim=512, depth=6, heads=8, mlp_ratio=4.0):
#         super().__init__()
#         self.layers = nn.ModuleList([
#             nn.TransformerEncoderLayer(
#                 d_model=embed_dim,
#                 nhead=heads,
#                 dim_feedforward=int(embed_dim * mlp_ratio),
#                 batch_first=True
#             ) for _ in range(depth)
#         ])
#         self.norm = nn.LayerNorm(embed_dim)

#     def forward(self, x):
#         for layer in self.layers:
#             x = layer(x)
#         return self.norm(x[:, 0])  # CLS token

# class ImprovedCNN(nn.Module):
#     def __init__(self, num_classes):
#         super().__init__()
#         self.patch_embed = PatchEmbed(img_size=64, patch_size=16, in_chans=3, embed_dim=512)
#         self.encoder = TransformerEncoder(embed_dim=512, depth=6, heads=8)
#         self.classifier = nn.Linear(512, num_classes)

#     def forward(self, x):
#         x = self.patch_embed(x)
#         x = self.encoder(x)
#         return self.classifier(x)


import torch
import torch.nn as nn
import torch.nn.functional as F

class PatchEmbed(nn.Module):
    def __init__(self, img_size=64, patch_size=16, in_chans=3, embed_dim=512):
        super().__init__()
        self.proj = nn.Conv2d(in_chans, embed_dim, kernel_size=patch_size, stride=patch_size)
        num_patches = (img_size // patch_size) ** 2
        self.cls_token = nn.Parameter(torch.randn(1, 1, embed_dim))
        self.pos_embed = nn.Parameter(torch.randn(1, num_patches + 1, embed_dim))  # 17 tokens

    def forward(self, x):
        B = x.shape[0]
        x = self.proj(x).flatten(2).transpose(1, 2)  # (B, 16, D)
        cls_tokens = self.cls_token.expand(B, -1, -1)  # (B, 1, D)
        x = torch.cat((cls_tokens, x), dim=1)         # (B, 17, D)
        x = x + self.pos_embed
        return x

class TransformerEncoder(nn.Module):
    def __init__(self, embed_dim=512, depth=6, heads=8, mlp_ratio=4.0):
        super().__init__()
        self.layers = nn.ModuleList([
            nn.TransformerEncoderLayer(
                d_model=embed_dim,
                nhead=heads,
                dim_feedforward=int(embed_dim * mlp_ratio),
                batch_first=True
            ) for _ in range(depth)
        ])
        self.norm = nn.LayerNorm(embed_dim)

    def forward(self, x):
        for layer in self.layers:
            x = layer(x)
        return self.norm(x[:, 0])  # CLS token

class CrimeClassifier(nn.Module):
    def __init__(self, num_classes=14, img_size=64, patch_size=16, embed_dim=512):
        super().__init__()
        self.patch_embed = PatchEmbed(img_size=img_size, patch_size=patch_size, embed_dim=embed_dim)
        self.encoder = TransformerEncoder(embed_dim=embed_dim)
        self.classifier = nn.Linear(embed_dim, num_classes)

    def forward(self, x):
        x = self.patch_embed(x)      # → (B, 17, D)
        x = self.encoder(x)          # → (B, D)
        x = self.classifier(x)       # → (B, 14)
        return x
