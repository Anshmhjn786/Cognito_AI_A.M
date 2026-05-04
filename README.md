# Cognito AI: Deepfake Detection System

## Overview

Cognito AI is a modular deepfake detection project built with PyTorch, OpenCV, Flask, and Grad-CAM explainability. The current implementation focuses on image-based deepfake classification while keeping the project structure ready for video and real-time detection.

The system supports the full machine learning lifecycle:

- Data preprocessing for images and videos
- PyTorch dataset loading from CSV manifests
- EfficientNet-based binary image classification
- Training, evaluation, and checkpoint saving
- Grad-CAM visual explanations
- Flask deployment through a `/predict` API endpoint

At inference time, a user uploads an image, the backend runs the trained model, predicts whether the image is `real` or `fake`, generates a Grad-CAM heatmap, and returns a JSON response.

## Project Structure

```text
Cognito_AI_A.M/
|-- configs/
|   |-- image_config.yaml
|   |-- training_config.yaml
|   |-- video_config.yaml
|
|-- data/
|   |-- raw/
|   |-- processed/
|
|-- models/
|   |-- checkpoints/
|   |-- image/
|   |-- video/
|
|-- notebooks/
|   |-- 01_data_exploration.ipynb
|   |-- 02_preprocessing.ipynb
|   |-- 03_train_image_model.ipynb
|   |-- 04_train_video_model.ipynb
|   |-- 05_evaluation.ipynb
|
|-- outputs/
|   |-- logs/
|   |-- predictions/
|   |-- visualizations/
|
|-- src/
|   |-- data/
|   |   |-- augmentation.py
|   |   |-- loader.py
|   |   |-- preprocessing.py
|   |
|   |-- evaluation/
|   |   |-- cross_dataset.py
|   |   |-- evaluate.py
|   |   |-- metrics.py
|   |
|   |-- explainability/
|   |   |-- frequency_analysis.py
|   |   |-- gradcam.py
|   |   |-- heatmap.py
|   |
|   |-- models/
|   |   |-- ensemble.py
|   |   |-- image_model.py
|   |   |-- realtime_model.py
|   |   |-- video_model.py
|   |
|   |-- training/
|   |   |-- trainer_utils.py
|   |   |-- train_image.py
|   |   |-- train_video.py
|   |
|   |-- utils/
|       |-- config.py
|       |-- helpers.py
|       |-- logger.py
|
|-- webapp/
|   |-- backend/
|   |   |-- app.py
|   |   |-- inference.py
|   |   |-- routes/
|   |       |-- predict.py
|   |
|   |-- frontend/
|   |-- static/
|
|-- requirements.txt
|-- run.py
|-- README.md
|-- LICENSE
```

## Folder Explanation

### `configs/`

Stores YAML configuration files used by training, evaluation, and future video workflows.

- `image_config.yaml`: Main image-model configuration such as batch size, epochs, learning rate, image size, model name, and CSV paths.
- `training_config.yaml`: General training configuration placeholder for shared or expanded training settings.
- `video_config.yaml`: Configuration placeholder for future video-based deepfake detection.

### `data/`

Stores dataset files.

- `data/raw/`: Original unprocessed media such as real and fake videos or images.
- `data/processed/`: Preprocessed images, extracted frames, and generated CSV manifests used for training and evaluation.

### `models/`

Stores model checkpoints and trained weights.

- `models/checkpoints/`: General checkpoint storage for experiments.
- `models/image/`: Trained image-classification checkpoints used by the Flask inference backend.
- `models/video/`: Reserved for future video-model checkpoints.

### `notebooks/`

Contains experimental notebooks for exploration, preprocessing, model training, and evaluation. These are useful for research and debugging but are separate from the production-style Python modules in `src/`.

### `outputs/`

Stores generated artifacts.

- `outputs/logs/`: Training or application logs.
- `outputs/predictions/`: Saved prediction outputs.
- `outputs/visualizations/`: Grad-CAM heatmaps and other explainability images.

### `src/`

Contains the core machine learning code.

- `src/data/`: Dataset loading, preprocessing, and augmentation utilities.
- `src/models/`: PyTorch model definitions for image, video, realtime, and ensemble models.
- `src/training/`: Training scripts and training helpers.
- `src/evaluation/`: Evaluation scripts and metric calculation.
- `src/explainability/`: Grad-CAM and visualization tools.
- `src/utils/`: Shared helpers for configuration, logging, and utilities.

### `webapp/`

Contains the deployment layer.

- `webapp/backend/`: Flask API and inference pipeline.
- `webapp/backend/routes/`: Route modules for future route separation.
- `webapp/frontend/`: Placeholder for a user interface.
- `webapp/static/`: Static web assets.

## File-Level Explanation

### `src/data/loader.py`

Defines `DeepfakeImageDataset`, a PyTorch `Dataset` that reads a CSV with `image_path` and `label` columns. It loads images with OpenCV, converts BGR to RGB, applies optional Albumentations transforms, handles missing or corrupt images safely, and returns an image tensor with its label. It also provides `get_dataloader()` for creating PyTorch dataloaders.

