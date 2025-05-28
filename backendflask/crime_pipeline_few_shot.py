import os
import torch
from PIL import Image
import cv2
import numpy as np
import torchvision.transforms as transforms
from tqdm import tqdm
import torch.nn as nn

from transformers import CLIPProcessor, CLIPModel
from vit_new import VisionTransformer

# === Config ===
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
FRAME_FOLDER = "frames"

# === Class labels ===
crime_classes = [
    "Arrest", "Arson", "Assault", "Burglary", "Explosion", "Fighting", "RoadAccidents",
    "Robbery", "Shooting", "Shoplifting", "Stealing", "Vandalism", "Abuse", "Normal"
]
evidence_classes = [
    "Gun", "Knife", "Mask", "Car", "Fire", "Glass", "Crowd",
    "Blood", "Explosion", "Bag", "Money", "Weapon", "Smoke", "Person"
]

# Enhanced crime prompts matching few-shot training
few_shot_crime_prompts = {
    "Arrest": "police officers arresting a suspect with handcuffs",
    "Arson": "building on fire from deliberate arson",
    "Assault": "person being physically attacked violently",
    "Burglary": "person breaking into private building",
    "Explosion": "explosion with debris and destruction",
    "Fighting": "multiple people fighting violently",
    "RoadAccidents": "serious car accident on roadway",
    "Robbery": "armed robbery with weapon threats",
    "Shooting": "shooting incident with firearm",
    "Shoplifting": "person stealing from retail store",
    "Stealing": "person stealing personal property",
    "Vandalism": "property being vandalized deliberately",
    "Abuse": "person being abused or harmed",
    "Normal": "normal peaceful everyday activity"
}

# === Transforms ===
vit_transforms = transforms.Compose([
    transforms.Resize((64, 64)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5])
])

# === Model initialization ===
class FewShotFineTunedCLIP:
    def __init__(self, model_path=None, model_name="openai/clip-vit-base-patch32"):
        self.device = device
        self.processor = CLIPProcessor.from_pretrained(model_name)
        self.model = CLIPModel.from_pretrained(model_name).to(device)
        
        # Lightweight classification head (matching training)
        self.classifier = nn.Sequential(
            nn.Dropout(0.3),
            nn.Linear(self.model.config.projection_dim, 512),
            nn.ReLU(),
            nn.BatchNorm1d(512),
            nn.Dropout(0.2),
            nn.Linear(512, len(crime_classes))
        ).to(device)
        
        # Load few-shot fine-tuned weights if available
        if model_path and os.path.exists(model_path):
            print(f"🔍 Loading few-shot fine-tuned CLIP model from: {model_path}")
            checkpoint = torch.load(model_path, map_location=device)
            self.model.load_state_dict(checkpoint['model_state_dict'])
            self.classifier.load_state_dict(checkpoint['classifier_state_dict'])
            
            # Display model metadata
            if 'model_config' in checkpoint:
                config = checkpoint['model_config']
                print(f"✅ Few-shot model loaded successfully")
                print(f"   Training mode: {config.get('training_mode', 'unknown')}")
                print(f"   Images per class: {config.get('images_per_class', 'unknown')}")
                print(f"   Total training images: {config.get('total_images', 'unknown')}")
                print(f"   Best accuracy: {checkpoint.get('best_acc', 'unknown'):.2f}%")
            else:
                print("✅ Few-shot model loaded successfully")
        else:
            print("⚠️ No few-shot fine-tuned model found, using zero-shot CLIP")
        
        self.model.eval()
        self.classifier.eval()
        self.use_finetuned = model_path and os.path.exists(model_path)

# Global models
clip_classifier = None
vit_model = VisionTransformer(num_classes=len(evidence_classes)).to(device)

def load_models(vit_checkpoint="vit_model.pth", clip_checkpoint="clip_finetuned_few_shot.pth"):
    global clip_classifier
    
    print(f"🔍 Loading few-shot optimized models...")
    
    # Load few-shot CLIP classifier
    clip_classifier = FewShotFineTunedCLIP(model_path=clip_checkpoint)
    
    # Load ViT checkpoint
    print(f"🔍 Loading ViT checkpoint from: {vit_checkpoint}")
    vit_ckpt = torch.load(vit_checkpoint, map_location=device)
    vit_model.load_state_dict(vit_ckpt)
    vit_model.eval()
    
    print("✅ All models loaded and ready for analysis.")

