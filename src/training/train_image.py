from pathlib import Path
import argparse
import sys

import torch
import torch.nn as nn
import torch.optim as optim
import yaml


PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.append(str(PROJECT_ROOT))

from src.data.loader import get_dataloader
from src.models.image_model import DeepfakeImageModel


def load_config(config_path):
    with open(config_path, "r", encoding="utf-8") as file:
        return yaml.safe_load(file) or {}


def get_config(config, keys, default=None):
    for key in keys:
        value = config
        found = True
        for part in key.split("."):
            if isinstance(value, dict) and part in value:
                value = value[part]
            else:
                found = False
                break
        if found:
            return value
    return default


def build_transforms(config, train=True):
    use_transforms = get_config(config, ["data.use_transforms", "use_transforms"], True)
    if not use_transforms:
        return None

    try:
        import albumentations as A
        from albumentations.pytorch import ToTensorV2
    except ImportError:
        return None

    image_size = int(get_config(config, ["data.image_size", "image_size"], 224))
    return A.Compose(
        [
            A.Resize(image_size, image_size),
            A.Normalize(mean=(0.485, 0.456, 0.406), std=(0.229, 0.224, 0.225)),
            ToTensorV2(),
        ]
    )


def train_one_epoch(model, dataloader, criterion, optimizer, device):
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0

    for images, labels in dataloader:
        images = images.to(device)
        labels = labels.float().view(-1, 1).to(device)

        optimizer.zero_grad()
        logits = model(images)
        loss = criterion(logits, labels)
        loss.backward()
        optimizer.step()

        running_loss += loss.item() * images.size(0)
        predictions = (torch.sigmoid(logits) >= 0.5).float()
        correct += (predictions == labels).sum().item()
        total += labels.size(0)

    return running_loss / max(total, 1), correct / max(total, 1)


@torch.no_grad()
def validate(model, dataloader, criterion, device):
    model.eval()
    running_loss = 0.0
    correct = 0
    total = 0

    for images, labels in dataloader:
        images = images.to(device)
        labels = labels.float().view(-1, 1).to(device)

        logits = model(images)
        loss = criterion(logits, labels)

        running_loss += loss.item() * images.size(0)
        predictions = (torch.sigmoid(logits) >= 0.5).float()
        correct += (predictions == labels).sum().item()
        total += labels.size(0)

    return running_loss / max(total, 1), correct / max(total, 1)


def save_checkpoint(path, model, optimizer, epoch, best_val_loss, config):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    torch.save(
        {
            "epoch": epoch,
            "model_state_dict": model.state_dict(),
            "optimizer_state_dict": optimizer.state_dict(),
            "best_val_loss": best_val_loss,
            "config": config,
        },
        path,
    )


def train(config_path):
    config = load_config(config_path)

    train_csv = get_config(config, ["data.train_csv", "train_csv"])
    val_csv = get_config(config, ["data.val_csv", "val_csv", "validation_csv"])
    if train_csv is None or val_csv is None:
        raise ValueError("Config must define train_csv and val_csv paths.")

    batch_size = int(get_config(config, ["training.batch_size", "batch_size"], 32))
    epochs = int(get_config(config, ["training.epochs", "epochs"], 10))
    learning_rate = float(get_config(config, ["training.learning_rate", "learning_rate", "lr"], 1e-4))
    model_name = get_config(config, ["model.name", "model_name"], "efficientnet_b0")
    pretrained = bool(get_config(config, ["model.pretrained", "pretrained"], True))
    checkpoint_dir = Path(get_config(config, ["training.checkpoint_dir", "checkpoint_dir"], "checkpoints"))

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    train_loader = get_dataloader(
        csv_path=train_csv,
        batch_size=batch_size,
        transforms=build_transforms(config, train=True),
        shuffle=True,
    )
    val_loader = get_dataloader(
        csv_path=val_csv,
        batch_size=batch_size,
        transforms=build_transforms(config, train=False),
        shuffle=False,
    )

    model = DeepfakeImageModel(
        model_name=model_name,
        pretrained=pretrained,
        apply_sigmoid=False,
    ).to(device)
    criterion = nn.BCEWithLogitsLoss()
    optimizer = optim.Adam(model.parameters(), lr=learning_rate)

    best_val_loss = float("inf")
    best_model_path = checkpoint_dir / "best_image_model.pth"
    last_checkpoint_path = checkpoint_dir / "last_image_checkpoint.pth"

    print(f"Training on {device} for {epochs} epochs")
    for epoch in range(1, epochs + 1):
        train_loss, train_acc = train_one_epoch(model, train_loader, criterion, optimizer, device)
        val_loss, val_acc = validate(model, val_loader, criterion, device)

        if val_loss < best_val_loss:
            best_val_loss = val_loss
            save_checkpoint(best_model_path, model, optimizer, epoch, best_val_loss, config)

        save_checkpoint(last_checkpoint_path, model, optimizer, epoch, best_val_loss, config)

        print(
            f"Epoch [{epoch}/{epochs}] "
            f"train_loss={train_loss:.4f} "
            f"val_loss={val_loss:.4f} "
            f"train_acc={train_acc:.4f} "
            f"val_acc={val_acc:.4f}"
        )

    return model


def parse_args():
    parser = argparse.ArgumentParser(description="Train deepfake image classifier.")
    parser.add_argument(
        "--config",
        default="configs/training_config.yaml",
        help="Path to YAML training config.",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    train(args.config)
