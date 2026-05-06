import torch
from pathlib import Path
from typing import Dict, Any, Union
import numpy as np

from src.models.video_model import load_video_model
from src.data.preprocessing import extract_frames, frames_to_tensor
from src.utils.config import load_config, get_config_value
from src.utils.helpers import get_device


def predict_video(
    video_path: Union[str, Path],
    config_path: str = "configs/video_config.yaml"
) -> Dict[str, Any]:
    """
    Full video inference pipeline.
    Steps:
    1. Extract frames from video
    2. Preprocess frames
    3. Create sequence
    4. Run temporal model (CNN + LSTM)
    5. Aggregate predictions (LSTM does this via its state/last output)
    """
    config = load_config(config_path)
    device = get_device(get_config_value(config, "device", "cpu"))
    
    # 1. Load model
    model_path = get_config_value(config, "paths.model_path", "models/video/best_model.pth")
    model = load_video_model(model_path, device=device)
    
    # 2. Extract frames
    frame_count = get_config_value(config, "data.frame_count", 20)
    image_size = get_config_value(config, "data.image_size", 224)
    frames = extract_frames(video_path, frame_count=frame_count)
    
    if not frames:
        return {
            "prediction": "ERROR",
            "confidence": 0.0,
            "message": "Could not extract frames from video."
        }
    
    # 3. Create sequence tensor
    sequence_tensor = frames_to_tensor(frames, image_size=image_size) # [T, C, H, W]
    input_tensor = sequence_tensor.unsqueeze(0).to(device) # [1, T, C, H, W]
    
    # 4. Run temporal model
    with torch.no_grad():
        logits = model(input_tensor)
        probability = torch.sigmoid(logits).item()
    
    # 5. Standardized output
    prediction = "FAKE" if probability > 0.5 else "REAL"
    confidence = probability if prediction == "FAKE" else 1.0 - probability
    
    return {
        "prediction": prediction,
        "confidence": float(confidence),
        "explainability": None # Optional
    }
