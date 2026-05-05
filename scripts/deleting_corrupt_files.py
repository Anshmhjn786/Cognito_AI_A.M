import os
import re

folder_path = r"D:/Projects/Machine_Learning Projects/Cognito_AI_A.M/data/raw/videos/fake"

pattern = re.compile(r"^\d{3}_\d{3}$")

deleted = 0
dry_run = False  # 🔥 set to False when ready

if not os.path.exists(folder_path):
    print("Folder does not exist!")
    exit()

for root, dirs, files in os.walk(folder_path):
    for file in files:
        name, ext = os.path.splitext(file)

        if ext.lower() == ".mp4":
            if len(name) <= 7 or pattern.match(name):
                file_path = os.path.join(root, file)

                if dry_run:
                    print(f"[DRY RUN] Would delete: {file_path}")
                else:
                    try:
                        os.remove(file_path)
                        deleted += 1
                        print(f"Deleted: {file_path}")
                    except Exception as e:
                        print(f"Error deleting {file_path}: {e}")

print(f"\nTotal deleted files: {deleted}")