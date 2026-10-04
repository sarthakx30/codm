"""Match repository: SQL access for matches and match_players."""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from database.connection import db
from server.app.schemas import MatchCreate, MatchUpdate, PlayerSchema

def _format_player(p: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "name": p.get("name", "?"),
        "score": int(p.get("score") or 0),
        "kills": int(p.get("kills") or 0),
        "deaths": int(p.get("deaths") or 0),
        "assists": int(p.get("assists") or 0),
        "impact": int(p.get("impact") or 0),
        "time": int(p.get("time") or 0),
        "mvp": bool(p.get("mvp"))
    }

async def get_all_matches() -> List[Dict[str, Any]]:
    """Retrieve all matches with nested us and them player lists."""
    matches = await db.fetch_all("SELECT * FROM matches ORDER BY COALESCE(played_at, added_at) ASC")
    if not matches:
        return []

    # Fetch all players in a single efficient query
    all_players = await db.fetch_all("SELECT * FROM match_players ORDER BY score DESC")
    
    players_by_match: Dict[str, Dict[str, List[Dict[str, Any]]]] = {}
    for p in all_players:
        mid = p["match_id"]
        team = p["team"]
        if mid not in players_by_match:
            players_by_match[mid] = {"us": [], "them": []}
        players_by_match[mid][team].append(_format_player(p))

    result = []
    for m in matches:
        mid = m["id"]
        roster = players_by_match.get(mid, {"us": [], "them": []})
        result.append({
            "id": mid,
            "result": m["result"],
            "score_us": m["score_us"],
            "score_them": m["score_them"],
            "mode": m["mode"],
            "map": m["map"],
            "played_at_raw": m["played_at_raw"],
            "played_at": m["played_at"],
            "added_at": m["added_at"],
            "opponent": m["opponent"],
            "tier": m["tier"],
            "game_type": m["game_type"],
            "us": roster["us"],
            "them": roster["them"]
        })
    return result

async def get_match_by_id(match_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve a single match by id with its player rosters."""
    m = await db.fetch_one("SELECT * FROM matches WHERE id = ?", (match_id,))
    if not m:
        return None
    players = await db.fetch_all("SELECT * FROM match_players WHERE match_id = ? ORDER BY score DESC", (match_id,))
    us = [_format_player(p) for p in players if p["team"] == "us"]
    them = [_format_player(p) for p in players if p["team"] == "them"]
    return {
        "id": m["id"],
        "result": m["result"],
        "score_us": m["score_us"],
        "score_them": m["score_them"],
        "mode": m["mode"],
        "map": m["map"],
        "played_at_raw": m["played_at_raw"],
        "played_at": m["played_at"],
        "added_at": m["added_at"],
        "opponent": m["opponent"],
        "tier": m["tier"],
        "game_type": m["game_type"],
        "us": us,
        "them": them
    }

async def save_match(match: MatchCreate, renames: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    """Insert or upsert a match, its player rosters, and aliases atomically."""
    now_iso = datetime.now(timezone.utc).isoformat(timespec="seconds")
    added_at = match.added_at or now_iso
    match_id = match.id

    match_sql = """
    INSERT INTO matches (id, result, score_us, score_them, mode, map, played_at_raw, played_at, added_at, opponent, tier, game_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
        result=excluded.result,
        score_us=excluded.score_us,
        score_them=excluded.score_them,
        mode=excluded.mode,
        map=excluded.map,
        played_at_raw=excluded.played_at_raw,
        played_at=excluded.played_at,
        opponent=excluded.opponent,
        tier=excluded.tier,
        game_type=excluded.game_type;
    """

    player_sql = """
    INSERT INTO match_players (match_id, team, name, score, kills, deaths, assists, impact, time, mvp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """

    alias_sql = """
    INSERT INTO aliases (raw_name, canonical_name, created_at)
    VALUES (?, ?, ?)
    ON CONFLICT(raw_name) DO UPDATE SET canonical_name=excluded.canonical_name;
    """

    # Build all statements for a single atomic transaction
    batch = [
        (match_sql, (
            match_id, match.result, match.score_us, match.score_them, match.mode, match.map,
            match.played_at_raw, match.played_at, added_at, match.opponent, match.tier, match.game_type
        )),
        ("DELETE FROM match_players WHERE match_id = ?", (match_id,)),
    ]

    for p in match.us:
        batch.append((player_sql, (
            match_id, "us", p.name, p.score, p.kills, p.deaths, p.assists, p.impact, p.time, 1 if p.mvp else 0
        )))

    for p in match.them:
        batch.append((player_sql, (
            match_id, "them", p.name, p.score, p.kills, p.deaths, p.assists, p.impact, p.time, 1 if p.mvp else 0
        )))

    if renames:
        for raw, canonical in renames.items():
            if raw and canonical:
                batch.append((alias_sql, (str(raw).strip(), str(canonical).strip(), now_iso)))

    await db.execute_batch(batch)

    return await get_match_by_id(match_id)

async def update_match_metadata(match_id: str, update: MatchUpdate) -> Optional[Dict[str, Any]]:
    """Update match metadata (opponent, tier, game_type)."""
    existing = await get_match_by_id(match_id)
    if not existing:
        return None

    opponent = update.opponent if update.opponent is not None else existing["opponent"]
    tier = update.tier if update.tier is not None else existing["tier"]
    game_type = update.game_type if update.game_type is not None else existing["game_type"]

    await db.execute(
        "UPDATE matches SET opponent = ?, tier = ?, game_type = ? WHERE id = ?",
        (opponent, tier, game_type, match_id)
    )
    return await get_match_by_id(match_id)

async def delete_match(match_id: str) -> bool:
    """Delete a match and cascade to match_players."""
    rows = await db.execute("DELETE FROM matches WHERE id = ?", (match_id,))
    return rows > 0
