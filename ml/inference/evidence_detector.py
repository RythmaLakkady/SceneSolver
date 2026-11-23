"""
ml/inference/evidence_detector.py
Evidence Aggregation Across All Frames and Calibrated Crime Voting.

Addresses Research Improvement 2.B & 2.C:
- Collects raw probability for every evidence class across ALL analyzed frames (not just thresholded ones).
- Averages across all valid frames to avoid score inflation.
- Reports supporting frame counts (how many frames detected each evidence item).
- Calculates crime_vote_share for honest, calibrated confidence attribution.
"""

from typing import List, Dict, Any, Optional
import numpy as np

from ml.labels import EVIDENCE_CLASSES, DEFAULT_EVIDENCE_THRESHOLDS


def aggregate_evidence_across_frames(
    frame_probabilities_list: List[Dict[str, float]],
    evidence_classes_list: Optional[List[str]] = None,
    thresholds: Optional[Dict[str, float]] = None,
) -> List[Dict[str, Any]]:
    """
    Aggregate evidence probabilities across ALL analyzed frames.

    Args:
        frame_probabilities_list: List of dicts mapping evidence label to probability (one per frame).
        evidence_classes_list: List of 14 canonical evidence classes.
        thresholds: Per-class decision thresholds.

    Returns:
        List of dicts containing:
            - label: Evidence category name
            - confidence: Unbiased mean probability across ALL frames
            - frame_support: Number of frames exceeding threshold
            - support_percentage: Percentage of frames supporting this label
            - threshold: Threshold applied
            - is_supported: True if support_percentage > 0 or mean >= threshold
    """
    labels = evidence_classes_list or EVIDENCE_CLASSES
    thresh_dict = thresholds or DEFAULT_EVIDENCE_THRESHOLDS

    total_frames = len(frame_probabilities_list)
    if total_frames == 0:
        return []

    # Accumulate probabilities and count supporting frames for EVERY label
    prob_accumulator = {label: [] for label in labels}
    support_counter = {label: 0 for label in labels}

    for frame_probs in frame_probabilities_list:
        for label in labels:
            p = float(frame_probs.get(label, 0.0))
            prob_accumulator[label].append(p)
            t = thresh_dict.get(label, 0.3)
            if p >= t:
                support_counter[label] += 1

    aggregated = []
    for label in labels:
        vals = prob_accumulator[label]
        mean_prob = float(np.mean(vals)) if len(vals) > 0 else 0.0
        support_count = support_counter[label]
        support_pct = round((support_count / total_frames) * 100.0, 1)
        t = thresh_dict.get(label, 0.3)

        # Include evidence items that have positive frame support or mean above threshold
        if support_count > 0 or mean_prob >= t:
            aggregated.append({
                "label": label,
                "confidence": round(mean_prob, 3),
                "frame_support": support_count,
                "total_frames": total_frames,
                "support_percentage": support_pct,
                "threshold": t,
                "is_supported": True,
            })

    # Sort descending by confidence
    aggregated.sort(key=lambda x: x["confidence"], reverse=True)
    return aggregated


def aggregate_crime_classification(
    frame_predictions: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Aggregate frame-level crime classification votes with calibrated vote share.

    Args:
        frame_predictions: List of dicts with 'predicted_class' and 'crime_confidence'.

    Returns:
        Dict with 'predicted_class', 'crime_vote_share', 'crime_confidence', and vote breakdown.
    """
    if not frame_predictions:
        return {
            "predicted_class": "NormalVideos",
            "crime_vote_share": 0.0,
            "crime_confidence": 0.0,
            "vote_distribution": {},
        }

    votes = {}
    frame_counts = {}
    for pred in frame_predictions:
        c = pred["predicted_class"]
        conf = float(pred.get("crime_confidence", 1.0))
        votes[c] = votes.get(c, 0.0) + conf
        frame_counts[c] = frame_counts.get(c, 0) + 1

    total_weight = sum(votes.values())
    total_frames = len(frame_predictions)

    winning_class = max(votes.items(), key=lambda x: x[1])[0]
    vote_share = round(votes[winning_class] / total_weight, 3) if total_weight > 0 else 0.0

    vote_distribution = {
        cls: {
            "weighted_score": round(score, 3),
            "share_percentage": round((score / total_weight) * 100.0, 1) if total_weight > 0 else 0.0,
            "frames_won": frame_counts.get(cls, 0),
        }
        for cls, score in sorted(votes.items(), key=lambda x: x[1], reverse=True)
    }

    return {
        "predicted_class": winning_class,
        "crime_vote_share": vote_share,
        "crime_confidence": vote_share,  # backward compatibility alias
        "total_frames_analyzed": total_frames,
        "vote_distribution": vote_distribution,
    }
