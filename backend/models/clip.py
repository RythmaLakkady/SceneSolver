import os
import torch
torch.backends.cudnn.benchmark = True
torch.backends.cudnn.deterministic = False
torch.backends.cudnn.enabled = True

from PIL import Image
import torch.nn as nn
import torch.optim as optim
from torchvision import transforms
import torchvision.transforms as T
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
import numpy as np
import cv2
import time
from torch.optim.lr_scheduler import CosineAnnealingLR
from torch.nn.functional import embedding


# Set device
device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")

class PositionalEmbedding(nn.Module):
    def __init__(self, width, max_seq_len):
        super(PositionalEmbedding, self).__init__()
        pos_enc = torch.zeros(max_seq_len, width)

        for pos in range(max_seq_len):
            for i in range(width):
                if i % 2 == 0:
                    pos_enc[pos][i] = torch.sin(pos/(10000 ** (i/width)))
                else:
                    pos_enc[pos][i] = torch.cos(pos/(10000 ** ((i-1)/width)))

        self.register_buffer('pos_enc', pos_enc.unsqueeze(0))

    def forward(self, x):
        # Fix: Use the correct registered buffer name
        return x + self.pos_enc[:, :x.size(1), :]
    
class AttentionHead(nn.Module):
    def __init__(self, width, head_size):
        super(AttentionHead, self).__init__()
        self.head_size = head_size

        self.query = nn.Linear(width, head_size)
        self.key = nn.Linear(width, head_size)
        self.value = nn.Linear(width, head_size)

    def forward(self, x, mask=None):
        q = self.query(x)
        k = self.key(x)
        v = self.value(x)

        attention_scores = torch.matmul(q, k.transpose(-2, -1)) / torch.sqrt(torch.tensor(self.head_size, dtype=torch.float32))
        if mask is not None:
            attention_scores = attention_scores.masked_fill(mask == 0, float("-inf"))

        attention_weights = F.softmax(attention_scores, dim=-1)
        output = torch.matmul(attention_weights, v)
        return output
    
class MultiHeadAttention(nn.Module):
    def __init__(self, width, num_heads, dropout_rate=0.2):
        super(MultiHeadAttention, self).__init__()
        self.head_size = width // num_heads
        self.heads = nn.ModuleList([AttentionHead(width, self.head_size) for _ in range(num_heads)])
        self.fc = nn.Linear(width, width)
        # Reduced dropout rate
        self.dropout = nn.Dropout(dropout_rate)

    def forward(self, x, mask=None):
        out = torch.cat([head(x, mask=mask) for head in self.heads], dim=-1)
        output = self.fc(out)
        return self.dropout(output)
    
class TransformerEncoder(nn.Module):
    def __init__(self, width, n_heads, dropout_rate=0.1, r_mlp=4):
        super().__init__()
        self.width = width
        self.n_heads = n_heads

        # Layer Normalization
        self.ln1 = nn.LayerNorm(width)
        self.ln2 = nn.LayerNorm(width)

        # Multi-Head Attention with reduced dropout
        self.mha = MultiHeadAttention(width, n_heads, dropout_rate)

        # MLP with reduced width multiplier and added dropout
        self.mlp = nn.Sequential(
            nn.Linear(self.width, self.width * r_mlp),
            nn.GELU(),
            nn.Dropout(dropout_rate),
            nn.Linear(self.width * r_mlp, self.width),
            nn.Dropout(dropout_rate)
        )

    def forward(self, x, mask=None):
        # Pre-LN architecture for more stable training
        x_norm = self.ln1(x)
        x = x + self.mha(x_norm, mask=mask)
        
        x_norm = self.ln2(x)
        x = x + self.mlp(x_norm)
        
        return x
    
