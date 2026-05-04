from pathlib import Path
import argparse
import csv
import json
import sys

import torch


PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.append(str(PROJECT_ROOT))

from src.data.loader import get_test_dataloader
from src.evaluation.metrics import calculate_metrics
from src.models.image_model import load_model
from src.utils.config import get_config_value, load_config
from src.utils.helpers import ensure_dir, get_device


@torch.no_grad()
def generate_predictions(model, dataloader, device, threshold: float = 0.5):
    model.eval()
    rows = []
    labels = []
    probabilities = []

    for batch_idx, (images, batch_labels) in enumerate(dataloader):
        images = images.to(device, non_blocking=True)
        logits = model(images).view(-1)
        probs = torch.sigmoid(logits)
        preds = (probs >= threshold).long()

        labels.extend(batch_labels.long().view(-1).cpu().tolist())
        probabilities.extend(probs.cpu().tolist())
        for label, probability, prediction in zip(batch_labels.view(-1), probs.cpu(), preds.cpu()):
            rows.append(
                {
                    "label": int(label.item()),
                    "fake_probability": float(probability.item()),
                    "prediction": int(prediction.item()),
                }
            )

        if batch_idx == 0:
            print(
                f"[DEBUG][evaluate] batch_shape={tuple(images.shape)} "
                f"prob_sample={probs[:5].cpu().tolist()}"
            )

    return rows, labels, probabilities


def evaluate(config_path: str = "configs/image_config.yaml"):
    config = load_config(config_path)
    device = get_device(get_config_value(config, ["device"], "auto"))
    threshold = float(get_config_value(config, ["evaluation.threshold"], 0.5))
    checkpoint_path = get_config_value(
        config,
        ["evaluation.checkpoint_path", "paths.best_model_path", "checkpoint_path"],
        "models/image/best_model.pth",
    )
    output_dir = ensure_dir(get_config_value(config, ["paths.prediction_dir", "evaluation.output_dir"], "outputs/predictions"))

    test_loader = get_test_dataloader(config)
    model = load_model(checkpoint_path=checkpoint_path, device=device, pretrained=False, apply_sigmoid=False)
    rows, labels, probabilities = generate_predictions(model, test_loader, device, threshold=threshold)
    metrics = calculate_metrics(labels, probabilities, threshold=threshold)

    csv_path = output_dir / "image_predictions.csv"
    json_path = output_dir / "image_metrics.json"
    _save_predictions_csv(rows, csv_path)
    _save_json({"threshold": threshold, "checkpoint_path": str(checkpoint_path), "metrics": metrics}, json_path)

    print(f"[DEBUG][evaluate] Evaluation complete device={device}")
    print(json.dumps(metrics, indent=2))
    print(f"[DEBUG][evaluate] Saved predictions={csv_path.resolve()}")
    print(f"[DEBUG][evaluate] Saved metrics={json_path.resolve()}")
    return {"metrics": metrics, "predictions_path": str(csv_path), "metrics_path": str(json_path)}


def _save_predictions_csv(rows, path: Path) -> None:
    ensure_dir(path.parent)
    with path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=["label", "fake_probability", "prediction"])
        writer.writeheader()
        writer.writerows(rows)


def _save_json(payload, path: Path) -> None:
    ensure_dir(path.parent)
    with path.open("w", encoding="utf-8") as file:
        json.dump(payload, file, indent=2)


def parse_args():
    parser = argparse.ArgumentParser(description="Evaluate EfficientNet-B0 image deepfake detector.")
    parser.add_argument("--config", default="configs/image_config.yaml", help="Path to YAML image config.")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    evaluate(args.config)
