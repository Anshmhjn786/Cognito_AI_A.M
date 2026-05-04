from copy import deepcopy
from typing import Dict, Iterable

from src.data.loader import get_test_dataloader
from src.evaluation.evaluate import generate_predictions
from src.evaluation.metrics import calculate_metrics
from src.models.image_model import load_model
from src.utils.config import get_config_value
from src.utils.helpers import get_device


def evaluate_cross_dataset(config: Dict, dataset_roots: Iterable[str]) -> Dict[str, Dict[str, float]]:
    """Evaluate one checkpoint against multiple image dataset roots."""
    device = get_device(get_config_value(config, ["device"], "auto"))
    threshold = float(get_config_value(config, ["evaluation.threshold"], 0.5))
    checkpoint_path = get_config_value(config, ["evaluation.checkpoint_path"], "models/image/best_model.pth")
    model = load_model(checkpoint_path=checkpoint_path, device=device, pretrained=False, apply_sigmoid=False)

    results = {}
    for root in dataset_roots:
        run_config = deepcopy(config)
        run_config.setdefault("data", {})["root_dir"] = root
        print(f"[DEBUG][cross_dataset] Evaluating dataset root={root}")
        loader = get_test_dataloader(run_config)
        _, labels, probabilities = generate_predictions(model, loader, device, threshold=threshold)
        results[root] = calculate_metrics(labels, probabilities, threshold=threshold)
    return results
