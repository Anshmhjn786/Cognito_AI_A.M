import torch
import torch.nn as nn
from torchvision import models
from pathlib import Path
from typing import Optional, Union


class DeepfakeVideoModel(nn.Module):
    """
    CNN + LSTM model architecture for video-based deepfake detection.
    EXACTLY aligned with training notebooks (03_train_video_model.ipynb).
    """
    def __init__(self, hidden_dim: int = 256, dropout: float = 0.3):
        super().__init__()
        
        # 1. Backbone: EfficientNet-B0 (Features + AvgPool)
        backbone = models.efficientnet_b0(weights=models.EfficientNet_B0_Weights.IMAGENET1K_V1)
        self.feature_extractor = nn.Sequential(*list(backbone.children())[:-1])
        
        # 2. LSTM: Temporal modeling
        self.lstm = nn.LSTM(1280, hidden_dim, batch_first=True)
        
        # 3. Head: FC layers (MATCHED NAME: named 'fc' to align with trained weights)
        self.fc = nn.Sequential(
            nn.Linear(hidden_dim, 64),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(64, 1)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Input x shape: [batch, frames, channels, height, width]
        """
        batch_size, seq_len, c, h, w = x.shape
        
        # Reshape to [batch * frames, channels, height, width] for CNN
        x = x.view(batch_size * seq_len, c, h, w)
        
        # Extract features and flatten to [batch * frames, 1280]
        f = self.feature_extractor(x).view(batch_size * seq_len, -1)
        
        # Reshape back to [batch, frames, 1280] for LSTM
        f = f.view(batch_size, seq_len, -1)
        
        # LSTM: capture temporal patterns
        _, (h_n, _) = self.lstm(f)
        
        # Use the last hidden state for classification (h_n shape: [num_layers, batch, hidden_dim])
        logits = self.fc(h_n[-1])
        
        return logits


def load_video_model(
    checkpoint_path: Optional[Union[str, Path]] = None,
    device: str = "cpu",
    hidden_dim: int = 256
) -> DeepfakeVideoModel:
    """
    Load the video model with optional pretrained weights.
    Strictly enforces architecture match.
    """
    model = DeepfakeVideoModel(hidden_dim=hidden_dim)
    
    if checkpoint_path:
        checkpoint = torch.load(checkpoint_path, map_location=device)
        # Handle state_dict wrapped in a dictionary or direct state_dict
        state_dict = checkpoint.get("model_state_dict", checkpoint)
        
        # Enforce strict loading to catch architecture mismatches early
        model.load_state_dict(state_dict, strict=True)
        
    model.to(device)
    model.eval()
    return model
