# ai-activity-tracker/config.py

# Local SQLite Database File
DB_FILE_PATH = "activity_tracker.db"

# Local File Logging (Optional JSONL Backup)
LOG_FILE_PATH = "activity_logs.jsonl"

OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "qwen2.5:3b"

POLL_INTERVAL_SECONDS = 5