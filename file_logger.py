# ai-activity-tracker/file_logger.py

import json
from config import LOG_FILE_PATH

def append_to_local_file(data: dict):
    """Appends a single activity document as a JSON line to a local file."""
    try:
        with open(LOG_FILE_PATH, "a", encoding="utf-8") as f:
            f.write(json.dumps(data, ensure_ascii=False) + "\n")
        print(f"📁 [Saved to File] {LOG_FILE_PATH}")
    except Exception as e:
        print(f"❌ [File Log Error]: {e}")