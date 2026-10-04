#!/usr/bin/env python3
"""Horizon: CODM team tracker server with Hardpoint objective time parsing."""
import base64, hashlib, json, logging, logging.handlers, os, re, shutil, threading, time, urllib.error, urllib.parse, urllib.request
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATA = HERE / "data.json"
ASSETS = HERE / "assets"
MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.5-flash-lite")
FALLBACK = os.environ.get("GEMINI_FALLBACK", "gemini-3-flash")
PORT = int(os.environ.get("PORT", 8000))
LOCK = threading.Lock()
BK = HERE / "backups"

log = logging.getLogger("codm")
log.setLevel(logging.INFO)
for _h in (logging.StreamHandler(),
           logging.handlers.RotatingFileHandler(HERE / "server.log", maxBytes=500_000, backupCount=3, encoding="utf-8")):
    _h.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s"))
    log.addHandler(_h)

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


def load():
    d = json.loads(DATA.read_text(encoding="utf-8")) if DATA.exists() else {}
    d.setdefault("aliases", {})
    d.setdefault("matches", [])
    return d


def save(d):
    if DATA.exists():
        BK.mkdir(exist_ok=True)
        shutil.copy2(DATA, BK / f"data-{datetime.now():%Y%m%d-%H%M%S-%f}.json")
        for old in sorted(BK.glob("data-*.json"))[:-30]:
            old.unlink()
    tmp = DATA.with_suffix(".tmp")
    tmp.write_text(json.dumps(d, indent=1, ensure_ascii=False), encoding="utf-8")
    tmp.replace(DATA)


def api_key():
    k = os.environ.get("GEMINI_API_KEY")
    kf = HERE / ".key"
    if not k and kf.exists():
        k = kf.read_text().strip()
    return k


def read_shot(img, mime):
    key = api_key()
    if not key:
        raise RuntimeError("No API key. Put it in a file named .key next to server.py, then restart.")
    body = json.dumps({
        "contents": [{"parts": [{"text": PROMPT},
                                {"inline_data": {"mime_type": mime, "data": base64.b64encode(img).decode()}}]}],
        "generationConfig": {"responseMimeType": "application/json", "temperature": 0},
    }).encode()
    hints = {404: "Model not found.",
             429: "Rate limit hit. Wait a minute and retry.", 503: "Service temporarily unavailable. Retrying...",
             400: "Check that the API key is valid.", 403: "Check that the API key is valid."}
    last = "Unknown error"
    for model in dict.fromkeys([MODEL, FALLBACK]):
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
        for attempt in range(2):
            req = urllib.request.Request(url, data=body,
                                         headers={"Content-Type": "application/json", "x-goog-api-key": key})
            try:
                with urllib.request.urlopen(req, timeout=35) as r:
                    out = json.load(r)
                txt = out["candidates"][0]["content"]["parts"][0]["text"]
                log.info("Gemini ok model=%s attempt=%d", model, attempt + 1)
                return json.loads(re.sub(r"^```(?:json)?\s*|\s*```$", "", txt.strip()))
            except urllib.error.HTTPError as e:
                if e.code in (429, 500, 503) and attempt < 1:
                    log.warning("Gemini %s on %s, retry %d", e.code, model, attempt + 1)
                    time.sleep(1.5)
                    continue
                last = f"Gemini error {e.code} ({model}). {hints.get(e.code, '')}"
                log.warning("Gemini failed: %s", last)
                break
            except Exception as e:
                log.warning("Gemini request error on %s: %s", model, e)
                last = f"Request error ({model}): {e}"
                break
    raise RuntimeError(last)


def num(v):
    try:
        return int(float(v))
    except (TypeError, ValueError):
        return 0


def parse_time(v):
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


def players(lst, aliases):
    out = []
    for p in lst or []:
        name = re.sub(r"\(.*$", "", str(p.get("name") or "")).strip() or "?"
        for _ in range(3):
            name = aliases.get(name, name)
        out.append({
            "name": name[:40],
            "score": num(p.get("score")),
            "kills": num(p.get("kills")),
            "deaths": num(p.get("deaths")),
            "assists": num(p.get("assists")),
            "impact": num(p.get("impact")),
            "time": parse_time(p.get("time")),
            "mvp": bool(p.get("mvp"))
        })
    return out


def clean(raw, aliases):
    us, them = players(raw.get("us"), aliases), players(raw.get("them"), aliases)
    if not us:
        return None
    when = str(raw.get("played_at") or "").strip()
    try:
        iso = datetime.strptime(when, "%H:%M:%S %y-%m-%d").isoformat()
    except ValueError:
        iso = None
    m = {
        "result": "W" if "VICT" in str(raw.get("result", "")).upper() else "L",
        "score_us": num(raw.get("score_us")),
        "score_them": num(raw.get("score_them")),
        "mode": str(raw.get("mode") or ""),
        "map": str(raw.get("map") or ""),
        "played_at_raw": when,
        "played_at": iso,
        "added_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "us": us,
        "them": them
    }
    sig = f"{when}|{m['score_us']}|{m['score_them']}|" + "|".join(
        f"{p['kills']}/{p['deaths']}/{p['score']}" for p in us)
    m["id"] = hashlib.sha1(sig.encode()).hexdigest()[:10]
    return m


def extras(m):
    t = str(m.get("game_type") or "").lower()
    return {
        "opponent": str(m.get("opponent") or "").strip()[:60],
        "tier": str(m.get("tier") or "").strip()[:30],
        "game_type": t if t in ("scrim", "tournament") else ""
    }


