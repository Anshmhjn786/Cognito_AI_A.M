from pathlib import Path
from typing import Union

import cv2
import numpy as np

from src.utils.helpers import ensure_dir


def overlay_heatmap(
    image: np.ndarray,
    heatmap: np.ndarray,
    alpha: float = 0.4,
    colormap: int = cv2.COLORMAP_JET,
) -> np.ndarray:
    """Overlay a normalized heatmap onto an RGB image."""
    if image is None:
        raise ValueError("image cannot be None")

    image = np.asarray(image)
    if image.ndim == 2:
        image = cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)
    if image.shape[-1] == 4:
        image = cv2.cvtColor(image, cv2.COLOR_RGBA2RGB)

    heatmap_resized = cv2.resize(heatmap, (image.shape[1], image.shape[0]))
    heatmap_uint8 = np.uint8(255 * np.clip(heatmap_resized, 0, 1))
    colored = cv2.applyColorMap(heatmap_uint8, colormap)
    colored = cv2.cvtColor(colored, cv2.COLOR_BGR2RGB)
    overlay = cv2.addWeighted(image.astype(np.uint8), 1 - alpha, colored, alpha, 0)

    print(
        f"[DEBUG][heatmap] image_shape={image.shape} heatmap_shape={heatmap.shape} "
        f"overlay_shape={overlay.shape}"
    )
    return overlay


def save_heatmap_overlay(overlay: np.ndarray, output_path: Union[str, Path] = "outputs/visualizations/gradcam.jpg") -> str:
    path = Path(output_path)
    ensure_dir(path.parent)
    cv2.imwrite(str(path), cv2.cvtColor(overlay, cv2.COLOR_RGB2BGR))
    print(f"[DEBUG][heatmap] Saved overlay to {path.resolve()}")
    return str(path)
