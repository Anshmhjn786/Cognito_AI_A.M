import argparse
import torch
import numpy as np
from pathlib import Path
from tqdm import tqdm

from src.data.loader import create_dataloader
from src.models.image_model import load_image_model
from src.models.video_model import load_video_model
from src.evaluation.metrics import calculate_metrics
from src.utils.config import load_config, get_config_value
from src.utils.helpers import get_device


def evaluate(config_path: str, mode: str = "image"):
    config = load_config(config_path)
    device = get_device(get_config_value(config, "device", "cpu"))
    
    # Load Model
    model_dir = get_config_value(config, "paths.model_dir", f"models/{mode}")
    model_path = Path(model_dir) / "best_model.pth"
    
    if mode == "image":
        model_name = get_config_value(config, "model.name", "efficientnet_b0")
        model = load_image_model(model_path, device=device, model_name=model_name)
    else:
        model = load_video_model(model_path, device=device)
        
    # Load Data
    data_dir = get_config_value(config, "data.root_dir", "data")
    batch_size = int(get_config_value(config, "evaluation.batch_size", 32))
    image_size = int(get_config_value(config, "data.image_size", 224))
    
    loader = create_dataloader(
        mode, data_dir, "test", batch_size, image_size, shuffle=False
    )
    
    model.eval()
    all_preds = []
    all_labels = []
    
    with torch.no_grad():
        for inputs, labels in tqdm(loader, desc=f"Evaluating {mode}"):
            inputs = inputs.to(device)
            logits = model(inputs)
            probs = torch.sigmoid(logits).cpu().numpy().flatten()
            
            all_preds.extend(probs)
            all_labels.extend(labels.numpy().flatten())
            
    metrics = calculate_metrics(np.array(all_labels), np.array(all_preds))
    print(f"\nEvaluation Results ({mode}):")
    for k, v in metrics.items():
        print(f"{k.capitalize()}: {v:.4f}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["image", "video"], default="image")
    parser.add_argument("--config", default="configs/image_config.yaml")
    args = parser.parse_args()
    
    evaluate(args.config, args.mode)
