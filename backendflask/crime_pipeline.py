import os
import torch
from PIL import Image
import cv2
import numpy as np
import torchvision.transforms as transforms
from tqdm import tqdm

from transformers import CLIPProcessor, CLIPModel
from vit_new import VisionTransformer

# === Config ===
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
FRAME_FOLDER = "frames"

# === Canonical Class Taxonomy (Research Phase 1 Canonical Ordering) ===
crime_classes = [
    "Abuse", "Arrest", "Arson", "Assault", "Burglary", "Explosion", "Fighting",
    "NormalVideos", "RoadAccidents", "Robbery", "Shooting", "Shoplifting", "Stealing", "Vandalism"
]
evidence_classes = [
    "Gun", "Knife", "Mask", "Car", "Fire", "Glass", "Crowd",
    "Blood", "Explosion", "Bag", "Money", "Weapon", "Smoke", "Person"
]

# Descriptive zero-shot prompts for CLIP
crime_prompts_map = {
    "Abuse": "a security camera recording of physical abuse or mistreatment of a person",
    "Arrest": "police officers arresting and detaining a suspect in handcuffs",
    "Arson": "a building, structure or vehicle on fire from deliberate arson",
    "Assault": "a person being physically attacked, beaten, or assaulted",
    "Burglary": "a burglar breaking into a private home, building, or store window",
    "Explosion": "a bomb explosion with blast fire, smoke, and debris",
    "Fighting": "people physically fighting, brawling, and punching each other",
    "NormalVideos": "normal peaceful everyday scene with routine activity and no crime",
    "RoadAccidents": "a car crash or motor vehicle collision on a road or street",
    "Robbery": "an armed robbery holding up someone with weapons or stealing money",
    "Shooting": "a shooting incident with a person firing a gun or firearm",
    "Shoplifting": "a customer secretly stealing items or merchandise from a store",
    "Stealing": "a person snatching or stealing personal property, purse, or bicycle",
    "Vandalism": "deliberately damaging, spray painting graffiti, or smashing property",
}
crime_prompts = [crime_prompts_map[c] for c in crime_classes]

# Per-label classification thresholds (Research Priority 2.C)
DEFAULT_EVIDENCE_THRESHOLDS = {
    "Gun": 0.35, "Knife": 0.28, "Mask": 0.30, "Car": 0.35,
    "Fire": 0.25, "Glass": 0.30, "Crowd": 0.32, "Blood": 0.28,
    "Explosion": 0.25, "Bag": 0.30, "Money": 0.30, "Weapon": 0.32,
    "Smoke": 0.25, "Person": 0.35
}

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


def calculate_frame_difference(frame1, frame2, threshold=8.0):
    """Calculate if two frames are significantly different."""
    if frame1 is None or frame2 is None:
        return True
    diff = cv2.absdiff(frame1, frame2)
    mean_diff = np.mean(diff)
    return float(mean_diff) > threshold


