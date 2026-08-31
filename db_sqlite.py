# ai-activity-tracker/db_sqlite.py

import sqlite3
from config import DB_FILE_PATH

def init_db():
    """Creates the SQLite database file and updated 'logs' table if not present."""
    conn = sqlite3.connect(DB_FILE_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS activity_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            readable_time TEXT NOT NULL,
            duration_seconds INTEGER DEFAULT 0,
            raw_window_title TEXT NOT NULL,
            category TEXT,
            app_name TEXT,
            summary TEXT,
            key_details TEXT
        )
    """)
    conn.commit()
    conn.close()

def insert_log(document: dict) -> int:
    """Inserts a structured log document into the SQLite database."""
    conn = sqlite3.connect(DB_FILE_PATH)
    cursor = conn.cursor()
    
    # Safely migration check if table was created in earlier version
    cursor.execute("PRAGMA table_info(activity_logs)")
    columns = [col[1] for col in cursor.fetchall()]
    if "readable_time" not in columns:
        cursor.execute("ALTER TABLE activity_logs ADD COLUMN readable_time TEXT")
    if "duration_seconds" not in columns:
        cursor.execute("ALTER TABLE activity_logs ADD COLUMN duration_seconds INTEGER DEFAULT 0")

    cursor.execute("""
        INSERT INTO activity_logs (timestamp, readable_time, duration_seconds, raw_window_title, category, app_name, summary, key_details)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        document.get("timestamp"),
        document.get("readable_time"),
        document.get("duration_seconds", 0),
        document.get("raw_window_title"),
        document.get("category"),
        document.get("app_name"),
        document.get("summary"),
        document.get("key_details")
    ))
    inserted_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return inserted_id

def update_last_duration(row_id: int, duration_seconds: int):
    """Updates the duration of the previous activity when a window switch occurs."""
    if not row_id:
        return
    conn = sqlite3.connect(DB_FILE_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE activity_logs 
        SET duration_seconds = ? 
        WHERE id = ?
    """, (duration_seconds, row_id))
    conn.commit()
    conn.close()