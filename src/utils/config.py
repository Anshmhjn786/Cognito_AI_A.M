import yaml
from pathlib import Path
from typing import Any, Dict, List, Optional, Union


def load_config(config_path: Union[str, Path]) -> Dict[str, Any]:
    """
    Load a YAML configuration file.
    
    Args:
        config_path: Path to the yaml config file.
        
    Returns:
        A dictionary containing the configuration.
    """
    path = Path(config_path)
    if not path.exists():
        print(f"[WARNING] Config file not found: {path}. Returning empty config.")
        return {}

    try:
        with open(path, "r", encoding="utf-8") as f:
            config = yaml.safe_load(f)
        return config if config else {}
    except Exception as e:
        print(f"[ERROR] Failed to load config {path}: {e}")
        return {}


def get_config_value(config: Dict[str, Any], keys: Union[str, List[str]], default: Any = None) -> Any:
    """
    Retrieve a value from a nested dictionary using a dot-separated string or list of keys.
    
    Args:
        config: The configuration dictionary.
        keys: A string (e.g., 'data.batch_size') or a list of such strings to try.
        default: Default value if key is not found.
        
    Returns:
        The value found or the default.
    """
    if isinstance(keys, str):
        keys = [keys]

    for key_str in keys:
        parts = key_str.split(".")
        val = config
        found = True
        for part in parts:
            if isinstance(val, dict) and part in val:
                val = val[part]
            else:
                found = False
                break
        if found:
            return val
    
    return default
