"""Database migration script: imports historical matches and aliases from data.json into SQLite or Turso."""
import argparse
import asyncio
from datetime import datetime, timezone
import json
from pathlib import Path
import sys
from typing import Optional

from database.connection import DEFAULT_LOCAL_DB, Database

ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_FILE = ROOT_DIR / "legacy" / "data.json"
if not DATA_FILE.exists():
    DATA_FILE = ROOT_DIR / "data.json"

async def run_migration(json_path: Path = DATA_FILE, db_url: Optional[str] = None, auth_token: Optional[str] = None) -> None:
    print("=" * 60)
    print("CODM Match Analytics Platform - Database Migration")
    print("=" * 60)

    if not json_path.exists():
        print(f"[ERROR] Source file not found: {json_path}")
        sys.exit(1)

    with open(json_path, "r", encoding="utf-8") as f:
        source_data = json.load(f)

    matches = source_data.get("matches", [])
    aliases = source_data.get("aliases", {})
    print(f"[INFO] Source data: {len(matches)} matches, {len(aliases)} aliases found in {json_path.name}")

    db = Database(db_url=db_url, auth_token=auth_token)
    target_info = "Turso Cloud (libSQL)" if db._is_turso else f"Local SQLite ({DEFAULT_LOCAL_DB})"
    print(f"[INFO] Destination: {target_info}")

    print("[1/3] Initializing database schema...")
    await db.init_schema()
    print("      Schema initialized successfully.")

    print("[2/3] Migrating match and player records...")
    match_insert_sql = """
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
        added_at=excluded.added_at,
        opponent=excluded.opponent,
        tier=excluded.tier,
        game_type=excluded.game_type;
    """

    player_insert_sql = """
    INSERT INTO match_players (match_id, team, name, score, kills, deaths, assists, impact, time, mvp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """

    alias_insert_sql = """
    INSERT INTO aliases (raw_name, canonical_name, created_at)
    VALUES (?, ?, ?)
    ON CONFLICT(raw_name) DO UPDATE SET
        canonical_name=excluded.canonical_name;
    """

    statements = []
    total_players = 0
    hp_time_players = 0
    now_iso = datetime.now(timezone.utc).isoformat(timespec="seconds")

    for m in matches:
        match_id = str(m.get("id"))
        result = "W" if m.get("result") == "W" else "L"
        score_us = int(m.get("score_us") or 0)
        score_them = int(m.get("score_them") or 0)
        mode = str(m.get("mode") or "").strip()
        map_name = str(m.get("map") or "").strip()
        played_at_raw = str(m.get("played_at_raw") or "").strip()
        played_at = m.get("played_at")
        added_at = str(m.get("added_at") or now_iso)
        opponent = str(m.get("opponent") or "").strip()
        tier = str(m.get("tier") or "").strip()
        game_type = str(m.get("game_type") or "").strip().lower()

        statements.append((match_insert_sql, (
            match_id, result, score_us, score_them, mode, map_name,
            played_at_raw, played_at, added_at, opponent, tier, game_type
        )))

        statements.append(("DELETE FROM match_players WHERE match_id = ?", (match_id,)))

        for p in m.get("us") or []:
            name = str(p.get("name") or "?").strip()
            score = int(p.get("score") or 0)
            kills = int(p.get("kills") or 0)
            deaths = int(p.get("deaths") or 0)
            assists = int(p.get("assists") or 0)
            impact = int(p.get("impact") or 0)
            t = int(p.get("time") or 0)
            mvp = 1 if p.get("mvp") else 0
            if t > 0:
                hp_time_players += 1
            statements.append((player_insert_sql, (
                match_id, "us", name, score, kills, deaths, assists, impact, t, mvp
            )))
            total_players += 1

        for p in m.get("them") or []:
            name = str(p.get("name") or "?").strip()
            score = int(p.get("score") or 0)
            kills = int(p.get("kills") or 0)
            deaths = int(p.get("deaths") or 0)
            assists = int(p.get("assists") or 0)
            impact = int(p.get("impact") or 0)
            t = int(p.get("time") or 0)
            mvp = 1 if p.get("mvp") else 0
            statements.append((player_insert_sql, (
                match_id, "them", name, score, kills, deaths, assists, impact, t, mvp
            )))
            total_players += 1

    for raw, canonical in aliases.items():
        if raw and canonical:
            statements.append((alias_insert_sql, (str(raw), str(canonical), now_iso)))

    await db.execute_batch(statements)
    print(f"      Processed {len(matches)} matches, {total_players} player records, {len(aliases)} aliases.")

    print("[3/3] Running verification checks...")
    db_matches = await db.fetch_all("SELECT COUNT(*) as count FROM matches")
    db_players = await db.fetch_all("SELECT COUNT(*) as count FROM match_players")
    db_hp = await db.fetch_all("SELECT COUNT(*) as count FROM match_players WHERE time > 0")
    db_aliases = await db.fetch_all("SELECT COUNT(*) as count FROM aliases")

    m_count = db_matches[0]["count"]
    p_count = db_players[0]["count"]
    hp_count = db_hp[0]["count"]
    a_count = db_aliases[0]["count"]

    print("-" * 60)
    print("MIGRATION INTEGRITY REPORT:")
    print(f" Matches in DB:      {m_count} (Source: {len(matches)}) -> {'OK' if m_count == len(matches) else 'MISMATCH'}")
    print(f" Players in DB:      {p_count} (Total processed: {total_players}) -> {'OK' if p_count == total_players else 'MISMATCH'}")
    print(f" Hardpoint OBJ rows: {hp_count} players with hill time recorded.")
    print(f" Aliases in DB:      {a_count} (Source: {len(aliases)}) -> {'OK' if a_count == len(aliases) else 'MISMATCH'}")
    print("-" * 60)

    if m_count == len(matches) and p_count == total_players:
        print("[SUCCESS] All historical data migrated successfully without data loss.")
    else:
        print("[WARNING] Verification detected potential data mismatch.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Migrate CODM data.json to Turso or SQLite")
    parser.add_argument("--file", type=Path, default=DATA_FILE, help="Path to data.json")
    parser.add_argument("--url", type=str, default=None, help="Turso database URL")
    parser.add_argument("--token", type=str, default=None, help="Turso auth token")
    args = parser.parse_args()

    asyncio.run(run_migration(json_path=args.file, db_url=args.url, auth_token=args.token))
