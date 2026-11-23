"""
ml/sampling/frame_extractor.py
Intelligent Video Frame Extraction with Timestamp Telemetry.

Addresses Research Improvement 2.A:
- Retains exact timestamps (milliseconds & formatted time) for every extracted frame.
- Supports both difference-based adaptive sampling and uniform sampling.
- Measures sampling efficiency and frame retention rates.
- Fully configurable min_frame_diff and max_frames parameters.
"""

import os
import cv2
import numpy as np
from typing import List, Dict, Any, Tuple, Optional


def format_timestamp(ms: float) -> str:
    """Format millisecond timestamp into HH:MM:SS.mmm string."""
    seconds = int(ms // 1000)
    millis = int(ms % 1000)
    minutes = seconds // 60
    hours = minutes // 60
    minutes = minutes % 60
    secs = seconds % 60
    return f"{hours:02d}:{minutes:02d}:{secs:02d}.{millis:03d}"


def calculate_frame_difference(frame1: np.ndarray, frame2: np.ndarray) -> float:
    """Calculate normalized mean absolute difference between two frames."""
    if frame1 is None or frame2 is None:
        return 999.0
    diff = cv2.absdiff(frame1, frame2)
    return float(np.mean(diff))


def extract_frames_with_telemetry(
    video_path: str,
    output_dir: str = "frames",
    max_frames: int = 50,
    min_frame_diff: float = 30.0,
    method: str = "adaptive",  # 'adaptive' or 'uniform'
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    Extract key frames from video with timestamp and selection telemetry.

    Args:
        video_path: Path to video file.
        output_dir: Root directory to save extracted frames.
        max_frames: Maximum number of frames to retain.
        min_frame_diff: Pixel difference threshold for adaptive sampling.
        method: 'adaptive' (difference-based) or 'uniform' (fixed interval).

    Returns:
        Tuple of:
            1. List of frame dicts: {path, frame_index, timestamp_ms, time_str}
            2. Telemetry metadata dict: {total_video_frames, retained_frames, compression_ratio, fps}
    """
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Video file not found: {video_path}")

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Could not open video file: {video_path}")

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    duration_sec = total_frames / fps if fps > 0 else 0.0

    video_name = os.path.splitext(os.path.basename(video_path))[0]
    dest_dir = os.path.join(output_dir, video_name)
    os.makedirs(dest_dir, exist_ok=True)

    interval = max(1, total_frames // max_frames) if total_frames > max_frames else 1

    extracted_records = []
    last_saved_frame = None
    frame_idx = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        timestamp_ms = cap.get(cv2.CAP_PROP_POS_MSEC)
        if timestamp_ms <= 0.0 and fps > 0:
            timestamp_ms = (frame_idx / fps) * 1000.0

        should_save = False

        if method == "uniform":
            if frame_idx % interval == 0:
                should_save = True
        else:  # 'adaptive'
            if frame_idx % interval == 0:
                diff = calculate_frame_difference(frame, last_saved_frame)
                if last_saved_frame is None or diff >= min_frame_diff:
                    should_save = True

        if should_save:
            frame_filename = f"frame_{len(extracted_records):04d}_idx{frame_idx:06d}.jpg"
            frame_path = os.path.join(dest_dir, frame_filename)
            cv2.imwrite(frame_path, frame)

            extracted_records.append({
                "path": os.path.abspath(frame_path),
                "frame_index": frame_idx,
                "timestamp_ms": round(timestamp_ms, 2),
                "time_str": format_timestamp(timestamp_ms),
            })
            last_saved_frame = frame.copy()

            if len(extracted_records) >= max_frames:
                break

        frame_idx += 1

    cap.release()

    telemetry = {
        "video_path": video_path,
        "video_name": video_name,
        "sampling_method": method,
        "total_video_frames": total_frames,
        "retained_frames": len(extracted_records),
        "fps": round(fps, 2),
        "duration_seconds": round(duration_sec, 2),
        "compression_ratio": round(len(extracted_records) / max(1, total_frames), 4),
    }

    return extracted_records, telemetry
