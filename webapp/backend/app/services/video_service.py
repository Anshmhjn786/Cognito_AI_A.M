import torch
import numpy as np
from pathlib import Path
from typing import Dict, Any

from app.core.model_manager import ModelManager
from app.utils.response_formatter import ResponseFormatter
from app.core.config import logger, FRAME_UPLOAD_DIR

import cv2
import uuid

# Import components from src
from src.data.preprocessing import extract_frames, frames_to_tensor
from src.utils.config import get_config_value

class VideoService:
    @staticmethod
    def predict(video_path: Path) -> Dict[str, Any]:
        """
        Predict if a video is REAL or FAKE using the trained temporal model.
        Uses exactly 16 frames as per model training.
        """
        try:
            # 1. Get Model and Config from Manager (Loaded once globally)
            model, config, device = ModelManager.get_video_model()
            
            # 2. Extract Visualization Frames (10 frames for UI display)
            cap = cv2.VideoCapture(str(video_path))
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            
            if total_frames <= 0:
                logger.error(f"Invalid video file: {video_path}")
                return ResponseFormatter.format_error("Invalid video", "Could not read frame count from video.")
            
            vis_indices = [int(i * total_frames / 10) for i in range(10)]
            request_id = str(uuid.uuid4())
            frame_paths = []
            
            for i, idx in enumerate(vis_indices):
                cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
                ret, frame = cap.read()
                if not ret:
                    continue
                
                frame_name = f"frame_{request_id}_{i}.jpg"
                save_path = FRAME_UPLOAD_DIR / frame_name
                cv2.imwrite(str(save_path), frame)
                frame_paths.append(f"/uploads/frames/{frame_name}")
            
            cap.release()

            # 3. Preprocess for Model Inference (Exactly 16 frames)
            frame_count = 16 
            image_size = 224
            
            logger.info(f"Extracting {frame_count} frames for inference from {video_path.name}")
            inference_frames = extract_frames(str(video_path), frame_count=frame_count)
            
            if not inference_frames:
                logger.error(f"Inference frame extraction failed for {video_path.name}")
                return ResponseFormatter.format_error("Frame extraction failed", "Could not extract frames for inference.")
            
            sequence_tensor = frames_to_tensor(inference_frames, image_size=image_size)
            input_tensor = sequence_tensor.unsqueeze(0).to(device)
            
            # 4. Inference
            model.eval()
            with torch.no_grad():
                logits = model(input_tensor)
                probability = torch.sigmoid(logits).item()
                
            prediction = "FAKE" if probability > 0.7 else "REAL"
            confidence = (
                (probability - 0.7) / (1 - 0.7) if prediction == "FAKE"
                else (0.7 - probability) / 0.7
            )

            confidence = max(confidence, 0.5)
            
            logger.info(f"VIDEO INFERENCE RESULT: {prediction} (prob: {probability:.4f})")
            
            # 5. Return Clean Response
            return {
                "status": "success",
                "result": float(probability),
                "prediction": prediction,
                "confidence": float(confidence),
                "frames": frame_paths,
                "method": "trained_video_model"
            }

        except Exception as e:
            logger.error(f"Video prediction pipeline failed: {str(e)}", exc_info=True)
            return ResponseFormatter.format_error("Prediction error", str(e))
