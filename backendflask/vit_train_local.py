import os
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets
from torch.utils.data import DataLoader
from vit_new import VisionTransformer, encode_evidence_labels
from transforms import train_transform
from tqdm import tqdm

# Hyperparameters
BATCH_SIZE = 128
EPOCHS = 10
LR = 1e-4
NUM_CLASSES = 14
MODEL_SAVE_PATH = "vit_best_model.pth"

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"🔥 Using device: {device}")

# Dataset
train_dataset = datasets.ImageFolder("your_local_path_to/Train", transform=train_transform)
train_loader = DataLoader(
    train_dataset,
    batch_size=BATCH_SIZE,
    shuffle=True,
    num_workers=os.cpu_count() // 2,  # use half of CPU cores
    pin_memory=True
)
print(f"🧠 Loaded {len(train_dataset)} training samples.")

# Model
model = VisionTransformer(num_classes=NUM_CLASSES)
if torch.cuda.device_count() > 1:
    print(f"🚀 Using {torch.cuda.device_count()} GPUs with DataParallel!")
    model = nn.DataParallel(model)

model = model.to(device)

criterion = nn.BCEWithLogitsLoss()
optimizer = optim.Adam(model.parameters(), lr=LR)
scaler = torch.cuda.amp.GradScaler()  # for mixed precision 🚀

best_loss = float('inf')

# Training Loop
for epoch in range(EPOCHS):
    model.train()
    running_loss = 0

    loop = tqdm(train_loader, desc=f"Epoch {epoch+1}/{EPOCHS}")

    for images, labels in loop:
        images = images.to(device)
        multi_labels = torch.stack([encode_evidence_labels(lbl.item()) for lbl in labels]).to(device)

        optimizer.zero_grad()

        with torch.cuda.amp.autocast():  # Mixed precision block
            outputs = model(images)
            loss = criterion(outputs, multi_labels)

        scaler.scale(loss).backward()
        scaler.step(optimizer)
        scaler.update()

        running_loss += loss.item()
        loop.set_postfix(loss=loss.item())

    epoch_loss = running_loss / len(train_loader)
    print(f"✅ Epoch {epoch+1}/{EPOCHS} - Average Loss: {epoch_loss:.4f}")

    # Save best model
    if epoch_loss < best_loss:
        print(f"💾 Saving best model (Loss improved from {best_loss:.4f} to {epoch_loss:.4f})")
        torch.save(model.state_dict(), MODEL_SAVE_PATH)
        best_loss = epoch_loss

print(f"🎯 Best model saved to {MODEL_SAVE_PATH}")
