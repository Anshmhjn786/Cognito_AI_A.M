from pathlib import Path
from typing import Callable, Dict, List, Optional, Tuple

import torch
from PIL import Image, UnidentifiedImageError
from torch.utils.data import DataLoader, Dataset

from src.data.preprocessing import IMAGE_EXTENSIONS, train_transforms, val_transforms
from src.utils.config import get_config_value


LABEL_MAP = {"real": 0, "fake": 1}


class DeepfakeImageDataset(Dataset):
    """Folder-backed dataset: split/real and split/fake."""

    def __init__(
        self,
        root_dir: str,
        split: str = "train",
        transform: Optional[Callable] = None,
        skip_corrupt: bool = False,
    ):
        self.root_dir = Path(root_dir)
        self.split = split
        self.split_dir = self.root_dir / split
        self.transform = transform
        self.skip_corrupt = skip_corrupt
        self.samples = self._collect_samples()

        if not self.samples:
            raise ValueError(f"No images found under {self.split_dir}/real or {self.split_dir}/fake")

        print(
            f"[DEBUG][loader] Dataset initialized split={split} root={self.root_dir.resolve()} "
            f"samples={len(self.samples)}"
        )

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, torch.Tensor]:
        image_path, label = self.samples[idx]
        try:
            image = Image.open(image_path).convert("RGB")
        except (OSError, UnidentifiedImageError) as exc:
            print(f"[DEBUG][loader] Corrupt image skipped via blank fallback: {image_path} error={exc}")
            image = Image.new("RGB", (224, 224), color=(0, 0, 0))

        if self.transform is not None:
            image = self.transform(image)

        label_tensor = torch.tensor(label, dtype=torch.float32)
        print(
            f"[DEBUG][loader] Sample path={image_path.name} image_shape={tuple(image.shape)} "
            f"label={label_tensor.item()}"
        )
        return image, label_tensor

    def _collect_samples(self) -> List[Tuple[Path, int]]:
        samples: List[Tuple[Path, int]] = []
        for class_name, label in LABEL_MAP.items():
            class_dir = self.split_dir / class_name
            if not class_dir.exists():
                print(f"[DEBUG][loader] Missing class directory: {class_dir.resolve()}")
                continue
            for path in sorted(class_dir.rglob("*")):
                if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS:
                    samples.append((path, label))
        return samples


def create_dataloader(
    root_dir: str,
    split: str,
    batch_size: int,
    image_size: int = 224,
    shuffle: Optional[bool] = None,
    num_workers: int = 0,
    pin_memory: Optional[bool] = None,
) -> DataLoader:
    transform = train_transforms(image_size) if split == "train" else val_transforms(image_size)
    dataset = DeepfakeImageDataset(root_dir=root_dir, split=split, transform=transform)
    shuffle = split == "train" if shuffle is None else shuffle
    pin_memory = torch.cuda.is_available() if pin_memory is None else pin_memory

    loader = DataLoader(
        dataset,
        batch_size=batch_size,
        shuffle=shuffle,
        num_workers=num_workers,
        pin_memory=pin_memory,
    )
    print(
        f"[DEBUG][loader] DataLoader split={split} batches={len(loader)} "
        f"batch_size={batch_size} shuffle={shuffle} num_workers={num_workers}"
    )
    return loader


def get_dataloaders(config: Dict) -> Tuple[DataLoader, DataLoader]:
    data_dir = get_config_value(config, ["data.root_dir", "data_dir"], "data/images")
    batch_size = int(get_config_value(config, ["training.batch_size", "batch_size"], 32))
    image_size = int(get_config_value(config, ["data.image_size", "image_size"], 224))
    num_workers = int(get_config_value(config, ["data.num_workers", "num_workers"], 0))

    train_loader = create_dataloader(data_dir, "train", batch_size, image_size, True, num_workers)
    val_loader = create_dataloader(data_dir, "val", batch_size, image_size, False, num_workers)
    return train_loader, val_loader


def get_test_dataloader(config: Dict) -> DataLoader:
    data_dir = get_config_value(config, ["data.root_dir", "data_dir"], "data/images")
    batch_size = int(get_config_value(config, ["evaluation.batch_size", "training.batch_size", "batch_size"], 32))
    image_size = int(get_config_value(config, ["data.image_size", "image_size"], 224))
    num_workers = int(get_config_value(config, ["data.num_workers", "num_workers"], 0))
    return create_dataloader(data_dir, "test", batch_size, image_size, False, num_workers)


def get_dataloader(*args, **kwargs) -> DataLoader:
    """Backward-compatible alias for older scripts."""
    return create_dataloader(*args, **kwargs)
