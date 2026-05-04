from pathlib import Path
from typing import Any, Dict, Iterable, Optional

import yaml


def load_config(config_path: str = "configs/image_config.yaml") -> Dict[str, Any]:
    """Load a YAML config file and return it as a dictionary."""
    path = Path(config_path)
    if not path.exists():
        raise FileNotFoundError(f"Config file not found: {path.resolve()}")

    with path.open("r", encoding="utf-8") as file:
        config = yaml.safe_load(file) or {}

    print(f"[DEBUG][config] Loaded config from {path.resolve()}")
    print(f"[DEBUG][config] Config: {config}")
    return config


def get_config_value(config: Dict[str, Any], keys: Iterable[str], default: Optional[Any] = None) -> Any:
    """Read the first present dotted key from a nested config dictionary."""
    for key in keys:
        value: Any = config
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
