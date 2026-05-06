from typing import Dict, Any, Optional, Union
from pathlib import Path

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader


def get_criterion() -> nn.Module:
    """
    Returns the binary cross entropy loss with logits.
    """
    return nn.BCEWithLogitsLoss()


def get_optimizer(model: nn.Module, lr: float = 1e-4, weight_decay: float = 1e-5) -> optim.Optimizer:
    """
    Returns an Adam optimizer for the given model.
    """
    return optim.Adam(model.parameters(), lr=lr, weight_decay=weight_decay)


def get_scheduler(optimizer: optim.Optimizer, step_size: int = 7, gamma: float = 0.1) -> optim.lr_scheduler._LRScheduler:
    """
    Returns a learning rate scheduler.
    """
    return optim.lr_scheduler.StepLR(optimizer, step_size=step_size, gamma=gamma)


def save_checkpoint(
    state: Dict[str, Any], 
    checkpoint_dir: Union[str, Path], 
    filename: str = "checkpoint.pth"
) -> None:
    """
    Saves the model state to a file.
    """
    checkpoint_dir = Path(checkpoint_dir)
    checkpoint_dir.mkdir(parents=True, exist_ok=True)
    filepath = checkpoint_dir / filename
    torch.save(state, filepath)
    print(f"[INFO] Checkpoint saved to {filepath}")


def load_checkpoint(
    checkpoint_path: Union[str, Path], 
    model: nn.Module, 
    optimizer: Optional[optim.Optimizer] = None
) -> int:
    """
    Loads a model state from a file and returns the epoch.
    """
    checkpoint_path = Path(checkpoint_path)
    if not checkpoint_path.exists():
        print(f"[WARNING] Checkpoint not found: {checkpoint_path}")
        return 0
    
    checkpoint = torch.load(checkpoint_path)
    model.load_state_dict(checkpoint["model_state_dict"])
    if optimizer and "optimizer_state_dict" in checkpoint:
        optimizer.load_state_dict(checkpoint["optimizer_state_dict"])
    
    return checkpoint.get("epoch", 0)


def train_one_epoch(
    model: nn.Module,
    dataloader: DataLoader,
    criterion: nn.Module,
    optimizer: torch.optim.Optimizer,
    device: torch.device,
) -> Dict[str, float]:
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0

    for batch_idx, (images, labels) in enumerate(dataloader):
        images = images.to(device, non_blocking=True)
        labels = labels.to(device, non_blocking=True).float().view(-1, 1)

        optimizer.zero_grad(set_to_none=True)
        logits = model(images)
        loss = criterion(logits, labels)
        loss.backward()
        optimizer.step()

        batch_size = images.size(0)
        running_loss += loss.item() * batch_size
        predictions = (torch.sigmoid(logits) >= 0.5).float()
        correct += (predictions == labels).sum().item()
        total += batch_size

        if batch_idx == 0:
            print(
                f"[DEBUG][trainer] train batch image_shape={tuple(images.shape)} "
                f"label_shape={tuple(labels.shape)} logits_sample={logits[:3].detach().cpu().view(-1).tolist()}"
            )

    metrics = {"loss": running_loss / max(total, 1), "accuracy": correct / max(total, 1)}
    print(f"[DEBUG][trainer] train metrics={metrics}")
    return metrics


@torch.no_grad()
def validate_one_epoch(
    model: nn.Module,
    dataloader: DataLoader,
    criterion: nn.Module,
    device: torch.device,
) -> Dict[str, float]:
    model.eval()
    running_loss = 0.0
    correct = 0
    total = 0

    for batch_idx, (images, labels) in enumerate(dataloader):
        images = images.to(device, non_blocking=True)
        labels = labels.to(device, non_blocking=True).float().view(-1, 1)

        logits = model(images)
        loss = criterion(logits, labels)

        batch_size = images.size(0)
        running_loss += loss.item() * batch_size
        predictions = (torch.sigmoid(logits) >= 0.5).float()
        correct += (predictions == labels).sum().item()
        total += batch_size

        if batch_idx == 0:
            print(
                f"[DEBUG][trainer] val batch image_shape={tuple(images.shape)} "
                f"label_shape={tuple(labels.shape)} probs_sample={torch.sigmoid(logits[:3]).cpu().view(-1).tolist()}"
            )

    metrics = {"loss": running_loss / max(total, 1), "accuracy": correct / max(total, 1)}
    print(f"[DEBUG][trainer] val metrics={metrics}")
    return metrics
