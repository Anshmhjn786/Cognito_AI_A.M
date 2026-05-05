from pathlib import Path
from typing import Any, Dict, Union

import cv2
import numpy as np

from src.inference.image_inference import image_inference
from src.inference.video_inference import video_inference
from src.utils.logger import get_logger

logger = get_logger("main_inference")


def main_inference(file: Union[str, Path, np.ndarray], mode: str = "image") -> Dict[str, Any]:
    """
    Standardized entry point for deepfake detection.
    
    Args:
        file: Image array (numpy) or path to image/video file (str/Path).
        mode: "image" or "video".
    
    Returns:
        Dictionary with label, confidence, and visualization path.
    """
    logger.info(f"Main inference started. Mode: {mode}")

    if mode == "image":
        # Handle case where file is a path
        if isinstance(file, (str, Path)):
            logger.debug(f"Loading image from path: {file}")
            img = cv2.imread(str(file))
            if img is None:
                raise ValueError(f"Could not read image from {file}")
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            return image_inference(img, input_format="rgb")
        
        # Handle case where file is already an array
        elif isinstance(file, np.ndarray):
            # We assume the array is BGR if coming from cv2, 
            # but if it's coming from a library that uses RGB, we need to be careful.
            # Standard practice in this project seems to be BGR for arrays passed to inference.py.
            # However, my image_inference defaults to RGB. 
            # I'll check src/inference.py's _ensure_rgb to see what it did.
            # It converted BGR to RGB.
            return image_inference(file, input_format="bgr")
        
        else:
            raise TypeError(f"Unsupported type for image inference: {type(file)}")

    elif mode == "video":
        if not isinstance(file, (str, Path)):
            raise TypeError(f"Video inference requires a file path (str or Path), got {type(file)}")
        return video_inference(str(file))

    else:
        logger.error(f"Invalid inference mode: {mode}")
        raise ValueError(f"Invalid mode: {mode}. Supported: 'image', 'video'")
