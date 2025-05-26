import os
import torch
from PIL import Image
import cv2
import numpy as np
import torchvision.transforms as transforms
from tqdm import tqdm

from transformers import CLIPProcessor, CLIPModel
from vit_new import VisionTransformer
from torchvision.transforms.functional import resize as tf_resize

# === Config ===
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
FRAME_FOLDER = "frames"

# === Class labels ===
crime_classes = [
    "Arrest", "Arson", "Assault", "Burglary", "Explosion", "Fighting", "RoadAccidents",
    "Robbery", "Shooting", "Shoplifting", "Stealing", "Vandalism", "Abuse", "NormalVideos"
]
evidence_classes = [
    "Gun", "Knife", "Mask", "Car", "Fire", "Glass", "Crowd",
    "Blood", "Explosion", "Bag", "Money", "Weapon", "Smoke", "Person"
]
crime_prompts = [f"a photo of {label.lower()}" for label in crime_classes]

# === Transforms ===
clip_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5])
])

vit_transforms = transforms.Compose([
    transforms.Resize((64, 64)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5])
])

# === Model initialization ===
clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(device)
clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
vit_model = VisionTransformer(num_classes=len(evidence_classes)).to(device)


def load_models(vit_checkpoint="vit_model.pth"):
    print(f"🔍 Loading ViT checkpoint from: {vit_checkpoint}")
    vit_ckpt = torch.load(vit_checkpoint, map_location=device)
    vit_model.load_state_dict(vit_ckpt)

    clip_model.eval()
    vit_model.eval()
    print("✅ Models loaded and ready.")


def calculate_frame_difference(frame1, frame2, threshold=30):
    """Calculate if two frames are significantly different."""
    if frame1 is None or frame2 is None:
        return True
    
    diff = cv2.absdiff(frame1, frame2)
    mean_diff = np.mean(diff)
    return mean_diff > threshold


def extract_frames(video_path, output_folder=FRAME_FOLDER, min_frame_diff=30, max_frames=50):
    """
    Extract frames from video with intelligent frame selection.
    
    Args:
        video_path (str): Path to video file
        output_folder (str): Where to save extracted frames
        min_frame_diff (float): Minimum difference between consecutive frames
        max_frames (int): Maximum number of frames to extract
        
    Returns:
        list: Paths to extracted frames
    """
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
    print(f"✅ Extracted {len(saved_frames)} frames from video")
    return saved_frames


def get_evidence_predictions(logits, threshold=0.3):
    probs = torch.sigmoid(logits).squeeze(0).cpu()
    return [
        {"label": evidence_classes[i], "confidence": round(probs[i].item(), 3)}
        for i in range(len(probs)) if probs[i].item() > threshold
    ]


def predict(image_path):
    try:
        image = Image.open(image_path).convert("RGB")

        # === CLIP prediction ===
        clip_inputs = clip_processor(text=crime_prompts, images=image, return_tensors="pt", padding=True).to(device)
        with torch.no_grad():
            outputs = clip_model(**clip_inputs)
            probs = outputs.logits_per_image.softmax(dim=1)

        crime_idx = torch.argmax(probs, dim=1).item()
        predicted_crime = crime_classes[crime_idx]
        crime_conf = round(probs[0][crime_idx].item(), 3)

        # === ViT prediction ===
        vit_input = vit_transforms(image).unsqueeze(0).to(device)
        with torch.no_grad():
            evidence_logits = vit_model(vit_input)
            evidence_found = get_evidence_predictions(evidence_logits)

        return {
            "image_name": os.path.basename(image_path),
            "predicted_class": predicted_crime,
            "crime_confidence": crime_conf,
            "extracted_evidence": evidence_found
        }

    except Exception as e:
        print(f"[ERROR] Failed on {image_path}: {e}")
        return None


def predict_multiple(inputs):
    image_paths = []

    if isinstance(inputs, str) and inputs.lower().endswith((".mp4", ".mov", ".avi")):
        print(f"📽 Extracting frames from video: {inputs}")
        image_paths = extract_frames(inputs)
    elif isinstance(inputs, list):
        image_paths = inputs
    else:
        print("⚠️ Invalid input to predict_multiple")
        return {"error": "Invalid input"}

    if not image_paths:
        return {"error": "No valid frames or images found"}

    crime_votes = {}
    all_evidence = []
    total_predictions = 0

    for img_path in tqdm(image_paths, desc="Analyzing frames"):
        result = predict(img_path)
        if not result:
            continue
            
        total_predictions += 1
        crime = result["predicted_class"]
        confidence = result["crime_confidence"]
        
        # Weight the vote by confidence
        crime_votes[crime] = crime_votes.get(crime, 0) + confidence
        all_evidence.extend(result["extracted_evidence"])

    if not crime_votes:
        return {"error": "No valid predictions"}

    # Get the crime class with highest weighted votes
    final_crime = max(crime_votes.items(), key=lambda x: x[1])[0]
    total_confidence = sum(crime_votes.values())
    final_conf = round(crime_votes[final_crime] / total_confidence, 3)

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
        "extracted_evidence": aggregated_evidence,
        "frames_analyzed": total_predictions,
        "total_frames": len(image_paths)
    }

def process_crime_scene(image_paths):
    """
    Process multiple images from a crime scene and return aggregated analysis
    
    Args:
        image_paths (list): List of paths to image files
        
    Returns:
        dict: Analysis results including crime classification and evidence
    """
    try:
        # Use predict_multiple to analyze all images
        results = predict_multiple(image_paths)
        
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
