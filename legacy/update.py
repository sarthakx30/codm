#!/usr/bin/env python3
"""Squad tracker.

  python update.py shot1.jpg [shot2.png ...] [--yes]   add screenshots, rebuild dashboard
  python update.py                                      just rebuild dashboard

Needs a Gemini API key in $GEMINI_API_KEY or in a file named .key next to this script.
No pip installs required. Data lives in data.json, the dashboard in dashboard.html.
"""
import base64, hashlib, json, os, re, sys, urllib.error, urllib.request
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATA, DASH = HERE / "data.json", HERE / "dashboard.html"
MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")

PROMPT = (
    "This is a mobile shooter 'Match Details' scoreboard. The LEFT (blue) table is our team, "
    "the RIGHT (red) table is the opponents. Return ONLY JSON in exactly this shape:\n"
    '{"result":"VICTORY or DEFEAT","score_us":0,"score_them":0,"mode":"","map":"",'
    '"played_at":"text under the result, e.g. 01:14:17 26-10-02",'
    '"us":[{"name":"","score":0,"kills":0,"deaths":0,"assists":0,"impact":0,"mvp":false}],'
    '"them":[same shape]}\n'
    "Rules: K/D/A 'a/b/c' means kills/deaths/assists. Numbers are integers. Copy player names "
    "exactly as shown. mvp is true only for a player with the MVP tag. Use null if unreadable."
)


def load():
    if DATA.exists():
        return json.loads(DATA.read_text(encoding="utf-8"))
    return {"aliases": {}, "matches": []}


def save(d):
    tmp = DATA.with_suffix(".tmp")
    tmp.write_text(json.dumps(d, indent=1, ensure_ascii=False), encoding="utf-8")
    tmp.replace(DATA)


def api_key():
    k = os.environ.get("GEMINI_API_KEY")
    kf = HERE / ".key"
    if not k and kf.exists():
        k = kf.read_text().strip()
    return k


def read_shot(path):
    key = api_key()
    if not key:
        sys.exit("No API key. Set GEMINI_API_KEY or put the key in a file named .key next to update.py")
    mime = "image/png" if path.lower().endswith(".png") else "image/jpeg"
    img = base64.b64encode(Path(path).read_bytes()).decode()
    body = {
        "contents": [{"parts": [{"text": PROMPT}, {"inline_data": {"mime_type": mime, "data": img}}]}],
        "generationConfig": {"responseMimeType": "application/json", "temperature": 0},
    }
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent"
    req = urllib.request.Request(
        url, data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json", "x-goog-api-key": key},
    )
    try:
        with urllib.request.urlopen(req, timeout=90) as r:
            out = json.load(r)
        txt = out["candidates"][0]["content"]["parts"][0]["text"]
        return json.loads(re.sub(r"^```(?:json)?\s*|\s*```$", "", txt.strip()))
    except urllib.error.HTTPError as e:
        hint = {
            404: f"Model '{MODEL}' not found. Set GEMINI_MODEL to a current Gemini flash model.",
            429: "Rate limit hit. Wait a minute and retry.",
        }.get(e.code, "")
        print(f"  API error {e.code}: {e.read()[:200].decode(errors='replace')} {hint}")
    except Exception as e:  # network, bad JSON, missing fields
        print(f"  Could not read result: {e}")
    return None


def num(v):
    try:
        return int(float(v))
    except (TypeError, ValueError):
        return 0


