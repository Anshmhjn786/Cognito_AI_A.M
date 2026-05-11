import os
import re
import uuid
import time
import requests
import yt_dlp
import instaloader
import ffmpeg
import exifread
from PIL import Image
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from pathlib import Path

from app.core.config import UPLOAD_DIR, logger

router = APIRouter()

class AnalyzeRequest(BaseModel):
    url: str

def route_url(url: str) -> str:
    if "youtube.com" in url or "youtu.be" in url:
        return "youtube"
    elif "instagram.com" in url:
        return "instagram"
    # Basic check for direct media links
    if re.search(r"\.(jpg|jpeg|png|webp|mp4|avi|mov|mkv)$", url, re.I):
        return "direct"
    return "unknown"

def download_youtube(url: str, output_path: str) -> Dict[str, Any]:
    cookies_path = "cookies.txt"
    ydl_opts = {
        'outtmpl': output_path,
        'quiet': True,
        'noplaylist': True,
        'no_warnings': True,
        'merge_output_format': 'mp4',
    }

    def attempt_download(use_cookies=False):
        current_opts = ydl_opts.copy()
        cookie_available = os.path.exists(cookies_path) and os.path.getsize(cookies_path) > 0
        
        if use_cookies and cookie_available:
            current_opts['cookiefile'] = cookies_path
            logger.info("Retrying YouTube download with cookies.txt")
        else:
            logger.info("Attempting YouTube download without cookies")
            
        try:
            with yt_dlp.YoutubeDL(current_opts) as ydl:
                ydl.download([url])
            return True
        except Exception as e:
            logger.warning(f"YouTube download attempt failed: {e}")
            return False

    # Respect rate limits
    time.sleep(2)

    # 1. Attempt without cookies
    if attempt_download(use_cookies=False):
        return {"status": "success", "platform": "youtube", "file_path": output_path}

    # 2. Attempt with cookies if available
    if os.path.exists(cookies_path) and os.path.getsize(cookies_path) > 0:
        time.sleep(2)
        if attempt_download(use_cookies=True):
            return {"status": "success", "platform": "youtube", "file_path": output_path}

    return {
        "status": "failed",
        "platform": "youtube",
        "reason": "YouTube video restricted or requires authentication"
    }

def download_instagram(url: str, output_dir: str) -> Dict[str, Any]:
    try:
        L = instaloader.Instaloader(
            dirname_pattern=output_dir, 
            download_videos=True, 
            download_video_thumbnails=False, 
            download_geotags=False, 
            download_comments=False, 
            save_metadata=False
        )
        
        # Optional session loading support
        # Note: session files would normally be managed via CLI or separate login utility
        session_file = Path("config/instagram_session")
        if session_file.exists():
            try:
                # We skip actual loading unless a username is provided/known
                # L.load_session_from_file("user", str(session_file))
                logger.info("Instagram session file found (loading skipped - username required)")
            except Exception as e:
                logger.warning(f"Could not prepare Instagram session: {e}")

        # Rate limit protection
        time.sleep(2)

        match = re.search(r"/(p|reels|reel)/([^/?#&]+)", url)
        if not match:
            return {"status": "failed", "platform": "instagram", "reason": "Invalid Instagram URL"}
        
        shortcode = match.group(2)
        post = instaloader.Post.from_shortcode(L.context, shortcode)
        L.download_post(post, target=output_dir)
        
        # Find the downloaded file
        media_files = [f for f in Path(output_dir).glob("*") if f.suffix.lower() in ['.jpg', '.jpeg', '.png', '.mp4']]
        if not media_files:
            return {"status": "failed", "platform": "instagram", "reason": "No media found in Instagram post"}
        
        return {"status": "success", "platform": "instagram", "file_path": str(media_files[0])}

    except Exception as e:
        logger.error(f"Instagram download failed: {e}")
        return {"status": "failed", "platform": "instagram", "reason": "Instagram content blocked or requires login"}

