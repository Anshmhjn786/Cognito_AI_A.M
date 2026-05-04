from pathlib import Path
from typing import Dict, Optional, Tuple
import time
import sys

import cv2
import numpy as np
import torch


PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.append(str(PROJECT_ROOT))

from src.explainability.gradcam import GradCAM, overlay_heatmap, preprocess_image as gradcam_preprocess
from src.models.image_model import DeepfakeImageModel
from src.training.train_image import get_config


MODEL_DIR = PROJECT_ROOT / "models" / "image"
OUTPUT_DIR = PROJECT_ROOT / "outputs" / "visualizations"
IMAGE_SIZE = (224, 224)
IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
IMAGENET_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)

_MODEL: Optional[DeepfakeImageModel] = None
_DEVICE: Optional[torch.device] = None
_MODEL_PATH: Optional[Path] = None


def load_model() -> Tuple[DeepfakeImageModel, torch.device]:
    """Load the trained image model once and reuse it for later requests."""
    global _MODEL, _DEVICE, _MODEL_PATH

    if _MODEL is not None and _DEVICE is not None:
        return _MODEL, _DEVICE

    _DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    _MODEL_PATH = _find_model_checkpoint(MODEL_DIR)
    checkpoint = torch.load(_MODEL_PATH, map_location=_DEVICE)

    config = checkpoint.get("config", {}) if isinstance(checkpoint, dict) else {}
    model_name = get_config(config, ["model.name", "model_name"], "efficientnet_b0")

    _MODEL = DeepfakeImageModel(
        model_name=model_name,
        pretrained=False,
        apply_sigmoid=False,
    ).to(_DEVICE)

    state_dict = checkpoint.get("model_state_dict", checkpoint) if isinstance(checkpoint, dict) else checkpoint
    _MODEL.load_state_dict(state_dict)
    _MODEL.eval()

    return _MODEL, _DEVICE


def preprocess_image(image: np.ndarray) -> torch.Tensor:
    """Resize, ImageNet-normalize, convert to tensor, and add batch dimension."""
    _, device = load_model()
    image = _ensure_rgb(image)
    image = cv2.resize(image, IMAGE_SIZE, interpolation=cv2.INTER_AREA)
    image = image.astype(np.float32) / 255.0
    image = (image - IMAGENET_MEAN) / IMAGENET_STD
    tensor = torch.from_numpy(image.transpose(2, 0, 1)).float().unsqueeze(0)
    return tensor.to(device)


@torch.no_grad()
def predict(image: np.ndarray) -> Dict[str, float]:
    """Run deepfake inference and return a label plus confidence score."""
    input_tensor = preprocess_image(image)
    return _predict_tensor(input_tensor)


@torch.no_grad()
def _predict_tensor(input_tensor: torch.Tensor) -> Dict[str, float]:
    model, _ = load_model()

    logit = model(input_tensor).view(-1)
    fake_probability = torch.sigmoid(logit).item()

    if fake_probability >= 0.5:
        return {"label": "fake", "confidence": float(fake_probability)}

    return {"label": "real", "confidence": float(1.0 - fake_probability)}


def generate_heatmap(image: np.ndarray) -> str:
    """Generate a Grad-CAM overlay image and return the saved file path."""
    model, device = load_model()
    rgb_image = _ensure_rgb(image)
    input_tensor = gradcam_preprocess(rgb_image, image_size=IMAGE_SIZE, device=device)

    gradcam = GradCAM(model)
    try:
        heatmap = gradcam.generate(input_tensor)
    finally:
        gradcam.remove_hooks()

    overlay = overlay_heatmap(rgb_image, heatmap, alpha=0.4)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    output_path = OUTPUT_DIR / f"gradcam_{int(time.time() * 1000)}.jpg"
    cv2.imwrite(str(output_path), cv2.cvtColor(overlay, cv2.COLOR_RGB2BGR))
    return str(output_path)


def main_inference(image: np.ndarray) -> Dict[str, object]:
    """Run prediction and Grad-CAM generation for one input image."""
    input_tensor = preprocess_image(image)
    prediction = _predict_tensor(input_tensor)
    heatmap_path = generate_heatmap(image)

    return {
        "label": prediction["label"],
        "confidence": prediction["confidence"],
        "heatmap_path": heatmap_path,
    }


def _find_model_checkpoint(model_dir: Path) -> Path:
    if not model_dir.exists():
        raise FileNotFoundError(f"Model directory not found: {model_dir}")

    preferred_names = [
        "best_image_model.pth",
        "last_image_checkpoint.pth",
        "model.pth",
        "checkpoint.pth",
    ]
    for name in preferred_names:
        path = model_dir / name
        if path.exists():
            return path

    checkpoint_paths = []
    for pattern in ("*.pth", "*.pt", "*.ckpt"):
        checkpoint_paths.extend(model_dir.glob(pattern))

    if not checkpoint_paths:
        raise FileNotFoundError(f"No PyTorch checkpoint found in: {model_dir}")

    return max(checkpoint_paths, key=lambda path: path.stat().st_mtime)


def _ensure_rgb(image: np.ndarray) -> np.ndarray:
    if image is None:
        raise ValueError("Input image cannot be None.")

    image = np.asarray(image)
    if image.ndim == 2:
        return cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)

    if image.ndim != 3:
        raise ValueError(f"Expected image with 2 or 3 dimensions, got shape: {image.shape}")

    if image.shape[2] == 4:
        return cv2.cvtColor(image, cv2.COLOR_BGRA2RGB)
    if image.shape[2] == 3:
        return cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    raise ValueError(f"Expected image with 1, 3, or 4 channels, got shape: {image.shape}")
