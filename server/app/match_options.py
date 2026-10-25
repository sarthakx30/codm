"""Canonical match metadata values for API input and output."""
import re
from typing import Optional


def normalize_tier(value: Optional[str] = None) -> Optional[str]:
    """Return an uppercase tier code. A bare main tier defaults to Mid."""
    if value is None:
        return None
    clean = str(value).strip().upper()
    if not clean:
        return ""
    if re.fullmatch(r"T[123]", clean):
        return f"{clean}M"
    return clean


def normalize_mode(value: str = "") -> str:
    """Return the canonical mode label used by the analytics engine."""
    compact = "".join(ch for ch in str(value or "").upper() if ch.isalnum())
    if not compact:
        return ""
    if "HARDPOINT" in compact or compact == "HP":
        return "Hardpoint"
    if "SEARCH" in compact or compact in {"SND", "SD", "SANDD"}:
        return "Search & Destroy"
    if "CONTROL" in compact or compact == "CTL":
        return "Control"
    return str(value).strip()


def normalize_game_type(value: str = "") -> str:
    """Return the lowercase category used by the scope filter.

    A blank legacy value defaults to scrim, matching the client default.
    """
    clean = str(value or "").strip().lower()
    if not clean:
        return "scrim"
    if clean in {"scrim", "scrims"}:
        return "scrim"
    if clean in {"tournament", "tournaments", "tourney"}:
        return "tournament"
    return clean
