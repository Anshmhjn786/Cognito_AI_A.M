import sys
from pathlib import Path

# 1. Path Setup: Add project root to sys.path to enable 'src' imports
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.routes import image, video
from app.core.config import ALLOWED_ORIGINS, logger
from app.utils.response_formatter import ResponseFormatter

# Initialize FastAPI
app = FastAPI(
    title="Cognito AI Backend",
    description="Backend API for Deepfake Detection and Explainability",
    version="1.0.0"
)

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Error Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content=ResponseFormatter.format_error("Internal Server Error", str(exc))
    )

# Include Routers
app.include_router(image.router, tags=["Image Detection"])
app.include_router(video.router, tags=["Video Detection"])

@app.get("/")
def health_check():
    return {"status": "online", "message": "Cognito AI Backend is running."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
