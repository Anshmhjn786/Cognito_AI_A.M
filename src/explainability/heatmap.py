import cv2
import numpy as np
from pathlib import Path
from typing import Union


def generate_heatmap(image: np.ndarray, model_output: np.ndarray) -> np.ndarray:
    """
    Generate an anomaly heatmap based on model output (placeholder logic).
    """
    # Simple placeholder: use model_output to highlight areas
    # In a real scenario, this might come from Grad-CAM or other methods
    heatmap = np.zeros_like(image[:, :, 0], dtype=np.float32)
    # ... logic ...
    return heatmap


def save_visualization(image: np.ndarray, output_path: Union[str, Path]) -> str:
    """
    Save the visualization image to disk.
    """
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    
    # Ensure image is BGR for cv2.imwrite
    if image.shape[2] == 3:
        image_bgr = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
    else:
        image_bgr = image
        
    cv2.imwrite(str(path), image_bgr)
    return str(path)
