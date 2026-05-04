from pathlib import Path
import argparse
import sys

import torch
import torch.nn as nn
import torch.optim as optim


PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.append(str(PROJECT_ROOT))

from src.data.loader import get_dataloaders
from src.models.image_model import DeepfakeImageModel
from src.training.trainer_utils import train_one_epoch, validate_one_epoch
from src.utils.config import get_config_value, load_config
from src.utils.helpers import ensure_dir, get_device, set_seed
from src.utils.logger import get_logger


def get_config(config, keys, default=None):
    """Backward-compatible config helper for older backend imports."""
    return get_config_value(config, keys, default)


def save_checkpoint(path, model, optimizer, epoch, best_val_loss, config):
    path = Path(path)
    ensure_dir(path.parent)
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
    print(f"[DEBUG][train_image] Saved checkpoint={path.resolve()}")


def train(config_path: str = "configs/image_config.yaml"):
    config = load_config(config_path)
    seed = int(get_config_value(config, ["seed"], 42))
    set_seed(seed)

    log_file = get_config_value(config, ["logging.file"], "outputs/logs/image_training.log")
    logger = get_logger("train_image", log_file=log_file)

    device = get_device(get_config_value(config, ["device"], "auto"))
    train_loader, val_loader = get_dataloaders(config)

    model = DeepfakeImageModel(
        pretrained=bool(get_config_value(config, ["model.pretrained", "pretrained"], True)),
        apply_sigmoid=False,
        model_name=get_config_value(config, ["model.name", "model_name"], "efficientnet_b0"),
    ).to(device)

    learning_rate = float(get_config_value(config, ["training.learning_rate", "learning_rate"], 1e-4))
    weight_decay = float(get_config_value(config, ["training.weight_decay"], 0.0))
    epochs = int(get_config_value(config, ["training.epochs", "epochs"], 10))
    patience = int(get_config_value(config, ["training.early_stopping_patience"], 0))

    criterion = nn.BCEWithLogitsLoss()
    optimizer = optim.AdamW(model.parameters(), lr=learning_rate, weight_decay=weight_decay)

    model_dir = ensure_dir(get_config_value(config, ["paths.model_dir", "model_dir"], "models/image"))
    best_model_path = model_dir / "best_model.pth"
    last_model_path = model_dir / "last_model.pth"
    best_val_loss = float("inf")
    epochs_without_improvement = 0

    logger.info("Starting image training on device=%s epochs=%s", device, epochs)
    for epoch in range(1, epochs + 1):
        print(f"[DEBUG][train_image] Epoch {epoch}/{epochs} started. device={device}")
        train_metrics = train_one_epoch(model, train_loader, criterion, optimizer, device)
        val_metrics = validate_one_epoch(model, val_loader, criterion, device)

        improved = val_metrics["loss"] < best_val_loss
        if improved:
            best_val_loss = val_metrics["loss"]
            epochs_without_improvement = 0
            save_checkpoint(best_model_path, model, optimizer, epoch, best_val_loss, config)
        else:
            epochs_without_improvement += 1

        save_checkpoint(last_model_path, model, optimizer, epoch, best_val_loss, config)
        logger.info(
            "Epoch %d/%d train_loss=%.4f train_acc=%.4f val_loss=%.4f val_acc=%.4f",
            epoch,
            epochs,
            train_metrics["loss"],
            train_metrics["accuracy"],
            val_metrics["loss"],
            val_metrics["accuracy"],
        )

        print(
            f"[DEBUG][train_image] Epoch={epoch} train={train_metrics} val={val_metrics} "
            f"best_val_loss={best_val_loss:.4f}"
        )

        if patience > 0 and epochs_without_improvement >= patience:
            logger.info("Early stopping triggered at epoch %d", epoch)
            break

    logger.info("Training complete. Best model saved to %s", best_model_path)
    return model


def parse_args():
    parser = argparse.ArgumentParser(description="Train EfficientNet-B0 image deepfake detector.")
    parser.add_argument("--config", default="configs/image_config.yaml", help="Path to YAML image config.")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    train(args.config)