def download_direct(url: str, output_path: str) -> Dict[str, Any]:
    try:
        time.sleep(1)
        response = requests.get(url, stream=True, timeout=15)
        response.raise_for_status()
        with open(output_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        return {"status": "success", "platform": "direct", "file_path": output_path}
    except Exception as e:
        return {"status": "failed", "platform": "direct", "reason": f"Direct download failed: {str(e)}"}

def download_media(url: str, temp_dir: Path) -> Dict[str, Any]:
    platform = route_url(url)
    if platform == "youtube":
        return download_youtube(url, str(temp_dir / "youtube_video.mp4"))
    elif platform == "instagram":
        return download_instagram(url, str(temp_dir))
    elif platform == "direct":
        ext = url.split(".")[-1].split("?")[0]
        if not ext or len(ext) > 5: ext = "media"
        return download_direct(url, str(temp_dir / f"direct_media.{ext}"))
    else:
        return {"status": "failed", "platform": "unknown", "reason": "Unsupported URL format"}

def extract_metadata(file_path: str) -> Dict[str, Any]:
    metadata = {}
    ext = Path(file_path).suffix.lower()
    
    if ext in ['.jpg', '.jpeg', '.png', '.webp']:
        # Image metadata
        with open(file_path, 'rb') as f:
            tags = exifread.process_file(f)
            for tag in tags.keys():
                if tag not in ['JPEGThumbnail', 'TIFFThumbnail', 'Filename', 'EXIF MakerNote']:
                    metadata[tag] = str(tags[tag])
        
        # Pillow fallback/extra
        try:
            img = Image.open(file_path)
            metadata['format'] = img.format
            metadata['size'] = img.size
            if hasattr(img, 'info'):
                for k, v in img.info.items():
                    if isinstance(v, (str, int, float)):
                        metadata[f"info_{k}"] = v
        except Exception as e:
            logger.error(f"Pillow extraction failed: {e}")

    elif ext in ['.mp4', '.avi', '.mov', '.mkv']:
        # Video metadata using ffprobe
        try:
            probe = ffmpeg.probe(file_path)
            video_stream = next((stream for stream in probe['streams'] if stream['codec_type'] == 'video'), None)
            if video_stream:
                metadata['codec'] = video_stream.get('codec_name')
                metadata['width'] = video_stream.get('width')
                metadata['height'] = video_stream.get('height')
                metadata['avg_frame_rate'] = video_stream.get('avg_frame_rate')
                metadata['duration'] = video_stream.get('duration')
                metadata['bit_rate'] = video_stream.get('bit_rate')
                metadata['encoder'] = video_stream.get('tags', {}).get('encoder') or video_stream.get('tags', {}).get('handler_name')
            
            metadata['format_name'] = probe['format'].get('format_name')
            metadata['format_long_name'] = probe['format'].get('format_long_name')
            
            # Check for FFmpeg/Lavf markers in format tags
            tags = probe['format'].get('tags', {})
            for k, v in tags.items():
                metadata[f"tag_{k}"] = v
        except Exception as e:
            logger.error(f"FFmpeg extraction failed: {e}")

    return metadata

def analyze_metadata(metadata: Dict[str, Any]) -> Dict[str, Any]:
    prediction = "REAL"
    explanation = []
    confidence = 0.5 # Default neutral

    meta_str = str(metadata).lower()

    # Rule-based detection
    ai_markers = ["stable diffusion", "midjourney", "dalle", "dall-e", "adobe firefly", "generative ai"]
    for marker in ai_markers:
        if marker in meta_str:
            prediction = "AI-GENERATED"
            explanation.append(f"Detected AI software marker: '{marker}' in metadata.")
            confidence = 0.95
            break

    # Suspicious markers
    suspicious_markers = ["ffmpeg", "lavf", "opencv", "moviepy"]
    if prediction == "REAL":
        for marker in suspicious_markers:
            if marker in meta_str:
                prediction = "SUSPICIOUS"
                explanation.append(f"Found encoding tool marker: '{marker}'. This might indicate the media was re-processed or generated via script.")
                confidence = 0.7
                break

    if not explanation:
        explanation.append("No common AI-generation markers found in metadata. Media appears to be authentic or stripped of metadata.")
        prediction = "REAL"
        confidence = 0.5

    return {
        "prediction": prediction,
        "explanation": " ".join(explanation),
        "confidence": confidence
    }

@router.post("/analyze")
async def analyze_url(request: AnalyzeRequest):
    temp_dir = Path(UPLOAD_DIR) / f"temp_{uuid.uuid4()}"
    temp_dir.mkdir(parents=True, exist_ok=True)
    
    try:
        # Unified download flow
        download_result = download_media(request.url, temp_dir)
        
        if download_result["status"] == "failed":
            return {
                "status": "failed",
                "platform": download_result.get("platform", "unknown"),
                "error": download_result.get("reason", "Download failed")
            }

        file_path = download_result["file_path"]
        if not file_path or not os.path.exists(file_path):
            raise HTTPException(status_code=500, detail="Downloaded file not found")

        # Analysis flow
        metadata = extract_metadata(file_path)
        result = analyze_metadata(metadata)
        
        return {
            "status": "success",
            "platform": download_result["platform"],
            "prediction": result["prediction"],
            "confidence": result["confidence"],
            "explanation": result["explanation"],
            "metadata_detected": len(metadata) > 0,
            "metadata": metadata
        }

    except Exception as e:
        logger.error(f"Analysis failed: {e}", exc_info=True)
        return {"status": "error", "message": str(e)}
    finally:
        try:
            import shutil
            shutil.rmtree(temp_dir)
        except:
            pass
