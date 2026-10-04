"""Health check endpoint for Render keep-alive and latency monitoring."""
import time
from datetime import datetime, timezone
from fastapi import APIRouter

from database.connection import db
from server.app.schemas import HealthResponse

router = APIRouter(prefix="/health", tags=["Health"])

@router.get("", response_model=HealthResponse)
async def check_health():
    """Lightweight keep-alive ping for Render and monitoring."""
    t0 = time.perf_counter()
    count_row = await db.fetch_one("SELECT COUNT(*) as count FROM matches")
    latency_ms = (time.perf_counter() - t0) * 1000

    matches_count = count_row["count"] if count_row else 0
    return HealthResponse(
        status="ok",
        timestamp=datetime.now(timezone.utc).isoformat(timespec="seconds"),
        db_latency_ms=round(latency_ms, 2),
        matches_count=matches_count,
        database_type="turso" if db._is_turso else "sqlite"
    )
