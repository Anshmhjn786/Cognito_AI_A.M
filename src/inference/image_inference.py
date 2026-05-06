import torch
from pathlib import Path
from typing import Dict, Any, Union
import numpy as np
from PIL import Image

from src.models.image_model import load_image_model
from src.data.preprocessing import preprocess_image
from src.utils.config import load_config, get_config_value
from src.utils.helpers import get_device


def predict_image(
    image: Union[str, Path, np.ndarray, Image.Image],
    config_path: str = "configs/image_config.yaml"
) -> Dict[str, Any]:
    """
    Full image inference pipeline.
    Steps:
    1. Load trained image model
    2. Preprocess input image
    3. Run prediction
    4. Return structured output (prediction + confidence)
    """
    config = load_config(config_path)
    device = get_device(get_config_value(config, "device", "cpu"))
    
    # 1. Load model
    model_path = get_config_value(config, "paths.model_path", "models/image/best_model.pth")
    model_name = get_config_value(config, "model.name", "efficientnet_b0")
    model = load_image_model(model_path, device=device, model_name=model_name)
    
    # 2. Preprocess image
    if isinstance(image, (str, Path)):
        image = Image.open(image).convert("RGB")
    
    image_size = get_config_value(config, "data.image_size", 224)
    input_tensor = preprocess_image(image, image_size=image_size).unsqueeze(0).to(device)
    
    # 3. Run prediction
    with torch.no_grad():
        logits = model(input_tensor)
        probability = torch.sigmoid(logits).item()
    
    # 4. Return structured output
    prediction = "FAKE" if probability > 0.5 else "REAL"
    confidence = probability if prediction == "FAKE" else 1.0 - probability
    
    return {
        "prediction": prediction,
        "confidence": float(confidence),
        "explainability": None # Optional for now
    }
