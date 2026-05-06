import cv2
import numpy as np
import torch
from pathlib import Path
from typing import List, Optional, Tuple, Union
from PIL import Image
from torchvision import transforms

IMAGENET_MEAN = (0.485, 0.456, 0.406)
IMAGENET_STD = (0.229, 0.224, 0.225)


def get_val_transforms(image_size: int = 224) -> transforms.Compose:
    """Standard normalization and resizing for inference and validation."""
    return transforms.Compose([
        transforms.Resize((image_size, image_size)),
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
    ])


def preprocess_image(
    image: Union[np.ndarray, Image.Image], 
    image_size: int = 224, 
    input_format: str = "rgb"
) -> torch.Tensor:
    """
    Preprocess a single image into a model-ready tensor.
    
    Args:
        image: Numpy array or PIL Image.
        image_size: Target size for resizing.
        input_format: 'rgb' or 'bgr' (if numpy).
        
    Returns:
        A normalized torch.Tensor of shape [3, H, W].
    """
    if isinstance(image, np.ndarray):
        if input_format.lower() == "bgr":
            image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        pil_image = Image.fromarray(image.astype(np.uint8)).convert("RGB")
    else:
        pil_image = image.convert("RGB")

    transform = get_val_transforms(image_size)
    return transform(pil_image)


def extract_frames(
    video_path: Union[str, Path], 
    frame_count: int = 20, 
    image_size: Optional[int] = None
) -> List[np.ndarray]:
    """
    Extract a fixed number of frames from a video file using uniform sampling.
    
    Args:
        video_path: Path to the video file.
        frame_count: Number of frames to extract.
        image_size: Optional size to resize frames to.
        
    Returns:
        List of frames as RGB numpy arrays.
    """
    path = str(Path(video_path).resolve())
    cap = cv2.VideoCapture(path)
    if not cap.isOpened():
        print(f"[ERROR] Could not open video: {path}")
        return []

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if total_frames <= 0:
        cap.release()
        return []

    # Uniformly sample frame indices
    indices = np.linspace(0, total_frames - 1, min(frame_count, total_frames), dtype=int)
    
    frames = []
    for idx in indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
        success, frame = cap.read()
        if success:
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            if image_size:
                frame_rgb = cv2.resize(frame_rgb, (image_size, image_size), interpolation=cv2.INTER_AREA)
            frames.append(frame_rgb)
    
    cap.release()
    return frames


def frames_to_tensor(frames: List[np.ndarray], image_size: int = 224) -> torch.Tensor:
    """
    Convert a list of RGB frames into a sequence tensor [T, C, H, W].
    """
    tensors = [preprocess_image(f, image_size=image_size) for f in frames]
    if not tensors:
        return torch.empty(0)
    return torch.stack(tensors)
