import base64
import cv2
import numpy as np
from PIL import Image
import io
from typing import Any, Dict

class ResponseFormatter:
    @staticmethod
    def ndarray_to_base64(array: np.ndarray, quality: int = 80) -> str:
        """
        Converts a numpy array (image) to a compressed base64 string.
        """
        try:
            # Convert to PIL Image
            if array.dtype != np.uint8:
                array = (array * 255).astype(np.uint8)
            
            img = Image.fromarray(array)
            buffered = io.BytesIO()
            # Compress as JPEG
            img.save(buffered, format="JPEG", quality=quality)
            img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
            return f"data:image/jpeg;base64,{img_str}"
        except Exception as e:
            return ""

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
