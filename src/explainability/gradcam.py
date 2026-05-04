from pathlib import Path
from typing import Optional, Tuple, Union

import cv2
import numpy as np
import torch
import torch.nn as nn

from src.data.preprocessing import preprocess_image_array
from src.explainability.heatmap import overlay_heatmap, save_heatmap_overlay


class GradCAM:
    """Grad-CAM implementation for EfficientNet-B0 style CNN classifiers."""

    def __init__(self, model: nn.Module, target_layer: Optional[nn.Module] = None):
        self.model = model
        self.target_layer = target_layer or find_last_conv_layer(model)
        self.activations = None
        self.gradients = None
        self.hooks = []
        self._register_hooks()
        print(f"[DEBUG][gradcam] Hooks registered on layer={self.target_layer}")

    def _register_hooks(self) -> None:
        self.hooks.append(self.target_layer.register_forward_hook(self._forward_hook))
        self.hooks.append(self.target_layer.register_full_backward_hook(self._backward_hook))

    def _forward_hook(self, module, inputs, output) -> None:
        self.activations = output.detach()
        print(f"[DEBUG][gradcam] activations shape={tuple(self.activations.shape)}")

    def _backward_hook(self, module, grad_input, grad_output) -> None:
        self.gradients = grad_output[0].detach()
        print(f"[DEBUG][gradcam] gradients shape={tuple(self.gradients.shape)}")

    def generate(self, input_tensor: torch.Tensor, class_idx: Optional[int] = None) -> np.ndarray:
        self.model.eval()
        self.model.zero_grad(set_to_none=True)
        output = self.model(input_tensor)
        score = output[:, 0].sum() if output.shape[-1] == 1 else output[:, class_idx or output.argmax(1).item()].sum()
        score.backward()

        if self.activations is None or self.gradients is None:
            raise RuntimeError("Grad-CAM failed to capture activations/gradients.")

        weights = self.gradients.mean(dim=(2, 3), keepdim=True)
        heatmap = torch.relu((weights * self.activations).sum(dim=1)).squeeze()
        heatmap_np = normalize_heatmap(heatmap.detach().cpu().numpy())
        print(f"[DEBUG][gradcam] heatmap shape={heatmap_np.shape} min={heatmap_np.min()} max={heatmap_np.max()}")
        return heatmap_np

    def remove_hooks(self) -> None:
        for hook in self.hooks:
            hook.remove()
        self.hooks = []
        print("[DEBUG][gradcam] Hooks removed.")


def find_last_conv_layer(model: nn.Module) -> nn.Module:
    conv_layer = None
    for module in model.modules():
        if isinstance(module, nn.Conv2d):
            conv_layer = module
    if conv_layer is None:
        raise ValueError("No Conv2d layer found for Grad-CAM.")
    return conv_layer


def normalize_heatmap(heatmap: np.ndarray) -> np.ndarray:
    heatmap = heatmap.astype(np.float32)
    heatmap -= heatmap.min()
    max_value = heatmap.max()
    if max_value > 0:
        heatmap /= max_value
    return heatmap


def preprocess_image(
    image: np.ndarray,
    image_size: Tuple[int, int] = (224, 224),
    device: Optional[torch.device] = None,
) -> torch.Tensor:
    size = image_size[0] if isinstance(image_size, tuple) else int(image_size)
    tensor = preprocess_image_array(image, image_size=size, input_format="rgb").unsqueeze(0)
    if device is not None:
        tensor = tensor.to(device)
    print(f"[DEBUG][gradcam] preprocessed tensor shape={tuple(tensor.shape)} device={tensor.device}")
    return tensor


def generate_gradcam(
    model: nn.Module,
    image: np.ndarray,
    image_size: int = 224,
    device: Optional[Union[str, torch.device]] = None,
) -> np.ndarray:
    device = torch.device(device) if device is not None else next(model.parameters()).device
    input_tensor = preprocess_image(image, image_size=(image_size, image_size), device=device)
    gradcam = GradCAM(model)
    try:
        return gradcam.generate(input_tensor)
    finally:
        gradcam.remove_hooks()


def generate_and_save_gradcam(
    model: nn.Module,
    image: np.ndarray,
    output_path: Union[str, Path],
    image_size: int = 224,
    alpha: float = 0.4,
    device: Optional[Union[str, torch.device]] = None,
) -> str:
    heatmap = generate_gradcam(model, image, image_size=image_size, device=device)
    overlay = overlay_heatmap(image, heatmap, alpha=alpha)
    return save_heatmap_overlay(overlay, output_path)
