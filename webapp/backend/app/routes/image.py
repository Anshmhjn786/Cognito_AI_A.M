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
    import cv2
    from app.core.config import IMAGE_UPLOAD_DIR
    
    # 2. Setup Filenames
    request_id = str(uuid.uuid4())
    extension = Path(file.filename).suffix
    original_filename = f"original_{request_id}{extension}"
    heatmap_filename = f"heatmap_{request_id}.png"
    gradcam_filename = f"gradcam_{request_id}.png"
    
    file_path = IMAGE_UPLOAD_DIR / original_filename
    heatmap_path = IMAGE_UPLOAD_DIR / heatmap_filename
    gradcam_path = IMAGE_UPLOAD_DIR / gradcam_filename
    
    # Ensure directory exists
    IMAGE_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    
    # 3. Save Original File
    try:
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        logger.error(f"Failed to save file: {e}")
        raise HTTPException(status_code=500, detail="Could not save uploaded file.")
    
    # 4. Run Prediction
    result = ImageService.predict(file_path)
    
    if result.get("status") != "success":
        raise HTTPException(status_code=500, detail=result.get("message", "Prediction failed"))

    # 5. Save explainability images
    explainability = result.get("explainability", {})
    
    try:
        if "heatmap" in explainability:
            cv2.imwrite(str(heatmap_path), explainability["heatmap"])
        if "gradcam" in explainability:
            cv2.imwrite(str(gradcam_path), explainability["gradcam"])
    except Exception as e:
        logger.error(f"Failed to save explainability images: {e}")

    # 6. Format Response according to Mandatory Contract
    response_dict = {
        "prediction": result["prediction"],
        "confidence": result["confidence"],
        "heatmap": f"/uploads/images/{heatmap_filename}",
        "gradcam": f"/uploads/images/{gradcam_filename}",
        "saved_image_path": f"/uploads/images/{original_filename}"
    }
    
    print("RETURNING:", response_dict)
    return response_dict
