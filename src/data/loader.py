from pathlib import Path
from typing import Callable, Optional, Tuple
import warnings

import cv2
import numpy as np
import pandas as pd
import torch
from torch.utils.data import DataLoader, Dataset


class DeepfakeImageDataset(Dataset):
    """Image dataset for CSV-backed deepfake detection training."""

    required_columns = {"image_path", "label"}

    def __init__(
        self,
        csv_path: str,
        transforms: Optional[Callable] = None,
        fallback_size: Tuple[int, int] = (224, 224),
    ):
        self.csv_path = Path(csv_path)
        self.csv_dir = self.csv_path.parent
        self.transforms = transforms
        self.fallback_size = fallback_size

        self.data = pd.read_csv(self.csv_path)
        missing_columns = self.required_columns.difference(self.data.columns)
        if missing_columns:
            missing = ", ".join(sorted(missing_columns))
            raise ValueError(f"CSV file must contain columns: {missing}")

        self.image_paths = self.data["image_path"].astype(str).tolist()
        self.labels = self.data["label"].tolist()

    def __len__(self) -> int:
        return len(self.data)

    def __getitem__(self, idx: int):
        image = self._load_image(self.image_paths[idx])
        label = torch.tensor(int(self.labels[idx]), dtype=torch.long)

        if self.transforms is not None:
            image = self._apply_transforms(image)

        image = self._to_tensor(image)
        return image, label

    def _resolve_image_path(self, image_path: str) -> Path:
        path = Path(image_path)
        if path.is_absolute():
            return path
        return self.csv_dir / path

    def _load_image(self, image_path: str) -> np.ndarray:
        path = self._resolve_image_path(image_path)
        image = cv2.imread(str(path))

        if image is None:
            warnings.warn(
                f"Missing or corrupt image '{path}'. Returning a blank fallback image.",
                RuntimeWarning,
                stacklevel=2,
            )
            height, width = self.fallback_size
            return np.zeros((height, width, 3), dtype=np.uint8)

        return cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    def _apply_transforms(self, image):
        try:
            transformed = self.transforms(image=image)
            if isinstance(transformed, dict):
                return transformed["image"]
            return transformed
        except TypeError:
            return self.transforms(image)

    @staticmethod
    def _to_tensor(image) -> torch.Tensor:
        if isinstance(image, torch.Tensor):
            tensor = image.float()
            if tensor.ndim == 3 and tensor.shape[-1] in (1, 3):
                tensor = tensor.permute(2, 0, 1).contiguous()
            return tensor

        if not isinstance(image, np.ndarray):
            image = np.asarray(image)

        if image.ndim == 2:
            image = np.expand_dims(image, axis=-1)

        image = np.ascontiguousarray(image.transpose(2, 0, 1))
        tensor = torch.from_numpy(image).float()

        if tensor.max() > 1:
            tensor = tensor / 255.0

        return tensor


def get_dataloader(csv_path, batch_size, transforms=None, shuffle=True):
    dataset = DeepfakeImageDataset(csv_path=csv_path, transforms=transforms)
    return DataLoader(dataset, batch_size=batch_size, shuffle=shuffle)