# Simplified TextEncoder with fewer parameters
class TextEncoder(nn.Module):
    def __init__(self, vocab_size, width, max_seq_length, n_heads, n_layers, emb_dim):
        super().__init__()
        self.max_seq_length = max_seq_length
        
        # Weight tying for embedding
        self.encoder_embedding = nn.Embedding(vocab_size, width)
        self.positional_embedding = PositionalEmbedding(width, max_seq_length)
        
        # Reduced number of layers
        self.encoder = nn.ModuleList([
            TransformerEncoder(width, n_heads, dropout_rate=0.1) 
            for _ in range(n_layers)
        ])
        
        # Projection with L2 normalization
        self.projection = nn.Linear(width, emb_dim, bias=False)
        
        # Initialize projection with smaller weights
        nn.init.xavier_uniform_(self.projection.weight, gain=0.1)

    def forward(self, text, mask=None):
        # Ensure inputs are on the correct device
        x = self.encoder_embedding(text)
        x = self.positional_embedding(x)

        for encoder_layer in self.encoder:
            x = encoder_layer(x, mask=mask)

        # Takes features from the [EOS] token (end of sequence)
        x = x[torch.arange(text.shape[0]), torch.sum(mask, dim=1).clamp(max=text.shape[1]-1) - 1]
        
        # Project and normalize
        x = self.projection(x)
        x = F.normalize(x, p=2, dim=-1)
        
        return x
    
