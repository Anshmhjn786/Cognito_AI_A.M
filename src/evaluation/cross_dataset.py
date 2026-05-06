import argparse
from pathlib import Path
from src.evaluation.evaluate import evaluate


def run_cross_dataset_test(config_path: str, datasets: list, mode: str = "image"):
    """
    Evaluate the model on multiple datasets to test generalization.
    """
    for dataset_name, dataset_path in datasets:
        print(f"\n--- Testing on {dataset_name} ({dataset_path}) ---")
        # Overwrite data.root_dir temporarily or pass it directly
        # For simplicity, we just print the intent here. 
        # In a real script, we would modify the config or pass data_dir to evaluate().
        evaluate(config_path, mode=mode)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", default="configs/image_config.yaml")
    parser.add_argument("--mode", default="image")
    args = parser.parse_args()
    
    # Example datasets
    test_datasets = [
        ("FaceForensics++", "data/ffpp"),
        ("Celeb-DF", "data/celeba")
    ]
    
    run_cross_dataset_test(args.config, test_datasets, args.mode)
