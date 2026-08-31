# ai-activity-tracker/ask_history.py

import sqlite3
import requests
from config import DB_FILE_PATH, OLLAMA_URL, OLLAMA_MODEL

def get_recent_activity_context(limit=100):
    conn = sqlite3.connect(DB_FILE_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT readable_time, category, app_name, summary, duration_seconds 
        FROM activity_logs 
        ORDER BY id DESC 
        LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    conn.close()

    context_lines = []
    for time_str, cat, app, summary, duration in reversed(rows):
        context_lines.append(f"[{time_str}] App: {app} | Category: {cat} | Duration: {duration}s | Activity: {summary}")
    return "\n".join(context_lines)

def ask_work_history(query: str):
    context = get_recent_activity_context(limit=80)
    
    prompt = f"""You are a helpful assistant with access to the user's recorded activity logs.
Answer the user's question accurately based ONLY on the provided activity history logs below.

LOGS HISTORY:
{context}

USER QUESTION: "{query}"

Instructions: Give a direct, concise, and helpful answer. Mention exact timestamps or names if relevant."""

    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False
    }

    print(f"\n🔍 Searching activity history for: '{query}'...")
    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=60)
        response.raise_for_status()
        answer = response.json().get("response", "")
        print("\n💡 Answer:")
        print(answer + "\n")
    except Exception as e:
        print(f"❌ Error getting answer: {e}")

if __name__ == "__main__":
    while True:
        try:
            user_input = input("💬 Ask your work history (or type 'exit'): ").strip()
            if not user_input or user_input.lower() == "exit":
                break
            ask_work_history(user_input)
        except KeyboardInterrupt:
            break