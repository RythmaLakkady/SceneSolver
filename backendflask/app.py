from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import cv2
import time

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})

import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")  
os.makedirs(UPLOAD_FOLDER, exist_ok=True) 
FRAME_FOLDER = os.path.join(BASE_DIR, "frames")  
os.makedirs(FRAME_FOLDER, exist_ok=True)

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["FRAME_FOLDER"] = FRAME_FOLDER

ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_frames(video_path, folder):
    cap = cv2.VideoCapture(video_path)
    frame_count = 0
    
    
    for file in os.listdir(folder):
        if file.startswith('frame_'):
            os.remove(os.path.join(folder, file))
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        frame_file = os.path.join(folder, f"frame_{frame_count:04d}.jpg")
        cv2.imwrite(frame_file, frame)
        frame_count += 1
    cap.release()
    return frame_count

@app.route("/upload", methods=["POST"])
def upload_file():
    print("Received upload request") 
    
    if "video" not in request.files:
        print("No video in request.files")  
        return jsonify({"error": "No video file provided"}), 400

    file = request.files["video"]
    print(f"Received file: {file.filename}")  
    
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400
    
    if file and allowed_file(file.filename):
        try:
            
            filename = f"video_{int(time.time())}_{file.filename}"
            video_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
            print(f"Saving to: {video_path}")  
            
            
            file.save(video_path)
            
            
            print("Starting frame extraction") 
            frame_count = extract_frames(video_path, app.config["FRAME_FOLDER"])
            print(f"Extracted {frame_count} frames") 
            
            return jsonify({
                "message": "Video processed successfully",
                "frames": frame_count
            }), 200
            
        except Exception as e:
            print(f"Error during processing: {str(e)}") 
            return jsonify({"error": f"Processing error: {str(e)}"}), 500
    
    return jsonify({"error": "Invalid file type"}), 400

if __name__ == "__main__":
  app.run(debug=True,port=5000)
  