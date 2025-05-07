
# import os
# import torch
# import torch.nn.functional as F
# from PIL import Image
# import cv2
# import json
# import torchvision.transforms as transforms
# from tqdm import tqdm

# from transformers import CLIPProcessor, CLIPModel
# from vit_new import VisionTransformer
# from torchvision.transforms.functional import resize as tf_resize

# # === Config ===
# device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
# FRAME_FOLDER = "frames"

# # === Class labels ===
# crime_classes = [
#     "Arrest", "Arson", "Assault", "Burglary", "Explosion", "Fighting", "RoadAccidents",
#     "Robbery", "Shooting", "Shoplifting", "Stealing", "Vandalism", "Abuse", "NormalVideos"
# ]
# evidence_classes = [
#     "Gun", "Knife", "Mask", "Car", "Fire", "Glass", "Crowd",
#     "Blood", "Explosion", "Bag", "Money", "Weapon", "Smoke", "Person"
# ]
# crime_prompts = [f"a photo of {label.lower()}" for label in crime_classes]

# # === Transforms ===
# clip_transform = transforms.Compose([
#     transforms.Resize((224, 224)),  # CLIP expects 224x224
#     transforms.ToTensor(),
#     transforms.Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5])
# ])

# vit_transforms = transforms.Compose([
#     transforms.Resize((64, 64)),        # Must match model input
#     transforms.ToTensor(),              # Converts to (C, H, W) in [0, 1]
#     transforms.Normalize(               # Normalize like CLIP or custom
#         mean=[0.5, 0.5, 0.5],
#         std=[0.5, 0.5, 0.5]
#     )
# ])

# # === Model initialization ===
# clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(device)
# clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
# vit_model = VisionTransformer(num_classes=len(evidence_classes)).to(device)


# def load_models(vit_checkpoint="vit_model.pth"):
#     print(f"🔍 Loading ViT checkpoint from: {vit_checkpoint}")
#     vit_ckpt = torch.load(vit_checkpoint, map_location=device)
#     vit_model.load_state_dict(vit_ckpt)

#     clip_model.eval()
#     vit_model.eval()
#     print("✅ Models loaded and ready.")


# def extract_frames(video_path, output_folder=FRAME_FOLDER, frame_rate=1):
#     os.makedirs(output_folder, exist_ok=True)
#     cap = cv2.VideoCapture(video_path)
#     frame_count = 0
#     saved = []

#     while cap.isOpened():
#         ret, frame = cap.read()
#         if not ret:
#             break
#         if frame_count % frame_rate == 0:
#             img_path = os.path.join(output_folder, f"frame_{frame_count}.jpg")
#             cv2.imwrite(img_path, frame)
#             saved.append(img_path)
#         frame_count += 1

#     cap.release()
#     return saved


# def get_evidence_predictions(logits, threshold=0.3):
#     probs = torch.sigmoid(logits).squeeze(0).cpu()
#     return [
#         {"label": evidence_classes[i], "confidence": round(probs[i].item(), 3)}
#         for i in range(len(probs)) if probs[i].item() > threshold
#     ]


# def predict(image_path):
#     try:
#         image = Image.open(image_path).convert("RGB")
#         # Optional super-resolution: upscale tiny images (e.g. 64x64) to 224x224
#         if min(image.size) < 224:
#             image = tf_resize(image, [224, 224])  # basic upscale

#         # === CLIP prediction ===
#         img_tensor = clip_transform(image).unsqueeze(0).to(device)
#         with torch.no_grad():
#             clip_inputs = clip_processor(text=crime_prompts, images=image, return_tensors="pt", padding=True).to(device)
#             outputs = clip_model(**clip_inputs)
#             probs = outputs.logits_per_image.softmax(dim=1)

#             crime_idx = torch.argmax(probs, dim=1).item()
#             predicted_crime = crime_classes[crime_idx]
#             crime_conf = round(probs[0][crime_idx].item(), 3)