### `src/data/preprocessing.py`

Contains reusable preprocessing utilities for both image and video data. It can extract frames from videos, resize images to `224x224`, normalize using ImageNet mean and standard deviation, process mixed image/video records, and save processed paths with labels into CSV files.

### `src/models/image_model.py`

Defines `DeepfakeImageModel`, a PyTorch model wrapper around `timm`. It loads a pretrained EfficientNet-style backbone, replaces the final classifier with a binary output layer, and supports sigmoid output for inference or raw logits for training with `BCEWithLogitsLoss`.

### `src/training/train_image.py`

Implements the image training loop. It loads YAML config, builds train and validation dataloaders, initializes the model, uses Adam optimization, tracks training loss, validation loss, and accuracy, and saves both the best model and the last checkpoint.

### `src/evaluation/evaluate.py`

Loads a trained image model checkpoint, runs inference on the test dataset, generates predictions, calculates metrics, saves results as JSON, and saves a confusion matrix plot.

### `src/evaluation/metrics.py`

Implements evaluation metrics using `sklearn.metrics`: accuracy, precision, recall, F1-score, and confusion matrix. Results are returned in dictionary format.

### `src/explainability/gradcam.py`

Implements Grad-CAM using PyTorch hooks. It captures CNN activations and gradients, generates a heatmap for an input image, overlays the heatmap on the original image, and saves the visualization.

### `webapp/backend/inference.py`

Contains the backend inference pipeline. It loads the trained PyTorch model from `models/image/` using a singleton pattern, preprocesses uploaded images, runs prediction, generates a Grad-CAM heatmap, and returns the final inference result.

### `webapp/backend/app.py`

Defines the Flask backend. It enables CORS, exposes the `/predict` endpoint, saves uploaded images temporarily, reads them with OpenCV, calls `main_inference()`, returns JSON, and runs on port `5000`.

## End-to-End Pipeline

### Training Flow

```text
raw data
  -> src/data/preprocessing.py
  -> processed images / extracted frames + CSV manifest
  -> src/data/loader.py
  -> DeepfakeImageDataset + DataLoader
  -> src/models/image_model.py
  -> src/training/train_image.py
  -> saved model checkpoint
```

Step-by-step:

1. Raw images or videos are stored in `data/raw/`.
2. `preprocessing.py` resizes images or extracts frames from videos.
3. Processed files are saved under `data/processed/`.
4. A CSV manifest is created with:

```csv
image_path,label
path/to/image_001.jpg,0
path/to/image_002.jpg,1
```

5. `loader.py` reads the CSV and returns tensors and labels.
6. `image_model.py` creates the EfficientNet-based binary classifier.
7. `train_image.py` trains the model using `BCEWithLogitsLoss`.
8. The best and last checkpoints are saved for evaluation and deployment.

### Evaluation Flow

```text
saved model
  -> src/evaluation/evaluate.py
  -> test DataLoader
  -> predictions
  -> src/evaluation/metrics.py
  -> JSON results + confusion matrix plot
```

Step-by-step:

1. `evaluate.py` loads a saved checkpoint.
2. The test CSV is loaded through `loader.py`.
3. The model generates logits and probabilities.
4. `metrics.py` calculates accuracy, precision, recall, F1-score, and confusion matrix.
5. Results are saved under `outputs/evaluation/`.
6. The confusion matrix plot is saved as an image.

### Inference Flow

```text
user image
  -> Flask /predict route
  -> webapp/backend/inference.py
  -> preprocessing
  -> trained model
  -> Grad-CAM
  -> response JSON
```

Step-by-step:

1. A user uploads an image to the Flask `/predict` endpoint.
2. `app.py` saves the uploaded image temporarily.
3. OpenCV reads the image into a NumPy array.
4. `inference.py` preprocesses the image.
5. The trained model predicts `real` or `fake`.
6. `gradcam.py` generates an explainability heatmap.
7. The API returns the prediction, confidence score, and heatmap path.

## Data Flow Explanation

Images move through the system in different forms depending on the stage:

1. Raw file stage:
   Images and videos are stored on disk in `data/raw/`.

2. Preprocessing stage:
   `preprocessing.py` loads files with OpenCV, extracts video frames when needed, resizes images to `224x224`, and writes processed files to `data/processed/`.

3. Manifest stage:
   Processed image paths and labels are saved into CSV files. These CSV files are the bridge between preprocessing and model training.

4. Dataset stage:
   `loader.py` reads image paths from CSV, loads each image with OpenCV, converts BGR to RGB, applies optional Albumentations transforms, converts the image to a tensor, and returns `(image_tensor, label)`.

5. Training stage:
   `train_image.py` receives batches from the dataloader and passes image tensors into `DeepfakeImageModel`.

6. Prediction stage:
   The model outputs a binary logit. During training, logits are passed to `BCEWithLogitsLoss`. During inference, logits are converted to probabilities using sigmoid.

7. Explainability stage:
   `gradcam.py` uses model gradients and CNN feature maps to generate a heatmap. The heatmap is overlaid on the original image and saved under `outputs/visualizations/`.

