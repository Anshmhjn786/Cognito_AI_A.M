import torch
from pathlib import Path
from typing import Dict, Any, Optional
import yaml
from app.core.config import IMAGE_MODEL_CONFIG, VIDEO_MODEL_CONFIG, IMAGE_MODEL_PATH, VIDEO_MODEL_PATH, logger

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
            model_name = get_config_value(config, "model.name", "efficientnet_b0")
            device = "cuda" if torch.cuda.is_available() else "cpu"
            
            # Use absolute path and check existence
            if not os.path.exists(IMAGE_MODEL_PATH):
                logger.error(f"CRITICAL: Image Model not found at {IMAGE_MODEL_PATH}")
                raise FileNotFoundError(f"Image Model file missing: {IMAGE_MODEL_PATH}")
            
            # 1. Initialize model without weights first
            model = load_image_model(
                checkpoint_path=None, # Don't load weights yet to avoid crash
                device=device,
                model_name=model_name
            )

            # 2. Manually load and remap weights
            logger.info(f"Remapping and loading weights from {IMAGE_MODEL_PATH}...")
            state_dict = torch.load(IMAGE_MODEL_PATH, map_location=device)
            # Handle cases where checkpoint is a dict or just state_dict
            state_dict = state_dict.get("model_state_dict", state_dict)
            
            new_state_dict = {}
            for key, value in state_dict.items():
                if key.startswith("features"):
                    new_key = "backbone." + key
                elif key.startswith("classifier"):
                    new_key = "backbone." + key
                else:
                    new_key = key
                new_state_dict[new_key] = value

            # 3. Load remapped weights safely
            model.load_state_dict(new_state_dict, strict=False)
            logger.info("Model weights remapped and loaded successfully")
            
            cls._instances["image"] = model
            cls._instances["image_config"] = config
            cls._instances["image_device"] = device
        return cls._instances["image"], cls._instances["image_config"], cls._instances["image_device"]

    @classmethod
    def get_video_model(cls):
        if "video" not in cls._instances:
            logger.info("Loading Video Model...")
            config = load_config(str(VIDEO_MODEL_CONFIG))
            device = "cuda" if torch.cuda.is_available() else "cpu"
            
            # Use absolute path and check existence
            if not os.path.exists(VIDEO_MODEL_PATH):
                logger.error(f"CRITICAL: Video Model not found at {VIDEO_MODEL_PATH}")
                raise FileNotFoundError(f"Video Model file missing: {VIDEO_MODEL_PATH}")

            # 1. Initialize model with config parameters
            hidden_dim = get_config_value(config, "model.hidden_dim", 256)
            model = load_video_model(
                checkpoint_path=None, 
                device=device,
                hidden_dim=hidden_dim
            )

            # 2. Load weights from file
            logger.info(f"Loading video weights from {VIDEO_MODEL_PATH}...")
            state_dict = torch.load(VIDEO_MODEL_PATH, map_location=device)
            state_dict = state_dict.get("model_state_dict", state_dict)
            
            # 3. Enforce strict match to ensure architecture alignment
            try:
                model.load_state_dict(state_dict, strict=True)
                logger.info("Video model weights loaded perfectly (Strict Match)")
            except Exception as e:
                logger.error(f"CRITICAL: Video model architecture mismatch: {str(e)}")
                raise RuntimeError(f"Video weights incompatible with model architecture: {str(e)}")
            
            cls._instances["video"] = model
            cls._instances["video_config"] = config
            cls._instances["video_device"] = device
        return cls._instances["video"], cls._instances["video_config"], cls._instances["video_device"]
