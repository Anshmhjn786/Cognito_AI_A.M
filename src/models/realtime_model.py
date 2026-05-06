import torch
import torch.nn as nn
from torchvision import models
from pathlib import Path
from typing import Optional, Union


class DeepfakeRealtimeModel(nn.Module):
    """
    Lightweight model for fast, low-latency deepfake detection.
    Uses MobileNetV3-Small as the backbone.
    """
    def __init__(self, pretrained: bool = True):
        super().__init__()
        
        weights = models.MobileNet_V3_Small_Weights.DEFAULT if pretrained else None
        self.backbone = models.mobilenet_v3_small(weights=weights)
        in_features = self.backbone.classifier[3].in_features
        self.backbone.classifier[3] = nn.Linear(in_features, 1)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Returns logits.
        """
        return self.backbone(x)


def load_realtime_model(
    checkpoint_path: Optional[Union[str, Path]] = None,
    device: str = "cpu"
) -> DeepfakeRealtimeModel:
    """
    Load the realtime model with optional pretrained weights.
    """
    model = DeepfakeRealtimeModel(pretrained=(checkpoint_path is None))
    
    if checkpoint_path:
        checkpoint = torch.load(checkpoint_path, map_location=device)
        state_dict = checkpoint.get("model_state_dict", checkpoint)
        model.load_state_dict(state_dict)
        
    model.to(device)
    model.eval()
    return model
