"""
tests/test_ml_pipeline.py
Comprehensive Verification Suite for SceneSolver ML Research Architecture.

Tests Priorities 1-4:
- Priority 1: Label pipeline and ImageFolder alphabetical synchronization.
- Priority 2: Inferred pseudo-label mapping and Knife/Weapon assignment.
- Priority 3: Video-level dataset splitting with zero frame leakage across splits.
- Priority 4: Defensible multi-label metrics (Precision, Recall, F1, Macro/Micro, PR-AUC, threshold tuning).
- Video Analysis: Unbiased all-frame evidence aggregation and vote share telemetry.
- Canonical Architecture: VisionTransformer shape and parameter verification.
"""

import unittest
import numpy as np
import torch
import os
import tempfile
import shutil

from ml.labels import (
    CRIME_CLASSES,
    EVIDENCE_CLASSES,
    CRIME_TO_EVIDENCE,
    DEFAULT_EVIDENCE_THRESHOLDS,
    encode_evidence_labels,
)
from ml.models.evidence_vit import VisionTransformer
from ml.datasets import (
    extract_video_id,
    split_video_dataset,
    create_dataset_manifest,
    eval_transform,
    train_transform,
)
from ml.evaluation.metrics import (
    compute_binary_metrics,
    compute_pr_auc,
    compute_multilabel_metrics,
    tune_thresholds,
    export_evaluation_report,
)
from ml.inference.evidence_detector import (
    aggregate_evidence_across_frames,
    aggregate_crime_classification,
)
from ml.sampling.frame_extractor import format_timestamp, calculate_frame_difference


class TestPriority1LabelPipeline(unittest.TestCase):
    """Priority 1: Ensure ImageFolder alphabetical class ordering never desynchronizes."""

    def test_alphabetical_crime_classes(self):
        # ImageFolder sorts classes alphabetically: 'Abuse' must be index 0
        sorted_classes = sorted(CRIME_CLASSES)
        self.assertEqual(CRIME_CLASSES, sorted_classes)
        self.assertEqual(CRIME_CLASSES[0], "Abuse")
        self.assertEqual(CRIME_CLASSES[1], "Arrest")

    def test_encode_evidence_labels_by_name(self):
        # Arson -> Fire, Smoke
        tensor = encode_evidence_labels("Arson")
        self.assertEqual(tensor.shape, (14,))
        fire_idx = EVIDENCE_CLASSES.index("Fire")
        smoke_idx = EVIDENCE_CLASSES.index("Smoke")
        gun_idx = EVIDENCE_CLASSES.index("Gun")
        self.assertEqual(tensor[fire_idx].item(), 1.0)
        self.assertEqual(tensor[smoke_idx].item(), 1.0)
        self.assertEqual(tensor[gun_idx].item(), 0.0)

    def test_encode_evidence_labels_by_index_with_dataset_classes(self):
        # Index 0 is 'Abuse' -> Person
        abuse_tensor = encode_evidence_labels(0, dataset_classes=CRIME_CLASSES)
        person_idx = EVIDENCE_CLASSES.index("Person")
        self.assertEqual(abuse_tensor[person_idx].item(), 1.0)

        # Index 2 is 'Arson' -> Fire, Smoke
        arson_tensor = encode_evidence_labels(2, dataset_classes=CRIME_CLASSES)
        fire_idx = EVIDENCE_CLASSES.index("Fire")
        self.assertEqual(arson_tensor[fire_idx].item(), 1.0)


class TestPriority2EvidenceSemantics(unittest.TestCase):
    """Priority 2: Inferred pseudo-labels and Knife/Weapon assignment."""

    def test_knife_and_weapon_assigned(self):
        # Knife and Weapon are assigned to relevant categories
        self.assertIn("Knife", CRIME_TO_EVIDENCE["Assault"])
        self.assertIn("Weapon", CRIME_TO_EVIDENCE["Robbery"])
        self.assertIn("Weapon", CRIME_TO_EVIDENCE["Shooting"])

        assault_tensor = encode_evidence_labels("Assault")
        knife_idx = EVIDENCE_CLASSES.index("Knife")
        weapon_idx = EVIDENCE_CLASSES.index("Weapon")
        self.assertEqual(assault_tensor[knife_idx].item(), 1.0)
        self.assertEqual(assault_tensor[weapon_idx].item(), 1.0)


