import torch
from pathlib import Path
from typing import Dict, Any

from app.core.model_manager import ModelManager
from app.utils.response_formatter import ResponseFormatter
from app.core.config import logger

# Import components from src
from src.data.preprocessing import extract_frames, frames_to_tensor
from src.utils.config import get_config_value

class VideoService:
    @staticmethod
    def predict(video_path: Path) -> Dict[str, Any]:
        try:
            # 1. Get Model and Config
            model, config, device = ModelManager.get_video_model()
            
            # 2. Preprocess
            frame_count = get_config_value(config, "data.frame_count", 20)
            image_size = get_config_value(config, "data.image_size", 224)
            
            frames = extract_frames(str(video_path), frame_count=frame_count)
            if not frames:
                return ResponseFormatter.format_error("Frame extraction failed", "Could not extract frames from video.")
            
            sequence_tensor = frames_to_tensor(frames, image_size=image_size)
            input_tensor = sequence_tensor.unsqueeze(0).to(device)
            
            # 3. Inference
            model.eval()
            with torch.no_grad():
                logits = model(input_tensor)
                probability = torch.sigmoid(logits).item()
            
            prediction = "FAKE" if probability > 0.5 else "REAL"
            confidence = probability if prediction == "FAKE" else 1.0 - probability
            
            return ResponseFormatter.format_prediction(
                prediction=prediction,
                confidence=confidence
            )

        except Exception as e:
            logger.error(f"Video prediction failed: {e}")
            return ResponseFormatter.format_error("Prediction failed", str(e))
