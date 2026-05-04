from pathlib import Path
from typing import Dict, Iterable, List, Optional, Sequence, Tuple, Union
import csv
import warnings

import cv2
import numpy as np


IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
IMAGENET_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tif", ".tiff"}
VIDEO_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv", ".webm", ".mpeg", ".mpg"}


Record = Union[Dict[str, Union[str, int]], Tuple[Union[str, Path], int]]


def resize_image(image: np.ndarray, size: Tuple[int, int] = (224, 224)) -> np.ndarray:
    """Resize an image to width x height."""
    return cv2.resize(image, size, interpolation=cv2.INTER_AREA)


def normalize_imagenet(image: np.ndarray) -> np.ndarray:
    """Normalize an RGB uint8/float image with ImageNet mean and std."""
    image = image.astype(np.float32)
    if image.max() > 1.0:
        image = image / 255.0
    return (image - IMAGENET_MEAN) / IMAGENET_STD


def load_image_rgb(image_path: Union[str, Path]) -> Optional[np.ndarray]:
    """Load an image with OpenCV and convert BGR to RGB."""
    image = cv2.imread(str(image_path))
    if image is None:
        warnings.warn(f"Could not read image: {image_path}", RuntimeWarning, stacklevel=2)
        return None
    return cv2.cvtColor(image, cv2.COLOR_BGR2RGB)


def save_rgb_image(image: np.ndarray, output_path: Union[str, Path]) -> str:
    """Save an RGB image using OpenCV."""
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    bgr_image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
    cv2.imwrite(str(output_path), bgr_image)
    return str(output_path)


def preprocess_image_file(
    image_path: Union[str, Path],
    output_dir: Union[str, Path],
    size: Tuple[int, int] = (224, 224),
    output_ext: str = ".jpg",
) -> Optional[str]:
    """Resize and save one image. Returns the processed image path."""
    image_path = Path(image_path)
    image = load_image_rgb(image_path)
    if image is None:
        return None

    resized = resize_image(image, size=size)
    output_path = Path(output_dir) / f"{image_path.stem}{output_ext}"
    return save_rgb_image(resized, output_path)


def extract_frames_from_video(
    video_path: Union[str, Path],
    output_dir: Union[str, Path],
    every_n_frames: int = 30,
    size: Tuple[int, int] = (224, 224),
    output_ext: str = ".jpg",
) -> List[str]:
    """Extract and save every Nth frame from a video as resized RGB images."""
    if every_n_frames < 1:
        raise ValueError("every_n_frames must be >= 1")

    video_path = Path(video_path)
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    capture = cv2.VideoCapture(str(video_path))
    if not capture.isOpened():
        warnings.warn(f"Could not open video: {video_path}", RuntimeWarning, stacklevel=2)
        return []

    saved_paths = []
    frame_idx = 0
    saved_idx = 0

    while True:
        success, frame = capture.read()
        if not success:
            break

        if frame_idx % every_n_frames == 0:
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            resized = resize_image(rgb_frame, size=size)
            frame_name = f"{video_path.stem}_frame_{saved_idx:06d}{output_ext}"
            saved_paths.append(save_rgb_image(resized, output_dir / frame_name))
            saved_idx += 1

        frame_idx += 1

    capture.release()
    return saved_paths


def save_manifest(rows: Sequence[Tuple[str, int]], csv_path: Union[str, Path]) -> str:
    """Save processed file paths and labels into a CSV with image_path,label columns."""
    csv_path = Path(csv_path)
    csv_path.parent.mkdir(parents=True, exist_ok=True)

    with csv_path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow(["image_path", "label"])
        writer.writerows(rows)

    return str(csv_path)


def preprocess_media_dataset(
    records: Iterable[Record],
    output_dir: Union[str, Path],
    csv_path: Union[str, Path],
    every_n_frames: int = 30,
    size: Tuple[int, int] = (224, 224),
    output_ext: str = ".jpg",
) -> str:
    """
    Process image/video records and write a training CSV.

    Each record can be {"path": "...", "label": 0} or ("path", 0).
    Videos are converted into extracted frames; images are resized directly.
    """
    output_dir = Path(output_dir)
    manifest_rows: List[Tuple[str, int]] = []

    for record in records:
        media_path, label = _parse_record(record)
        media_path = Path(media_path)
        label = int(label)

        if _is_video(media_path):
            media_output_dir = output_dir / media_path.stem
            processed_paths = extract_frames_from_video(
                media_path,
                media_output_dir,
                every_n_frames=every_n_frames,
                size=size,
                output_ext=output_ext,
            )
            manifest_rows.extend((path, label) for path in processed_paths)
        elif _is_image(media_path):
            processed_path = preprocess_image_file(
                media_path,
                output_dir,
                size=size,
                output_ext=output_ext,
            )
            if processed_path is not None:
                manifest_rows.append((processed_path, label))
        else:
            warnings.warn(f"Unsupported media type skipped: {media_path}", RuntimeWarning, stacklevel=2)

    return save_manifest(manifest_rows, csv_path)


def preprocess_csv_dataset(
    input_csv_path: Union[str, Path],
    output_dir: Union[str, Path],
    csv_path: Union[str, Path],
    path_column: str = "image_path",
    label_column: str = "label",
    every_n_frames: int = 30,
    size: Tuple[int, int] = (224, 224),
    output_ext: str = ".jpg",
) -> str:
    """Read image/video paths from a CSV, process media, and write a new manifest CSV."""
    input_csv_path = Path(input_csv_path)
    records = []

    with input_csv_path.open("r", newline="", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        fieldnames = set(reader.fieldnames or [])
        if label_column not in fieldnames:
            raise ValueError(f"Input CSV must contain label column: {label_column}")

        resolved_path_column = path_column
        if resolved_path_column not in fieldnames:
            if "video_path" in fieldnames:
                resolved_path_column = "video_path"
            else:
                raise ValueError(f"Input CSV must contain path column: {path_column}")

        for row in reader:
            media_path = Path(row[resolved_path_column])
            if not media_path.is_absolute():
                media_path = input_csv_path.parent / media_path
            records.append((media_path, int(row[label_column])))

    return preprocess_media_dataset(
        records=records,
        output_dir=output_dir,
        csv_path=csv_path,
        every_n_frames=every_n_frames,
        size=size,
        output_ext=output_ext,
    )


def _parse_record(record: Record) -> Tuple[Union[str, Path], int]:
    if isinstance(record, dict):
        path = record.get("path", record.get("image_path", record.get("video_path")))
        label = record.get("label")
        if path is None or label is None:
            raise ValueError("Record dictionaries must include a path/image_path/video_path and label.")
        return path, int(label)

    path, label = record
    return path, int(label)


def _is_image(path: Path) -> bool:
    return path.suffix.lower() in IMAGE_EXTENSIONS


def _is_video(path: Path) -> bool:
    return path.suffix.lower() in VIDEO_EXTENSIONS