def format_timestamp(ms: float) -> str:
    """Format millisecond timestamp to HH:MM:SS.mmm."""
    seconds = int(ms // 1000)
    millis = int(ms % 1000)
    minutes = seconds // 60
    hours = minutes // 60
    minutes = minutes % 60
    secs = seconds % 60
    return f"{hours:02d}:{minutes:02d}:{secs:02d}.{millis:03d}"


def extract_frames(video_path, output_folder=FRAME_FOLDER, min_frame_diff=8.0, max_frames=30, return_telemetry=False):
    """
    Extract representative key frames from video with timestamp telemetry and guaranteed coverage.
    """
    print(f"📽 Processing video: {video_path}")

    video_name = os.path.splitext(os.path.basename(video_path))[0]
    frames_folder = os.path.join(output_folder, video_name)
    os.makedirs(frames_folder, exist_ok=True)

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"❌ Error: Could not open video {video_path}")
        return ([], []) if return_telemetry else []

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0

    target_count = min(max_frames, max(12, total_frames // 15)) if total_frames > 15 else max(1, total_frames)
    frame_interval = max(1, total_frames // target_count) if total_frames > target_count else 1

    saved_frames = []
    frame_telemetry = []
    last_saved_frame = None
    frame_count = 0

    with tqdm(total=total_frames, desc="Extracting frames with timestamps") as pbar:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            if frame_count % frame_interval == 0:
                diff = calculate_frame_difference(frame, last_saved_frame, min_frame_diff)
                if last_saved_frame is None or diff:
                    frame_path = os.path.join(frames_folder, f"frame_{frame_count:05d}.jpg")
                    cv2.imwrite(frame_path, frame)
                    saved_frames.append(frame_path)

                    ms = cap.get(cv2.CAP_PROP_POS_MSEC)
                    if ms <= 0.0 and fps > 0:
                        ms = (frame_count / fps) * 1000.0

                    frame_telemetry.append({
                        "path": frame_path,
                        "frame_index": frame_count,
                        "timestamp_ms": round(ms, 2),
                        "time_str": format_timestamp(ms),
                    })
                    last_saved_frame = frame.copy()

                    if len(saved_frames) >= max_frames:
                        break

            frame_count += 1
            pbar.update(1)

    # Fallback to uniform sampling if difference filter was too strict (< 8 frames retained)
    min_required = min(8, total_frames)
    if len(saved_frames) < min_required and total_frames > 0:
        print(f"⚠️ Difference filter yielded only {len(saved_frames)} frames; falling back to uniform sampling")
        saved_frames.clear()
        frame_telemetry.clear()
        cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
        step = max(1, total_frames // 15)
        f_idx = 0
        while cap.isOpened() and len(saved_frames) < max_frames:
            ret, frame = cap.read()
            if not ret:
                break
            if f_idx % step == 0:
                frame_path = os.path.join(frames_folder, f"frame_u_{f_idx:05d}.jpg")
                cv2.imwrite(frame_path, frame)
                saved_frames.append(frame_path)
                ms = (f_idx / fps) * 1000.0 if fps > 0 else 0.0
                frame_telemetry.append({
                    "path": frame_path,
                    "frame_index": f_idx,
                    "timestamp_ms": round(ms, 2),
                    "time_str": format_timestamp(ms),
                })
            f_idx += 1

    cap.release()
    print(f"✅ Extracted {len(saved_frames)} frames from video (retained with timestamp telemetry)")
    if return_telemetry:
        return saved_frames, frame_telemetry
    return saved_frames


def get_evidence_predictions(logits, thresholds=None):
    thresh = thresholds or DEFAULT_EVIDENCE_THRESHOLDS
    probs = torch.sigmoid(logits).squeeze(0).cpu().tolist()
    return [
        {
            "label": evidence_classes[i],
            "confidence": round(float(probs[i]), 3),
            "threshold": thresh.get(evidence_classes[i], 0.3)
        }
        for i in range(len(probs))
        if probs[i] > thresh.get(evidence_classes[i], 0.3)
    ]


def predict(image_path):
    try:
        image = Image.open(image_path).convert("RGB")

        # === CLIP prediction with descriptive prompts ===
        clip_inputs = clip_processor(text=crime_prompts, images=image, return_tensors="pt", padding=True).to(device)
        with torch.no_grad():
            outputs = clip_model(**clip_inputs)
            probs = outputs.logits_per_image.softmax(dim=1)

        crime_idx = torch.argmax(probs, dim=1).item()
        predicted_crime = crime_classes[crime_idx]
        crime_conf = round(float(probs[0][crime_idx].item()), 3)

        # === ViT prediction ===
        vit_input = vit_transforms(image).unsqueeze(0).to(device)
        with torch.no_grad():
            evidence_logits = vit_model(vit_input)
            raw_probs = torch.sigmoid(evidence_logits).squeeze(0).cpu().tolist()
            all_evidence_probs = {evidence_classes[i]: float(raw_probs[i]) for i in range(len(evidence_classes))}
            evidence_found = get_evidence_predictions(evidence_logits)

        return {
            "image_name": os.path.basename(image_path),
            "predicted_class": predicted_crime,
            "crime_confidence": crime_conf,
            "extracted_evidence": evidence_found,
            "all_evidence_probabilities": all_evidence_probs,
        }

    except Exception as e:
        print(f"[ERROR] Failed on {image_path}: {e}")
        return None


def predict_multiple(inputs):
    """
    Analyze multiple images or video frames.

    Implements Research Improvement 2.B:
    - Collects probabilities across ALL analyzed frames (including below threshold).
    - Calculates unbiased mean probability per evidence category.
    - Reports frame support count (how many frames detected each evidence item).
    - Calculates crime_vote_share for honest attribution.
    """
    image_paths = []
    telemetry_records = []

    if isinstance(inputs, str) and inputs.lower().endswith((".mp4", ".mov", ".avi")):
        print(f"📽 Extracting frames with timestamps from video: {inputs}")
        image_paths, telemetry_records = extract_frames(inputs, return_telemetry=True)
    elif isinstance(inputs, list):
        image_paths = inputs
    else:
        print("⚠️ Invalid input to predict_multiple")
        return {"error": "Invalid input"}

    if not image_paths:
        return {"error": "No valid frames or images found"}

    crime_votes = {}
    crime_frame_counts = {}
    all_frame_evidence_probs = []
    total_predictions = 0

    for img_path in tqdm(image_paths, desc="Analyzing frames across all categories"):
        result = predict(img_path)
        if not result:
            continue

        total_predictions += 1
        crime = result["predicted_class"]
        confidence = result["crime_confidence"]

        crime_votes[crime] = crime_votes.get(crime, 0.0) + confidence
        crime_frame_counts[crime] = crime_frame_counts.get(crime, 0) + 1

        if "all_evidence_probabilities" in result:
            all_frame_evidence_probs.append(result["all_evidence_probabilities"])

    if not crime_votes:
        return {"error": "No valid predictions"}

    # Final crime class and vote share
    final_crime = max(crime_votes.items(), key=lambda x: x[1])[0]
    total_confidence = sum(crime_votes.values())
    crime_vote_share = round(crime_votes[final_crime] / total_confidence, 3) if total_confidence > 0 else 0.0

    # Evidence aggregation across ALL analyzed frames (Research Improvement 2.B)
    aggregated_evidence = []
    total_analyzed = len(all_frame_evidence_probs)

    if total_analyzed > 0:
        for label in evidence_classes:
            vals = [frame_p.get(label, 0.0) for frame_p in all_frame_evidence_probs]
            mean_prob = float(np.mean(vals))
            thresh = DEFAULT_EVIDENCE_THRESHOLDS.get(label, 0.3)
            support_count = sum(1 for v in vals if v >= thresh)
            support_pct = round((support_count / total_analyzed) * 100.0, 1)

            # Include evidence items with positive frame support or substantial mean confidence
            if support_count > 0 or mean_prob >= thresh:
                aggregated_evidence.append({
                    "label": label,
                    "confidence": round(mean_prob, 3),
                    "frame_support": support_count,
                    "support_percentage": support_pct,
                    "threshold": thresh,
                })

        # Sort descending by confidence
        aggregated_evidence.sort(key=lambda x: x["confidence"], reverse=True)

    return {
        "predicted_class": final_crime,
        "crime_confidence": crime_vote_share,  # Backward compatible
        "crime_vote_share": crime_vote_share,  # Calibrated vote share
        "extracted_evidence": aggregated_evidence,
        "frames_analyzed": total_predictions,
        "total_frames": len(image_paths),
        "timestamps": telemetry_records,
    }


def process_crime_scene(image_paths):
    """
    Process multiple images from a crime scene and return aggregated analysis.
    """
    try:
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
