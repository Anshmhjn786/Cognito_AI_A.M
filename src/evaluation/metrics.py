import numpy as np
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix
from typing import Dict


def calculate_metrics(y_true: np.ndarray, y_pred_probs: np.ndarray, threshold: float = 0.5) -> Dict[str, float]:
    """
    Calculate standard binary classification metrics.
    """
    y_pred = (y_pred_probs >= threshold).astype(int)
    
    metrics = {
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "precision": float(precision_score(y_true, y_pred, zero_division=0)),
        "recall": float(recall_score(y_true, y_pred, zero_division=0)),
        "f1": float(f1_score(y_true, y_pred, zero_division=0)),
    }
    
    try:
        metrics["auc"] = float(roc_auc_score(y_true, y_pred_probs))
    except ValueError:
        metrics["auc"] = 0.5
        
    return metrics


def get_confusion_matrix(y_true: np.ndarray, y_pred: np.ndarray) -> np.ndarray:
    """
    Returns the confusion matrix.
    """
    return confusion_matrix(y_true, y_pred)
