import argparse
import sys
from pathlib import Path

import torch
from torch.utils.data import DataLoader

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.append(str(PROJECT_ROOT))

from src.data.loader import create_dataloader
from src.models.video_model import DeepfakeVideoModel
from src.training.trainer_utils import (
    get_criterion, 
    get_optimizer, 
    get_scheduler, 
    save_checkpoint, 
    train_one_epoch, 
    validate_one_epoch
)
from src.utils.config import get_config_value, load_config
from src.utils.helpers import ensure_dir, get_device, set_seed
from src.utils.logger import get_logger


def train(config_path: str = "configs/video_config.yaml"):
    config = load_config(config_path)
    seed = int(get_config_value(config, "seed", 42))
    set_seed(seed)

    log_file = get_config_value(config, "logging.file", "outputs/logs/video_training.log")
    logger = get_logger("train_video", log_file=log_file)

    device = get_device(get_config_value(config, "device", "auto"))
    
    # Data Loaders
    data_dir = get_config_value(config, "data.root_dir", "data/videos")
    batch_size = int(get_config_value(config, "training.batch_size", 8)) # Smaller batch for video
    image_size = int(get_config_value(config, "data.image_size", 224))
    frame_count = int(get_config_value(config, "data.frame_count", 20))
    num_workers = int(get_config_value(config, "training.num_workers", 4))

    train_loader = create_dataloader(
        "video", data_dir, "train", batch_size, image_size, frame_count, num_workers=num_workers
    )
    val_loader = create_dataloader(
        "video", data_dir, "val", batch_size, image_size, frame_count, num_workers=num_workers
    )

    # Model
    model = DeepfakeVideoModel().to(device)

    # Training Components
    lr = float(get_config_value(config, "training.learning_rate", 1e-4))
    weight_decay = float(get_config_value(config, "training.weight_decay", 1e-5))
    epochs = int(get_config_value(config, "training.epochs", 10))

    criterion = get_criterion()
    optimizer = get_optimizer(model, lr=lr, weight_decay=weight_decay)
    scheduler = get_scheduler(optimizer)

    model_dir = ensure_dir(get_config_value(config, "paths.model_dir", "models/video"))
    best_val_loss = float("inf")

    logger.info(f"Starting video training: device={device} epochs={epochs}")

    for epoch in range(1, epochs + 1):
        train_metrics = train_one_epoch(model, train_loader, criterion, optimizer, device)
        val_metrics = validate_one_epoch(model, val_loader, criterion, device)
        scheduler.step()

        is_best = val_metrics["loss"] < best_val_loss
        if is_best:
            best_val_loss = val_metrics["loss"]
        
        checkpoint_state = {
            "epoch": epoch,
            "model_state_dict": model.state_dict(),
            "optimizer_state_dict": optimizer.state_dict(),
            "val_loss": val_metrics["loss"],
            "val_acc": val_metrics["accuracy"]
        }
        
        save_checkpoint(checkpoint_state, model_dir, filename="last_model.pth")
        if is_best:
            save_checkpoint(checkpoint_state, model_dir, filename="best_model.pth")
            logger.info(f"New best model saved at epoch {epoch}")

        logger.info(
            f"Epoch {epoch}/{epochs} - Train Loss: {train_metrics['loss']:.4f}, Val Loss: {val_metrics['loss']:.4f}, Val Acc: {val_metrics['accuracy']:.4f}"
        )

    logger.info("Training complete.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", default="configs/video_config.yaml")
    args = parser.parse_args()
    train(args.config)
