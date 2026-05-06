import uvicorn
import os
import sys
from pathlib import Path

# Add project root to sys.path
backend_dir = Path(__file__).resolve().parent
project_root = backend_dir.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

if __name__ == "__main__":
    # Change CWD to backend dir to keep uploads local
    os.chdir(backend_dir)
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