class TestPriority3VideoLevelSplitting(unittest.TestCase):
    """Priority 3: Video-level dataset splitting without frame leakage."""

    def test_video_id_extraction(self):
        self.assertEqual(extract_video_id("Robbery005_x264_00120.jpg"), "Robbery005_x264")
        self.assertEqual(extract_video_id("Explosion_012_frame_045.png"), "Explosion_012")
        self.assertEqual(extract_video_id("Arson001.mp4"), "Arson001")

    def test_no_frame_leakage_across_splits(self):
        # 4 videos with 3 frames each
        records = [
            {"path": "vidA_frame01.jpg", "crime_class": "Robbery"},
            {"path": "vidA_frame02.jpg", "crime_class": "Robbery"},
            {"path": "vidA_frame03.jpg", "crime_class": "Robbery"},
            {"path": "vidB_frame01.jpg", "crime_class": "Robbery"},
            {"path": "vidB_frame02.jpg", "crime_class": "Robbery"},
            {"path": "vidC_frame01.jpg", "crime_class": "Robbery"},
            {"path": "vidC_frame02.jpg", "crime_class": "Robbery"},
            {"path": "vidD_frame01.jpg", "crime_class": "Robbery"},
            {"path": "vidD_frame02.jpg", "crime_class": "Robbery"},
        ]

        splits = split_video_dataset(records, train_ratio=0.5, val_ratio=0.25, test_ratio=0.25, seed=42)

        train_vids = {r["video_id"] for r in splits["train"]}
        val_vids = {r["video_id"] for r in splits["val"]}
        test_vids = {r["video_id"] for r in splits["test"]}

        # Disjoint sets: NO video appears in more than one split
        self.assertTrue(train_vids.isdisjoint(val_vids), "Train and Val share video IDs (Data Leakage!)")
        self.assertTrue(train_vids.isdisjoint(test_vids), "Train and Test share video IDs (Data Leakage!)")
        self.assertTrue(val_vids.isdisjoint(test_vids), "Val and Test share video IDs (Data Leakage!)")


class TestPriority4EvaluationMetrics(unittest.TestCase):
    """Priority 4: Defensible multi-label metrics (Precision, Recall, F1, PR-AUC, Thresholds)."""

    def test_binary_metrics_calculation(self):
        y_true = np.array([1, 1, 0, 0, 1])
        y_prob = np.array([0.9, 0.8, 0.1, 0.7, 0.2])  # threshold 0.5 -> pred = [1, 1, 0, 1, 0]
        # TP=2, FP=1, FN=1, TN=1 -> P=2/3 (~0.6667), R=2/3 (~0.6667), F1=2/3
        m = compute_binary_metrics(y_true, y_prob, threshold=0.5)
        self.assertAlmostEqual(m["precision"], 0.6667, places=3)
        self.assertAlmostEqual(m["recall"], 0.6667, places=3)
        self.assertAlmostEqual(m["f1"], 0.6667, places=3)
        self.assertEqual(m["support"], 3)

    def test_pr_auc_range(self):
        y_true = np.array([1, 0, 1, 1, 0, 0])
        y_prob = np.array([0.9, 0.8, 0.7, 0.6, 0.2, 0.1])
        auc = compute_pr_auc(y_true, y_prob)
        self.assertGreaterEqual(auc, 0.0)
        self.assertLessEqual(auc, 1.0)

    def test_threshold_tuning_optimizes_f1(self):
        y_true = np.zeros((10, 14))
        y_true[:5, 0] = 1  # 5 positives for label 0
        y_probs = np.full((10, 14), 0.2)
        y_probs[:5, 0] = 0.65  # label 0 positives have prob 0.65

        tuned = tune_thresholds(y_true, y_probs, candidate_thresholds=[0.3, 0.5, 0.6, 0.8])
        # Any threshold between 0.25 and 0.65 (e.g. 0.3, 0.5, 0.6) yields F1 = 1.0
        self.assertIn(tuned[EVIDENCE_CLASSES[0]], [0.3, 0.5, 0.6])
        # Verify that evaluating with the tuned threshold yields perfect F1
        m = compute_binary_metrics(y_true[:, 0], y_probs[:, 0], threshold=tuned[EVIDENCE_CLASSES[0]])
        self.assertEqual(m["f1"], 1.0)

    def test_export_report_files(self):
        temp_dir = tempfile.mkdtemp()
        try:
            y_true = np.zeros((4, 14))
            y_probs = np.full((4, 14), 0.5)
            metrics = compute_multilabel_metrics(y_true, y_probs)
            paths = export_evaluation_report(metrics, checkpoint_id="test_ckpt", output_dir=temp_dir)
            self.assertTrue(os.path.exists(paths["json"]))
            self.assertTrue(os.path.exists(paths["csv"]))
        finally:
            shutil.rmtree(temp_dir)