def players(lst, aliases):
    out = []
    for p in lst or []:
        name = re.sub(r"\(.*$", "", str(p.get("name") or "")).strip() or "?"  # drop "(ra...)" truncation
        out.append({
            "name": aliases.get(name, name), "score": num(p.get("score")),
            "kills": num(p.get("kills")), "deaths": num(p.get("deaths")),
            "assists": num(p.get("assists")), "impact": num(p.get("impact")),
            "mvp": bool(p.get("mvp")),
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
        "score_us": num(raw.get("score_us")), "score_them": num(raw.get("score_them")),
        "mode": str(raw.get("mode") or ""), "map": str(raw.get("map") or ""),
        "played_at_raw": when, "played_at": iso,
        "added_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "us": us, "them": them,
    }
    sig = f"{when}|{m['score_us']}|{m['score_them']}|" + "|".join(
        f"{p['name']}{p['kills']}{p['deaths']}{p['score']}" for p in us)
    m["id"] = hashlib.sha1(sig.encode()).hexdigest()[:10]
    return m


def show(m):
    print(f"\n{'Victory' if m['result'] == 'W' else 'Defeat'} {m['score_us']}-{m['score_them']}  "
          f"{m['mode']}  {m['map']}  {m['played_at_raw']}")
    for p in m["us"]:
        print(f"  {p['name']:<14}{p['score']:>5}  {p['kills']}/{p['deaths']}/{p['assists']}  "
              f"impact {p['impact']}{'  MVP' if p['mvp'] else ''}")
    print(f"  (plus {len(m['them'])} opponents)")


def main():
    args = sys.argv[1:]
    yes = "--yes" in args
    files = [a for a in args if not a.startswith("--")]
    d = load()
    d.setdefault("aliases", {})
    added = 0
    for f in files:
        print(f"Reading {f} ...")
        if not Path(f).exists():
            print("  File not found.")
            continue
        raw = read_shot(f)
        m = clean(raw, d["aliases"]) if raw else None
        if not m:
            print("  Skipped.")
            continue
        if any(x["id"] == m["id"] for x in d["matches"]):
            print("  Already saved, skipping.")
            continue
        show(m)
        if yes or input("Save this match? [y/N] ").strip().lower() == "y":
            d["matches"].append(m)
            added += 1
    if added:
        save(d)
    blob = json.dumps(d, ensure_ascii=False).replace("</", "<\\/")
    DASH.write_text(TEMPLATE.replace("__DATA__", blob), encoding="utf-8")
    print(f"\n{added} added, {len(d['matches'])} total. Dashboard: {DASH}")


TEMPLATE = '''<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Squad tracker</title>
<style>
:root{--bg:#0f1722;--panel:#16212f;--line:#24344a;--text:#e8eef6;--muted:#8da0b8;--us:#4a90d9;--them:#d9626b;--gold:#f2c230}
*{box-sizing:border-box}
body{margin:0 auto;max-width:760px;padding:16px 16px 48px;background:var(--bg);color:var(--text);font:15px/1.45 system-ui,sans-serif}
.cond{font-family:Bahnschrift,"Roboto Condensed","Arial Narrow",sans-serif;font-stretch:condensed}
h1{margin:4px 0 14px;font-size:18px;font-weight:600;color:var(--muted)}
h2{margin:30px 0 4px;font-size:16px}
.cap{margin:0 0 10px;color:var(--muted);font-size:13px}
.record{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 12px}
.record b{font-size:68px;line-height:1;font-weight:800}
.record .w{color:var(--gold)}.record .l{color:var(--them)}
.record span{color:var(--muted)}
.pips{display:flex;gap:5px;margin:12px 0 4px}
.pip{width:18px;height:28px;border-radius:3px;background:var(--gold)}
.pip.l{background:transparent;border:2px solid var(--them)}
.wrap{overflow-x:auto;border:1px solid var(--line);border-radius:6px;background:var(--panel)}
table{border-collapse:collapse;width:100%;font-variant-numeric:tabular-nums}
#players table{min-width:600px}
th,td{padding:9px 10px;text-align:right;white-space:nowrap;border-bottom:1px solid var(--line)}
th:first-child,td:first-child{text-align:left;position:sticky;left:0;background:var(--panel)}
th{color:var(--muted);font-weight:600;cursor:pointer}
th.on{color:var(--text);box-shadow:inset 0 -2px var(--us)}
tr:last-child td{border-bottom:0}
details{border:1px solid var(--line);border-radius:6px;background:var(--panel);margin-bottom:8px}
summary{display:flex;flex-wrap:wrap;gap:4px 14px;align-items:baseline;padding:10px 12px;cursor:pointer}
summary span{color:var(--muted);font-size:13px}
.gw{color:var(--gold)}.gl{color:var(--them)}
.b{margin:0;border-top:1px solid var(--line)}
.b.us td:first-child{border-left:3px solid var(--us)}.b.them td:first-child{border-left:3px solid var(--them)}
.mvp{color:var(--gold);font-size:12px;font-weight:700}
code{background:var(--panel);padding:2px 6px;border-radius:4px}
</style></head><body>
<h1>Squad tracker</h1>
<div id="record"></div>
<h2>Players</h2><p class="cap">Tap a column to sort.</p>
<div class="wrap" id="players"></div>
<h2>Recent matches</h2><p class="cap">Tap a match for both scoreboards.</p>
<div id="recent"></div>
<script>
const D=__DATA__;
const M=D.matches.slice().sort((a,b)=>(a.played_at||a.added_at).localeCompare(b.played_at||b.added_at));
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const sum=(a,f)=>a.reduce((t,x)=>t+(f(x)||0),0);
const W=M.filter(m=>m.result==="W").length,L=M.length-W;
$("#record").innerHTML=M.length
 ?`<div class="record cond"><b class="w">${W}</b><span>wins</span><b class="l">${L}</b><span>losses</span><span>${Math.round(W/M.length*100)}% win rate</span></div>
   <div class="pips">${M.slice(-10).map(m=>`<i class="pip ${m.result==="W"?"":"l"}" title="${m.score_us} to ${m.score_them}"></i>`).join("")}</div>
   <p class="cap">Last ${Math.min(10,M.length)} matches, newest on the right.</p>`
 :`<p>No matches yet. Run <code>python update.py screenshot.jpg</code> to add one.</p>`;
const P={};
M.forEach(m=>m.us.forEach(p=>{(P[p.name]=P[p.name]||{n:p.name,g:[]}).g.push({...p,r:m.result})}));
const rows=Object.values(P).map(x=>{const g=x.g,k=sum(g,e=>e.kills),d=sum(g,e=>e.deaths);
 return{name:x.n,games:g.length,kd:k/Math.max(d,1),score:sum(g,e=>e.score)/g.length,impact:sum(g,e=>e.impact)/g.length,
 mvp:g.filter(e=>e.mvp).length,win:g.filter(e=>e.r==="W").length/g.length*100,trend:g.map(e=>e.impact)}});
const cols=[["name","Player"],["games","Games"],["kd","K/D"],["score","Avg score"],["impact","Avg impact"],["trend","Impact trend"],["mvp","MVPs"],["win","Win %"]];
let key="impact";
function spark(a){a=a.slice(-12);if(a.length<2)return"";const lo=Math.min(...a),hi=Math.max(...a),w=64,h=20;
 const pts=a.map((v,i)=>[(i*w/(a.length-1)).toFixed(1),(hi===lo?h/2:h-2-(v-lo)/(hi-lo)*(h-4)).toFixed(1)]);
 return`<svg width="${w}" height="${h}"><polyline points="${pts.map(p=>p.join(",")).join(" ")}" fill="none" stroke="#4a90d9" stroke-width="2" stroke-linejoin="round"/></svg>`}
function draw(){
 const r=rows.slice().sort((a,b)=>key==="name"?a.name.localeCompare(b.name):b[key]-a[key]);
 $("#players").innerHTML=`<table><tr>${cols.map(([k,t])=>`<th ${k==="trend"?"":`data-k="${k}"`} class="${k===key?"on":""}">${t}</th>`).join("")}</tr>`+
 r.map(p=>`<tr><td>${esc(p.name)}</td><td>${p.games}</td><td>${p.kd.toFixed(2)}</td><td>${Math.round(p.score)}</td><td>${Math.round(p.impact)}</td><td>${spark(p.trend)}</td><td>${p.mvp}</td><td>${Math.round(p.win)}%</td></tr>`).join("")+`</table>`}
$("#players").onclick=e=>{const t=e.target.closest("th[data-k]");if(t){key=t.dataset.k;draw()}};
draw();
const board=(a,s)=>`<table class="b ${s}">`+a.map(p=>`<tr><td>${p.mvp?`<span class="mvp">MVP</span> `:""}${esc(p.name)}</td><td>${p.score}</td><td>${p.kills}/${p.deaths}/${p.assists}</td><td>${p.impact}</td></tr>`).join("")+`</table>`;
$("#recent").innerHTML=M.slice().reverse().slice(0,20).map(m=>
 `<details><summary><b class="${m.result==="W"?"gw":"gl"}">${m.result==="W"?"Win":"Loss"} ${m.score_us} to ${m.score_them}</b><span>${esc(m.mode)}</span><span>${esc(m.map)}</span><span>${esc(m.played_at_raw)}</span></summary>${board(m.us,"us")}${board(m.them,"them")}</details>`).join("");
</script></body></html>'''

if __name__ == "__main__":
    main()
