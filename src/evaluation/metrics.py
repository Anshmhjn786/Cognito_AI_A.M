import numpy as np
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)


def calculate_metrics(y_true, y_pred, threshold: float = 0.5):
    """
    Calculate binary classification metrics for deepfake detection.

    y_pred can contain class labels, probabilities, or logits.
    """
    y_true = _to_numpy(y_true).astype(int).reshape(-1)
    y_pred = _to_numpy(y_pred).reshape(-1)
    y_pred_labels = _to_binary_labels(y_pred, threshold=threshold)

    return {
        "accuracy": accuracy_score(y_true, y_pred_labels),
        "precision": precision_score(y_true, y_pred_labels, zero_division=0),
        "recall": recall_score(y_true, y_pred_labels, zero_division=0),
        "f1_score": f1_score(y_true, y_pred_labels, zero_division=0),
        "confusion_matrix": confusion_matrix(y_true, y_pred_labels, labels=[0, 1]).tolist(),
    }


def _to_numpy(values):
    if hasattr(values, "detach"):
        values = values.detach().cpu().numpy()
    return np.asarray(values)


def _to_binary_labels(values, threshold: float = 0.5):
    unique_values = np.unique(values)
    if np.all(np.isin(unique_values, [0, 1])):
        return values.astype(int)

    if values.min() < 0 or values.max() > 1:
        values = 1 / (1 + np.exp(-values))

    return (values >= threshold).astype(int)
