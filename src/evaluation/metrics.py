from typing import Dict

import numpy as np


def accuracy(y_true, y_pred) -> float:
    y_true = _to_numpy(y_true).astype(int)
    y_pred = _to_numpy(y_pred).astype(int)
    value = float((y_true == y_pred).mean()) if y_true.size else 0.0
    print(f"[DEBUG][metrics] accuracy={value}")
    return value


def precision(y_true, y_pred) -> float:
    y_true = _to_numpy(y_true).astype(int)
    y_pred = _to_numpy(y_pred).astype(int)
    tp = np.logical_and(y_true == 1, y_pred == 1).sum()
    fp = np.logical_and(y_true == 0, y_pred == 1).sum()
    value = float(tp / (tp + fp)) if (tp + fp) else 0.0
    print(f"[DEBUG][metrics] precision={value}")
    return value


def recall(y_true, y_pred) -> float:
    y_true = _to_numpy(y_true).astype(int)
    y_pred = _to_numpy(y_pred).astype(int)
    tp = np.logical_and(y_true == 1, y_pred == 1).sum()
    fn = np.logical_and(y_true == 1, y_pred == 0).sum()
    value = float(tp / (tp + fn)) if (tp + fn) else 0.0
    print(f"[DEBUG][metrics] recall={value}")
    return value


def f1_score(y_true, y_pred) -> float:
    p = precision(y_true, y_pred)
    r = recall(y_true, y_pred)
    value = float(2 * p * r / (p + r)) if (p + r) else 0.0
    print(f"[DEBUG][metrics] f1={value}")
    return value


def calculate_metrics(y_true, scores, threshold: float = 0.5) -> Dict[str, float]:
    y_true = _to_numpy(y_true).astype(int).reshape(-1)
    scores = _to_numpy(scores).reshape(-1)
    if scores.size and (scores.min() < 0 or scores.max() > 1):
        scores = 1.0 / (1.0 + np.exp(-scores))
    y_pred = (scores >= threshold).astype(int)

    metrics = {
        "accuracy": accuracy(y_true, y_pred),
        "precision": precision(y_true, y_pred),
        "recall": recall(y_true, y_pred),
        "f1_score": f1_score(y_true, y_pred),
    }
    print(f"[DEBUG][metrics] metrics={metrics}")
    return metrics


def _to_numpy(values) -> np.ndarray:
    if hasattr(values, "detach"):
        values = values.detach().cpu().numpy()
    return np.asarray(values)
