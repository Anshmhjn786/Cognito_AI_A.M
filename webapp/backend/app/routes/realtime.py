from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import torch
import base64
import numpy as np
import cv2
from io import BytesIO
from PIL import Image

from app.core.model_manager import ModelManager
from src.data.preprocessing import preprocess_image

router = APIRouter()

class RealtimeRequest(BaseModel):
    frames: List[str]  # List of 16 base64 encoded jpeg strings

@router.post("/predict-realtime")
async def predict_realtime(request: RealtimeRequest):
    try:
        if len(request.frames) < 16:
            raise HTTPException(status_code=400, detail="Buffer must contain exactly 16 frames")

        # 1. Load Model
        model, config, device = ModelManager.get_video_model()
        
        # 2. Process base64 frames to tensor
        processed_tensors = []
        for b64_frame in request.frames:
            # Remove header if present
            if "," in b64_frame:
                b64_frame = b64_frame.split(",")[1]
            
            # Decode
            img_bytes = base64.b64decode(b64_frame)
            img = Image.open(BytesIO(img_bytes)).convert("RGB")
            
            # Use src preprocessing
            tensor = preprocess_image(img, image_size=224)
            processed_tensors.append(tensor)
        
        # 3. Stack into [1, 16, 3, 224, 224]
        input_tensor = torch.stack(processed_tensors).unsqueeze(0).to(device)
        
        # 4. Inference
        model.eval()
        with torch.no_grad():
            logits = model(input_tensor)
            probability = torch.sigmoid(logits).item()
        
        prediction = "FAKE" if probability > 0.5 else "REAL"
        confidence = probability if prediction == "FAKE" else 1.0 - probability
        
        return {
            "status": "success",
            "prediction": prediction,
            "confidence": confidence
        }

    except Exception as e:
        print(f"Realtime prediction failed: {e}")
        return {"status": "error", "message": str(e)}
