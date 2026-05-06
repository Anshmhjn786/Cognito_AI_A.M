import torch
from pathlib import Path
from typing import Callable, List, Optional, Tuple, Dict
from PIL import Image
from torch.utils.data import Dataset, DataLoader

from src.data.preprocessing import get_val_transforms, extract_frames, frames_to_tensor
from src.data.augmentation import get_train_transforms, get_video_train_transforms

LABEL_MAP = {"real": 0, "fake": 1}
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
VIDEO_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv"}


class ImageDataset(Dataset):
    """
    Dataset for single image deepfake detection.
    Expects folder structure: root/split/real/ and root/split/fake/
    """
    def __init__(self, root_dir: str, split: str = "train", transform: Optional[Callable] = None):
        self.split_dir = Path(root_dir) / split
        self.transform = transform
        self.samples = self._collect_samples()

    def _collect_samples(self) -> List[Tuple[Path, int]]:
        samples = []
        for label_name, label_idx in LABEL_MAP.items():
            class_dir = self.split_dir / label_name
            if not class_dir.exists():
                continue
            for img_path in class_dir.glob("*"):
                if img_path.suffix.lower() in IMAGE_EXTENSIONS:
                    samples.append((img_path, label_idx))
        return samples

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, int]:
        img_path, label = self.samples[idx]
        image = Image.open(img_path).convert("RGB")
        
        if self.transform:
            image = self.transform(image)
        else:
            # Default validation transform if none provided
            image = get_val_transforms()(image)
            
        return image, label


class VideoDataset(Dataset):
    """
    Dataset for video sequence deepfake detection.
    Expects folder structure: root/split/real/ and root/split/fake/
    Returns a tensor of shape [T, C, H, W] for each video.
    """
    def __init__(
        self, 
        root_dir: str, 
        split: str = "train", 
        transform: Optional[Callable] = None, 
        frame_count: int = 20,
        image_size: int = 224
    ):
        self.split_dir = Path(root_dir) / split
        self.transform = transform
        self.frame_count = frame_count
        self.image_size = image_size
        self.samples = self._collect_samples()

    def _collect_samples(self) -> List[Tuple[Path, int]]:
        samples = []
        for label_name, label_idx in LABEL_MAP.items():
            class_dir = self.split_dir / label_name
            if not class_dir.exists():
                continue
            for vid_path in class_dir.glob("*"):
                if vid_path.suffix.lower() in VIDEO_EXTENSIONS:
                    samples.append((vid_path, label_idx))
        return samples

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, int]:
        vid_path, label = self.samples[idx]
        
        # Extract frames
        frames = extract_frames(vid_path, frame_count=self.frame_count)
        
        if not frames:
            # Fallback for empty/corrupt videos
            sequence = torch.zeros((self.frame_count, 3, self.image_size, self.image_size))
        else:
            # Apply transforms frame-wise if provided, else use preprocessing
            if self.transform:
                tensors = [self.transform(Image.fromarray(f)) for f in frames]
                sequence = torch.stack(tensors)
            else:
                sequence = frames_to_tensor(frames, image_size=self.image_size)
        
        # Pad or truncate to ensure fixed sequence length
        if sequence.size(0) < self.frame_count:
            padding = torch.zeros((self.frame_count - sequence.size(0), 3, self.image_size, self.image_size))
            sequence = torch.cat([sequence, padding], dim=0)
        elif sequence.size(0) > self.frame_count:
            sequence = sequence[:self.frame_count]

        return sequence, label


def create_dataloader(
    dataset_type: str,
    root_dir: str,
    split: str,
    batch_size: int,
    image_size: int = 224,
    frame_count: int = 20,
    shuffle: bool = True,
    num_workers: int = 4
) -> DataLoader:
    """
    Factory function for dataloaders.
    """
    if dataset_type.lower() == "image":
        transform = get_train_transforms(image_size) if split == "train" else get_val_transforms(image_size)
        dataset = ImageDataset(root_dir, split, transform)
    elif dataset_type.lower() == "video":
        transform = get_video_train_transforms(image_size) if split == "train" else None
        dataset = VideoDataset(root_dir, split, transform, frame_count, image_size)
    else:
        raise ValueError(f"Unknown dataset type: {dataset_type}")

    return DataLoader(
        dataset, 
        batch_size=batch_size, 
        shuffle=shuffle, 
        num_workers=num_workers,
        pin_memory=torch.cuda.is_available()
    )
