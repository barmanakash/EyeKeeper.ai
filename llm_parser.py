# ai-activity-tracker/llm_parser.py

import json
import requests
from config import OLLAMA_URL, OLLAMA_MODEL

def parse_window_title(window_title: str) -> dict:
    prompt = f"""Analyze this active window title: "{window_title}"
Extract structured information into JSON with keys: "category", "app_name", "summary", "key_details".
Categories must be one of: ["Coding", "Job Search", "Entertainment", "Social Media", "Browsing", "Other"].
Return ONLY raw JSON."""

    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "format": "json",
        "keep_alive": "1h",
        "options": {
            "num_predict": 150
        }
    }

    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=60)
        response.raise_for_status()
        result_text = response.json().get("response", "{}")
        return json.loads(result_text)
    except Exception as e:
        print(f"[LLM Error] Fallback triggered: {e}")
        return {
            "category": "Uncategorized",
            "app_name": "Unknown",
            "summary": window_title,
            "key_details": "N/A"
        }