class TestVideoAnalysisImprovements(unittest.TestCase):
    """Improvements 2.A & 2.B: Timestamp telemetry and unbiased evidence aggregation."""

    def test_timestamp_formatting(self):
        self.assertEqual(format_timestamp(0.0), "00:00:00.000")
        self.assertEqual(format_timestamp(61500.0), "00:01:01.500")

    def test_unbiased_evidence_aggregation_across_all_frames(self):
        # 4 frames: Gun has probabilities [0.1, 0.1, 0.1, 0.9]
        # In the old flawed logic, only 0.9 was averaged -> reported 0.9!
        # In the new corrected logic, all 4 frames are averaged: (0.1+0.1+0.1+0.9)/4 = 0.3
        frame_probs = [
            {"Gun": 0.1, "Person": 0.8},
            {"Gun": 0.1, "Person": 0.7},
            {"Gun": 0.1, "Person": 0.9},
            {"Gun": 0.9, "Person": 0.8},
        ]
        agg = aggregate_evidence_across_frames(frame_probs)
        gun_item = next(item for item in agg if item["label"] == "Gun")
        self.assertAlmostEqual(gun_item["confidence"], 0.3, places=2)
        self.assertEqual(gun_item["frame_support"], 1)
        self.assertEqual(gun_item["support_percentage"], 25.0)

    def test_crime_classification_vote_share(self):
        preds = [
            {"predicted_class": "Robbery", "crime_confidence": 0.9},
            {"predicted_class": "Robbery", "crime_confidence": 0.8},
            {"predicted_class": "Burglary", "crime_confidence": 0.3},
        ]
        res = aggregate_crime_classification(preds)
        self.assertEqual(res["predicted_class"], "Robbery")
        # Total votes = 0.9 + 0.8 + 0.3 = 2.0. Robbery share = 1.7 / 2.0 = 0.85
        self.assertAlmostEqual(res["crime_vote_share"], 0.85, places=2)


class TestCanonicalViTArchitecture(unittest.TestCase):
    """Canonical Vision Transformer Model structure."""

    def test_vit_forward_pass_shape(self):
        model = VisionTransformer(num_classes=14, dim=256, depth=2, heads=4, patch_size=8, image_size=64)
        dummy_input = torch.randn(2, 3, 64, 64)
        logits = model(dummy_input)
        self.assertEqual(logits.shape, (2, 14))

        probs = model.predict_probabilities(dummy_input)
        self.assertEqual(probs.shape, (2, 14))
        self.assertTrue(torch.all(probs >= 0.0) and torch.all(probs <= 1.0))


if __name__ == "__main__":
    unittest.main()
