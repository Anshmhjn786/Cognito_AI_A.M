from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException
from app.services.video_service import VideoService
from app.utils.file_handler import FileHandler
from app.utils.response_formatter import ResponseFormatter
from app.core.config import logger

router = APIRouter()

@router.post("/predict-video")
def predict_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    """
    Predict if a video is REAL or FAKE using temporal analysis.
    """
    logger.info(f"Received video prediction request: {file.filename}")
    
    # 1. Validate
    FileHandler.validate_file(file, is_video=True)
    
    # 2. Save file temporarily
    import shutil
    from pathlib import Path
    import uuid
    from app.core.config import VIDEO_UPLOAD_DIR
    
    extension = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{extension}"
    file_path = VIDEO_UPLOAD_DIR / unique_filename
    
    try:
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        logger.error(f"Failed to save file: {e}")
        raise HTTPException(status_code=500, detail="Could not save uploaded file.")
    
    # 3. Predict
    result = VideoService.predict(file_path)
    
    # 4. Cleanup in background
    background_tasks.add_task(FileHandler.cleanup_file, file_path)
    
    return result
