import torch
import torch.nn as nn
from torchvision import models
from pathlib import Path
from typing import Optional, Union


class DeepfakeImageModel(nn.Module):
    """
    CNN-based image classifier for deepfake detection.
    Uses EfficientNet-B0 as the backbone.
    """
    def __init__(self, model_name: str = "efficientnet_b0", pretrained: bool = True):
        super().__init__()
        
        if model_name == "efficientnet_b0":
            weights = models.EfficientNet_B0_Weights.DEFAULT if pretrained else None
            self.backbone = models.efficientnet_b0(weights=weights)
            in_features = self.backbone.classifier[1].in_features
            self.backbone.classifier[1] = nn.Linear(in_features, 1)
        elif model_name == "resnet50":
            weights = models.ResNet50_Weights.DEFAULT if pretrained else None
            self.backbone = models.resnet50(weights=weights)
            in_features = self.backbone.fc.in_features
            self.backbone.fc = nn.Linear(in_features, 1)
        else:
            raise ValueError(f"Unsupported model: {model_name}")

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Returns logits. Use sigmoid externally for probability.
        """
        return self.backbone(x)


def load_image_model(
    checkpoint_path: Optional[Union[str, Path]] = None,
    device: str = "cpu",
    model_name: str = "efficientnet_b0"
) -> DeepfakeImageModel:
    """
    Load the image model with optional pretrained weights.
    """
    model = DeepfakeImageModel(model_name=model_name, pretrained=(checkpoint_path is None))
    
    if checkpoint_path:
        checkpoint = torch.load(checkpoint_path, map_location=device)
        # Handle cases where checkpoint is a dict or just state_dict
        state_dict = checkpoint.get("model_state_dict", checkpoint)
        model.load_state_dict(state_dict)
        
    model.to(device)
    model.eval()
    return model
