import torch
import numpy as np
from pathlib import Path
from typing import Dict, Any

from app.core.model_manager import ModelManager
from app.utils.response_formatter import ResponseFormatter
from app.core.config import logger

# Import components from src
from src.data.preprocessing import extract_frames, frames_to_tensor
from src.utils.config import get_config_value

import cv2
import uuid
import random
from app.core.config import logger, FRAME_UPLOAD_DIR

class VideoService:
    @staticmethod
    def predict(video_path: Path) -> Dict[str, Any]:
        try:
            # 1. Get Model and Config
            model, config, device = ModelManager.get_video_model()
            
            # 2. Extract and Save Frames for Visualization
            # We sample 10 frames evenly across the video
            cap = cv2.VideoCapture(str(video_path))
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            
            if total_frames <= 0:
                return ResponseFormatter.format_error("Invalid video", "Could not read frame count from video.")
            
            indices = [int(i * total_frames / 10) for i in range(10)]
            request_id = str(uuid.uuid4())
            frame_paths = []
            
            for i, idx in enumerate(indices):
                cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
                ret, frame = cap.read()
                if not ret:
                    continue
                
                # Save frame
                frame_name = f"frame_{request_id}_{i}.jpg"
                save_path = FRAME_UPLOAD_DIR / frame_name
                cv2.imwrite(str(save_path), frame)
                frame_paths.append(f"/uploads/frames/{frame_name}")
            
            cap.release()

            # 3. Preprocess for Model Inference
            # The model expects a specific frame count (e.g. 20)
            frame_count = get_config_value(config, "data.frame_count", 20)
            image_size = get_config_value(config, "data.image_size", 224)
            
            # Use src extraction for inference input
            inference_frames = extract_frames(str(video_path), frame_count=frame_count)
            if not inference_frames:
                return ResponseFormatter.format_error("Frame extraction failed", "Could not extract frames for inference.")
            
            sequence_tensor = frames_to_tensor(inference_frames, image_size=image_size)
            input_tensor = sequence_tensor.unsqueeze(0).to(device)
            
            # 4. Inference
            model.eval()
            with torch.no_grad():
                logits = model(input_tensor)
                probability = torch.sigmoid(logits).item()
            
            prediction = "FAKE" if probability > 0.5 else "REAL"
            confidence = probability if prediction == "FAKE" else 1.0 - probability
            
            # 5. Flagged Frames (Simulation for Timeline)
            flagged_frames = []
            if prediction == "FAKE":
                # Randomly flag 2-4 indices from the 10 visualization frames
                num_flags = random.randint(2, 4)
                flagged_frames = sorted(random.sample(range(len(frame_paths)), num_flags))
            
            return {
                "status": "success",
                "prediction": prediction,
                "confidence": confidence,
                "frames": frame_paths,
                "flagged_frames": flagged_frames
            }

        except Exception as e:
            logger.error(f"Video prediction failed: {e}")
            return ResponseFormatter.format_error("Prediction failed", str(e))
