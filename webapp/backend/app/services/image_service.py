import torch
import numpy as np
from PIL import Image
from pathlib import Path
from typing import Dict, Any

from app.core.model_manager import ModelManager
from app.utils.response_formatter import ResponseFormatter
from app.core.config import logger

# Import components from src
from src.data.preprocessing import preprocess_image
from src.explainability.gradcam import GradCAM, apply_heatmap
from src.explainability.frequency_analysis import analyze_frequency_artifacts
from src.utils.config import get_config_value

class ImageService:
    @staticmethod
    def predict(image_path: Path) -> Dict[str, Any]:
        try:
            # 1. Get Model and Config
            model, config, device = ModelManager.get_image_model()
            
            # 2. Preprocess
            image_pil = Image.open(image_path).convert("RGB")
            image_np = np.array(image_pil)
            image_size = get_config_value(config, "data.image_size", 224)
            input_tensor = preprocess_image(image_pil, image_size=image_size).unsqueeze(0).to(device)
            
            # 3. Inference
            model.eval()
            with torch.no_grad():
                logits = model(input_tensor)
                probability = torch.sigmoid(logits).item()
            
            prediction = "FAKE" if probability > 0.5 else "REAL"
            confidence = probability if prediction == "FAKE" else 1.0 - probability
            
            # 4. Explainability
            explainability_data = {}
            
            # Grad-CAM
            try:
                grad_cam = GradCAM(model)
                # Need to enable gradients for Grad-CAM
                input_tensor.requires_grad = True
                heatmap = grad_cam.generate(input_tensor)
                grad_cam.remove_hooks()
                
                # Apply heatmap to original image (resized)
                image_resized = cv2.resize(image_np, (image_size, image_size))
                overlay = apply_heatmap(image_resized, heatmap)
                
                explainability_data["gradcam"] = ResponseFormatter.ndarray_to_base64(overlay)
                explainability_data["heatmap"] = ResponseFormatter.ndarray_to_base64(heatmap)
            except Exception as e:
                logger.error(f"Grad-CAM failed: {e}")

            # Frequency Analysis
            try:
                freq_results = analyze_frequency_artifacts(image_np)
                # We can't easily visualize this as an image in the same way, 
                # but we can return the magnitude spectrum if we want.
                # For now, let's just use the placeholder requirement
                explainability_data["frequency_map"] = "" # Placeholder or actual logic if needed
            except Exception as e:
                logger.error(f"Frequency analysis failed: {e}")

            return ResponseFormatter.format_prediction(
                prediction=prediction,
                confidence=confidence,
                explainability=explainability_data
            )

        except Exception as e:
            logger.error(f"Image prediction failed: {e}")
            return ResponseFormatter.format_error("Prediction failed", str(e))

# Need cv2 for resizing in explainability
import cv2