# Simplified ImageEncoder
class ImageEncoder(nn.Module):
    def __init__(self, width, img_size, patch_size, n_channels, n_layers, n_heads, emb_dim):
        super().__init__()
        assert img_size[0] % patch_size[0] == 0 and img_size[1] % patch_size[1] == 0
        
        self.n_patches = (img_size[0] // patch_size[0]) * (img_size[1] // patch_size[1])
        self.max_seq_length = self.n_patches + 1
        
        # Linear projection of flattened patches
        self.linear_project = nn.Conv2d(
            n_channels, width, 
            kernel_size=patch_size, 
            stride=patch_size
        )
        
        # Class token
        self.cls_token = nn.Parameter(torch.zeros(1, 1, width))
        # Initialize with small random values
        nn.init.normal_(self.cls_token, std=0.02)
        
        self.positional_embedding = PositionalEmbedding(width, self.max_seq_length)
        
        # Reduced layers with increased dropout for regularization
        self.encoder = nn.ModuleList([
            TransformerEncoder(width, n_heads, dropout_rate=0.15) 
            for _ in range(n_layers)
        ])
        
        # Projection layer
        self.projection = nn.Linear(width, emb_dim, bias=False)
        # Initialize with smaller weights
        nn.init.xavier_uniform_(self.projection.weight, gain=0.1)
        
        # Add LayerNorm before projection
        self.ln_final = nn.LayerNorm(width)

    def forward(self, x):
        x = self.linear_project(x)
        x = x.flatten(2).transpose(1, 2)
        
        batch_size = x.shape[0]
        cls_tokens = self.cls_token.expand(batch_size, -1, -1)
        x = torch.cat((cls_tokens, x), dim=1)
        
        x = self.positional_embedding(x)
        
        for encoder_layer in self.encoder:
            x = encoder_layer(x)
            
        # Get CLS token and apply final normalization
        x = self.ln_final(x[:, 0])
        
        # Project and normalize
        x = self.projection(x)
        x = F.normalize(x, p=2, dim=-1)
        
        return x

# Simplified CLIP model
class CLIP(nn.Module):
    def __init__(self, emb_dim, vit_width, img_size, patch_size, n_channels, vit_layers, vit_heads, 
                 vocab_size, text_width, max_seq_length, text_heads, text_layers):
        super().__init__()
        
        # Reduce embedding dimension
        emb_dim = emb_dim // 2  # Halve embedding dimension
        
        # Create encoders
        self.image_encoder = ImageEncoder(
            vit_width, img_size, patch_size, n_channels, 
            vit_layers, vit_heads, emb_dim
        )
        
        self.text_encoder = TextEncoder(
            vocab_size, text_width, max_seq_length, 
            text_heads, text_layers, emb_dim
        )
        
        # Learnable temperature parameter
        self.temperature = nn.Parameter(torch.ones([]) * np.log(1/0.07))
        
        self.device = device

    def forward(self, image, text, mask=None):
        # Encode image and text
        I_e = self.image_encoder(image)
        T_e = self.text_encoder(text, mask=mask)
        
        # Calculate similarity and loss
        # Scale logits with temperature
        logits = torch.matmul(I_e, T_e.transpose(-2, -1)) * self.temperature.exp()
        
        # Create targets (diagonal matrix - each image matches its text)
        labels = torch.arange(logits.shape[0], device=self.device)
        
        # Calculate loss (image-to-text and text-to-image)
        loss_i2t = F.cross_entropy(logits, labels)
        loss_t2i = F.cross_entropy(logits.T, labels)
        
        # Combined loss
        loss = (loss_i2t + loss_t2i) / 2
        
        return loss

# Improved CNN model with stronger regularization
class ImprovedCNN(nn.Module):
    def __init__(self, num_classes):
        super(ImprovedCNN, self).__init__()
        
        # Convolutional layers with batch normalization and dropout
        self.features = nn.Sequential(
            nn.Conv2d(3, 32, kernel_size=3, stride=1, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),
            nn.Dropout2d(0.1),
            
            nn.Conv2d(32, 64, kernel_size=3, stride=1, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),
            nn.Dropout2d(0.2),
            
            nn.Conv2d(64, 64, kernel_size=3, stride=1, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),
            nn.Dropout2d(0.3),
        )
        
        # Classifier with L2 regularization inherent in the initialization
        self.classifier = nn.Sequential(
            nn.Linear(64 * 8 * 8, 256),
            nn.BatchNorm1d(256),
            nn.ReLU(inplace=True),
            nn.Dropout(0.4),
            nn.Linear(256, num_classes)
        )
        
        # Weight initialization
        self._initialize_weights()
    
    def _initialize_weights(self):
        for m in self.modules():
            if isinstance(m, nn.Conv2d):
                nn.init.kaiming_normal_(m.weight, mode='fan_out', nonlinearity='relu')
                if m.bias is not None:
                    nn.init.constant_(m.bias, 0)
            elif isinstance(m, nn.BatchNorm2d):
                nn.init.constant_(m.weight, 1)
                nn.init.constant_(m.bias, 0)
            elif isinstance(m, nn.Linear):
                nn.init.normal_(m.weight, 0, 0.01)
                nn.init.constant_(m.bias, 0)

    def forward(self, x):
        x = self.features(x)
        x = torch.flatten(x, 1)
        x = self.classifier(x)
        return x

# Enhanced Dataset with more augmentations
class EnhancedUCFDataset(Dataset):
    def __init__(self, root_dir, transform=None, frame_count=16):
        self.root_dir = root_dir
        self.transform = transform
        self.frame_count = frame_count
        self.data = []
        crime_classes = sorted(os.listdir(root_dir))
        self.class_to_idx = {cls_name: i for i, cls_name in enumerate(crime_classes)}
        # Collect paths and labels
        for crime in crime_classes:
            crime_path = os.path.join(root_dir, crime)
            if not os.path.isdir(crime_path):
                continue
            for file in os.listdir(crime_path):
                file_path = os.path.join(crime_path, file)
                if file.lower().endswith(('.png', '.jpg', '.jpeg')):
                    self.data.append((file_path, self.class_to_idx[crime], 'image'))
                elif file.lower().endswith(('.mp4', '.avi', '.mov')):
                    self.data.append((file_path, self.class_to_idx[crime], 'video'))
    def __len__(self):
        return len(self.data)
    def load_video_frames(self, video_path):
        cap = cv2.VideoCapture(video_path)
        frames = []
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        frame_interval = max(total_frames // self.frame_count, 1)
        for i in range(self.frame_count):
            cap.set(cv2.CAP_PROP_POS_FRAMES, i * frame_interval)
            ret, frame = cap.read()
            if not ret:
                break
            frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            frame = cv2.resize(frame, (64, 64))
            frames.append(frame)
        cap.release()
        # Pad if needed
        while len(frames) < self.frame_count:
            frames.append(np.zeros((64, 64, 3), dtype=np.uint8))
        return np.array(frames)
    def __getitem__(self, idx):
        file_path, label, data_type = self.data[idx]
        if data_type == 'image':
            image = cv2.imread(file_path)
            if image is None:
                # Return a black image if file can't be read
                image = np.zeros((64, 64, 3), dtype=np.uint8)
            else:
                image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
                image = cv2.resize(image, (64, 64))
            # Convert to PIL Image here
            image = Image.fromarray(image)
            if self.transform:
                image = self.transform(image)
            return image, label
        elif data_type == 'video':
            frames = self.load_video_frames(file_path)
            transformed_frames = []
            for frame in frames:
                # Convert each frame to PIL Image
                frame = Image.fromarray(frame)
                if self.transform:
                    frame = self.transform(frame)
                transformed_frames.append(frame)
            frames = torch.stack(transformed_frames)
            return frames, label

# Enhanced data augmentation
train_transform = transforms.Compose([
    transforms.RandomResizedCrop(64, scale=(0.8, 1.0)),
    transforms.RandomHorizontalFlip(),
    transforms.RandomRotation(15),
    transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
    transforms.RandomGrayscale(p=0.05),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]) # ImageNet stats
])

