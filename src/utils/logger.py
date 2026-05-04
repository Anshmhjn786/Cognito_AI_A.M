import logging
from pathlib import Path
from typing import Optional


def get_logger(name: str = "deepfake_image", log_file: Optional[str] = None) -> logging.Logger:
    """Create a console logger with an optional file sink."""
    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG)
    logger.propagate = False

    if logger.handlers:
        return logger

    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.DEBUG)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    if log_file:
        path = Path(log_file)
        path.parent.mkdir(parents=True, exist_ok=True)
        file_handler = logging.FileHandler(path, encoding="utf-8")
        file_handler.setLevel(logging.DEBUG)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)

    logger.debug("Logger initialized. log_file=%s", log_file)
    return logger