## Setup Instructions

### 1. Create Conda Environment

```bash
conda create -n cognito-ai python=3.10 -y
conda activate cognito-ai
```

### 2. Install PyTorch with CUDA

Install the CUDA build that matches your GPU and driver. Example for CUDA 12.1:

```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
```

For CPU-only systems:

```bash
pip install torch torchvision torchaudio
```

### 3. Install Project Requirements

```bash
pip install -r requirements.txt
```

## Configuration

The image pipeline can be configured from `configs/image_config.yaml`:

```yaml
batch_size: 32
epochs: 10
learning_rate: 0.0001
image_size: 224
model_name: efficientnet_b0
train_csv: path
val_csv: path
test_csv: path
device: cuda
```

Replace the placeholder CSV paths with real files before training or evaluation.

## Run Instructions

### Train Image Model

```bash
python src/training/train_image.py --config configs/image_config.yaml
```

Expected outputs:

- Best model checkpoint
- Last training checkpoint
- Per-epoch training logs

Place the trained image checkpoint in:

```text
models/image/
```

The backend searches this folder for common checkpoint names such as:

- `best_image_model.pth`
- `last_image_checkpoint.pth`
- `model.pth`
- `checkpoint.pth`

### Evaluate Image Model

```bash
python src/evaluation/evaluate.py --config configs/image_config.yaml
```

Expected outputs:

- JSON metrics file in `outputs/evaluation/`
- Confusion matrix plot in `outputs/evaluation/`

### Run Flask Server

```bash
python webapp/backend/app.py
```

The backend runs at:

```text
http://localhost:5000
```

Health check:

```bash
curl http://localhost:5000/
```

## API Documentation

### `POST /predict`

Runs deepfake detection on an uploaded image and returns the prediction result.

URL:

```text
http://localhost:5000/predict
```

Request type:

```text
multipart/form-data
```

Input field:

| Field | Type | Description |
|---|---|---|
| `image` | File | Image file to classify. Supported formats include JPG, JPEG, PNG, BMP, and WEBP. |

Example request:

```bash
curl -X POST http://localhost:5000/predict \
  -F "image=@sample.jpg"
```

Example response:

```json
{
  "label": "fake",
  "confidence": 0.9472,
  "heatmap_path": "outputs/visualizations/gradcam_1714829000000.jpg"
}
```

Response fields:

| Field | Type | Description |
|---|---|---|
| `label` | string | Predicted class, either `real` or `fake`. |
| `confidence` | float | Confidence score between `0` and `1`. |
| `heatmap_path` | string | Saved Grad-CAM visualization path. |

Common error response:

```json
{
  "error": "No image file provided. Use form field name 'image'."
}
```

## Design Decisions

### Modular Architecture

The project separates data processing, model definition, training, evaluation, explainability, and deployment into different modules. This makes the code easier to test, debug, and extend.

### Separation of Training and Inference

Training code lives under `src/training/`, while deployment code lives under `webapp/backend/`. This prevents Flask request handling from being mixed with model training logic.

### CSV-Based Dataset Interface

The training pipeline uses CSV manifests with `image_path` and `label` columns. This keeps the dataset format simple and allows the same loader to work with images extracted from videos or standalone image datasets.

### EfficientNet via `timm`

The image model uses `timm` so the backbone can be changed easily. The default model is `efficientnet_b0`, but the config can point to another compatible model.

### `BCEWithLogitsLoss` for Training

The training script uses raw logits with `BCEWithLogitsLoss`, which is numerically more stable than applying sigmoid before binary cross-entropy.

### Singleton Model Loading

The Flask inference pipeline loads the trained model only once. This avoids expensive model reloads for every API request.

### Explainability Integration

Grad-CAM is integrated into inference so every prediction can include a visual explanation. This helps users inspect which image regions influenced the model decision.

## Future Work

### Video Model

Add `src/models/video_model.py` and `src/training/train_video.py` support for temporal deepfake detection using frame sequences, CNN-LSTM models, 3D CNNs, or transformer-based video models.

### Real-Time Webcam Detection

Extend `src/models/realtime_model.py` and the web application to support webcam streams, frame sampling, live prediction, and real-time Grad-CAM visualization.

### Ensemble Models

Use `src/models/ensemble.py` to combine multiple image and video models. Ensemble predictions can improve robustness across different datasets and manipulation methods.

### Cross-Dataset Evaluation

Expand `src/evaluation/cross_dataset.py` to measure how well the model generalizes across different deepfake datasets.

### Improved Frontend

Build a frontend that allows users to upload images, view predictions, inspect Grad-CAM overlays, and compare previous results.

### Model Registry

Add model versioning so the backend can select between multiple trained checkpoints and track model performance over time.

## Summary

Cognito AI is designed as a practical deepfake detection system with a clean separation between data preparation, model training, evaluation, explainability, and deployment. The current image pipeline is ready for experimentation and backend inference, while the folder structure provides a clear path toward video, real-time, and ensemble-based detection.