def sanitize(m):
    if not isinstance(m, dict) or not str(m.get("id") or ""):
        raise ValueError("Bad match data")
    iso = m.get("played_at")
    return {
        "id": str(m["id"])[:16],
        "result": "W" if m.get("result") == "W" else "L",
        "score_us": num(m.get("score_us")),
        "score_them": num(m.get("score_them")),
        "mode": str(m.get("mode") or "")[:40],
        "map": str(m.get("map") or "")[:40],
        "played_at_raw": str(m.get("played_at_raw") or "")[:40],
        "played_at": iso if isinstance(iso, str) else None,
        "added_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "us": players(m.get("us"), {}),
        "them": players(m.get("them"), {}),
        **extras(m)
    }


class H(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def reply(self, code, body, ctype="application/json; charset=utf-8"):
        b = body if isinstance(body, bytes) else json.dumps(body, ensure_ascii=False).encode()
        log.info("%s %s -> %s (%d ms)", self.command, self.path, code, (time.time() - getattr(self, "t0", time.time())) * 1000)
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(b)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(b)

    def do_GET(self):
        self.t0 = time.time()
        clean_path = urllib.parse.unquote(self.path.split("?")[0])
        if clean_path in ("/", "/index.html"):
            index_path = HERE / "index.html"
            if index_path.exists():
                self.reply(200, index_path.read_bytes(), "text/html; charset=utf-8")
            else:
                self.reply(404, {"error": "index.html not found"})
        elif clean_path == "/data":
            with LOCK:
                self.reply(200, load())
        elif clean_path.startswith("/assets/"):
            target = (HERE / clean_path.lstrip("/")).resolve()
            if target.is_file() and str(target).startswith(str(ASSETS.resolve())):
                ext = target.suffix.lower()
                mimes = {
                    ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
                    ".webp": "image/webp", ".svg": "image/svg+xml", ".ico": "image/x-icon",
                    ".woff2": "font/woff2", ".woff": "font/woff", ".ttf": "font/ttf",
                    ".css": "text/css; charset=utf-8", ".js": "application/javascript; charset=utf-8"
                }
                self.reply(200, target.read_bytes(), mimes.get(ext, "application/octet-stream"))
            else:
                self.reply(404, {"error": "asset not found"})
        elif clean_path == "/favicon.ico":
            self.reply(204, b"", "image/x-icon")
        else:
            self.reply(404, {"error": "not found"})

    def do_POST(self):
        self.t0 = time.time()
        try:
            n = int(self.headers.get("Content-Length") or 0)
            if n > 15_000_000:
                raise ValueError("Image is too large")
            raw = self.rfile.read(n)
            if self.path == "/parse":
                mime = self.headers.get("Content-Type", "")
                mime = mime if mime.startswith("image/") else "image/jpeg"
                with LOCK:
                    d = load()
                m = clean(read_shot(raw, mime), d["aliases"])
                if not m:
                    raise RuntimeError("No players found. Is this the Match Details screen?")
                dup = any(x["id"] == m["id"] for x in d["matches"])
                log.info("Parsed %s: %s %s-%s, %d players, duplicate=%s, image=%d bytes", m["id"], m["result"], m["score_us"], m["score_them"], len(m["us"]), dup, len(raw))
                self.reply(200, {"match": m, "duplicate": dup})
            elif self.path == "/save":
                req = json.loads(raw)
                m = sanitize(req.get("match"))
                with LOCK:
                    d = load()
                    if any(x["id"] == m["id"] for x in d["matches"]):
                        raise ValueError("This match is already saved")
                    d["aliases"].update({str(k): str(v) for k, v in (req.get("renames") or {}).items() if k and v})
                    d["matches"].append(m)
                    log.info("Saved match %s: %s %s-%s opp=%r tier=%r type=%r", m["id"], m["result"], m["score_us"], m["score_them"], m["opponent"], m["tier"], m["game_type"])
                    save(d)
                self.reply(200, d)
            elif self.path == "/update":
                req = json.loads(raw)
                with LOCK:
                    d = load()
                    m = next((x for x in d["matches"] if x["id"] == req.get("id")), None)
                    if not m:
                        raise ValueError("Match not found")
                    m.update(extras(req))
                    save(d)
                log.info("Updated match %s: %s", m["id"], extras(req))
                self.reply(200, d)
            elif self.path == "/delete":
                rid = json.loads(raw).get("id")
                with LOCK:
                    d = load()
                    d["matches"] = [x for x in d["matches"] if x["id"] != rid]
                    log.info("Deleted match %s", rid)
                    save(d)
                self.reply(200, d)
            else:
                self.reply(404, {"error": "not found"})
        except (ValueError, RuntimeError) as e:
            log.warning("%s rejected: %s", self.path, e)
            self.reply(400, {"error": str(e)})
        except Exception as e:
            log.exception("Unhandled error on %s", self.path)
            self.reply(500, {"error": f"Server error: {e}"})


if __name__ == "__main__":
    ASSETS.mkdir(exist_ok=True)
    srv = ThreadingHTTPServer(("127.0.0.1", PORT), H)
    log.info("Starting: port=%d model=%s fallback=%s matches=%d", PORT, MODEL, FALLBACK, len(load()["matches"]))
    print(f"Open http://localhost:{PORT} in your browser. Press Ctrl+C to stop.")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
