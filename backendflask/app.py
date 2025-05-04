# from flask import Flask, request, jsonify
# from pymongo import MongoClient
# from crime_pipeline import load_models, predict
# from datetime import datetime
# import os
# import io
# from PIL import Image

# app = Flask(__name__)

# # Load models once when server starts
# load_models(clip_checkpoint="clip_model_weights.pth", vit_checkpoint="vit_model.pth")

# # MongoDB setup
# client = MongoClient("mongodb://localhost:27017/")
# db = client["crime_db"]
# collection = db["predictions"]

# UPLOAD_FOLDER = "uploads"
# os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# @app.route("/upload", methods=["POST"])
# def upload_image():
#     if "image" not in request.files:
#         return jsonify({"error": "No image uploaded"}), 400

#     file = request.files["image"]
#     if file.filename == "":
#         return jsonify({"error": "No selected file"}), 400

#     # Save the uploaded image temporarily
#     filepath = os.path.join(UPLOAD_FOLDER, file.filename)
#     file.save(filepath)

#     # Predict using crime_pipeline
#     prediction = predict(filepath)

#     # Read image back as binary for MongoDB
#     with open(filepath, "rb") as f:
#         image_binary = f.read()

#     # Store prediction + image in MongoDB
#     record = {
#         "image_name": prediction["image_name"],
#         "image_data": image_binary,
#         "predicted_class": prediction["predicted_class"],
#         "crime_confidence": prediction["crime_confidence"],
#         "extracted_evidence": prediction["extracted_evidence"],
#         "timestamp": datetime.utcnow()
#     }
#     collection.insert_one(record)

#     # Delete the image after processing (optional)
#     os.remove(filepath)

#     return jsonify({"message": "Prediction successful", "data": prediction})

# if __name__ == "__main__":
#     app.run(host="0.0.0.0", port=5000, debug=True)
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from crime_pipeline import load_models, predict_multiple
from datetime import datetime
import os

app = Flask(__name__)
CORS(app) 

# Load models once when server starts
load_models(clip_checkpoint="clip_model_weights.pth", vit_checkpoint="vit_model.pth")

# MongoDB setup
client = MongoClient("mongodb+srv://adityapanyala:Sanjeeva7@nodeexpressprojects.m2toq.mongodb.net/crimescene?retryWrites=true&w=majority&appName=NodeExpressProjects")
db = client["crime_db"]
collection = db["predictions"]

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route("/upload", methods=["POST"])
def upload_images():
    print("upload route")
    if "files" not in request.files:
        return jsonify({"error": "No images uploaded. Use 'images' as the key."}), 400

    files = request.files.getlist("files")
    if len(files) == 0:
        return jsonify({"error": "No files received"}), 400

    saved_paths = []
    for file in files:
        if file and file.filename:
            filepath = os.path.join(UPLOAD_FOLDER, file.filename)
            file.save(filepath)
            saved_paths.append(filepath)
        else:
            print("Skipped empty or invalid file.")

    # Predict once for all saved images
    prediction = predict_multiple(saved_paths)

    # Store summary in MongoDB
    record = {
        "frame_count": len(saved_paths),
        "predicted_class": prediction["predicted_class"],
        "crime_confidence": prediction["crime_confidence"],
        "extracted_evidence": prediction["extracted_evidence"],
        "timestamp": datetime.now().isoformat()
    }
    collection.insert_one(record)

    # Clean up uploaded files
    for path in saved_paths:
        os.remove(path)

    return jsonify({"message": "Prediction complete", "data": prediction})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
