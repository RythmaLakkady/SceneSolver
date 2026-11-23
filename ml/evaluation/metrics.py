"""
ml/evaluation/metrics.py
Defensible Multi-Label Evaluation Metrics for SceneSolver.

Addresses Research Priority 4:
- Replaces naive element-wise accuracy with:
  1. Per-label Precision, Recall, F1, and Support count.
  2. Macro F1 (treats every evidence category equally).
  3. Micro F1 (aggregates total TP, FP, FN across labels).
  4. PR-AUC (Precision-Recall Area Under Curve per label).
- Tunes optimal per-label decision thresholds on validation data.
- Exports structured evaluation summaries to CSV and JSON.
"""

import json
import csv
import os
from typing import Dict, Any, List, Optional
import numpy as np

from ml.labels import EVIDENCE_CLASSES, DEFAULT_EVIDENCE_THRESHOLDS


def compute_binary_metrics(y_true_col: np.ndarray, y_prob_col: np.ndarray, threshold: float = 0.5) -> Dict[str, float]:
    """Calculate Precision, Recall, and F1 for a single binary column."""
    y_pred = (y_prob_col >= threshold).astype(int)
    tp = int(np.sum((y_true_col == 1) & (y_pred == 1)))
    fp = int(np.sum((y_true_col == 0) & (y_pred == 1)))
    fn = int(np.sum((y_true_col == 1) & (y_pred == 0)))
    support = int(np.sum(y_true_col == 1))

    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0

    return {
        "precision": round(float(precision), 4),
        "recall": round(float(recall), 4),
        "f1": round(float(f1), 4),
        "support": support,
        "tp": tp,
        "fp": fp,
        "fn": fn,
    }


def compute_pr_auc(y_true_col: np.ndarray, y_prob_col: np.ndarray) -> float:
    """Compute Area under the Precision-Recall curve using trapezoidal rule."""
    if np.sum(y_true_col == 1) == 0:
        return 0.0

    # Sort descending by predicted probability
    order = np.argsort(-y_prob_col)
    y_true_sorted = y_true_col[order]

    precisions = []
    recalls = []
    total_positives = np.sum(y_true_col == 1)

    tp = 0
    fp = 0
    for i, label in enumerate(y_true_sorted):
        if label == 1:
            tp += 1
        else:
            fp += 1
        p = tp / (tp + fp)
        r = tp / total_positives
        precisions.append(p)
        recalls.append(r)

    # Monotonic envelope & trapezoidal integration
    precisions = np.array([1.0] + precisions)
    recalls = np.array([0.0] + recalls)

    trapezoid_fn = getattr(np, "trapezoid", getattr(np, "trapz", None))
    if trapezoid_fn is not None:
        pr_auc = float(trapezoid_fn(precisions, recalls))
    else:
        # Pure numpy trapezoidal rule fallback
        pr_auc = float(np.sum((recalls[1:] - recalls[:-1]) * (precisions[1:] + precisions[:-1]) / 2.0))

    return round(max(0.0, min(1.0, pr_auc)), 4)


def compute_multilabel_metrics(
    y_true: np.ndarray,
    y_probs: np.ndarray,
    thresholds: Optional[Dict[str, float]] = None,
    evidence_classes_list: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Compute rigorous multi-label evaluation metrics.

    Args:
        y_true: Binary ground truth array of shape (N, num_classes)
        y_probs: Predicted probabilities array of shape (N, num_classes)
        thresholds: Dict mapping class names to decision thresholds.
        evidence_classes_list: List of evidence labels.

    Returns:
        Dict containing per-label metrics, macro F1, micro F1, and mean PR-AUC.
    """
    labels = evidence_classes_list or EVIDENCE_CLASSES
    thresh_dict = thresholds or DEFAULT_EVIDENCE_THRESHOLDS

    assert y_true.shape == y_probs.shape, f"Shape mismatch: {y_true.shape} vs {y_probs.shape}"
    num_classes = len(labels)

    per_label_results = {}
    f1_list = []
    pr_auc_list = []
    total_tp = 0
    total_fp = 0
    total_fn = 0

    for i in range(num_classes):
        label = labels[i]
        t = thresh_dict.get(label, 0.3)
        y_t = y_true[:, i]
        y_p = y_probs[:, i]

        metrics = compute_binary_metrics(y_t, y_p, threshold=t)
        pr_auc = compute_pr_auc(y_t, y_p)

        metrics["pr_auc"] = pr_auc
        metrics["threshold"] = t
        per_label_results[label] = metrics

        f1_list.append(metrics["f1"])
        pr_auc_list.append(pr_auc)
        total_tp += metrics["tp"]
        total_fp += metrics["fp"]
        total_fn += metrics["fn"]

    macro_f1 = round(float(np.mean(f1_list)), 4)
    macro_pr_auc = round(float(np.mean(pr_auc_list)), 4)

    micro_precision = total_tp / (total_tp + total_fp) if (total_tp + total_fp) > 0 else 0.0
    micro_recall = total_tp / (total_tp + total_fn) if (total_tp + total_fn) > 0 else 0.0
    micro_f1 = (
        (2 * micro_precision * micro_recall) / (micro_precision + micro_recall)
        if (micro_precision + micro_recall) > 0
        else 0.0
    )

    return {
        "summary": {
            "macro_f1": macro_f1,
            "micro_f1": round(float(micro_f1), 4),
            "micro_precision": round(float(micro_precision), 4),
            "micro_recall": round(float(micro_recall), 4),
            "mean_pr_auc": macro_pr_auc,
            "total_samples": int(y_true.shape[0]),
            "num_evidence_classes": num_classes,
        },
        "per_label": per_label_results,
    }


def tune_thresholds(
    y_true_val: np.ndarray,
    y_probs_val: np.ndarray,
    evidence_classes_list: Optional[List[str]] = None,
    candidate_thresholds: Optional[List[float]] = None,
) -> Dict[str, float]:
    """
    Select optimal classification thresholds on validation predictions.
    Avoids using test data to tune thresholds.
    """
    labels = evidence_classes_list or EVIDENCE_CLASSES
    candidates = candidate_thresholds or list(np.arange(0.15, 0.85, 0.05))

    tuned = {}
    for i in range(len(labels)):
        label = labels[i]
        best_f1 = -1.0
        best_t = 0.30

        for t in candidates:
            m = compute_binary_metrics(y_true_val[:, i], y_probs_val[:, i], threshold=float(t))
            if m["f1"] > best_f1:
                best_f1 = m["f1"]
                best_t = round(float(t), 2)

        tuned[label] = best_t

    return tuned


def export_evaluation_report(
    metrics_report: Dict[str, Any],
    checkpoint_id: str = "vit_model.pth",
    output_dir: str = "experiments/results",
) -> Dict[str, str]:
    """Export formatted CSV and JSON evaluation reports."""
    os.makedirs(output_dir, exist_ok=True)
    json_path = os.path.join(output_dir, "evaluation_report.json")
    csv_path = os.path.join(output_dir, "per_label_metrics.csv")

    full_payload = {
        "checkpoint_id": checkpoint_id,
        "evaluation_summary": metrics_report["summary"],
        "per_label": metrics_report["per_label"],
    }

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(full_payload, f, indent=2)

    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Evidence_Label", "Precision", "Recall", "F1", "PR_AUC", "Threshold", "Support"])
        for label, m in metrics_report["per_label"].items():
            writer.writerow([
                label,
                m["precision"],
                m["recall"],
                m["f1"],
                m["pr_auc"],
                m["threshold"],
                m["support"],
            ])

    return {"json": json_path, "csv": csv_path}
