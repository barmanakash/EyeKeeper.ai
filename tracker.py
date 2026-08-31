# ai-activity-tracker/tracker.py

import time
from datetime import datetime, timezone
import pygetwindow as gw
from config import POLL_INTERVAL_SECONDS, DB_FILE_PATH
from llm_parser import parse_window_title
from db_sqlite import init_db, insert_log, update_last_duration

def get_active_window_title():
    try:
        win = gw.getActiveWindow()
        if win and win.title:
            return win.title.strip()
    except Exception:
        pass
    return None

def run_tracker():
    init_db()
    
    print("🚀 AI Activity Tracker is active...")
    print(f"📁 Local SQLite File: {DB_FILE_PATH}")
    print("Press Ctrl+C to stop.\n")

    last_title = ""
    last_row_id = None
    start_time = None

    while True:
        try:
            current_title = get_active_window_title()

            if current_title and current_title != last_title:
                now_utc = datetime.now(timezone.utc)
                now_local = datetime.now()
                readable_time_str = now_local.strftime("%Y-%m-%d %I:%M:%S %p")

                # Update the duration of the previous activity
                if last_row_id and start_time:
                    duration = int((now_utc - start_time).total_seconds())
                    update_last_duration(last_row_id, duration)
                    print(f"⏱️ [Previous Activity Duration] {duration} seconds\n")

                print(f"⏰ [{readable_time_str}] Detected: {current_title[:60]}...")
                
                # Parse via Ollama
                analysis = parse_window_title(current_title)

                # Prepare Data Document
                document = {
                    "timestamp": now_utc.isoformat(),
                    "readable_time": readable_time_str,
                    "duration_seconds": 0,
                    "raw_window_title": current_title,
                    "category": analysis.get("category", "Other"),
                    "app_name": analysis.get("app_name", "Unknown"),
                    "summary": analysis.get("summary", ""),
                    "key_details": analysis.get("key_details", "")
                }

                # Save to SQLite DB File
                last_row_id = insert_log(document)
                start_time = now_utc
                last_title = current_title

                print(f"✅ [Saved to SQLite] Row ID: {last_row_id} | Time: {readable_time_str} | Category: {document['category']}")
                print(f"   Summary: {document['summary']}")

        except KeyboardInterrupt:
            # Handle duration for final active window before exit
            if last_row_id and start_time:
                duration = int((datetime.now(timezone.utc) - start_time).total_seconds())
                update_last_duration(last_row_id, duration)
            print("\nStopping Activity Tracker...")
            break
        except Exception as e:
            print(f"❌ Error: {e}")

        time.sleep(POLL_INTERVAL_SECONDS)

if __name__ == "__main__":
    run_tracker()