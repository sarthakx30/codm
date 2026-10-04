"""Deterministic match deduplication fingerprint generator."""
import hashlib
from typing import Any, Dict, List

def generate_match_fingerprint(played_at_raw: str, score_us: int, score_them: int, us_players: List[Dict[str, Any]]) -> str:
    """Generate SHA-1 hash (first 10 hex characters) of match fingerprint.
    
    Formula:
    played_at_raw|score_us|score_them|kills/deaths/score|...
    """
    player_sigs = [f"{p.get('kills', 0)}/{p.get('deaths', 0)}/{p.get('score', 0)}" for p in us_players]
    sig = f"{played_at_raw}|{score_us}|{score_them}|" + "|".join(player_sigs)
    return hashlib.sha1(sig.encode("utf-8")).hexdigest()[:10]
