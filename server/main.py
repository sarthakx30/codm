"""Main FastAPI application entry point for CODM Analytics Platform."""
import logging
import sys
from contextlib import asynccontextmanager
from pathlib import Path
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure root directory is in sys.path
SERVER_DIR = Path(__file__).resolve().parent
ROOT_DIR = SERVER_DIR.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from database.connection import db
from server.app.config import CORS_ORIGINS, PORT
from server.app.routers import aliases, health, matches, parse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("codm.server")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifespan."""
    logger.info("Initializing database schema...")
    await db.init_schema()
    logger.info(f"Database ready ({'Turso Cloud' if db._is_turso else 'Local SQLite'}).")
    yield
    logger.info("Server shutting down.")

app = FastAPI(
    title="CODM Match Analytics API",
    description="Esports analytics and match tracking API for Call of Duty: Mobile",
    version="2.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if "*" in CORS_ORIGINS else CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(health.router, prefix="/api")
app.include_router(matches.router, prefix="/api")
app.include_router(parse.router, prefix="/api")
app.include_router(aliases.router, prefix="/api")

@app.get("/")
async def root():
    return {
        "service": "CODM Match Analytics Platform API",
        "version": "2.0.0",
        "docs": "/docs",
        "health": "/api/health"
    }

if __name__ == "__main__":
    logger.info(f"Starting server on port {PORT}...")
    uvicorn.run("server.main:app", host="0.0.0.0", port=PORT, reload=True)
