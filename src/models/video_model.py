import torch
import torch.nn as nn
from torchvision import models
from pathlib import Path
from typing import Optional, Union


class DeepfakeVideoModel(nn.Module):
    """
    CNN + LSTM model architecture for video-based deepfake detection.
    
    The CNN (EfficientNet-B0) extracts frame-level features.
    The LSTM captures temporal inconsistencies across the sequence.
    """
    def __init__(self, feature_dim: int = 1280, hidden_dim: int = 256, num_layers: int = 1):
        super().__init__()
        
        # CNN Backbone (Feature Extractor)
        # We remove the classifier to get raw features
        cnn = models.efficientnet_b0(weights=models.EfficientNet_B0_Weights.DEFAULT)
        self.feature_extractor = nn.Sequential(*list(cnn.children())[:-1])
        
        # LSTM Layer
        self.lstm = nn.LSTM(
            input_size=feature_dim, 
            hidden_size=hidden_dim, 
            num_layers=num_layers, 
            batch_first=True
        )
        
        # Final Classifier (Aligned with Training Notebook)
        self.classifier = nn.Sequential(
            nn.Linear(hidden_dim, 64),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(64, 1)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Input x shape: [batch, frames, channels, height, width]
        """
        batch_size, seq_len, c, h, w = x.shape
        
        # Reshape to [batch * frames, channels, height, width] for CNN
        x = x.view(batch_size * seq_len, c, h, w)
        features = self.feature_extractor(x)  # [batch * frames, feature_dim, 1, 1]
        features = features.view(batch_size, seq_len, -1)  # [batch, frames, feature_dim]
        
        # LSTM
        lstm_out, (h_n, c_n) = self.lstm(features)  # [batch, frames, hidden_dim]
        
        # Use the last hidden state for classification (Aligned with Training Notebook)
        last_hidden = h_n[-1]  # [batch, hidden_dim]
        
        logits = self.classifier(last_hidden)  # [batch, 1]
        return logits


def load_video_model(
    checkpoint_path: Optional[Union[str, Path]] = None,
    device: str = "cpu"
) -> DeepfakeVideoModel:
    """
    Load the video model with optional pretrained weights.
    """
    model = DeepfakeVideoModel()
    
    if checkpoint_path:
        checkpoint = torch.load(checkpoint_path, map_location=device)
        state_dict = checkpoint.get("model_state_dict", checkpoint)
        model.load_state_dict(state_dict)
        
    model.to(device)
    model.eval()
    return model
