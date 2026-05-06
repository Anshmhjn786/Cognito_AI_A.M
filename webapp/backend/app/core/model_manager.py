import torch
from pathlib import Path
from typing import Dict, Any, Optional
import yaml
from app.core.config import IMAGE_MODEL_CONFIG, VIDEO_MODEL_CONFIG, logger

# We need to import the loaders from src
import sys
import os

# Ensure src is in path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.append(str(PROJECT_ROOT))

from src.models.image_model import load_image_model
from src.models.video_model import load_video_model
from src.utils.config import load_config, get_config_value

class ModelManager:
    _instances: Dict[str, Any] = {}

    @classmethod
    def get_image_model(cls):
        if "image" not in cls._instances:
            logger.info("Loading Image Model...")
            config = load_config(str(IMAGE_MODEL_CONFIG))
            model_path = get_config_value(config, "paths.model_path", "models/image/best_model.pth")
            model_name = get_config_value(config, "model.name", "efficientnet_b0")
            device = "cuda" if torch.cuda.is_available() else "cpu"
            
            # Resolve relative model path
            abs_model_path = PROJECT_ROOT / model_path
            if not abs_model_path.exists():
                logger.warning(f"Model file not found at {abs_model_path}, using pretrained backbone.")
                abs_model_path = None
            
            cls._instances["image"] = load_image_model(
                checkpoint_path=abs_model_path,
                device=device,
                model_name=model_name
            )
            cls._instances["image_config"] = config
            cls._instances["image_device"] = device
        return cls._instances["image"], cls._instances["image_config"], cls._instances["image_device"]

    @classmethod
    def get_video_model(cls):
        if "video" not in cls._instances:
            logger.info("Loading Video Model...")
            config = load_config(str(VIDEO_MODEL_CONFIG))
            model_path = get_config_value(config, "paths.model_path", "models/video/best_model.pth")
            device = "cuda" if torch.cuda.is_available() else "cpu"
            
            # Resolve relative model path
            abs_model_path = PROJECT_ROOT / model_path
            if not abs_model_path.exists():
                logger.warning(f"Model file not found at {abs_model_path}, using default architecture.")
                abs_model_path = None

            cls._instances["video"] = load_video_model(
                checkpoint_path=abs_model_path,
                device=device
            )
            cls._instances["video_config"] = config
            cls._instances["video_device"] = device
        return cls._instances["video"], cls._instances["video_config"], cls._instances["video_device"]
