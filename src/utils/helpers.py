import random
from pathlib import Path
from typing import Iterable, Union

import numpy as np
import torch


def get_device(preferred: str = "auto") -> torch.device:
    """Return CUDA when available unless a concrete device is requested."""
    if preferred and preferred != "auto":
        if preferred == "cuda" and not torch.cuda.is_available():
            print("[DEBUG][helpers] CUDA requested but unavailable; falling back to CPU.")
            return torch.device("cpu")
        device = torch.device(preferred)
    else:
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    print(f"[DEBUG][helpers] Using device: {device}")
    return device


def ensure_dir(path: Union[str, Path]) -> Path:
    directory = Path(path)
    directory.mkdir(parents=True, exist_ok=True)
    print(f"[DEBUG][helpers] Ensured directory exists: {directory.resolve()}")
    return directory


def set_seed(seed: int = 42) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)
    print(f"[DEBUG][helpers] Random seed set to {seed}")


def count_items(items: Iterable[object]) -> int:
    return sum(1 for _ in items)


def extract_frames(video_path: Union[str, Path], max_frames: int = 20) -> list:
    """Uniformly extract and resize frames from a .mp4 video file."""
    import cv2
    path = str(Path(video_path).resolve())
    cap = cv2.VideoCapture(path)
    if not cap.isOpened():
        print(f"[ERROR][helpers] Could not open video: {path}")
        return []

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if total_frames <= 0:
        print(f"[ERROR][helpers] Video has no frames: {path}")
        cap.release()
        return []

    # Uniform sampling across video
    indices = np.linspace(0, total_frames - 1, min(max_frames, total_frames), dtype=int)
    print(f"[DEBUG][helpers] Extracting {len(indices)} frames from total={total_frames}")

    frames = []
    for idx in indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
        success, frame = cap.read()
        if success:
            # Resize to 224x224 as required by image model
            frame_resized = cv2.resize(frame, (224, 224), interpolation=cv2.INTER_AREA)
            # Convert BGR (OpenCV default) to RGB
            frames.append(cv2.cvtColor(frame_resized, cv2.COLOR_BGR2RGB))
        else:
            print(f"[WARNING][helpers] Failed to read frame at index {idx}")

    cap.release()
    return frames
