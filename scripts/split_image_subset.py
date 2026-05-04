from __future__ import annotations

import argparse
import random
import shutil
from dataclasses import dataclass
from pathlib import Path


IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}
DEFAULT_SPLITS = ("train", "val", "test")
DEFAULT_CLASSES = ("real", "fake")


@dataclass
class ClassSummary:
    split: str
    class_name: str
    total_images: int
    moved_images: int
    remaining_images: int


def is_image_file(path: Path) -> bool:
    return path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS


def get_image_files(directory: Path) -> list[Path]:
    if not directory.exists():
        return []
    return sorted(path for path in directory.iterdir() if is_image_file(path))


def find_child_dir(parent: Path, child_name: str) -> Path:
    if not parent.exists():
        return parent / child_name

    child_name_lower = child_name.lower()
    for child in parent.iterdir():
        if child.is_dir() and child.name.lower() == child_name_lower:
            return child

    return parent / child_name


def select_subset(files: list[Path], fraction: float, rng: random.Random) -> list[Path]:
    shuffled_files = files[:]
    rng.shuffle(shuffled_files)
    subset_size = int(len(shuffled_files) * fraction)
    return shuffled_files[:subset_size]


def ensure_no_collisions(files: list[Path], source_group: Path, destination_group: Path) -> None:
    collisions = []
    for source_file in files:
        destination_file = destination_group / source_file.relative_to(source_group)
        if destination_file.exists():
            collisions.append(destination_file)

    if collisions:
        collision_list = "\n".join(f"  - {path}" for path in collisions[:10])
        extra = "" if len(collisions) <= 10 else f"\n  ... and {len(collisions) - 10} more"
        raise FileExistsError(
            "Destination files already exist. Refusing to overwrite:\n"
            f"{collision_list}{extra}"
        )


def move_files(files: list[Path], source_group: Path, destination_group: Path) -> None:
    ensure_no_collisions(files, source_group, destination_group)

    for source_file in files:
        destination_file = destination_group / source_file.relative_to(source_group)
        destination_file.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(source_file), str(destination_file))


def split_images(
    source_root: Path,
    destination_root: Path,
    fraction: float,
    seed: int | None,
    splits: tuple[str, ...] = DEFAULT_SPLITS,
    class_names: tuple[str, ...] = DEFAULT_CLASSES,
) -> list[ClassSummary]:
    if not 0 <= fraction <= 1:
        raise ValueError("fraction must be between 0 and 1")

    rng = random.Random(seed)
    summaries: list[ClassSummary] = []
    print("[DEBUG] Starting split process...\n")

    for split in splits:
        source_split = find_child_dir(source_root, split)
        print(f"[DEBUG] Checking split: {split}")
        print(f"[DEBUG] Resolved path: {source_split.resolve()}")
        print(f"[DEBUG] Exists: {source_split.exists()}")
        for class_name in class_names:
            source_group = find_child_dir(source_split, class_name)
            print(f"  [DEBUG] Class: {class_name}")
            print(f"  [DEBUG] Path: {source_group.resolve()}")
            print(f"  [DEBUG] Exists: {source_group.exists()}")
            destination_group = destination_root / split / class_name
            files = get_image_files(source_group)
            print(f"  [DEBUG] Found {len(files)} images in {class_name}")
            if len(files) > 0:
                print(f"  [DEBUG] Sample file: {files[0]}")
            selected_files = select_subset(files, fraction, rng)
            print(f"  [DEBUG] Selected {len(selected_files)} images to move")
            move_files(selected_files, source_group, destination_group)
            remaining_images = len(get_image_files(source_group))

            summaries.append(
                ClassSummary(
                    split=split,
                    class_name=class_name,
                    total_images=len(files),
                    moved_images=len(selected_files),
                    remaining_images=remaining_images,
                )
            )

    return summaries


def print_summary(summaries: list[ClassSummary]) -> None:
    print("\nImage split summary")
    print("===================")

    for split in DEFAULT_SPLITS:
        print(f"\n{split}")
        for class_name in DEFAULT_CLASSES:
            summary = next(
                item
                for item in summaries
                if item.split == split and item.class_name == class_name
            )
            print(
                f"  {class_name}: "
                f"moved={summary.moved_images}, "
                f"remaining={summary.remaining_images}"
            )

    total_moved = sum(summary.moved_images for summary in summaries)
    total_remaining = sum(summary.remaining_images for summary in summaries)
    print("-------------------")
    print(f"total moved={total_moved}, total remaining={total_remaining}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Move a random image subset from data/raw/images to data/splits/images."
    )
    parser.add_argument(
        "--source",
        type=Path,
        default=Path("data/raw/images"),
        help="Source image dataset root.",
    )
    parser.add_argument(
        "--destination",
        type=Path,
        default=Path("data/splits/images"),
        help="Destination image subset root.",
    )
    parser.add_argument(
        "--fraction",
        type=float,
        default=0.30,
        help="Fraction of images to move from each split/group.",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=None,
        help="Optional random seed for reproducible selection.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    print(f"\n[DEBUG] Source root: {args.source.resolve()}")
    print(f"[DEBUG] Destination root: {args.destination.resolve()}\n")
    summaries = split_images(
        source_root=args.source,
        destination_root=args.destination,
        fraction=args.fraction,
        seed=args.seed,
    )
    print_summary(summaries)


if __name__ == "__main__":
    main()
