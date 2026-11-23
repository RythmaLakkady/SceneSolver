from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from pymongo import MongoClient
from crime_pipeline import load_models, predict, predict_multiple, process_crime_scene, extract_frames
from datetime import datetime
import os
from werkzeug.utils import secure_filename
import json
import shutil
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

app = Flask(__name__)
CORS(app) 

load_models(
    vit_checkpoint="vit_model.pth"
)

mongo_uri = os.environ.get("MONGODB_URI", "mongodb://127.0.0.1:27017/scenesolver")
client = MongoClient(mongo_uri)
db = client["crime_db"]
collection = db["predictions"]

UPLOAD_FOLDER = "uploads"
FRAMES_FOLDER = "frames"
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'mp4', 'mov', 'avi'}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(FRAMES_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def cleanup_files(case_dir, frames_dir=None):
    """Clean up local files after analysis."""
    try:
        if os.path.exists(case_dir):
            shutil.rmtree(case_dir)
        if frames_dir and os.path.exists(frames_dir):
            shutil.rmtree(frames_dir)
    except Exception as e:
        print(f"Error during cleanup: {str(e)}")

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def is_video_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'mp4', 'mov', 'avi'}

def process_uploaded_files(files, case_dir):
    """Process uploaded files, handling both images and videos."""
    image_paths = []
    frames_dir = None
    
    try:
        for file in files:
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                file_path = os.path.join(case_dir, filename)
                file.save(file_path)
                
                if is_video_file(filename):
                    
                    print(f"Processing video file: {filename}")
                    video_name = os.path.splitext(filename)[0]
                    frames_dir = os.path.join(FRAMES_FOLDER, video_name)
                    
                    
                    frame_paths = extract_frames(file_path, FRAMES_FOLDER)
                    if frame_paths:
                        image_paths.extend(frame_paths)
                        print(f"✅ Extracted {len(frame_paths)} frames from {filename}")
                    else:
                        print(f"⚠️ No frames extracted from {filename}")
                        
                elif filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif')):
                    
                    image_paths.append(file_path)
                    print(f"✅ Added image: {filename}")
        
        return image_paths, frames_dir
    except Exception as e:
        print(f"Error processing files: {str(e)}")
        return [], frames_dir

@app.route("/upload", methods=["POST"])
def upload():
    if "files" not in request.files:
        return jsonify({"error": "Use 'files' key for images/videos"}), 400

    files = request.files.getlist("files")
    if len(files) == 0:
        return jsonify({"error": "No files received"}), 400

    file_paths = []

    for file in files:
        if file and file.filename:
            path = os.path.join(UPLOAD_FOLDER, secure_filename(file.filename))
            file.save(path)
            file_paths.append(path)

    
    if len(file_paths) == 1:
        file_path = file_paths[0]
        if is_video_file(file_path):
            result = predict_multiple(file_path)
        else:
            result = predict(file_path)
    else:
        result = predict_multiple(file_paths)

    
    collection.insert_one({
        "timestamp": datetime.now().isoformat(),
        "result": result
    })

    return jsonify({"message": "Prediction complete", "result": result})

@app.route('/api/upload/add-to-case', methods=['POST'])
def add_to_case():
    try:
        email = request.form.get('email')
        case_name = request.form.get('caseName')
        location = request.form.get('location')
        date = request.form.get('date')
        crime_time = request.form.get('crimeTime')
        
        if not email or not case_name:
            return jsonify({'error': 'Email and case name are required'}), 400

        
        case_dir = os.path.join(app.config['UPLOAD_FOLDER'], email, case_name)
        os.makedirs(case_dir, exist_ok=True)

        files = request.files.getlist('files')
        if not files:
            return jsonify({'error': 'No files provided'}), 400

        
        video_files = [f for f in files if f.filename and is_video_file(f.filename)]
        
        
        if video_files:
            if len(files) > 1:
                return jsonify({'error': 'Please upload only one video file at a time'}), 400
        else:
            
            if len(files) < 1:
                return jsonify({'error': 'Please upload at least one image'}), 400

        
        image_paths, frames_dir = process_uploaded_files(files, case_dir)

        if not image_paths:
            return jsonify({'error': 'No valid image or video files provided'}), 400

        print(f"📊 Processing {len(image_paths)} images/frames for case analysis...")

        
        analysis_result = process_crime_scene(image_paths)
        
        
        if analysis_result.get('status') == 'success':
            analysis_result['analysis']['scene_details'] = {
                'location': location,
                'date': date,
                'time': crime_time
            }
        else:
            analysis_result['scene_details'] = {
                'location': location,
                'date': date,
                'time': crime_time
            }

        
        result_file = os.path.join(case_dir, 'analysis_result.json')
        with open(result_file, 'w') as f:
            json.dump(analysis_result, f)

        
        cleanup_files(case_dir, frames_dir)

        return jsonify({
            'message': 'Files added and analyzed successfully',
            'result': analysis_result
        }), 200

    except Exception as e:
        print(f"Error in add_to_case: {str(e)}") 
        return jsonify({'error': str(e)}), 500

@app.route('/api/upload/reanalyze', methods=['POST'])
def reanalyze_case():
    try:
        data = request.json
        email = data.get('email')
        case_name = data.get('caseName')
        
        if not email or not case_name:
            return jsonify({'error': 'Email and case name are required'}), 400

        case_dir = os.path.join(app.config['UPLOAD_FOLDER'], email, case_name)
        if not os.path.exists(case_dir):
            return jsonify({'error': 'Case directory not found'}), 400

        
        all_files = []
        for root, _, files in os.walk(case_dir):
            for file in files:
                if file.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.mp4', '.mov', '.avi')):
                    all_files.append(os.path.join(root, file))

        if not all_files:
            return jsonify({'error': 'No images or videos found in case'}), 400

        
        image_paths = []
        frames_dir = None
        
        for file_path in all_files:
            if is_video_file(file_path):
                
                video_name = os.path.splitext(os.path.basename(file_path))[0]
                frames_dir = os.path.join(FRAMES_FOLDER, video_name)
                
                
                frame_paths = extract_frames(file_path, FRAMES_FOLDER)
                if frame_paths:
                    image_paths.extend(frame_paths)
                    print(f"✅ Re-extracted {len(frame_paths)} frames from {os.path.basename(file_path)}")
            else:
                
                image_paths.append(file_path)

        if not image_paths:
            return jsonify({'error': 'No valid images or video frames found'}), 400

        print(f"📊 Re-analyzing {len(image_paths)} images/frames...")

        
        analysis_result = process_crime_scene(image_paths)

        
        result_file = os.path.join(case_dir, 'analysis_result.json')
        with open(result_file, 'w') as f:
            json.dump(analysis_result, f)

        
        if frames_dir and os.path.exists(frames_dir):
            try:
                shutil.rmtree(frames_dir)
            except Exception as e:
                print(f"Warning: Could not clean up frames directory: {e}")

        return jsonify({'message': 'Case reanalyzed successfully', 'result': analysis_result}), 200

    except Exception as e:
        print(f"Error in reanalyze_case: {str(e)}") 
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=False)
