# ai-activity-tracker/summary.py

import sqlite3
from datetime import datetime
import requests
from config import DB_FILE_PATH, OLLAMA_URL, OLLAMA_MODEL

def get_today_logs():
    today_str = datetime.now().strftime("%Y-%m-%d")
    conn = sqlite3.connect(DB_FILE_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT readable_time, category, app_name, summary, duration_seconds 
        FROM activity_logs 
        WHERE readable_time LIKE ? 
        ORDER BY id ASC
    """, (f"{today_str}%",))
    rows = cursor.fetchall()
    conn.close()
    return rows, today_str

def generate_analytics():
    rows, date_str = get_today_logs()
    if not rows:
        print(f"⚠️ No logs found for today ({date_str}). Make sure tracker.py has recorded data.")
        return

    category_time = {}
    app_time = {}
    total_seconds = 0
    activity_stream = []

    for time_str, cat, app, summary, duration in rows:
        dur = duration if duration else 0
        total_seconds += dur
        category_time[cat] = category_time.get(cat, 0) + dur
        app_time[app] = app_time.get(app, 0) + dur
        activity_stream.append(f"- [{time_str}] {app} ({cat}): {summary}")

    print("\n" + "="*60)
    print(f"📊 DAILY PRODUCTIVITY REPORT FOR {date_str}")
    print("="*60)
    
    print(f"\n⏱️  Total Tracked Time: {total_seconds // 60} mins ({total_seconds // 3600}h {(total_seconds % 3600) // 60}m)")
    
    print("\n🏷️  Time Spent by Category:")
    for cat, secs in sorted(category_time.items(), key=lambda x: x[1], reverse=True):
        print(f"  • {cat:<20}: {secs // 60:>4} mins ({round((secs/total_seconds)*100, 1) if total_seconds else 0}%)")

    print("\n💻 Top Applications:")
    for app, secs in sorted(app_time.items(), key=lambda x: x[1], reverse=True)[:5]:
        print(f"  • {app:<20}: {secs // 60:>4} mins")

    print("\n🤖 Generating AI Daily Standup Summary via Qwen...")
    
    # Send log history to Qwen2.5:3b for structured summary
    logs_text = "\n".join(activity_stream[:50]) # Send recent activities
    prompt = f"""
Below is a user's work log for today ({date_str}):
{logs_text}

Generate a concise, professional Standup Summary in bullet points:
1. Key Achievements / Main Tasks Completed
2. Research & Learning Activities
3. Overall Productivity Rating (High/Medium/Low) with a 1-sentence reason.
"""

    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False
    }

    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=60)
        response.raise_for_status()
        summary_text = response.json().get("response", "")
        print("\n" + "-"*60)
        print("📝 AI STANDUP SUMMARY")
        print("-"*60)
        print(summary_text)
        print("="*60 + "\n")
    except Exception as e:
        print(f"❌ Could not generate AI summary: {e}")

if __name__ == "__main__":
    generate_analytics()