#         # === ViT prediction ===
#         vit_input = vit_transforms(image).unsqueeze(0).to(device)  # shape: (1, 3, 64, 64)
#         with torch.no_grad():
#             evidence_logits = vit_model(vit_input)  # correct input shape
#             evidence_found = get_evidence_predictions(evidence_logits)

#         return {
#             "image_name": os.path.basename(image_path),
#             "predicted_class": predicted_crime,
#             "crime_confidence": crime_conf,
#             "extracted_evidence": evidence_found
#         }

#     except Exception as e:
#         print(f"[ERROR] Failed on {image_path}: {e}")
#         return None


# def predict_multiple(inputs):
#     image_paths = []

#     if isinstance(inputs, str) and inputs.lower().endswith((".mp4", ".mov")):
#         print(f"📽 Extracting frames from video: {inputs}")
#         image_paths = extract_frames(inputs)
#     elif isinstance(inputs, list):
#         image_paths = inputs
#     else:
#         print("⚠️ Invalid input to predict_multiple")
#         return {"error": "Invalid input"}

#     crime_votes = {}
#     all_evidence = []

#     for img_path in image_paths:
#         result = predict(img_path)
#         if not result:
#             continue
#         crime = result["predicted_class"]
#         crime_votes[crime] = crime_votes.get(crime, 0) + 1
#         all_evidence.extend(result["extracted_evidence"])

#     if not crime_votes:
#         return {"error": "No valid predictions"}

#     final_crime = max(crime_votes.items(), key=lambda x: x[1])[0]
#     total_votes = sum(crime_votes.values())
#     final_conf = round(crime_votes[final_crime] / total_votes, 3)

#     evidence_dict = {}
#     for e in all_evidence:
#         label = e["label"]
#         conf = e["confidence"]
#         if label in evidence_dict:
#             evidence_dict[label].append(conf)
#         else:
#             evidence_dict[label] = [conf]

#     aggregated_evidence = [
#         {"label": label, "confidence": round(sum(confs)/len(confs), 3)}
#         for label, confs in evidence_dict.items()
#         if sum(confs)/len(confs) > 0.3
#     ]

#     return {
#         "predicted_class": final_crime,
#         "crime_confidence": final_conf,
#         "extracted_evidence": aggregated_evidence
#     }

import os
import torch
from PIL import Image
import cv2
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


def extract_frames(video_path, output_folder=FRAME_FOLDER, frame_rate=1):
    os.makedirs(output_folder, exist_ok=True)
    cap = cv2.VideoCapture(video_path)
    frame_count = 0
    saved = []

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        if frame_count % frame_rate == 0:
            img_path = os.path.join(output_folder, f"frame_{frame_count}.jpg")
            cv2.imwrite(img_path, frame)
            saved.append(img_path)
        frame_count += 1

    cap.release()
    return saved


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

    if isinstance(inputs, str) and inputs.lower().endswith((".mp4", ".mov")):
        print(f"📽 Extracting frames from video: {inputs}")
        image_paths = extract_frames(inputs)
    elif isinstance(inputs, list):
        image_paths = inputs
    else:
        print("⚠️ Invalid input to predict_multiple")
        return {"error": "Invalid input"}

    crime_votes = {}
    all_evidence = []

    for img_path in image_paths:
        result = predict(img_path)
        if not result:
            continue
        crime = result["predicted_class"]
        crime_votes[crime] = crime_votes.get(crime, 0) + 1
        all_evidence.extend(result["extracted_evidence"])

    if not crime_votes:
        return {"error": "No valid predictions"}

    final_crime = max(crime_votes.items(), key=lambda x: x[1])[0]
    total_votes = sum(crime_votes.values())
    final_conf = round(crime_votes[final_crime] / total_votes, 3)

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

    return {
        "predicted_class": final_crime,
        "crime_confidence": final_conf,
        "extracted_evidence": aggregated_evidence
    }