def calculate_frame_difference(frame1, frame2, threshold=30):
    """Calculate if two frames are significantly different."""
    if frame1 is None or frame2 is None:
        return True
    
    diff = cv2.absdiff(frame1, frame2)
    mean_diff = np.mean(diff)
    return mean_diff > threshold

def extract_frames(video_path, output_folder=FRAME_FOLDER, min_frame_diff=30, max_frames=50):
    """Extract frames from video with intelligent frame selection."""
    print(f"📽 Processing video: {video_path}")
    
    # Create output folder if it doesn't exist
    video_name = os.path.splitext(os.path.basename(video_path))[0]
    frames_folder = os.path.join(output_folder, video_name)
    os.makedirs(frames_folder, exist_ok=True)
    
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"❌ Error: Could not open video {video_path}")
        return []
    
    # Get video properties
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = int(cap.get(cv2.CAP_PROP_FPS))
    
    # Calculate frame sampling rate
    if total_frames > max_frames:
        frame_interval = total_frames // max_frames
    else:
        frame_interval = 1
    
    saved_frames = []
    last_saved_frame = None
    frame_count = 0
    
    with tqdm(total=total_frames, desc="Extracting frames") as pbar:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
                
            if frame_count % frame_interval == 0:
                # Check if frame is significantly different from last saved frame
                if last_saved_frame is None or calculate_frame_difference(frame, last_saved_frame, min_frame_diff):
                    frame_path = os.path.join(frames_folder, f"frame_{frame_count:05d}.jpg")
                    cv2.imwrite(frame_path, frame)
                    saved_frames.append(frame_path)
                    last_saved_frame = frame.copy()
                    
                    # Break if we've extracted enough frames
                    if len(saved_frames) >= max_frames:
                        break
            
            frame_count += 1
            pbar.update(1)
    
    cap.release()
    print(f"✅ Extracted {len(saved_frames)} frames for analysis")
    return saved_frames

def get_evidence_predictions(logits, threshold=0.3):
    probs = torch.sigmoid(logits).squeeze(0).cpu()
    return [
        {"label": evidence_classes[i], "confidence": round(probs[i].item(), 3)}
        for i in range(len(probs)) if probs[i].item() > threshold
    ]

def predict_with_few_shot_finetuned(image):
    """Use few-shot fine-tuned CLIP for crime classification"""
    few_shot_prompts = list(few_shot_crime_prompts.values())
    
    inputs = clip_classifier.processor(
        text=few_shot_prompts,
        images=image,
        return_tensors="pt",
        padding=True
    ).to(device)
    
    with torch.no_grad():
        outputs = clip_classifier.model(**inputs)
        image_features = outputs.image_embeds
        
        # Use fine-tuned classifier head
        logits = clip_classifier.classifier(image_features)
        probs = torch.softmax(logits, dim=1)
    
    crime_idx = torch.argmax(probs, dim=1).item()
    predicted_crime = crime_classes[crime_idx]
    crime_conf = round(probs[0][crime_idx].item(), 3)
    
    return predicted_crime, crime_conf

def predict_with_zeroshot_clip(image):
    """Fallback to zero-shot CLIP if fine-tuned model not available"""
    few_shot_prompts = list(few_shot_crime_prompts.values())
    
    inputs = clip_classifier.processor(
        text=few_shot_prompts,
        images=image,
        return_tensors="pt",
        padding=True
    ).to(device)
    
    with torch.no_grad():
        outputs = clip_classifier.model(**inputs)
        probs = outputs.logits_per_image.softmax(dim=1)
    
    crime_idx = torch.argmax(probs, dim=1).item()
    predicted_crime = crime_classes[crime_idx]
    crime_conf = round(probs[0][crime_idx].item(), 3)
    
    return predicted_crime, crime_conf

