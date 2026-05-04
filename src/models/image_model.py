from pathlib import Path
from typing import Optional, Union

import torch
import torch.nn as nn
from torchvision import models


class DeepfakeImageModel(nn.Module):
    """EfficientNet-B0 binary classifier for image deepfake detection."""

    def __init__(self, pretrained: bool = True, apply_sigmoid: bool = False, model_name: str = "efficientnet_b0"):
        super().__init__()
        if model_name != "efficientnet_b0":
            raise ValueError("This image pipeline currently supports only efficientnet_b0.")

        weights = None
        if pretrained and hasattr(models, "EfficientNet_B0_Weights"):
            weights = models.EfficientNet_B0_Weights.IMAGENET1K_V1

        try:
            self.backbone = models.efficientnet_b0(weights=weights)
        except TypeError:
            self.backbone = models.efficientnet_b0(pretrained=pretrained)
        in_features = self.backbone.classifier[1].in_features
        self.backbone.classifier[1] = nn.Linear(in_features, 1)
        self.apply_sigmoid = apply_sigmoid
        self.activation = nn.Sigmoid()

        print(
            f"[DEBUG][image_model] EfficientNet-B0 initialized pretrained={pretrained} "
            f"in_features={in_features} apply_sigmoid={apply_sigmoid}"
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        print(f"[DEBUG][image_model] Forward input shape={tuple(x.shape)} device={x.device}")
        logits = self.backbone(x)
        print(f"[DEBUG][image_model] Forward logits shape={tuple(logits.shape)} sample={logits[:1].detach().cpu()}")
        if self.apply_sigmoid:
            return self.activation(logits)
        return logits


def load_model(
    checkpoint_path: Optional[Union[str, Path]] = None,
    device: Optional[Union[str, torch.device]] = None,
    pretrained: bool = False,
    apply_sigmoid: bool = False,
) -> DeepfakeImageModel:
    """Create EfficientNet-B0 and optionally load a saved checkpoint."""
    device = torch.device(device) if device is not None else torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = DeepfakeImageModel(pretrained=pretrained, apply_sigmoid=apply_sigmoid).to(device)

    if checkpoint_path:
        checkpoint_path = Path(checkpoint_path)
        checkpoint = torch.load(checkpoint_path, map_location=device)
        state_dict = checkpoint.get("model_state_dict", checkpoint) if isinstance(checkpoint, dict) else checkpoint
        model.load_state_dict(state_dict)
        print(f"[DEBUG][image_model] Loaded checkpoint={checkpoint_path.resolve()} device={device}")

    model.eval()
    print(f"[DEBUG][image_model] Model ready on device={device}")
    return model
