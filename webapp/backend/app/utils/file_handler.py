import uuid
import shutil
import os
from pathlib import Path
from fastapi import UploadFile, HTTPException
from app.core.config import IMAGE_UPLOAD_DIR, VIDEO_UPLOAD_DIR, ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES, logger

class FileHandler:
    @staticmethod
    def validate_file(file: UploadFile, is_video: bool = False):
        allowed_types = ALLOWED_VIDEO_TYPES if is_video else ALLOWED_IMAGE_TYPES
        if file.content_type not in allowed_types:
            logger.warning(f"Invalid file type: {file.content_type}")
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid file type. Allowed: {', '.join(allowed_types)}"
            )

    @staticmethod
    async def save_file(file: UploadFile, is_video: bool = False) -> Path:
        target_dir = VIDEO_UPLOAD_DIR if is_video else IMAGE_UPLOAD_DIR
        extension = Path(file.filename).suffix
        unique_filename = f"{uuid.uuid4()}{extension}"
        file_path = target_dir / unique_filename
        
        try:
            with file_path.open("wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            logger.info(f"File saved: {file_path}")
            return file_path
        except Exception as e:
            logger.error(f"Failed to save file: {e}")
            raise HTTPException(status_code=500, detail="Could not save uploaded file.")

    @staticmethod
    def cleanup_file(file_path: Path):
        try:
            if file_path.exists():
                os.remove(file_path)
                logger.info(f"File cleaned up: {file_path}")
        except Exception as e:
            logger.error(f"Error during file cleanup: {e}")
