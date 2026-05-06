import base64
import cv2
import numpy as np
from PIL import Image
import io
from typing import Any, Dict

class ResponseFormatter:
    @staticmethod
    def ndarray_to_base64(array: np.ndarray) -> str:
        """
        Converts a numpy array (image) to a base64 PNG string.
        """
        try:
            if array is None:
                raise ValueError("Array is None")
                
            # Handle float arrays (0-1 range)
            if array.dtype != np.uint8:
                array = (array * 255).astype(np.uint8)
            
            # Ensure array is in a format PIL likes (H, W, C)
            if len(array.shape) == 2: # Grayscale
                img = Image.fromarray(array, mode='L')
            else: # Color
                img = Image.fromarray(array)
                
            buffered = io.BytesIO()
            img.save(buffered, format="PNG")
            img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
            return f"data:image/png;base64,{img_str}"
        except Exception as e:
            from app.core.config import logger
            logger.error(f"Base64 conversion failed: {e}")
            raise e

    @staticmethod
    def format_error(message: str, details: Any = None) -> Dict[str, Any]:
        return {
            "status": "error",
            "error": message,
            "details": details
        }

    @staticmethod
    def format_prediction(prediction: str, confidence: float, explainability: Dict[str, str] = None) -> Dict[str, Any]:
        response = {
            "status": "success",
            "prediction": prediction,
            "confidence": round(float(confidence), 4)
        }
        if explainability:
            response.update(explainability)
        return response
