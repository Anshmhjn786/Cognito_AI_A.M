from pathlib import Path
import sys
import uuid

import cv2
from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.utils import secure_filename


BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.append(str(BACKEND_DIR))

from inference import main_inference


UPLOAD_DIR = PROJECT_ROOT / "outputs" / "uploads"
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = str(UPLOAD_DIR)
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024
CORS(app)


@app.route("/", methods=["GET"])
def health_check():
    return jsonify({"status": "ok"})


@app.route("/predict", methods=["POST"])
def predict():
    if "image" not in request.files:
        return jsonify({"error": "No image file provided. Use form field name 'image'."}), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "No selected image file."}), 400

    suffix = Path(file.filename).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        return jsonify({"error": f"Unsupported file type: {suffix}"}), 400

    upload_path = _save_temp_upload(file, suffix)

    try:
        image = cv2.imread(str(upload_path))
        if image is None:
            return jsonify({"error": "Uploaded file could not be decoded as an image."}), 400

        result = main_inference(image)
        return jsonify(result), 200
    except FileNotFoundError as error:
        return jsonify({"error": str(error)}), 500
    except Exception as error:
        return jsonify({"error": str(error)}), 500
    finally:
        upload_path.unlink(missing_ok=True)


def _save_temp_upload(file, suffix):
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    safe_name = secure_filename(file.filename)
    unique_name = f"{uuid.uuid4().hex}_{safe_name or 'upload'}"
    if not unique_name.lower().endswith(suffix):
        unique_name = f"{unique_name}{suffix}"

    upload_path = UPLOAD_DIR / unique_name
    file.save(upload_path)
    return upload_path


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
