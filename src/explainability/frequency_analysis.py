import numpy as np
import cv2
from typing import Dict, Any


def analyze_frequency_artifacts(image: np.ndarray) -> Dict[str, Any]:
    """
    Detect frequency-domain artifacts using FFT.
    Deepfakes often show unnatural patterns in the high-frequency spectrum.
    """
    if image.ndim == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
    else:
        gray = image

    # Compute FFT
    f = np.fft.fft2(gray)
    fshift = np.fft.fftshift(f)
    magnitude_spectrum = 20 * np.log(np.abs(fshift) + 1e-8)

    # Simple heuristic: energy in high frequencies
    rows, cols = gray.shape
    crow, ccol = rows // 2, cols // 2
    
    # Mask out the low frequencies
    mask_size = 30
    fshift[crow - mask_size : crow + mask_size, ccol - mask_size : ccol + mask_size] = 0
    
    high_freq_energy = np.abs(fshift).mean()
    
    # Standardized output
    return {
        "high_freq_energy": float(high_freq_energy),
        "artifact_detected": high_freq_energy > 100.0 # Threshold for demonstration
    }


def analyze_dct_artifacts(image: np.ndarray) -> Dict[str, Any]:
    """
    Detect compression artifacts using DCT.
    """
    if image.ndim == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
    else:
        gray = image
        
    gray_f = np.float32(gray)
    dct = cv2.dct(gray_f)
    
    # Analyze high-frequency coefficients
    high_freq_dct = np.abs(dct[64:, 64:]).mean() if gray.shape[0] > 64 else 0.0
    
    return {
        "dct_high_freq_mean": float(high_freq_dct),
        "artifact_detected": high_freq_dct > 50.0
    }
