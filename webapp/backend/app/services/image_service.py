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
            
            # Grad-CAM and Heatmap
            try:
                grad_cam = GradCAM(model)
                # Need to enable gradients for Grad-CAM
                input_tensor.requires_grad = True
                cam_heatmap = grad_cam.generate(input_tensor)
                grad_cam.remove_hooks()
                
                # Apply heatmap to original image (resized)
                image_resized = cv2.resize(image_np, (image_size, image_size))
                overlay = apply_heatmap(image_resized, cam_heatmap)
                
                explainability_data["gradcam"] = overlay
                explainability_data["heatmap"] = cam_heatmap
                
                logger.info("GradCAM and Heatmap generated successfully")
            except Exception as e:
                logger.error(f"Explainability (Grad-CAM/Heatmap) failed: {e}")
                raise e

            # Frequency Analysis
            try:
                if image_np.ndim == 3:
                    gray = cv2.cvtColor(image_np, cv2.COLOR_RGB2GRAY)
                else:
                    gray = image_np

                # Compute FFT for visualization
                f = np.fft.fft2(gray)
                fshift = np.fft.fftshift(f)
                magnitude_spectrum = 20 * np.log(np.abs(fshift) + 1e-8)
                
                # Normalize for display
                mag_norm = cv2.normalize(magnitude_spectrum, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
                explainability_data["frequency_map"] = mag_norm
                
                # Still call src function for stats/consistency
                freq_stats = analyze_frequency_artifacts(image_np)
                logger.info(f"Frequency analysis generated successfully: {freq_stats}")
            except Exception as e:
                logger.error(f"Frequency analysis failed: {e}")
                raise e

            return {
                "status": "success",
                "prediction": prediction,
                "confidence": confidence,
                "explainability": explainability_data
            }

        except Exception as e:
            logger.error(f"Image prediction failed: {e}")
            return ResponseFormatter.format_error("Prediction failed", str(e))

# Need cv2 for resizing in explainability
import cv2
