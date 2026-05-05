import time
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

import numpy as np
import torch

from src.data.preprocessing import preprocess_image_array, tensor_to_batch
from src.explainability.gradcam import generate_gradcam
from src.explainability.heatmap import overlay_heatmap, save_heatmap_overlay
from src.models.image_model import load_model as base_load_model
from src.utils.config import get_config_value, load_config
from src.utils.logger import get_logger

logger = get_logger("image_inference")

# Singleton for lazy model loading
_MODEL: Optional[torch.nn.Module] = None
_DEVICE: Optional[torch.device] = None


def load_inference_model() -> Tuple[torch.nn.Module, torch.device]:
    """Lazy-load the image model and keep it in memory."""
    global _MODEL, _DEVICE
    if _MODEL is not None:
        return _MODEL, _DEVICE

    config = load_config("configs/image_config.yaml")
    checkpoint_path = get_config_value(config, ["model.path", "evaluation.checkpoint_path"], "models/image/best_model.pth")
    
    logger.info(f"Loading model from {checkpoint_path}")
    _DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    _MODEL = base_load_model(checkpoint_path=checkpoint_path, device=_DEVICE)
    
    return _MODEL, _DEVICE


@torch.no_grad()
def predict_image_tensor(tensor: torch.Tensor) -> float:
    """Lightweight prediction for a single image tensor."""
    model, _ = load_inference_model()
    logit = model(tensor).view(-1)
    return torch.sigmoid(logit).item()


def image_inference(image: np.ndarray, input_format: str = "rgb") -> Dict[str, Any]:
    """
    Standardized image inference with Grad-CAM visualization.
    Returns:
        {
            "label": str,
            "confidence": float,
            "heatmap_path": str
        }
    """
    model, device = load_inference_model()

    # Preprocessing
    tensor = preprocess_image_array(image, image_size=224, input_format=input_format)
    batch = tensor_to_batch(tensor, device)

    # Lightweight prediction
    fake_prob = predict_image_tensor(batch)
    label = "fake" if fake_prob > 0.5 else "real"
    confidence = fake_prob if label == "fake" else 1.0 - fake_prob

    # Generate Grad-CAM for visualization
    # generate_gradcam expects RGB image for overlay logic
    heatmap = generate_gradcam(model, image, device=device)
    overlay = overlay_heatmap(image, heatmap)

    timestamp = int(time.time() * 1000)
    output_path = f"outputs/visualizations/image_{timestamp}.jpg"
    heatmap_path = save_heatmap_overlay(overlay, output_path)

    result = {
        "label": label,
        "confidence": float(confidence),
        "heatmap_path": heatmap_path,
    }

    logger.debug(f"Image tensor shape: {tuple(batch.shape)}")
    logger.info(f"Image prediction: {label} ({confidence:.4f})")
    
    return result
