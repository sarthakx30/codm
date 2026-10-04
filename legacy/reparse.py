#!/usr/bin/env python3
import base64, hashlib, json, re, shutil, time, urllib.error, urllib.request
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATA_PATH = HERE / "data.json"
IMG_DIR = HERE / "reparse"
KEY_FILE = HERE / ".key"

if not KEY_FILE.exists():
    print("Error: Missing Gemini API key in ~/codm/.key")
    exit(1)

KEY = KEY_FILE.read_text().strip()

if not DATA_PATH.exists():
    print("Error: data.json not found")
    exit(1)

# Create a safety backup
shutil.copy2(DATA_PATH, HERE / "data.json.bak")
d = json.loads(DATA_PATH.read_text(encoding="utf-8"))
aliases = d.get("aliases", {})
existing_ids = {m["id"]: m for m in d.get("matches", [])}

PROMPT = (
    'This is a mobile shooter "Match Details" scoreboard. The LEFT (blue) table is our team, '
    'the RIGHT (red) table is the opponents. Return ONLY JSON in exactly this shape:\n'
    '{"result":"VICTORY or DEFEAT","score_us":0,"score_them":0,"mode":"","map":"",'
    '"played_at":"text under the result, e.g. 01:14:17 26-10-02",'
    '"us":[{"name":"","score":0,"kills":0,"deaths":0,"assists":0,"impact":0,"time":0,"mvp":false}],'
    '"them":[same shape]}\n'
    'Rules: For Hardpoint, "time" is the objective/hill time in seconds (convert mm:ss to seconds, e.g. 01:15 = 75). Use 0 if not shown. '
    'Copy player names exactly as shown. mvp is true only for player with MVP tag.'
)

def num(v):
    try:
        return int(float(v))
    except (TypeError, ValueError):
        return 0

def parse_time(v):
    if not v:
        return 0
    if isinstance(v, (int, float)):
        return int(v)
    s = str(v).strip()
    if ":" in s:
        p = s.split(":")
        try:
            return int(p[0]) * 60 + int(p[1])
        except (ValueError, IndexError):
            return 0
    try:
        return int(float(s))
    except ValueError:
        return 0

def clean_players(lst):
    out = []
    for p in lst or []:
        nm = re.sub(r"\(.*$", "", str(p.get("name") or "")).strip() or "?"
        for _ in range(3):
            nm = aliases.get(nm, nm)
        out.append({
            "name": nm[:40],
            "score": num(p.get("score")),
            "kills": num(p.get("kills")),
            "deaths": num(p.get("deaths")),
            "assists": num(p.get("assists")),
            "impact": num(p.get("impact")),
            "time": parse_time(p.get("time")),
            "mvp": bool(p.get("mvp"))
        })
    return out

images = sorted(list(IMG_DIR.glob("*.jpg")) + list(IMG_DIR.glob("*.png")) + list(IMG_DIR.glob("*.jpeg")))
print(f"Found {len(images)} screenshots in ~/codm/reparse/\n")

updated_count = 0
added_count = 0

for i, img_file in enumerate(images, 1):
    raw = img_file.read_bytes()
    mime = "image/png" if img_file.suffix.lower() == ".png" else "image/jpeg"
    body = json.dumps({
        "contents": [{"parts": [{"text": PROMPT}, {"inline_data": {"mime_type": mime, "data": base64.b64encode(raw).decode()}}]}],
        "generationConfig": {"responseMimeType": "application/json", "temperature": 0}
    }).encode()

    parsed = None
    for model in ["gemini-3.5-flash-lite", "gemini-3-flash"]:
        req = urllib.request.Request(
            f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
            data=body, headers={"Content-Type": "application/json", "x-goog-api-key": KEY}
        )
        try:
            with urllib.request.urlopen(req, timeout=35) as r:
                out = json.load(r)
            txt = out["candidates"][0]["content"]["parts"][0]["text"]
            parsed = json.loads(re.sub(r"^```(?:json)?\s*|\s*```$", "", txt.strip()))
            break
        except Exception as e:
            time.sleep(1.0)
            continue

    if not parsed:
        print(f"[{i}/{len(images)}] {img_file.name}: Could not parse with Gemini")
        continue

    us = clean_players(parsed.get("us"))
    them = clean_players(parsed.get("them"))
    if not us:
        print(f"[{i}/{len(images)}] {img_file.name}: Skipped (No player rows found)")
        continue

    when = str(parsed.get("played_at") or "").strip()
    score_us = num(parsed.get("score_us"))
    score_them = num(parsed.get("score_them"))
    
    # Generate exact match fingerprint
    player_sigs = [f"{p['kills']}/{p['deaths']}/{p['score']}" for p in us]
    sig = f"{when}|{score_us}|{score_them}|" + "|".join(player_sigs)
    match_id = hashlib.sha1(sig.encode()).hexdigest()[:10]

    if match_id in existing_ids:
        target = existing_ids[match_id]
        hp_updated = False
        for p_new in us:
            if p_new.get("time", 0) > 0:
                for p_old in target.get("us", []):
                    if p_old["name"].lower() == p_new["name"].lower():
                        if p_old.get("time", 0) != p_new["time"]:
                            p_old["time"] = p_new["time"]
                            hp_updated = True
        if hp_updated:
            updated_count += 1
            print(f"[{i}/{len(images)}] {match_id}: [UPDATED] Backfilled OBJ hill times ({target.get('map')} {target.get('mode')})")
        else:
            print(f"[{i}/{len(images)}] {match_id}: [DUPLICATE] Already logged with current stats")
    else:
        try:
            iso = datetime.strptime(when, "%H:%M:%S %y-%m-%d").isoformat()
        except ValueError:
            iso = None
        new_m = {
            "id": match_id,
            "result": "W" if "VICT" in str(parsed.get("result", "")).upper() else "L",
            "score_us": score_us,
            "score_them": score_them,
            "mode": str(parsed.get("mode") or ""),
            "map": str(parsed.get("map") or ""),
            "played_at_raw": when,
            "played_at": iso,
            "added_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "us": us,
            "them": them,
            "opponent": "",
            "tier": "",
            "game_type": ""
        }
        d["matches"].append(new_m)
        existing_ids[match_id] = new_m
        added_count += 1
        print(f"[{i}/{len(images)}] {match_id}: [NEW] Added {new_m['result']} {score_us}-{score_them} {new_m['map']} ({new_m['mode']})")

    time.sleep(0.8)

DATA_PATH.write_text(json.dumps(d, indent=1, ensure_ascii=False), encoding="utf-8")
print(f"\nCompleted: {updated_count} matches backfilled, {added_count} new matches added.")
print("Backup preserved at ~/codm/data.json.bak")
