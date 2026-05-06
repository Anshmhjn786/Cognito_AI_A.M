import torch
import torch.nn as nn
import numpy as np
import cv2
from typing import Optional, Union, Tuple
from pathlib import Path

from src.data.preprocessing import preprocess_image


class GradCAM:
    """
    Grad-CAM implementation for visualizing model decisions.
    """
    def __init__(self, model: nn.Module, target_layer: Optional[nn.Module] = None):
        self.model = model
        self.target_layer = target_layer or self._find_last_conv_layer(model)
        self.activations = None
        self.gradients = None
        self.hooks = []
        self._register_hooks()

    def _find_last_conv_layer(self, model: nn.Module) -> nn.Module:
        for module in reversed(list(model.modules())):
            if isinstance(module, nn.Conv2d):
                return module
        raise ValueError("No Conv2d layer found in the model.")

    def _register_hooks(self):
        def forward_hook(module, input, output):
            self.activations = output.detach()

        def backward_hook(module, grad_input, grad_output):
            self.gradients = grad_output[0].detach()

        self.hooks.append(self.target_layer.register_forward_hook(forward_hook))
        self.hooks.append(self.target_layer.register_full_backward_hook(backward_hook))

    def generate(self, input_tensor: torch.Tensor) -> np.ndarray:
        self.model.eval()
        output = self.model(input_tensor)
        
        self.model.zero_grad()
        output.backward(retain_graph=True)
        
        weights = torch.mean(self.gradients, dim=(2, 3), keepdim=True)
        grad_cam = torch.sum(weights * self.activations, dim=1).squeeze()
        grad_cam = torch.relu(grad_cam)
        
        grad_cam = grad_cam.cpu().numpy()
        grad_cam = cv2.resize(grad_cam, (input_tensor.shape[3], input_tensor.shape[2]))
        
        # Normalize
        grad_cam -= grad_cam.min()
        if grad_cam.max() > 0:
            grad_cam /= grad_cam.max()
            
        return grad_cam

    def remove_hooks(self):
        for hook in self.hooks:
            hook.remove()


def apply_heatmap(image: np.ndarray, heatmap: np.ndarray, alpha: float = 0.4) -> np.ndarray:
    """
    Apply a heatmap overlay to an image.
    """
    heatmap_color = cv2.applyColorMap(np.uint8(255 * heatmap), cv2.COLORMAP_JET)
    heatmap_color = cv2.cvtColor(heatmap_color, cv2.COLOR_BGR2RGB)
    overlay = cv2.addWeighted(image, 1 - alpha, heatmap_color, alpha, 0)
    return overlay
