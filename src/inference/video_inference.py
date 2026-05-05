from typing import Any, Dict

import numpy as np

from src.data.preprocessing import preprocess_image_array, tensor_to_batch
from src.inference.image_inference import (image_inference,
                                           load_inference_model,
                                           predict_image_tensor)
from src.utils.config import get_config_value, load_config
from src.utils.helpers import extract_frames
from src.utils.logger import get_logger

logger = get_logger("video_inference")


def video_inference(video_path: str) -> Dict[str, Any]:
    """
    Modular video inference supporting frame-based and future LSTM modes.
    Returns standardized prediction and visualization for the most suspicious frame.
    """
    config = load_config("configs/video_config.yaml")
    mode = get_config_value(config, ["video.mode"], "frame")
    max_frames = get_config_value(config, ["video.max_frames"], 20)

    if mode == "lstm":
        # "This CNN+LSTM pipeline is for academic/research use and not used in production deployment."
        logger.warning("CNN+LSTM mode selected. This pipeline is for academic/research use and not used in production deployment.")
        # For future research, using a placeholder return
        return {
            "label": "research_only",
            "confidence": 0.0,
            "status": "CNN+LSTM pipeline is for academic use and not production ready.",
        }

    # MODE 1: FRAME-BASED (DEFAULT)
    logger.info(f"Starting frame-based inference for: {video_path}")
    # extract_frames now returns a list of resized RGB frames
    frames = extract_frames(video_path, max_frames=max_frames)
    
    if not frames:
        logger.error(f"Failed to extract frames from {video_path}")
        return {"type": "video", "label": "error", "confidence": 0.0, "frames_analyzed": 0}

    _, device = load_inference_model()
    confidences = []
    suspicious_frame = None
    max_fake_prob = -1.0

    for i, frame in enumerate(frames):
        # Lightweight prediction inside the loop
        # Preprocessing: frames are already resized to 224 and RGB
        tensor = preprocess_image_array(frame, image_size=224, input_format="rgb")
        batch = tensor_to_batch(tensor, device)
        
        fake_prob = predict_image_tensor(batch)
        confidences.append(fake_prob)

        # Track the most suspicious frame (highest fake probability)
        if fake_prob > max_fake_prob:
            max_fake_prob = fake_prob
            suspicious_frame = frame
        
        logger.debug(f"Frame {i+1}/{len(frames)} - Fake Prob: {fake_prob:.4f}")

    # Aggregate results: Mean of confidence scores
    avg_fake_prob = float(np.mean(confidences))
    label = "fake" if avg_fake_prob > 0.5 else "real"
    confidence = avg_fake_prob if label == "fake" else 1.0 - avg_fake_prob

    # Generate heatmap ONLY for the most suspicious frame (optional, enabled)
    heatmap_path = None
    if suspicious_frame is not None:
        logger.info(f"Generating heatmap for most suspicious frame (fake_prob={max_fake_prob:.4f})")
        image_res = image_inference(suspicious_frame, input_format="rgb")
        heatmap_path = image_res.get("heatmap_path")

    result = {
        "type": "video",
        "label": label,
        "confidence": float(confidence),
        "frames_analyzed": len(frames),
        "heatmap_path": heatmap_path,
    }

    logger.info(f"Video Inference Result: {label} ({confidence:.4f}) over {len(frames)} frames")
    return result
