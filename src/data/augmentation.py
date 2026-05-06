from torchvision import transforms
from src.data.preprocessing import IMAGENET_MEAN, IMAGENET_STD


def get_train_transforms(image_size: int = 224) -> transforms.Compose:
    """
    Standard training augmentations for deepfake detection.
    Includes horizontal flip and color jitter.
    """
    return transforms.Compose([
        transforms.Resize((image_size, image_size)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.ColorJitter(brightness=0.1, contrast=0.1, saturation=0.1),
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
    ])


def get_video_train_transforms(image_size: int = 224) -> transforms.Compose:
    """
    Frame-wise training augmentations for video sequences.
    Same as image transforms but can be extended for sequence-specific logic.
    """
    return get_train_transforms(image_size)
