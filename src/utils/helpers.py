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
