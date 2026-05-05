import os
import random
import shutil

# ======================
# PATHS
# ======================
RAW_BASE = "D:/Projects/Machine_Learning Projects/Cognito_AI_A.M/data/raw/videos"
SPLIT_BASE = "D:/Projects/Machine_Learning Projects/Cognito_AI_A.M/data/splits/videos"

CLASSES = ["real", "fake"]

# ======================
# CONFIG
# ======================
MAIN_SPLIT_RATIO = 0.7   # 70% → raw/videos/train-val-test
TRAIN_RATIO = 0.7
VAL_RATIO = 0.15
TEST_RATIO = 0.15

random.seed(42)

# ======================
# SAFETY CHECKS
# ======================
def check_path(path, name):
    if not os.path.exists(path):
        raise FileNotFoundError(f"❌ {name} not found: {path}")
    else:
        print(f"✅ Found {name}: {path}")

check_path(RAW_BASE, "RAW_BASE")
check_path(SPLIT_BASE, "SPLIT_BASE")

# ======================
# CREATE FOLDERS
# ======================
def create_structure(base_path):
    for split in ["train", "val", "test"]:
        for cls in CLASSES:
            path = os.path.join(base_path, split, cls)
            os.makedirs(path, exist_ok=True)

create_structure(RAW_BASE)
create_structure(SPLIT_BASE)

# ======================
# SPLIT FUNCTION
# ======================
def split_data(file_list):
    n = len(file_list)
    train_end = int(n * TRAIN_RATIO)
    val_end = train_end + int(n * VAL_RATIO)

    return {
        "train": file_list[:train_end],
        "val": file_list[train_end:val_end],
        "test": file_list[val_end:]
    }

# ======================
# PROCESS EACH CLASS
# ======================
for cls in CLASSES:
    print(f"\n📂 Processing class: {cls}")

    src_folder = os.path.join(RAW_BASE, cls)
    check_path(src_folder, f"{cls} source folder")

    files = [f for f in os.listdir(src_folder) if f.lower().endswith(".mp4")]
    random.shuffle(files)

    total = len(files)
    print(f"Total files: {total}")

    main_count = int(total * MAIN_SPLIT_RATIO)

    main_files = files[:main_count]       # 70%
    secondary_files = files[main_count:]  # 30%

    main_split = split_data(main_files)
    secondary_split = split_data(secondary_files)

    # ======================
    # MOVE 70% → RAW (train/val/test)
    # ======================
    for split, file_list in main_split.items():
        for file in file_list:
            src = os.path.join(src_folder, file)
            dst = os.path.join(RAW_BASE, split, cls, file)

            if os.path.exists(src):
                shutil.move(src, dst)

    # ======================
    # COPY 30% → SPLITS
    # IMPORTANT FIX:
    # Copy directly from original source list (secondary_files)
    # ======================
    for split, file_list in secondary_split.items():
        for file in file_list:
            src = os.path.join(src_folder, file)
            dst = os.path.join(SPLIT_BASE, split, cls, file)

            if os.path.exists(src):
                shutil.copy2(src, dst)

print("\n✅ Dataset split completed safely.")