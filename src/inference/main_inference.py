import argparse
from pathlib import Path
from typing import Dict, Any, Union
import numpy as np

from src.inference.image_inference import predict_image
from src.inference.video_inference import predict_video

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
VIDEO_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv"}


def main_inference(input_path: Union[str, Path]) -> Dict[str, Any]:
    """
    Main entry point for deepfake detection.
    Detects input type and routes to the appropriate pipeline.
    """
    path = Path(input_path)
    if not path.exists():
        return {"prediction": "ERROR", "confidence": 0.0, "message": f"File not found: {path}"}

    suffix = path.suffix.lower()
    
    if suffix in IMAGE_EXTENSIONS:
        return predict_image(path)
    elif suffix in VIDEO_EXTENSIONS:
        return predict_video(path)
    else:
        return {
            "prediction": "ERROR", 
            "confidence": 0.0, 
            "message": f"Unsupported file format: {suffix}"
        }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Deepfake Detection Inference")
    parser.add_argument("input", help="Path to image or video file")
    args = parser.parse_args()
    
    result = main_inference(args.input)
    print(result)
