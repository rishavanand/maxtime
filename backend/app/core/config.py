import os
import ssl
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[2] / ".env")

API_HOST = "api.anthropic.com"
STATUS_URL = "https://status.claude.com/api/v2/summary.json"
MESSAGES_URL = "https://api.anthropic.com/v1/messages"
USER_AGENT = "maxtime/1.0"

CLAUDE_API_COMPONENT_ID = "k8w3r06qmzrp"
CLAUDE_CODE_COMPONENT_ID = "yyzkbfz2thpt"
STATUS_COMPONENT_IDS = {CLAUDE_API_COMPONENT_ID, CLAUDE_CODE_COMPONENT_ID}

MODELS = [
    "claude-opus-4-6",
    "claude-sonnet-4-6",
    "claude-haiku-4-5-20251001",
]

MODEL_SHORT = {
    "claude-opus-4-6": "Opus",
    "claude-sonnet-4-6": "Sonnet",
    "claude-haiku-4-5-20251001": "Haiku",
}

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
MONGO_DB = os.environ.get("MONGO_DB", "maxtime")
MONITOR_INTERVAL_SECONDS = int(os.environ.get("MONITOR_INTERVAL_SECONDS", "120"))

# Reusable SSL context (avoids re-parsing CA bundle every cycle)
ssl_context = ssl.create_default_context()
