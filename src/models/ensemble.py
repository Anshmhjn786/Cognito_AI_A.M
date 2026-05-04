from typing import Iterable

import torch
import torch.nn as nn


class AverageLogitEnsemble(nn.Module):
    """Average logits from multiple binary image classifiers."""

    def __init__(self, models: Iterable[nn.Module]):
        super().__init__()
        self.models = nn.ModuleList(list(models))
        if not self.models:
            raise ValueError("AverageLogitEnsemble requires at least one model.")
        print(f"[DEBUG][ensemble] Initialized with {len(self.models)} models.")

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        logits = [model(x) for model in self.models]
        stacked = torch.stack(logits, dim=0)
        print(f"[DEBUG][ensemble] Stacked logits shape={tuple(stacked.shape)}")
        return stacked.mean(dim=0)
