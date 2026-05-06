from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException
from app.services.image_service import ImageService
from app.utils.file_handler import FileHandler
from app.utils.response_formatter import ResponseFormatter
from app.core.config import logger

router = APIRouter()

@router.post("/predict-image")
def predict_image(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    """
    Predict if an image is REAL or FAKE.
    Includes Grad-CAM and Heatmap visualizations.
    """
    logger.info(f"Received image prediction request: {file.filename}")
    
    # 1. Validate
    FileHandler.validate_file(file, is_video=False)
    
    # 2. Save file temporarily
    # Since save_file is async, we need to run it in the event loop or use await.
    # But this route is sync 'def'. FastAPI runs sync routes in a threadpool.
    # We can use 'import asyncio' to run the coroutine if needed, 
    # but it's better to just make the route 'async def' if we use await.
    # HOWEVER, the requirement said: "ensure endpoints are sync (def) or use run_in_threadpool".
    # If I use 'def', I can't 'await'. 
    
    # Let's make save_file sync in FileHandler or just use a helper.
    # Actually, saving a file is I/O, 'def' is fine if I don't use 'async' inside.
    
    # I'll modify FileHandler.save_file to have a sync version.
    
    # For now, let's assume I can call it. 
    # Wait, I'll just change the save_file to sync to be safer in 'def' routes.
    
    import shutil
    from pathlib import Path
    import uuid
    from app.core.config import IMAGE_UPLOAD_DIR
    
    extension = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{extension}"
    file_path = IMAGE_UPLOAD_DIR / unique_filename
    
    try:
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        logger.error(f"Failed to save file: {e}")
        raise HTTPException(status_code=500, detail="Could not save uploaded file.")
    
    # 3. Predict
    result = ImageService.predict(file_path)
    
    # 4. Cleanup in background
    background_tasks.add_task(FileHandler.cleanup_file, file_path)
    
    return result
