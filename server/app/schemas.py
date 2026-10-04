"""Pydantic schemas for request and response validation."""
from typing import Dict, List, Optional
from pydantic import BaseModel, Field

class PlayerSchema(BaseModel):
    name: str
    score: int = 0
    kills: int = 0
    deaths: int = 0
    assists: int = 0
    impact: int = 0
    time: int = 0
    mvp: bool = False

class MatchBase(BaseModel):
    result: str = Field(..., pattern="^[WL]$")
    score_us: int = 0
    score_them: int = 0
    mode: str = ""
    map: str = ""
    played_at_raw: str = ""
    played_at: Optional[str] = None
    opponent: str = ""
    tier: str = ""
    game_type: str = ""

class MatchCreate(MatchBase):
    id: Optional[str] = None
    added_at: Optional[str] = None
    us: List[PlayerSchema] = []
    them: List[PlayerSchema] = []

class MatchUpdate(BaseModel):
    opponent: Optional[str] = None
    tier: Optional[str] = None
    game_type: Optional[str] = None

class MatchOut(MatchBase):
    id: str
    added_at: str
    us: List[PlayerSchema] = []
    them: List[PlayerSchema] = []

class MatchSaveRequest(BaseModel):
    match: MatchCreate
    renames: Optional[Dict[str, str]] = None

class ParseResponse(BaseModel):
    match: MatchOut
    duplicate: bool

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    db_latency_ms: float
    matches_count: int
    database_type: str
