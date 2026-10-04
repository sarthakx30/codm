"""Gemini Vision OCR service for match scoreboards."""
import base64
import json
import logging
import re
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from server.app.config import GEMINI_FALLBACK, GEMINI_MODEL, get_gemini_api_key
from server.app.services.dedup import generate_match_fingerprint

logger = logging.getLogger("codm.ocr")

PROMPT = (
    "This is a mobile shooter 'Match Details' scoreboard. The LEFT (blue) table is our team, "
    "the RIGHT (red) table is the opponents. Return ONLY JSON in exactly this shape:\n"
    '{"result":"VICTORY or DEFEAT","score_us":0,"score_them":0,"mode":"","map":"",'
    '"played_at":"text under the result, e.g. 01:14:17 26-10-02",'
    '"us":[{"name":"","score":0,"kills":0,"deaths":0,"assists":0,"impact":0,"time":0,"mvp":false}],'
    '"them":[same shape]}\n'
    "Rules: K/D/A 'a/b/c' means kills/deaths/assists. Numbers are integers. "
    "For Hardpoint, 'time' is the objective/hill time in seconds (convert mm:ss to total seconds, e.g., 01:15 = 75; use 0 if not shown or non-Hardpoint). "
    "Copy player names exactly as shown. mvp is true only for a player with the MVP tag. Use null if unreadable."
)

def num(v: Any) -> int:
    try:
        return int(float(v))
    except (TypeError, ValueError):
        return 0

def parse_time(v: Any) -> int:
    if v is None:
        return 0
    if isinstance(v, (int, float)):
        return int(v)
    s = str(v).strip()
    if ":" in s:
        parts = s.split(":")
        try:
            return int(parts[0]) * 60 + int(parts[1])
        except (ValueError, IndexError):
            return 0
    try:
        return int(float(s))
    except ValueError:
        return 0

def clean_players(lst: Optional[List[Dict[str, Any]]], aliases: Dict[str, str]) -> List[Dict[str, Any]]:
    out = []
    for p in lst or []:
        raw_name = re.sub(r"\(.*$", "", str(p.get("name") or "")).strip() or "?"
        name = raw_name
        # Resolve aliases transitively (up to 3 hops)
        for _ in range(3):
            name = aliases.get(name, name)
        out.append({
            "name": name[:40],
            "raw_name": raw_name[:40],
            "score": num(p.get("score")),
            "kills": num(p.get("kills")),
            "deaths": num(p.get("deaths")),
            "assists": num(p.get("assists")),
            "impact": num(p.get("impact")),
            "time": parse_time(p.get("time")),
            "mvp": bool(p.get("mvp"))
        })
    return out

def parse_scoreboard_image(image_bytes: bytes, mime_type: str = "image/jpeg", aliases: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    """Call Google Gemini Vision API to parse match scoreboard image bytes."""
    key = get_gemini_api_key()
    if not key:
        raise RuntimeError("No Gemini API key found. Set GEMINI_API_KEY in your .env file or environment.")

    if not aliases:
        aliases = {}

    body = json.dumps({
        "contents": [{
            "parts": [
                {"text": PROMPT},
                {"inline_data": {"mime_type": mime_type, "data": base64.b64encode(image_bytes).decode("ascii")}}
            ]
        }],
        "generationConfig": {"responseMimeType": "application/json", "temperature": 0}
    }).encode("utf-8")

    hints = {
        404: "Model not found.",
        429: "Rate limit hit. Wait a minute and retry.",
        503: "Service temporarily unavailable. Retrying...",
        400: "Check that the API key is valid.",
        403: "Check that the API key is valid."
    }

    last_error = "Unknown error"
    models_to_try = [GEMINI_MODEL]
    if GEMINI_FALLBACK and GEMINI_FALLBACK != GEMINI_MODEL:
        models_to_try.append(GEMINI_FALLBACK)
    if "gemini-2.5-flash" not in models_to_try:
        models_to_try.append("gemini-2.5-flash")

    parsed_raw = None
    for model in models_to_try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
        for attempt in range(2):
            req = urllib.request.Request(
                url, data=body,
                headers={"Content-Type": "application/json", "x-goog-api-key": key}
            )
            try:
                with urllib.request.urlopen(req, timeout=35) as r:
                    res_json = json.load(r)
                txt = res_json["candidates"][0]["content"]["parts"][0]["text"]
                clean_json_str = re.sub(r"^```(?:json)?\s*|\s*```$", "", txt.strip())
                parsed_raw = json.loads(clean_json_str)
                logger.info(f"Gemini OCR success model={model} attempt={attempt + 1}")
                break
            except urllib.error.HTTPError as e:
                if e.code in (429, 500, 503) and attempt < 1:
                    time.sleep(1.5)
                    continue
                last_error = f"Gemini error {e.code} ({model}). {hints.get(e.code, '')}"
                logger.warning(f"Gemini error: {last_error}")
                break
            except Exception as e:
                last_error = f"Request error ({model}): {e}"
                logger.warning(f"Gemini request exception: {e}")
                break
        if parsed_raw:
            break

    if not parsed_raw:
        raise RuntimeError(last_error)

    us = clean_players(parsed_raw.get("us"), aliases)
    them = clean_players(parsed_raw.get("them"), aliases)
    if not us:
        raise RuntimeError("No player rows found. Is this the Match Details screen?")

    when_raw = str(parsed_raw.get("played_at") or "").strip()
    iso = None
    try:
        iso = datetime.strptime(when_raw, "%H:%M:%S %y-%m-%d").isoformat()
    except ValueError:
        pass

    result_str = "W" if "VICT" in str(parsed_raw.get("result", "")).upper() else "L"
    score_us = num(parsed_raw.get("score_us"))
    score_them = num(parsed_raw.get("score_them"))
    mode = str(parsed_raw.get("mode") or "").strip()
    map_name = str(parsed_raw.get("map") or "").strip()
    match_id = generate_match_fingerprint(when_raw, score_us, score_them, us)

    return {
        "id": match_id,
        "result": result_str,
        "score_us": score_us,
        "score_them": score_them,
        "mode": mode,
        "map": map_name,
        "played_at_raw": when_raw,
        "played_at": iso,
        "added_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "opponent": "",
        "tier": "",
        "game_type": "",
        "us": us,
        "them": them
    }