test_transform = transforms.Compose([
    transforms.Resize(70), # Slightly larger
    transforms.CenterCrop(64), # Then center crop
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

def train_model(model, train_loader, val_loader, num_epochs=10, patience=3):
    criterion = nn.CrossEntropyLoss(label_smoothing=0.1)  # Add label smoothing
    optimizer = optim.AdamW(
        model.parameters(), 
        lr=1e-3,  # Higher initial LR with scheduler
        weight_decay=1e-2  # Increased weight decay
    )
    
    # Learning rate scheduler
    scheduler = CosineAnnealingLR(optimizer, T_max=num_epochs, eta_min=1e-6)
    
    # For mixed precision training
    scaler = torch.amp.GradScaler()
    
    # For early stopping
    best_val_acc = 0
    patience_counter = 0
    
    # Training loop
    for epoch in range(num_epochs):
        start_time = time.time()
        model.train()
        train_loss = 0.0
        correct = 0
        total = 0
        
        for batch_idx, (inputs, labels) in enumerate(train_loader):
            inputs, labels = inputs.to(device), labels.to(device)
            
            # Mixup data augmentation
            if np.random.random() < 0.5:  # Apply mixup 50% of the time
                alpha = 0.2
                lam = np.random.beta(alpha, alpha)
                index = torch.randperm(inputs.size(0)).to(device)
                mixed_inputs = lam * inputs + (1 - lam) * inputs[index]
                inputs = mixed_inputs
                
                # Mixed labels for mixup
                targets_a, targets_b = labels, labels[index]
            else:
                lam = 1
                targets_a, targets_b = labels, labels
            
            optimizer.zero_grad()
            
            with torch.amp.autocast(device_type='cuda'):
                outputs = model(inputs)
                
                # Calculate loss with mixup if applied
                if lam < 1:
                    loss = lam * criterion(outputs, targets_a) + (1 - lam) * criterion(outputs, targets_b)
                else:
                    loss = criterion(outputs, labels)
            
            scaler.scale(loss).backward()
            
            # Gradient clipping to prevent exploding gradients
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            
            scaler.step(optimizer)
            scaler.update()
            
            train_loss += loss.item()
            
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()
        
        # Calculate epoch statistics
        train_loss = train_loss / len(train_loader)
        train_acc = 100. * correct / total
        
        # Validation
        model.eval()
        val_loss = 0.0
        val_correct = 0
        val_total = 0
        
        with torch.no_grad():
            for inputs, labels in val_loader:
                inputs, labels = inputs.to(device), labels.to(device)
                
                outputs = model(inputs)
                loss = criterion(outputs, labels)
                
                val_loss += loss.item()
                
                _, predicted = outputs.max(1)
                val_total += labels.size(0)
                val_correct += predicted.eq(labels).sum().item()
        
        val_loss = val_loss / len(val_loader)
        val_acc = 100. * val_correct / val_total
        
        # Update LR scheduler
        scheduler.step()
        
        # Print epoch results
        epoch_time = time.time() - start_time
        print(f"Epoch {epoch+1}/{num_epochs} | "
              f"Train Loss: {train_loss:.4f} | Train Acc: {train_acc:.2f}% | "
              f"Val Loss: {val_loss:.4f} | Val Acc: {val_acc:.2f}% | "
              f"Time: {epoch_time:.2f}s | LR: {scheduler.get_last_lr()[0]:.6f}")
        
        # Early stopping check
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            patience_counter = 0
            
            # Save best model
            torch.save({
                'epoch': epoch,
                'model_state_dict': model.state_dict(),
                'optimizer_state_dict': optimizer.state_dict(),
                'scheduler_state_dict': scheduler.state_dict(),
                'val_acc': val_acc,
            }, "best_model.pth")
            
            print(f"* Saved best model with validation accuracy: {val_acc:.2f}%")
        else:
            patience_counter += 1
            if patience_counter >= patience:
                print(f"Early stopping triggered after {epoch+1} epochs")
                break
    return model

def predict_image(model, input_data, class_labels, transform=test_transform):
    model.eval()
    with torch.no_grad():
        try:
            if isinstance(input_data, str):  # It's a file path
                image = Image.open(input_data).convert("RGB")
                image = transform(image).unsqueeze(0).to(device)
            elif isinstance(input_data, torch.Tensor):  # It's already a tensor
                image = input_data.unsqueeze(0).to(device)  # Add batch dimension

            output = model(image)
            probabilities = F.softmax(output, dim=1)
            prob_values, predicted_indices = torch.topk(probabilities, 3)

            top_predictions = []
            for i in range(3):
                idx = predicted_indices[0][i].item()
                prob = prob_values[0][i].item() * 100
                top_predictions.append((class_labels[idx], prob))

            print("\nTop 3 predictions:")
            for cls, prob in top_predictions:
                print(f"{cls}: {prob:.2f}%")
            return top_predictions

        except Exception as e:
            print(f"Error predicting image: {e}")
            return None

# Main execution
if __name__ == "__main__":
    # Create datasets
    train_dataset = EnhancedUCFDataset(root_dir="dataset/Train", transform=train_transform)
    test_dataset = EnhancedUCFDataset(root_dir="dataset/Test", transform=test_transform)
    
    # Create data loaders with stratified sampling
    train_loader = DataLoader(
        train_dataset, 
        batch_size=32,  # Reduced batch size
        shuffle=True, 
        num_workers=4,
        pin_memory=True,
        drop_last=True  # Avoid small last batches
    )
    
    test_loader = DataLoader(
        test_dataset, 
        batch_size=32, 
        shuffle=False, 
        num_workers=4,
        pin_memory=True
    )
    
    # Class labels mapping
    class_labels = {
        0: "Arson",
        1: "Assault",
        2: "Burglary",
        3: "Explosion",
        4: "Fighting",
        5: "Normal",
        6: "Road Accidents",
        7: "Robbery",
        8: "Shooting",
        9: "Shoplifting",
        10: "Stealing",
        11: "Vandalism",
        12: "Abuse",
        13: "Arrest"
    }
    
    # Create and train model
    model = ImprovedCNN(num_classes=len(class_labels))
    model.to(device)
    
    # Train with validation (using 20% of training data for validation)
    from torch.utils.data import random_split
    
    train_size = int(0.8 * len(train_dataset))
    val_size = len(train_dataset) - train_size
    
    train_subset, val_subset = random_split(
        train_dataset, 
        [train_size, val_size],
        generator=torch.Generator().manual_seed(42)  # Fixed seed for reproducibility
    )
    
    train_subset_loader = DataLoader(
        train_subset, 
        batch_size=32, 
        shuffle=True, 
        num_workers=4,
        pin_memory=True
    )
    
    val_subset_loader = DataLoader(
        val_subset, 
        batch_size=32, 
        shuffle=False, 
        num_workers=4,
        pin_memory=True
    )
    
    # Train the model
    trained_model = train_model(
        model=model,
        train_loader=train_subset_loader,
        val_loader=val_subset_loader,
        num_epochs=20,  # More epochs with early stopping
        patience=5
    )
    
    # Load best model for evaluation
    checkpoint = torch.load("best_model.pth", weights_only=True)
    model.load_state_dict(checkpoint['model_state_dict'])
    
    # Evaluate on test set
    model.eval()
    test_loss = 0.0
    correct = 0
    total = 0
    
    criterion = nn.CrossEntropyLoss()
    
    all_preds = []
    all_targets = []
    
    with torch.no_grad():
        for inputs, targets in test_loader:
            inputs, targets = inputs.to(device), targets.to(device)
            
            outputs = model(inputs)
            loss = criterion(outputs, targets)
            
            test_loss += loss.item()
            
            _, predicted = outputs.max(1)
            total += targets.size(0)
            correct += predicted.eq(targets).sum().item()
            
            # Save predictions and targets for confusion matrix
            all_preds.extend(predicted.cpu().numpy())
            all_targets.extend(targets.cpu().numpy())
    
    test_loss = test_loss / len(test_loader)
    test_acc = 100. * correct / total
    
    print(f"\nFinal Test Results:")
    print(f"Test Loss: {test_loss:.4f}")
    print(f"Test Accuracy: {test_acc:.2f}%")
    
    # Example prediction
    image_path = "C:\\Users\\Tusha\\OneDrive\\Desktop\\SceneSolver\\dataset\\Test\\Robbery\\Robbery048_x264_250.png"  # Update with your path
    predict_image(model, image_path, class_labels)