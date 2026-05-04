from typing import Dict

import torch
from torch import nn
from torch.utils.data import DataLoader


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
