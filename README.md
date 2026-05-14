# Cognito AI A.M: Full-Stack Deepfake Detection System

Cognito AI A.M is a sophisticated full-stack platform designed to detect synthetic media (Deepfakes) using state-of-the-art Computer Vision and Deep Learning architectures. The system provides a unified interface for analyzing both images and videos, leveraging high-performance backends and modern frontends to deliver real-time predictions.

## 🚀 Project Overview

In an era of rapidly evolving generative AI, Cognito AI A.M serves as a defensive layer against misinformation. By utilizing ensemble models and advanced frame-aggregation techniques, the system identifies subtle artifacts and temporal inconsistencies that distinguish manipulated content from authentic media.

- **Objective:** Provide a reliable, scalable, and user-friendly tool for media integrity verification.
- **Core Logic:** Multi-stage analysis pipeline involving frame extraction, facial landmarking (where applicable), and feature extraction using 3D CNNs.

---

## 🛠 Tech Stack

### Backend
- **Framework:** FastAPI (High-performance Python web framework)
- **Deep Learning:** PyTorch, PyTorchVideo
- **Computer Vision:** OpenCV, PIL
- **Concurrency:** Uvicorn (ASGI server)

### Frontend
- **Library:** React.js
- **State Management:** Modern React Hooks
- **Styling:** CSS3 / Modern UI Components

### Machine Learning Models
- **Image Detection:** EfficientNet-based CNNs for high-resolution artifact detection.
- **Video Detection:** X3D (3D CNN) for temporal feature extraction and frame-based aggregation pipelines.
- **Pipeline:** Automated frame extraction, normalization, and inference orchestration.

---

## ✨ Key Features

- **Image Deepfake Analysis:** Upload static images to get an instant real/fake probability score.
- **Video Deepfake Detection:** Process complex video files using X3D architectures to detect frame-level and temporal manipulations.
- **Intelligent Frame Extraction:** Dynamic sampling of video frames to optimize processing speed without sacrificing accuracy.
- **Automated Metadata Analysis:** Basic checks for file consistency and structural anomalies.
- **Interactive Swagger Documentation:** Built-in API testing interface via `/docs`.

---

## 📂 Project Structure

```bash
Cognito_AI_A.M/
├── webapp/
│   ├── backend/                # FastAPI Application
│   │   ├── app/
│   │   │   ├── core/           # Config, Model Management, Security
│   │   │   ├── routes/         # API Endpoints (/predict-image, /predict-video)
│   │   │   ├── services/       # Business Logic (Video processing, Inference)
│   │   │   ├── schemas/        # Pydantic models for Request/Response
│   │   │   └── main.py         # Application Entry point
│   ├── frontend/               # React Application
│   │   └── src/                # UI Components and Logic
├── src/
│   ├── inference/              # Core ML inference scripts
├── models/                     # Saved model weights (.pth files)
├── notebooks/                  # Training & Research notebooks
│   └── video_notebooks/        # X3D and Video pipeline experiments
├── configs/                    # Model and System configurations
└── requirements.txt            # Project dependencies
```

---

## ⚙️ Setup Instructions

### Backend Setup
1. **Environment Creation:**
   ```bash
   conda create -n cognito_env python=3.10
   conda activate cognito_env
   ```
2. **Dependency Installation:**
   ```bash
   pip install -r requirements.txt
   ```
3. **Run the Server:**
   ```bash
   cd webapp/backend
   uvicorn app.main:app --reload
   ```

### Frontend Setup
1. **Navigate to Directory:**
   ```bash
   cd webapp/frontend
   ```
2. **Install Dependencies:**
   ```bash
   npm install
   ```
3. **Start Development Server:**
   ```bash
   npm start
   ```

---

## 🔌 API Endpoints

The backend provides a RESTful API for media analysis. Detailed documentation is available at `http://localhost:8000/docs`.

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/predict-image` | `POST` | Accepts an image file and returns prediction (Real/Fake) + Confidence. |
| `/predict-video` | `POST` | Accepts a video file for temporal analysis using the X3D pipeline. |

---

## 🗺 Version Roadmap

### **v1.0** (Current)
- Initial deployment of Image and Video detection modules.
- Implementation of basic CNN + LSTM aggregation for video processing.
- Core FastAPI infrastructure and React UI.

### **v1.5**
- Migration to improved Video models with training on expanded datasets (DFDC/FaceForensics++).
- Enhanced frame sampling algorithms.

### **v2.0**
- Integration of a dedicated **AI-Generated Content Detection** model (GenAI Image Detection).
- Refined UI for detailed report generation.

### **v2.5**
- Advanced AI-generated video detection.
- Deep metadata integration for forensic analysis.

### **v3.0**
- Major UI/UX overhaul for enterprise-grade experience.
- Launch of a dedicated **Research Page** for academic/forensic insights.
- System-wide performance optimizations and batch processing support.

---

## 🔮 Future Work

- **Real-time Detection:** Implementation of low-latency stream analysis for live video feeds.
- **Cloud Deployment:** Orchestration using Docker & Kubernetes for scalable cloud hosting.
- **Model Explainability:** Integrating Grad-CAM or similar tools to visualize *why* a piece of media was flagged.
- **Accuracy Improvements:** Continuous fine-tuning on emerging deepfake techniques.

---

## 👥 Contributors

- **Author:** [Your Name / Team Name]
- **Project Link:** [https://github.com/Anshmhjn786/Cognito_AI_A.M](https://github.com/Anshmhjn786/Cognito_AI_A.M)

---
*Disclaimer: This tool is intended for research and educational purposes. No detection system is 100% accurate; results should be used as one of many factors in media verification.*
