from torchvision import transforms


def light_train_augmentation() -> transforms.Compose:
    """Small image augmentations that preserve face-level forensic cues."""
    print("[DEBUG][augmentation] Building light training augmentation.")
    return transforms.Compose(
        [
            transforms.RandomHorizontalFlip(p=0.5),
            transforms.ColorJitter(brightness=0.1, contrast=0.1, saturation=0.1),
        ]
    )
