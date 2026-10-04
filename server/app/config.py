"""Configuration management for the FastAPI server."""
import os
from pathlib import Path
from typing import List
from dotenv import load_dotenv

# Paths
SERVER_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = SERVER_DIR.parent

# Load .env if present
if (SERVER_DIR / ".env").exists():
    load_dotenv(SERVER_DIR / ".env")
elif (ROOT_DIR / ".env").exists():
    load_dotenv(ROOT_DIR / ".env")

def get_gemini_api_key() -> str:
    return os.environ.get("GEMINI_API_KEY", "").strip()

PORT = int(os.environ.get("PORT", 8000))
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.5-flash-lite")
GEMINI_FALLBACK = os.environ.get("GEMINI_FALLBACK", "gemini-3-flash")
TURSO_DATABASE_URL = os.environ.get("TURSO_DATABASE_URL", "")
TURSO_AUTH_TOKEN = os.environ.get("TURSO_AUTH_TOKEN", "")

# CORS origins
_raw_cors = os.environ.get(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000"
)
CORS_ORIGINS: List[str] = [x.strip() for x in _raw_cors.split(",") if x.strip()]
