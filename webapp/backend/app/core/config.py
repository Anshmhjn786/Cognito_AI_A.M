import os
import logging
from pathlib import Path
from typing import List

# Base Directory
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Upload Settings
UPLOAD_DIR = BASE_DIR / "uploads"
IMAGE_UPLOAD_DIR = UPLOAD_DIR / "images"
VIDEO_UPLOAD_DIR = UPLOAD_DIR / "videos"

# Create directories if they don't exist
IMAGE_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
VIDEO_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# CORS Settings
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# Validation Settings
ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]
ALLOWED_VIDEO_TYPES = ["video/mp4", "video/mpeg", "video/quicktime", "video/x-msvideo"]

# Model Paths (Relative to project root)
PROJECT_ROOT = BASE_DIR.parent.parent
IMAGE_MODEL_CONFIG = PROJECT_ROOT / "configs" / "image_config.yaml"
VIDEO_MODEL_CONFIG = PROJECT_ROOT / "configs" / "video_config.yaml"

# Logging Configuration
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
logging.basicConfig(
    level=LOG_LEVEL,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(BASE_DIR / "backend.log")
    ]
)
logger = logging.getLogger("cognito-backend")
