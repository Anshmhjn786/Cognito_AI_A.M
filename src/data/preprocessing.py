from pathlib import Path
from typing import Tuple, Union

import cv2
import numpy as np
import torch
from PIL import Image
from torchvision import transforms


IMAGENET_MEAN = (0.485, 0.456, 0.406)
IMAGENET_STD = (0.229, 0.224, 0.225)
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tif", ".tiff"}


def train_transforms(image_size: int = 224) -> transforms.Compose:
    print(f"[DEBUG][preprocessing] Building train transforms. image_size={image_size}")
    return transforms.Compose(
        [
            transforms.Resize((image_size, image_size)),
            transforms.RandomHorizontalFlip(p=0.5),
            transforms.ColorJitter(brightness=0.1, contrast=0.1, saturation=0.1),
            transforms.ToTensor(),
            transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
        ]
    )


def val_transforms(image_size: int = 224) -> transforms.Compose:
    print(f"[DEBUG][preprocessing] Building val/inference transforms. image_size={image_size}")
    return transforms.Compose(
        [
            transforms.Resize((image_size, image_size)),
            transforms.ToTensor(),
            transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
        ]
    )


def load_pil_image(image_path: Union[str, Path]) -> Image.Image:
    """Load an image as RGB PIL for transforms."""
    path = Path(image_path)
    image = Image.open(path).convert("RGB")
    print(f"[DEBUG][preprocessing] Loaded image={path} size={image.size}")
    return image


def preprocess_pil_image(image: Image.Image, image_size: int = 224) -> torch.Tensor:
    tensor = val_transforms(image_size=image_size)(image.convert("RGB"))
    print(f"[DEBUG][preprocessing] Preprocessed PIL tensor shape={tuple(tensor.shape)}")
    return tensor


def preprocess_image_array(
    image: np.ndarray,
    image_size: int = 224,
    input_format: str = "bgr",
) -> torch.Tensor:
    """Preprocess a numpy image from Flask/OpenCV into a model-ready tensor."""
    if image is None:
        raise ValueError("Input image cannot be None.")

    image = np.asarray(image)
    if image.ndim == 2:
        rgb = cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)
    elif image.ndim == 3 and image.shape[2] == 4:
        rgb = cv2.cvtColor(image, cv2.COLOR_BGRA2RGB if input_format == "bgr" else cv2.COLOR_RGBA2RGB)
    elif image.ndim == 3 and image.shape[2] == 3:
        rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB) if input_format == "bgr" else image
    else:
        raise ValueError(f"Unsupported image shape: {image.shape}")

    pil_image = Image.fromarray(rgb.astype(np.uint8))
    tensor = preprocess_pil_image(pil_image, image_size=image_size)
    print(f"[DEBUG][preprocessing] Array input shape={image.shape}; tensor shape={tuple(tensor.shape)}")
    return tensor


def tensor_to_batch(tensor: torch.Tensor, device: Union[str, torch.device]) -> torch.Tensor:
    batch = tensor.unsqueeze(0).to(device)
    print(f"[DEBUG][preprocessing] Batch tensor shape={tuple(batch.shape)} device={batch.device}")
    return batch


def resize_image(image: np.ndarray, size: Tuple[int, int] = (224, 224)) -> np.ndarray:
    return cv2.resize(image, size, interpolation=cv2.INTER_AREA)