def predict_single_image(image_path):
    """Predict crime type and evidence from a single image"""
    try:
        image = Image.open(image_path).convert("RGB")

        # === CLIP prediction (few-shot optimized) ===
        if clip_classifier.use_finetuned:
            predicted_crime, crime_conf = predict_with_few_shot_finetuned(image)
            model_type = "few-shot-finetuned"
        else:
            predicted_crime, crime_conf = predict_with_zeroshot_clip(image)
            model_type = "zero-shot"

        # === ViT prediction for evidence ===
        vit_input = vit_transforms(image).unsqueeze(0).to(device)
        with torch.no_grad():
            evidence_logits = vit_model(vit_input)
            evidence_found = get_evidence_predictions(evidence_logits)

        return {
            "image_name": os.path.basename(image_path),
            "predicted_class": predicted_crime,
            "crime_confidence": crime_conf,
            "extracted_evidence": evidence_found,
            "model_type": model_type,
            "analysis_mode": "few_shot"
        }

    except Exception as e:
        print(f"[ERROR] Failed on {image_path}: {e}")
        return None

def predict_multiple_images(inputs):
    """Process multiple images or video frames"""
    image_paths = []

    if isinstance(inputs, str) and inputs.lower().endswith((".mp4", ".mov", ".avi")):
        print(f"📽 Extracting frames from video: {inputs}")
        image_paths = extract_frames(inputs)
    elif isinstance(inputs, list):
        image_paths = inputs
    else:
        print("⚠️ Invalid input to predict_multiple_images")
        return {"error": "Invalid input"}

    if not image_paths:
        return {"error": "No valid frames or images found"}

    print(f"🎯 Analyzing {len(image_paths)} images with few-shot model...")

    # Analyze each image
    individual_results = []
    crime_votes = {}
    all_evidence = []
    model_type = None

    for img_path in tqdm(image_paths, desc="Processing images"):
        result = predict_single_image(img_path)
        if not result:
            continue
            
        individual_results.append(result)
        crime = result["predicted_class"]
        confidence = result["crime_confidence"]
        model_type = result["model_type"]
        
        # Weight the vote by confidence
        crime_votes[crime] = crime_votes.get(crime, 0) + confidence
        all_evidence.extend(result["extracted_evidence"])

    if not crime_votes:
        return {"error": "No valid predictions"}

    # Aggregate results
    final_crime = max(crime_votes.items(), key=lambda x: x[1])[0]
    total_confidence = sum(crime_votes.values())
    final_conf = round(crime_votes[final_crime] / total_confidence, 3)

    # Calculate confidence distribution
    crime_distribution = {
        crime: round(votes / total_confidence, 3) 
        for crime, votes in crime_votes.items()
    }

    # Aggregate evidence with confidence averaging
    evidence_dict = {}
    for e in all_evidence:
        label = e["label"]
        conf = e["confidence"]
        if label in evidence_dict:
            evidence_dict[label].append(conf)
        else:
            evidence_dict[label] = [conf]

    aggregated_evidence = [
        {"label": label, "confidence": round(sum(confs) / len(confs), 3)}
        for label, confs in evidence_dict.items()
        if sum(confs) / len(confs) > 0.3
    ]

    # Sort evidence by confidence
    aggregated_evidence.sort(key=lambda x: x["confidence"], reverse=True)

    return {
        "predicted_class": final_crime,
        "crime_confidence": final_conf,
        "crime_distribution": crime_distribution,
        "extracted_evidence": aggregated_evidence,
        "images_analyzed": len(individual_results),
        "total_images": len(image_paths),
        "model_type": model_type,
        "analysis_mode": "few_shot_aggregated"
    }

def process_crime_scene(image_paths):
    """Process multiple images from a crime scene"""
    try:
        # Use the few-shot approach
        results = predict_multiple_images(image_paths)
        
        if "error" in results:
            return {
                "status": "error",
                "message": results["error"]
            }
            
        return {
            "status": "success",
            "analysis": results
        }
        
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

# Alias for backwards compatibility
predict = predict_single_image
predict_multiple = predict_multiple_images 