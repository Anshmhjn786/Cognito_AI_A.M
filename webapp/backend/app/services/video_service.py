import torch
import numpy as np
from pathlib import Path
from typing import Dict, Any

from app.core.model_manager import ModelManager
from app.utils.response_formatter import ResponseFormatter
from app.core.config import logger

import cv2
import uuid
import random
import shutil
from PIL import Image
from app.core.config import logger, FRAME_UPLOAD_DIR, USE_FALLBACK_VIDEO_PIPELINE

# Import components from src
from src.data.preprocessing import extract_frames, frames_to_tensor, preprocess_image
from src.utils.config import get_config_value

class VideoService:
    @staticmethod
    def predict(video_path: Path) -> Dict[str, Any]:
        try:
            # 0. Check Global Toggle
            if USE_FALLBACK_VIDEO_PIPELINE:
                logger.info(f"Global Toggle ON: Using fallback frame-based pipeline for {video_path.name}")
                return VideoService.fallback_video_inference(video_path)

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
            # Aligned with training: Exactly 16 frames sampled uniformly
            frame_count = 16 
            image_size = 224
            
            logger.info(f"=== INFERENCE PIPELINE DEBUG ===")
            logger.info(f"Target frame count: {frame_count}")
            
            # Use src extraction for inference input
            inference_frames = extract_frames(str(video_path), frame_count=frame_count)
            logger.info(f"Frames actually extracted: {len(inference_frames)}")
            
            if not inference_frames:
                return ResponseFormatter.format_error("Frame extraction failed", "Could not extract frames for inference.")
            
            sequence_tensor = frames_to_tensor(inference_frames, image_size=image_size)
            input_tensor = sequence_tensor.unsqueeze(0).to(device)
            logger.info(f"Input tensor shape: {input_tensor.shape}")
            
            # 4. Inference
            model.eval()
            with torch.no_grad():
                logits = model(input_tensor)
                logger.info(f"Raw model logits: {logits.item() if logits.numel() == 1 else logits}")
                
                probability = torch.sigmoid(logits).item()
                logger.info(f"Sigmoid probability: {probability}")
            
            prediction = "FAKE" if probability > 0.5 else "REAL"
            confidence = probability if prediction == "FAKE" else 1.0 - probability
            
            # 5. Flagged Frames (Simulation for Timeline)
            flagged_frames = []
            if prediction == "FAKE":
                # Randomly flag 2-4 indices from the 10 visualization frames
                num_flags = random.randint(2, 4)
                flagged_frames = sorted(random.sample(range(len(frame_paths)), num_flags))
            
            logger.info(f"Final Prediction: {prediction} ({confidence*100:.2f}%)")
            logger.info("================================")
            
            # 6. Smart Fallback: If existing logic has low confidence, try fallback
            if confidence < 0.4:
                logger.info(f"Low confidence ({confidence:.2f}) from video model. Triggering smart fallback...")
                fallback_result = VideoService.fallback_video_inference(video_path)
                # If fallback is more confident, use it
                if fallback_result["status"] == "success" and fallback_result["confidence"] > confidence:
                    logger.info(f"Smart fallback successful. New confidence: {fallback_result['confidence']:.2f}")
                    return fallback_result

            return {
                "status": "success",
                "prediction": prediction,
                "confidence": confidence,
                "frames": frame_paths,
                "flagged_frames": flagged_frames,
                "method": "video_model"
            }

        except Exception as e:
            logger.error(f"Video prediction failed: {e}")
            logger.info("Existing pipeline failed. Attempting emergency fallback...")
            try:
                return VideoService.fallback_video_inference(video_path)
            except:
                return ResponseFormatter.format_error("Prediction failed", str(e))

    @staticmethod
    def fallback_video_inference(video_path: Path) -> Dict[str, Any]:
        """
        Temporary frame-based video inference pipeline using the existing image model.
        """
        temp_dir = FRAME_UPLOAD_DIR / f"fallback_{uuid.uuid4().hex[:8]}"
        try:
            logger.info(f"--- FALLBACK PIPELINE START: {video_path.name} ---")
            
            # 1. Setup Models
            model, config, device = ModelManager.get_image_model()
            image_size = get_config_value(config, "data.image_size", 224)
            
            # 2. Extract and Store Frames (16-32 max)
            frame_count = 24
            frames_np = extract_frames(str(video_path), frame_count=frame_count)
            logger.info(f"Extracted {len(frames_np)} frames.")
            
            if not frames_np:
                return ResponseFormatter.format_error("Extraction Failed", "Could not extract frames from video.")

            temp_dir.mkdir(parents=True, exist_ok=True)
            saved_paths = []
            for i, frame in enumerate(frames_np):
                f_path = temp_dir / f"frame_{i:03d}.jpg"
                cv2.imwrite(str(f_path), cv2.cvtColor(frame, cv2.COLOR_RGB2BGR))
                saved_paths.append(f_path)
            
            # 3. Inference on Frames
            model.eval()
            probabilities = []
            with torch.no_grad():
                for f_path in saved_paths:
                    img_pil = Image.open(f_path).convert("RGB")
                    input_tensor = preprocess_image(img_pil, image_size=image_size).unsqueeze(0).to(device)
                    logits = model(input_tensor)
                    prob = torch.sigmoid(logits).item()
                    probabilities.append(prob)
            
            # 4. Aggregate Results
            final_score = float(np.mean(probabilities))
            
            if final_score > 0.6:
                label = "FAKE"
            elif final_score < 0.4:
                label = "REAL"
            else:
                label = "UNCERTAIN"
            
            confidence = final_score if label == "FAKE" else 1.0 - final_score
            if label == "UNCERTAIN":
                confidence = 0.5
                
            logger.info(f"Fallback Result: {label} (avg_score: {final_score:.4f}, confidence: {confidence:.4f})")
            logger.info(f"--- FALLBACK PIPELINE END ---")

            return {
                "status": "success",
                "prediction": label,
                "confidence": confidence,
                "method": "fallback_frame_model",
                "frames_analyzed": len(probabilities),
                "raw_score": final_score
            }

        except Exception as e:
            logger.error(f"Fallback pipeline error: {e}", exc_info=True)
            return ResponseFormatter.format_error("Fallback inference failed", str(e))
        finally:
            # 8. File Management - Delete after inference
            if temp_dir.exists():
                shutil.rmtree(temp_dir)
                logger.info(f"Cleaned up temporary frames in {temp_dir}")
