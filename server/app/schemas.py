"""Pydantic schemas for request and response validation."""
from typing import Dict, List, Optional
from pydantic import BaseModel, Field, field_validator

from .match_options import normalize_game_type, normalize_mode, normalize_tier


class PlayerSchema(BaseModel):
    name: str
    raw_name: Optional[str] = None
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
    tier: str = Field(default="", pattern=r"^(|[Tt][123][HhMmLl])$")
    game_type: str = ""

    @field_validator("tier")
    @classmethod
    def normalize_tier_value(cls, value: str) -> str:
        return normalize_tier(value) or ""

    @field_validator("mode")
    @classmethod
    def normalize_mode_value(cls, value: str) -> str:
        return normalize_mode(value)

    @field_validator("game_type")
    @classmethod
    def normalize_game_type_value(cls, value: str) -> str:
        return normalize_game_type(value)

class MatchCreate(MatchBase):
    id: Optional[str] = None
    added_at: Optional[str] = None
    us: List[PlayerSchema] = Field(default_factory=list)
    them: List[PlayerSchema] = Field(default_factory=list)

class MatchUpdate(BaseModel):
    opponent: Optional[str] = None
    tier: Optional[str] = Field(default=None, pattern=r"^(|[Tt][123][HhMmLl])$")
    mode: Optional[str] = None
    game_type: Optional[str] = None

    @field_validator("tier")
    @classmethod
    def normalize_tier_value(cls, value: Optional[str]) -> Optional[str]:
        return normalize_tier(value)

    @field_validator("mode")
    @classmethod
    def normalize_mode_value(cls, value: Optional[str]) -> Optional[str]:
        return normalize_mode(value) if value is not None else None

    @field_validator("game_type")
    @classmethod
    def normalize_game_type_value(cls, value: Optional[str]) -> Optional[str]:
        return normalize_game_type(value) if value is not None else None

class MatchOut(MatchBase):
    id: str
    added_at: str
    us: List[PlayerSchema] = Field(default_factory=list)
    them: List[PlayerSchema] = Field(default_factory=list)

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
