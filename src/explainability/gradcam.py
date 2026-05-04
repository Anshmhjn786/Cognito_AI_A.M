from pathlib import Path
from typing import Optional, Tuple, Union

import cv2
import numpy as np
import torch
import torch.nn as nn


IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
IMAGENET_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)


class GradCAM:
    """Generate Grad-CAM heatmaps for CNN image classifiers using PyTorch hooks."""

    def __init__(self, model: nn.Module, target_layer: Optional[nn.Module] = None):
        self.model = model
        self.target_layer = target_layer or find_last_conv_layer(model)
        self.activations = None
        self.gradients = None
        self.hooks = []
        self._register_hooks()

    def _register_hooks(self):
        self.hooks.append(self.target_layer.register_forward_hook(self._forward_hook))
        self.hooks.append(self.target_layer.register_full_backward_hook(self._backward_hook))

    def _forward_hook(self, module, inputs, output):
        self.activations = output.detach()

    def _backward_hook(self, module, grad_input, grad_output):
        self.gradients = grad_output[0].detach()

    def generate(self, input_tensor: torch.Tensor, class_idx: Optional[int] = None) -> np.ndarray:
        """Return a normalized Grad-CAM heatmap for a single input tensor."""
        self.model.eval()
        self.model.zero_grad(set_to_none=True)
        self.activations = None
        self.gradients = None

        output = self.model(input_tensor)
        if output.ndim == 1:
            output = output.unsqueeze(0)

        if output.shape[1] == 1:
            score = output[:, 0].sum()
        else:
            if class_idx is None:
                class_idx = int(output.argmax(dim=1).item())
            score = output[:, class_idx].sum()

        score.backward()

        if self.activations is None or self.gradients is None:
            raise RuntimeError("Grad-CAM hooks did not capture activations or gradients.")

        weights = self.gradients.mean(dim=(2, 3), keepdim=True)
        cam = (weights * self.activations).sum(dim=1, keepdim=True)
        cam = torch.relu(cam)
        cam = cam.squeeze().cpu().numpy()
        return normalize_heatmap(cam)

    def remove_hooks(self):
        for hook in self.hooks:
            hook.remove()
        self.hooks = []


def find_last_conv_layer(model: nn.Module) -> nn.Module:
    """Find the last Conv2d layer in a CNN model."""
    conv_layer = None
    for module in model.modules():
        if isinstance(module, nn.Conv2d):
            conv_layer = module

    if conv_layer is None:
        raise ValueError("No Conv2d layer found. Pass target_layer explicitly for this model.")

    return conv_layer


def load_image_rgb(image_path: Union[str, Path]) -> np.ndarray:
    image = cv2.imread(str(image_path))
    if image is None:
        raise ValueError(f"Could not read image: {image_path}")
    return cv2.cvtColor(image, cv2.COLOR_BGR2RGB)


def preprocess_image(
    image: np.ndarray,
    image_size: Tuple[int, int] = (224, 224),
    device: Optional[torch.device] = None,
) -> torch.Tensor:
    resized = cv2.resize(image, image_size, interpolation=cv2.INTER_AREA)
    normalized = resized.astype(np.float32) / 255.0
    normalized = (normalized - IMAGENET_MEAN) / IMAGENET_STD
    tensor = torch.from_numpy(normalized.transpose(2, 0, 1)).float().unsqueeze(0)
    if device is not None:
        tensor = tensor.to(device)
    return tensor


def normalize_heatmap(heatmap: np.ndarray) -> np.ndarray:
    heatmap = heatmap.astype(np.float32)
    heatmap -= heatmap.min()
    max_value = heatmap.max()
    if max_value > 0:
        heatmap /= max_value
    return heatmap


def overlay_heatmap(
    image: np.ndarray,
    heatmap: np.ndarray,
    alpha: float = 0.4,
    colormap: int = cv2.COLORMAP_JET,
) -> np.ndarray:
    """Overlay a Grad-CAM heatmap on an RGB image."""
    heatmap = cv2.resize(heatmap, (image.shape[1], image.shape[0]))
    heatmap = np.uint8(255 * heatmap)
    colored_heatmap = cv2.applyColorMap(heatmap, colormap)
    colored_heatmap = cv2.cvtColor(colored_heatmap, cv2.COLOR_BGR2RGB)

    overlay = cv2.addWeighted(image, 1 - alpha, colored_heatmap, alpha, 0)
    return overlay


def save_image_rgb(image: np.ndarray, output_path: Union[str, Path]) -> str:
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(output_path), cv2.cvtColor(image, cv2.COLOR_RGB2BGR))
    return str(output_path)


def generate_gradcam(
    model: nn.Module,
    image_path: Union[str, Path],
    output_path: Union[str, Path],
    target_layer: Optional[nn.Module] = None,
    image_size: Tuple[int, int] = (224, 224),
    class_idx: Optional[int] = None,
    alpha: float = 0.4,
    device: Optional[Union[str, torch.device]] = None,
) -> str:
    """Generate and save a Grad-CAM overlay for an input image."""
    device = torch.device(device) if device is not None else next(model.parameters()).device
    model = model.to(device)

    original_image = load_image_rgb(image_path)
    input_tensor = preprocess_image(original_image, image_size=image_size, device=device)

    gradcam = GradCAM(model, target_layer=target_layer)
    try:
        heatmap = gradcam.generate(input_tensor, class_idx=class_idx)
    finally:
        gradcam.remove_hooks()

    overlay = overlay_heatmap(original_image, heatmap, alpha=alpha)
    return save_image_rgb(overlay, output_path)
