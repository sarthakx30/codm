"""Alias repository: SQL access for player aliases."""
from datetime import datetime, timezone
from typing import Any, Dict, List

from database.connection import db

async def get_all_aliases() -> Dict[str, str]:
    """Retrieve all alias mappings as a dictionary."""
    rows = await db.fetch_all("SELECT raw_name, canonical_name FROM aliases ORDER BY raw_name ASC")
    return {r["raw_name"]: r["canonical_name"] for r in rows}

async def get_all_alias_records() -> List[Dict[str, Any]]:
    """Retrieve all alias records with metadata."""
    return await db.fetch_all("SELECT raw_name, canonical_name, created_at FROM aliases ORDER BY canonical_name ASC, raw_name ASC")

async def save_alias(raw_name: str, canonical_name: str) -> None:
    """Save or update an alias mapping."""
    now_iso = datetime.now(timezone.utc).isoformat(timespec="seconds")
    sql = """
    INSERT INTO aliases (raw_name, canonical_name, created_at)
    VALUES (?, ?, ?)
    ON CONFLICT(raw_name) DO UPDATE SET canonical_name=excluded.canonical_name;
    """
    await db.execute(sql, (raw_name.strip(), canonical_name.strip(), now_iso))

async def save_aliases_batch(aliases_dict: Dict[str, str]) -> None:
    """Save or update multiple alias mappings atomically."""
    now_iso = datetime.now(timezone.utc).isoformat(timespec="seconds")
    sql = """
    INSERT INTO aliases (raw_name, canonical_name, created_at)
    VALUES (?, ?, ?)
    ON CONFLICT(raw_name) DO UPDATE SET canonical_name=excluded.canonical_name;
    """
    batch = []
    for raw, canonical in aliases_dict.items():
        if raw and canonical:
            batch.append((sql, (str(raw).strip(), str(canonical).strip(), now_iso)))
    if batch:
        await db.execute_batch(batch)

async def delete_alias(raw_name: str) -> bool:
    """Delete an alias mapping by raw_name."""
    sql = "DELETE FROM aliases WHERE raw_name = ?"
    await db.execute(sql, (raw_name.strip(),))
    return True

