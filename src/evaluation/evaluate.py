from pathlib import Path
import argparse
import json
import sys

import matplotlib.pyplot as plt
import torch


PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.append(str(PROJECT_ROOT))

from src.data.loader import get_dataloader
from src.evaluation.metrics import calculate_metrics
from src.models.image_model import DeepfakeImageModel
from src.training.train_image import build_transforms, get_config, load_config


@torch.no_grad()
def generate_predictions(model, dataloader, device):
    model.eval()
    all_labels = []
    all_logits = []
    all_probabilities = []

    for images, labels in dataloader:
        images = images.to(device)
        logits = model(images).view(-1)
        probabilities = torch.sigmoid(logits)

        all_labels.extend(labels.view(-1).cpu().tolist())
        all_logits.extend(logits.cpu().tolist())
        all_probabilities.extend(probabilities.cpu().tolist())

    return all_labels, all_logits, all_probabilities


def load_trained_model(checkpoint_path, model_name, device):
    model = DeepfakeImageModel(
        model_name=model_name,
        pretrained=False,
        apply_sigmoid=False,
    ).to(device)

    checkpoint = torch.load(checkpoint_path, map_location=device)
    state_dict = checkpoint.get("model_state_dict", checkpoint)
    model.load_state_dict(state_dict)
    return model


def save_json_results(results, output_path):
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with output_path.open("w", encoding="utf-8") as file:
        json.dump(_json_safe(results), file, indent=4)

    return str(output_path)


def save_confusion_matrix_plot(confusion_matrix, output_path):
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    fig, ax = plt.subplots(figsize=(5, 4))
    image = ax.imshow(confusion_matrix, interpolation="nearest", cmap="Blues")
    fig.colorbar(image, ax=ax)

    labels = ["Real", "Fake"]
    ax.set(
        xticks=range(len(labels)),
        yticks=range(len(labels)),
        xticklabels=labels,
        yticklabels=labels,
        xlabel="Predicted label",
        ylabel="True label",
        title="Confusion Matrix",
    )

    matrix_max = max(max(row) for row in confusion_matrix) if confusion_matrix else 0
    threshold = matrix_max / 2
    for row_idx, row in enumerate(confusion_matrix):
        for col_idx, value in enumerate(row):
            color = "white" if value > threshold else "black"
            ax.text(col_idx, row_idx, str(value), ha="center", va="center", color=color)

    fig.tight_layout()
    fig.savefig(output_path, dpi=150)
    plt.close(fig)
    return str(output_path)


def evaluate(config_path):
    config = load_config(config_path)

    test_csv = get_config(config, ["data.test_csv", "test_csv"])
    checkpoint_path = get_config(
        config,
        ["evaluation.checkpoint_path", "checkpoint_path", "model.checkpoint_path"],
        "checkpoints/best_image_model.pth",
    )
    checkpoint_path = Path(checkpoint_path)
    if test_csv is None:
        raise ValueError("Config must define test_csv path.")

    batch_size = int(get_config(config, ["evaluation.batch_size", "batch_size"], 32))
    model_name = get_config(config, ["model.name", "model_name"], "efficientnet_b0")
    threshold = float(get_config(config, ["evaluation.threshold", "threshold"], 0.5))
    output_dir = Path(get_config(config, ["evaluation.output_dir", "output_dir"], "outputs/evaluation"))
    results_path = output_dir / "image_evaluation_results.json"
    confusion_matrix_path = output_dir / "image_confusion_matrix.png"

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    test_loader = get_dataloader(
        csv_path=test_csv,
        batch_size=batch_size,
        transforms=build_transforms(config, train=False),
        shuffle=False,
    )
    model = load_trained_model(checkpoint_path, model_name, device)

    labels, logits, probabilities = generate_predictions(model, test_loader, device)
    metrics = calculate_metrics(labels, probabilities, threshold=threshold)
    predictions = [int(probability >= threshold) for probability in probabilities]

    results = {
        "checkpoint_path": str(checkpoint_path),
        "test_csv": str(test_csv),
        "threshold": threshold,
        "metrics": metrics,
        "predictions": predictions,
        "probabilities": probabilities,
        "labels": labels,
    }

    save_json_results(results, results_path)
    save_confusion_matrix_plot(metrics["confusion_matrix"], confusion_matrix_path)

    print(f"Evaluation complete on {device}")
    print(json.dumps(_json_safe(metrics), indent=4))
    print(f"Saved results: {results_path}")
    print(f"Saved confusion matrix: {confusion_matrix_path}")

    return results


def _json_safe(value):
    if hasattr(value, "item"):
        return value.item()
    if isinstance(value, dict):
        return {key: _json_safe(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_json_safe(item) for item in value]
    return value


def parse_args():
    parser = argparse.ArgumentParser(description="Evaluate deepfake image classifier.")
    parser.add_argument(
        "--config",
        default="configs/training_config.yaml",
        help="Path to YAML config containing test_csv and checkpoint path.",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    evaluate(args.config)
