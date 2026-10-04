const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const esc = s => String(s).replace(/[&<"]/g, c => ({
  '&': '&amp;', '<': '&lt;', '"': '&quot;'
}[c]));
const title = s => String(s || '').toLowerCase()
  .replace(/\b[a-z]/g, c => c.toUpperCase());
const sum = (a, f) => (a || []).reduce((t, x) => t + (f(x) || 0), 0);

const say = (t, e) => {
  const s = $("#status");
  if (s) {
    s.textContent = t;
    s.className = "cap" + (e ? " err" : "");
  }
};

const toast = t => {
  const e = $("#toast");
  if (e) {
    e.textContent = t;
    e.classList.add("on");
    setTimeout(() => e.classList.remove("on"), 1800);
  }
};

async function post(u, b, t) {
  const r = await fetch(u, {
    method: "POST",
    headers: { "Content-Type": t || "application/json" },
    body: t ? b : JSON.stringify(b)
  });
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(j.error || r.status);
  return j;
}

const TYPES = { scrim: "Scrim", tournament: "Tournament" };
const cols = [
  ["name", "Player"], ["games", "Games"], ["kd", "K/D"],
  ["kpm", "KPM"], ["killShare", "Kill%"], ["objShare", "OBJ%"],
  ["netSpread", "+/-"], ["score", "Score"], ["impact", "Impact"],
  ["mvp", "MVPs"], ["win", "Win%"]
];

let D = { matches: [] };
let rows = [];
let key = "impact";
let F = "";
let viewMode = "cards";
let queue = [];
let queueIndex = 0;

function tab(n) {
  if (!$("#s-" + n)) n = "overview";
  $$("section").forEach(s => s.classList.toggle("on", s.id === "s-" + n));
  $$("nav button").forEach(b => b.classList.toggle("on", b.dataset.t === n));
  document.body.classList.toggle("add", n === "add");
  location.hash = n;
  scrollTo(0, 0);
}

function parseTier(t) {
  const m = String(t || "").toUpperCase().match(/^(T[123])([HML])?$/);
  return m ? { main: m[1], sub: m[2] || "" } : { main: "", sub: "" };
}

function spark(a) {
  a = (a || []).slice(-12);
  if (a.length < 2) return "";
  const lo = Math.min(...a);
  const hi = Math.max(...a);
  const w = 70, h = 22;
  const pts = a.map((v, i) => {
    const x = (i * w / (a.length - 1)).toFixed(1);
    const y = (hi === lo ? h / 2 : h - 3 - (v - lo) / (hi - lo) * (h - 6)).toFixed(1);
    return x + "," + y;
  });
  return '<svg width="' + w + '" height="' + h + '">' +
    '<polyline points="' + pts.join(" ") + '" fill="none" ' +
    'stroke="#00e5ff" stroke-width="2"/></svg>';
}

function form(m) {
  const pt = parseTier(m.tier);
  const mainChips = ["T1", "T2", "T3", ""].map(v => {
    const on = pt.main === v || (!pt.main && !v) ? "on" : "";
    const label = v ? v.replace("T", "Tier ") : "None";
    return '<button type="button" class="chip ' + on +
      '" data-val="' + v + '">' + label + '</button>';
  }).join("");

  const subChips = ["H", "M", "L"].map(v => {
    const on = pt.sub === v || (!pt.sub && v === "M" && pt.main) ? "on" : "";
    const label = v === "H" ? "High" : v === "M" ? "Mid" : "Low";
    return '<button type="button" class="chip ' + on +
      '" data-val="' + v + '">' + label + '</button>';
  }).join("");

  const typeChips = Object.keys(TYPES).map(v => {
    const on = m.game_type === v ? "on" : "";
    return '<button type="button" class="chip ' + on +
      '" data-v="' + v + '">' + TYPES[v] + '</button>';
  }).join("");

  return '<label>Opponent team' +
    '<input class="t f-opp" list="dl-opp" value="' + esc(m.opponent || "") +
    '" placeholder="Optional"></label>' +
    '<div class="tier-selector">' +
    '<div class="tier-preview">Selected: <b class="tier-lbl">' +
    (m.tier || "None") + '</b></div>' +
    '<input type="hidden" class="f-tier" value="' + esc(m.tier || "") + '">' +
    '<div class="seg tier-main">' + mainChips + '</div>' +
    '<div class="seg tier-sub" style="' + (!pt.main ? 'display:none' : '') + '">' +
    subChips + '</div></div>' +
    '<label>Type</label>' +
    '<div class="seg seg-type">' + typeChips + '</div>';
}

function read(root) {
  const g = s => (root.querySelector(s) ? root.querySelector(s).value.trim() : "");
  const on = root.querySelector(".seg-type .on");
  return { opponent: g(".f-opp"), tier: g(".f-tier"), game_type: on ? on.dataset.v : "" };
}

function bindTier(root) {
  const w = root.querySelector(".tier-selector");
  if (!w) return;
  const inp = w.querySelector(".f-tier");
  const lbl = w.querySelector(".tier-lbl");
  const sub = w.querySelector(".tier-sub");

  w.querySelectorAll(".tier-main button").forEach(b => {
    b.onclick = () => {
      w.querySelectorAll(".tier-main button").forEach(x => x.classList.remove("on"));
      b.classList.add("on");
      const v = b.dataset.val;
      if (!v) {
        inp.value = "";
        lbl.textContent = "None";
        sub.style.display = "none";
      } else {
        sub.style.display = "flex";
        let s = (sub.querySelector(".on") || {}).dataset?.val || "M";
        inp.value = v + s;
        lbl.textContent = inp.value;
      }
    };
  });

  w.querySelectorAll(".tier-sub button").forEach(b => {
    b.onclick = () => {
      w.querySelectorAll(".tier-sub button").forEach(x => x.classList.remove("on"));
      b.classList.add("on");
      const m = (w.querySelector(".tier-main .on") || {}).dataset?.val;
      if (m) {
        inp.value = m + b.dataset.val;
        lbl.textContent = inp.value;
      }
    };
  });
}

function pBreak(matches, name) {
  const mm = {};
  (matches || []).filter(m => (m.us || []).some(u => u.name === name)).forEach(m => {
    const u = m.us.find(x => x.name === name);
    const l = title(m.map || "Unknown") + " - " + title(m.mode || "Unknown");
    mm[l] = mm[l] || { p: 0, w: 0, k: 0, d: 0, s: 0, t: 0 };
    mm[l].p++;
    if (m.result === "W") mm[l].w++;
    mm[l].k += (u.kills || 0);
    mm[l].d += (u.deaths || 0);
    mm[l].s += (u.score || 0);
    mm[l].t += (u.time || 0);
  });

  const r = Object.entries(mm).sort((a, b) => b[1].p - a[1].p).map(([k, v]) => {
    const kd = (v.k / Math.max(v.d, 1)).toFixed(2);
    const avgS = Math.round(v.s / v.p);
    const winP = Math.round(v.w / v.p * 100) + "%";
    const hpTime = v.t ? ' (' + Math.round(v.t / v.p) + 's OBJ)' : '';
    return '<tr><td>' + esc(k) + '</td><td>' + v.p + '</td><td>' +
      kd + '</td><td>' + avgS + hpTime + '</td><td>' + winP + '</td></tr>';
  }).join("");

  return '<details class="pc-breakdown">' +
    '<summary>MAP - MODE BREAKDOWN</summary>' +
    '<div class="wrap" style="margin-top:8px"><table>' +
    '<tr><th>Map - Mode</th><th>Games</th><th>K/D</th><th>Score/OBJ</th><th>Win %</th></tr>' +
    (r || '<tr><td colspan=5>No matches</td></tr>') +
    '</table></div></details>';
}

function getPlayerRoleTag(p) {
  if (p.objShare >= 28) return "OBJ Anchor";
  if (p.sndKd >= 1.35 && p.sndGames >= 2) return "S&D Specialist";
  if (p.kpm >= 18) return "Primary Fragger";
  if (p.apm >= 5.5) return "Support Flex";
  return "Flex Operator";
}

function draw() {
  const r = rows.slice().sort((a, b) => {
    if (key === "name") return a.name.localeCompare(b.name);
    return (b[key] || 0) - (a[key] || 0);
  });

  if (viewMode === "cards") {
    $("#players-cards").style.display = "block";
    $("#players-table").style.display = "none";
    $("#toggle-view").textContent = "TABLE";
    $("#players-cards").innerHTML = r.map(p => {
      const mvpBadge = p.mvp ? '<div class="pc-mvp">' + p.mvp + ' MVP</div>' : '';
      const hiKd = p.kd >= 1.5 ? 'hi-kd' : '';
      const netSign = p.netSpread >= 0 ? '+' : '';
      const roleTag = getPlayerRoleTag(p);

      const dropCol = p.tierDiff >= 0 ? 'var(--us)' : 'var(--them)';
      const dropSign = p.tierDiff >= 0 ? '+' : '';

      return '<div class="player-card ' + (p.mvp ? 'has-mvp' : '') + '">' +
        '<div class="pc-top">' +
        '<div class="pc-name-group">' +
        '<div class="pc-name">' + esc(p.name) + '</div>' +
        '<span class="pc-tag">' + roleTag + '</span>' +
        '</div>' + mvpBadge + '</div>' +
        '<div class="pc-grid">' +
        '<div class="pc-stat"><span class="lbl">K/D</span><span class="val ' + hiKd + '">' + p.kd.toFixed(2) + '</span></div>' +
        '<div class="pc-stat"><span class="lbl">KPM</span><span class="val">' + p.kpm.toFixed(1) + '</span></div>' +
        '<div class="pc-stat"><span class="lbl">KILL SHARE</span><span class="val">' + Math.round(p.killShare) + '%</span></div>' +
        '<div class="pc-stat"><span class="lbl">NET +/-</span><span class="val">' + netSign + p.netSpread + '</span></div>' +
        '</div>' +
        '<div class="pc-sub-grid">' +
        '<div class="pc-stat"><span class="lbl">IMPACT</span><span class="val">' + Math.round(p.impact) + '</span></div>' +
        '<div class="pc-stat"><span class="lbl">OBJ SHARE</span><span class="val" style="color:var(--gold)">' + Math.round(p.objShare) + '%</span></div>' +
        '<div class="pc-stat"><span class="lbl">T1/2 vs T3</span><span class="val" style="color:' + dropCol + '">' + dropSign + Math.round(p.tierDiff) + '</span></div>' +
        '<div class="pc-stat"><span class="lbl">WIN%</span><span class="val">' + Math.round(p.win) + '%</span></div>' +
        '</div>' +
        '<div class="pc-bot"><span class="trend-title">' + p.games + ' games ' +
        (p.avgHpTime > 0 ? '• ' + Math.round(p.avgHpTime) + 's OBJ' : '') + '</span>' +
        '<div class="spark">' + spark(p.trend) + '</div></div>' +
        pBreak(D.matches, p.name) + '</div>';
    }).join("");
  } else {
    $("#players-cards").style.display = "none";
    $("#players-table").style.display = "block";
    $("#toggle-view").textContent = "CARDS";
    const header = cols.map(([k, t]) => {
      const cls = k === key ? 'class="on"' : '';
      const act = k === "trend" ? "" : 'data-k="' + k + '"';
      return '<th ' + act + ' ' + cls + '>' + t + '</th>';
    }).join("");
    const body = r.map(p => {
      const netSign = p.netSpread >= 0 ? '+' : '';
      return '<tr><td>' + esc(p.name) + '</td><td>' + p.games + '</td><td>' +
        p.kd.toFixed(2) + '</td><td>' + p.kpm.toFixed(1) + '</td><td>' +
        Math.round(p.killShare) + '%</td><td>' + Math.round(p.objShare) + '%</td><td>' +
        netSign + p.netSpread + '</td><td>' + Math.round(p.score) + '</td><td>' +
        Math.round(p.impact) + '</td><td>' + p.mvp + '</td><td>' + Math.round(p.win) + '%</td></tr>';
    }).join("");
    $("#players-table").innerHTML = '<table><tr>' + header + '</tr>' + body + '</table>';
  }
}

const board = (a, s) => {
  const rows = (a || []).map(p => {
    const pill = p.mvp ? '<span class="mvp-pill">MVP</span>' : '';
    const timeStr = p.time ? ' [' + p.time + 's]' : '';
    return '<tr><td>' + pill + esc(p.name) + '</td><td>' + p.score +
      '</td><td>' + p.kills + '/' + p.deaths + '/' + p.assists + timeStr +
      '</td><td>' + p.impact + '</td></tr>';
  }).join("");
  return '<table class="b ' + s + '">' + rows + '</table>';
};

function render() {
  const all = (D.matches || []).slice().sort((a, b) => {
    const sa = String(a.played_at || a.added_at || "");
    const sb = String(b.played_at || b.added_at || "");
    return sa.localeCompare(sb);
  });
  const M = all.filter(m => !F || m.game_type === F);

  const oppOpts = [...new Set(all.map(m => m.opponent).filter(Boolean))];
  $("#dl-opp").innerHTML = oppOpts.map(v => '<option value="' + esc(v) + '">').join("");

  let streak = 0;
  let last = M.length ? M[M.length - 1].result : null;
  if (M.length) {
    for (let i = M.length - 1; i >= 0; i--) {
      if (M[i].result === last) streak++;
      else break;
    }
  }

  let maxT = Date.now();
  const times = all.map(m => new Date(m.played_at || m.added_at || 0).getTime()).filter(x => !isNaN(x));
  if (times.length) maxT = Math.max(...times);

  // 14-Day Rolling Window for Player Highlights
  const twoWeeksMatches = all.filter(m => (maxT - new Date(m.played_at || m.added_at || 0).getTime()) <= 1209600000);
  const WPl = {};
  twoWeeksMatches.forEach(m => (m.us || []).forEach(p => {
    const x = WPl[p.name] = WPl[p.name] || {
      name: p.name, g: 0, w: 0, k: 0, d: 0, a: 0, i: 0, m: 0, t: 0, hpG: 0, sc: 0
    };
    x.g++;
    if (m.result === "W") x.w++;
    x.k += (p.kills || 0);
    x.d += (p.deaths || 0);
    x.a += (p.assists || 0);
    x.i += (p.impact || 0);
    x.sc += (p.score || 0);
    if (p.mvp) x.m++;
    if (String(m.mode || "").toLowerCase().includes("hardpoint")) {
      x.hpG++;
      x.t += (p.time || 0);
    }
  }));

  const pList = Object.values(WPl).filter(p => p.g >= 2);
  const bestOverall = pList.slice().sort((a, b) => (b.i / b.g) - (a.i / a.g))[0];
  const bestSlayer = pList.slice().sort((a, b) => (b.k / b.g) - (a.k / a.g))[0];
  const bestObj = Object.values(WPl).filter(p => p.hpG >= 1 && p.t > 0).sort((a, b) => (b.t / b.hpG) - (a.t / a.hpG))[0];
  const bestSupport = pList.slice().sort((a, b) => {
    const aScore = (a.a / a.g) * 2 + (a.sc / Math.max(a.k, 1) * 0.02);
    const bScore = (b.a / b.g) * 2 + (b.sc / Math.max(b.k, 1) * 0.02);
    return bScore - aScore;
  })[0];
  const bestClincher = pList.slice().sort((a, b) => (b.m / b.g) - (a.m / a.g))[0];

  let honorsHtml = '';
  if (bestOverall) {
    honorsHtml += '<div class="honor-card main">' +
      '<div class="h-role">★ TOP PERFORMER</div>' +
      '<div class="h-main"><span class="h-name">' + esc(bestOverall.name) + '</span>' +
      '<span class="h-stat">' + Math.round(bestOverall.i / bestOverall.g) + ' AVG IMPACT</span></div>' +
      '<div class="h-sub">' + (bestOverall.k / Math.max(bestOverall.d, 1)).toFixed(2) + ' K/D • ' +
      bestOverall.g + ' matches • ' + Math.round(bestOverall.w / bestOverall.g * 100) + '% win</div></div>';
  }

  const roleList = [];
  if (bestSlayer) {
    roleList.push({
      role: "TOP SLAYER", name: bestSlayer.name,
      stat: (bestSlayer.k / bestSlayer.g).toFixed(1) + " Kills/Match",
      sub: (bestSlayer.k / Math.max(bestSlayer.d, 1)).toFixed(2) + " K/D"
    });
  }
  if (bestObj) {
    roleList.push({
      role: "BEST OBJ", name: bestObj.name,
      stat: Math.round(bestObj.t / bestObj.hpG) + "s Avg Hill Time",
      sub: bestObj.hpG + " Hardpoint games"
    });
  }
  if (bestSupport) {
    roleList.push({
      role: "BEST SUPPORT", name: bestSupport.name,
      stat: (bestSupport.a / bestSupport.g).toFixed(1) + " Assists/Match",
      sub: Math.round(bestSupport.sc / bestSupport.g) + " Avg Score"
    });
  }
  if (bestClincher && bestClincher.m > 0) {
    roleList.push({
      role: "THE CLINCHER", name: bestClincher.name,
      stat: Math.round(bestClincher.m / bestClincher.g * 100) + "% MVP Rate",
      sub: bestClincher.m + " MVPs in " + bestClincher.g + " matches"
    });
  }

  if (roleList.length) {
    honorsHtml += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px;">' +
      roleList.map(r => {
        return '<div class="honor-card"><div class="h-role">' + r.role + '</div>' +
          '<div class="h-name" style="font-size:18px">' + esc(r.name) + '</div>' +
          '<div class="h-stat" style="font-size:13px">' + r.stat + '</div>' +
          '<div class="h-sub">' + r.sub + '</div></div>';
      }).join("") + '</div>';
  }

  $("#honors").innerHTML = honorsHtml ? '<div class="honors-wrap">' + honorsHtml + '</div>' : '';

  const W = M.filter(m => m.result === "W").length;
  const L = M.length - W;
  const winRate = M.length ? Math.round(W / M.length * 100) : 0;
  const streakBadge = last ? '<span class="badge ' + (last === "W" ? "streak-w" : "streak-l") +
    '">' + streak + ' ' + (last === "W" ? "WIN" : "LOSS") + ' STREAK</span>' : '';
  const pips = M.slice(-10).map(m => '<i class="pip ' + (m.result === "W" ? "" : "l") + '"></i>').join("");

  $("#record").innerHTML = M.length ? '<div class="record-box"><div class="record cond">' +
    '<b class="w">' + W + '</b><span class="cap">WINS</span>' +
    '<b class="l">' + L + '</b><span class="cap">LOSSES</span>' +
    '<span class="badge">' + winRate + '% WIN RATE</span>' + streakBadge + '</div>' +
    '<div class="pips">' + pips + '</div></div>' : '<p>No matches yet.</p>';

  let outslayedWon = 0;
  let outslayedLost = 0;
  let underslayedWon = 0;
  let underslayedLost = 0;
  let clutchWon = 0;
  let clutchTotal = 0;

  M.forEach(m => {
    const squadKills = sum(m.us, p => p.kills);
    const enemyKills = sum(m.them, p => p.kills);
    const won = m.result === "W";

    if (squadKills >= enemyKills) {
      if (won) outslayedWon++;
      else outslayedLost++;
    } else {
      if (won) underslayedWon++;
      else underslayedLost++;
    }

    const diff = Math.abs(m.score_us - m.score_them);
    const mode = String(m.mode || "").toLowerCase();
    let isClutch = false;
    if (mode.includes("hardpoint") && diff <= 30) isClutch = true;
    else if ((mode.includes("search") || mode.includes("control")) && diff <= 1) isClutch = true;
    else if (diff <= 15) isClutch = true;

    if (isClutch) {
      clutchTotal++;
      if (won) clutchWon++;
    }
  });

  const clutchPct = clutchTotal ? Math.round(clutchWon / clutchTotal * 100) + "%" : "N/A";
  $("#intel").innerHTML = '<div class="intel-grid">' +
    '<div class="intel-box"><div class="lbl">Out-Slay & Won</div><div class="val" style="color:var(--us)">' + outslayedWon + ' <span class="cap">Matches</span></div></div>' +
    '<div class="intel-box"><div class="lbl">Out-Slay but Lost (Wasted)</div><div class="val" style="color:var(--them)">' + outslayedLost + ' <span class="cap">Matches</span></div></div>' +
    '<div class="intel-box"><div class="lbl">Out-Slayed by Enemy but Won</div><div class="val" style="color:var(--gold)">' + underslayedWon + ' <span class="cap">OBJ Steals</span></div></div>' +
    '<div class="intel-box"><div class="lbl">Clutch Win Rate (Close Games)</div><div class="val">' + clutchPct + ' <span class="cap">(' + clutchWon + '/' + clutchTotal + ')</span></div></div>' +
    '</div>';

  const MM = {};
  M.forEach(m => {
    if (!m.mode && !m.map) return;
    const c = title(m.map || "Unknown") + " - " + title(m.mode || "Unknown");
    const x = MM[c] = MM[c] || { n: c, p: 0, w: 0 };
    x.p++;
    if (m.result === "W") x.w++;
  });

  const vetoRows = Object.values(MM).filter(g => g.p >= 1).map(g => {
    const rate = Math.round(g.w / g.p * 100);
    let tag = '<span class="badge" style="border-color:var(--line);color:var(--muted)">CONTESTED</span>';
    if (rate >= 65 && g.p >= 2) tag = '<span class="badge pick">AUTO-PICK</span>';
    else if (rate < 40 && g.p >= 2) tag = '<span class="badge ban">AUTO-BAN</span>';

    return '<tr><td>' + esc(g.n) + '</td><td>' + g.p + '</td><td>' +
      g.w + '-' + (g.p - g.w) + '</td><td>' + rate + '%</td><td>' + tag + '</td></tr>';
  }).join("");

  $("#veto").innerHTML = vetoRows ? '<div class="wrap"><table>' +
    '<tr><th>Map - Mode</th><th>Played</th><th>Record</th><th>Win %</th><th>Draft Recommendation</th></tr>' +
    vetoRows + '</table></div>' : '<p class="cap">Play 2+ matches per map to view draft recommendations.</p>';

  const T = {
    "Tier 1": { p: 0, w: 0, d: 0, s: {} },
    "Tier 2": { p: 0, w: 0, d: 0, s: {} },
    "Tier 3": { p: 0, w: 0, d: 0, s: {} },
    "Other":  { p: 0, w: 0, d: 0, s: {} }
  };

  M.forEach(m => {
    const pt = parseTier(m.tier);
    const k = pt.main === "T1" ? "Tier 1" : pt.main === "T2" ? "Tier 2" : pt.main === "T3" ? "Tier 3" : "Other";
    const node = T[k];
    node.p++;
    if (m.result === "W") node.w++;
    node.d += ((m.score_us || 0) - (m.score_them || 0));
    if (m.tier) {
      const sk = m.tier.toUpperCase();
      node.s[sk] = node.s[sk] || { p: 0, w: 0 };
      node.s[sk].p++;
      if (m.result === "W") node.s[sk].w++;
    }
  });

  const tierRows = Object.entries(T).filter(([_, v]) => v.p > 0).map(([k, v]) => {
    const diffCol = v.d >= 0 ? "var(--us)" : "var(--them)";
    const diffSign = v.d >= 0 ? "+" : "";
    const mainRow = '<tr><td><b>' + k + '</b></td><td>' + v.p + '</td><td>' +
      v.w + '-' + (v.p - v.w) + '</td><td>' + Math.round(v.w / v.p * 100) + '%</td>' +
      '<td style="color:' + diffCol + '">' + diffSign + Math.round(v.d / v.p) + '</td></tr>';
    const subRows = Object.entries(v.s).map(([sk, sv]) => {
      return '<tr style="color:var(--muted);font-size:12px"><td style="padding-left:22px">' +
        sk + '</td><td>' + sv.p + '</td><td>' + sv.w + '-' + (sv.p - sv.w) + '</td><td>' +
        Math.round(sv.w / sv.p * 100) + '%</td><td>-</td></tr>';
    }).join("");
    return mainRow + subRows;
  }).join("");

  $("#tier-breakdown").innerHTML = '<div class="wrap"><table>' +
    '<tr><th>Tier</th><th>Played</th><th>Record</th><th>Win %</th><th>Avg +/-</th></tr>' +
    (tierRows || '<tr><td colspan=5>No tiers logged</td></tr>') + '</table></div>';

  const O = {};
  M.forEach(m => {
    if (!m.opponent) return;
    const k = m.opponent.toLowerCase();
    const o = O[k] = O[k] || { n: m.opponent, t: m.tier || "", p: 0, w: 0 };
    o.p++;
    if (m.result === "W") o.w++;
  });
  const oppRows = Object.values(O).sort((a, b) => b.p - a.p).map(o => {
    return '<tr><td>' + esc(o.n) + '</td><td>' + esc(o.t) + '</td><td>' +
      o.p + '</td><td>' + o.w + '-' + (o.p - o.w) + '</td></tr>';
  }).join("");
  $("#opps").innerHTML = Object.keys(O).length ? '<div class="wrap"><table>' +
    '<tr><th>Team</th><th>Tier</th><th>Played</th><th>Record</th></tr>' +
    oppRows + '</table></div>' : '<p class="cap">No opponents recorded.</p>';

  const P = {};
  M.forEach(m => {
    const squadKills = sum(m.us, p => p.kills);
    const isHp = String(m.mode || "").toLowerCase().includes("hardpoint");
    const squadHpTime = isHp ? sum(m.us, p => p.time || 0) : 0;
    const pt = parseTier(m.tier);
    const isHighTier = pt.main === "T1" || pt.main === "T2";
    const isLowTier = pt.main === "T3";
    const isSnd = String(m.mode || "").toLowerCase().includes("search");

    (m.us || []).forEach(p => {
      const node = P[p.name] = P[p.name] || {
        n: p.name, g: [], kills: 0, deaths: 0, assists: 0, score: 0, impact: 0,
        teamKillsInGames: 0, hpTime: 0, hpGames: 0, teamHpTimeInGames: 0,
        highImpact: 0, highGames: 0, lowImpact: 0, lowGames: 0,
        sndKills: 0, sndDeaths: 0, sndGames: 0
      };
      node.g.push({ ...p, r: m.result });
      node.kills += (p.kills || 0);
      node.deaths += (p.deaths || 0);
      node.assists += (p.assists || 0);
      node.score += (p.score || 0);
      node.impact += (p.impact || 0);
      node.teamKillsInGames += squadKills;

      if (isHp) {
        node.hpTime += (p.time || 0);
        node.teamHpTimeInGames += squadHpTime;
        node.hpGames++;
      }
      if (isHighTier) {
        node.highImpact += (p.impact || 0);
        node.highGames++;
      } else if (isLowTier) {
        node.lowImpact += (p.impact || 0);
        node.lowGames++;
      }
      if (isSnd) {
        node.sndKills += (p.kills || 0);
        node.sndDeaths += (p.deaths || 0);
        node.sndGames++;
      }
    });
  });

  rows = Object.values(P).map(x => {
    const g = x.g;
    const avgHigh = x.highGames ? (x.highImpact / x.highGames) : (x.impact / g.length);
    const avgLow = x.lowGames ? (x.lowImpact / x.lowGames) : avgHigh;

    return {
      name: x.n,
      games: g.length,
      kd: x.kills / Math.max(x.deaths, 1),
      kpm: x.kills / g.length,
      killShare: x.teamKillsInGames ? (x.kills / x.teamKillsInGames * 100) : 0,
      objShare: x.teamHpTimeInGames ? (x.hpTime / x.teamHpTimeInGames * 100) : 0,
      netSpread: x.kills - x.deaths,
      score: x.score / g.length,
      impact: x.impact / g.length,
      mvp: g.filter(e => e.mvp).length,
      win: g.filter(e => e.r === "W").length / g.length * 100,
      trend: g.map(e => e.impact),
      avgHpTime: x.hpGames ? (x.hpTime / x.hpGames) : 0,
      apm: x.assists / g.length,
      tierDiff: avgHigh - avgLow,
      sndKd: x.sndGames ? (x.sndKills / Math.max(x.sndDeaths, 1)) : 0,
      sndGames: x.sndGames
    };
  });
  draw();

  $("#recent").innerHTML = M.slice().reverse().slice(0, 30).map(m => {
    const isW = m.result === "W";
    const resText = isW ? "VICTORY" : "DEFEAT";
    const tierTag = m.tier ? '<span class="ms-tag" style="color:var(--gold);border-color:var(--gold)">' + esc(m.tier) + '</span>' : '';
    const typeTag = m.game_type ? '<span class="ms-tag">' + TYPES[m.game_type] + '</span>' : '';
    const oppTag = m.opponent ? '<span class="ms-opp">VS ' + esc(m.opponent) + '</span>' : '';
    const mapMode = title(m.map) + " - " + title(m.mode);

    return '<details class="match-item ' + (isW ? 'is-win' : 'is-loss') + '">' +
      '<summary class="match-summary">' +
      '<div class="ms-top"><div class="ms-result">' + resText + '</div>' +
      '<div class="ms-score">' + m.score_us + ' - ' + m.score_them + '</div></div>' +
      '<div class="ms-tags">' + tierTag + typeTag + oppTag +
      '<span>' + esc(mapMode) + '</span>' +
      '<span style="margin-left:auto">' + esc(m.played_at_raw) + '</span></div></summary>' +
      '<div class="match-body">' +
      '<div class="sb-heading us">OUR TEAM</div>' + board(m.us, "us") +
      '<div class="sb-heading them">OPPONENT TEAM</div>' + board(m.them, "them") +
      '<div class="card df-wrap" data-id="' + esc(m.id) + '" style="margin-top:12px">' +
      '<b class="cond" style="font-size:18px">MATCH DETAILS</b>' +
      '<div style="margin-top:8px">' + form(m) + '</div>' +
      '<div class="row">' +
      '<button class="btn save-d">SAVE</button>' +
      '<button class="btn danger del">DELETE</button>' +
      '</div></div></div></details>';
  }).join("");

  $$("#recent .df-wrap").forEach(bindTier);
}

document.addEventListener("click", e => {
  const b = e.target.closest(".seg-type button");
  if (!b) return;
  const was = b.classList.contains("on");
  b.parentNode.querySelectorAll("button").forEach(x => x.classList.remove("on"));
  if (!was) b.classList.add("on");
});

if ($("#filter-select")) {
  $("#filter-select").onchange = e => {
    F = e.target.value;
    render();
  };
}

if ($("nav")) {
  $("nav").onclick = e => {
    const b = e.target.closest("[data-t]");
    if (b) tab(b.dataset.t);
  };
}

if ($("#sort-bar")) {
  $("#sort-bar").onclick = e => {
    const t = e.target.closest("[data-k]");
    if (t) {
      key = t.dataset.k;
      $$("#sort-bar .sort-chip").forEach(c => c.classList.toggle("on", c === t));
      draw();
    }
  };
}

if ($("#toggle-view")) {
  $("#toggle-view").onclick = () => {
    viewMode = viewMode === "cards" ? "table" : "cards";
    draw();
  };
}

if ($("#players-table")) {
  $("#players-table").onclick = e => {
    const t = e.target.closest("th[data-k]");
    if (t) {
      key = t.dataset.k;
      $$("#sort-bar .sort-chip").forEach(c => c.classList.toggle("on", c === t));
      draw();
    }
  };
}

if ($("#recent")) {
  $("#recent").onclick = async e => {
    const w = e.target.closest(".df-wrap");
    if (!w) return;
    const id = w.dataset.id;
    try {
      if (e.target.closest(".del")) {
        if (confirm("Delete match?")) {
          D = await post("/delete", { id });
          render();
          toast("Deleted");
        }
      } else if (e.target.closest(".save-d")) {
        D = await post("/update", { id, ...read(w) });
        render();
        toast("Saved");
      }
    } catch (x) {
      alert(x.message);
    }
  };
}

function shrink(f) {
  return new Promise(res => {
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, 2000 / img.width);
      const c = document.createElement("canvas");
      c.width = img.width * s;
      c.height = img.height * s;
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      c.toBlob(b => res(b || f), "image/jpeg", 0.88);
    };
    img.onerror = () => res(f);
    img.src = URL.createObjectURL(f);
  });
}

async function runQ() {
  for (let i = 0; i < queue.length; i++) {
    const it = queue[i];
    if (it.s !== "wait") continue;
    it.s = "proc";
    renderQH();
    try {
      const b = await shrink(it.f);
      const j = await post("/parse", b, b.type || "image/jpeg");
      it.s = "ready";
      it.m = j.match;
      it.dup = j.duplicate;
    } catch (err) {
      it.s = "err";
      it.e = err.message;
    }
    renderQH();
    if (queueIndex === i) renderRev();
  }
}

function renderQH() {
  const b = $("#q-bar");
  if (!b || queue.length <= 1) return;
  const savedCount = queue.filter(q => q.s === "saved").length;
  const chips = queue.map((q, i) => {
    const icon = q.s === 'ready' ? (q.dup ? '!' : '*') :
      q.s === 'saved' ? 'OK' : q.s === 'err' ? 'X' : '..';
    const act = i === queueIndex ? 'active' : '';
    return '<button type="button" class="q-chip-btn ' + act + ' ' + q.s +
      '" data-idx="' + i + '">#' + (i + 1) + ' ' + icon + '</button>';
  }).join("");

  b.innerHTML = '<div class="q-bar-top">' +
    '<span class="q-title">BATCH REVIEW (' + savedCount + '/' + queue.length + ' SAVED)</span>' +
    '<span class="q-counter">MATCH ' + (queueIndex + 1) + ' OF ' + queue.length + '</span>' +
    '</div><div class="q-chips">' + chips + '</div>';
}

function renderRev() {
  if (!queue.length) {
    $("#preview").innerHTML = "";
    say("Select screenshot(s) to add.");
    return;
  }
  const cur = queue[queueIndex];
  if (!cur) return;
  const qBar = queue.length > 1 ? '<div class="q-bar-card" id="q-bar"></div>' : '';

  if (cur.s === "wait" || cur.s === "proc") {
    $("#preview").innerHTML = qBar + '<div class="card"><b class="cond" ' +
      'style="font-size:20px;color:var(--us)">READING SCREENSHOT ' +
      (queueIndex + 1) + '...</b></div>';
    renderQH();
    return;
  }

  if (cur.s === "err") {
    $("#preview").innerHTML = qBar + '<div class="card">' +
      '<b class="err">FAILED: ' + esc(cur.e) + '</b>' +
      '<div class="row" style="margin-top:10px">' +
      '<button class="btn alt" id="q-sk">SKIP</button>' +
      '<button class="btn danger" id="q-ca">CANCEL ALL</button>' +
      '</div></div>';
    renderQH();
    $("#q-sk").onclick = advQ;
    $("#q-ca").onclick = clrQ;
    return;
  }

  if (cur.s === "saved") {
    $("#preview").innerHTML = qBar + '<div class="card">' +
      '<b class="cond" style="font-size:20px;color:#22c55e">SAVED</b>' +
      '<div class="row" style="margin-top:10px">' +
      '<button class="btn" id="q-nx">NEXT</button>' +
      '</div></div>';
    renderQH();
    $("#q-nx").onclick = advQ;
    return;
  }

  const m = cur.m;
  const mapMode = title(m.map) + " - " + title(m.mode);
  const dupBadge = cur.dup ? '<div style="margin-top:6px"><span class="badge">DUPLICATE DETECTED</span></div>' : '';

  const headerCard = '<div class="card"><div class="score-edit-box">' +
    '<select id="e-res">' +
    '<option value="W" ' + (m.result === "W" ? "selected" : "") + '>VICTORY</option>' +
    '<option value="L" ' + (m.result === "L" ? "selected" : "") + '>DEFEAT</option>' +
    '</select>' +
    '<input type="number" id="e-us" class="score-num-in" value="' + m.score_us + '">' +
    '<span style="color:var(--muted);font-weight:700">-</span>' +
    '<input type="number" id="e-th" class="score-num-in" value="' + m.score_them + '">' +
    '</div><div class="cap" style="margin-top:6px">' + esc(mapMode) +
    ' [' + esc(m.played_at_raw) + ']</div>' + dupBadge + '</div>';

  const playersHtml = (m.us || []).map((p, i) => {
    return '<div class="pl-edit-card" data-i="' + i + '">' +
      '<div class="pl-edit-top">' +
      '<input class="t nm" data-o="' + esc(p.name) + '" value="' + esc(p.name) + '">' +
      '<button type="button" class="btn-mvp-toggle ' + (p.mvp ? 'on' : '') + '">MVP</button>' +
      '<button type="button" class="btn-del-pl">[X] REMOVE</button>' +
      '</div><div class="pl-stat-grid">' +
      '<div class="stat-field"><span>SCORE</span><input type="number" class="st-s" value="' + p.score + '"></div>' +
      '<div class="stat-field"><span>K</span><input type="number" class="st-k" value="' + p.kills + '"></div>' +
      '<div class="stat-field"><span>D</span><input type="number" class="st-d" value="' + p.deaths + '"></div>' +
      '<div class="stat-field"><span>A</span><input type="number" class="st-a" value="' + p.assists + '"></div>' +
      '<div class="stat-field"><span>TIME(s)</span><input type="number" class="st-t" value="' + (p.time || 0) + '"></div>' +
      '<div class="stat-field"><span>IMPACT</span><input type="number" class="st-i" value="' + p.impact + '"></div>' +
      '</div></div>';
  }).join("");

  const detailsCard = '<div class="card" id="pvf">' +
    '<b class="cond" style="font-size:18px">DETAILS</b>' +
    '<div style="margin-top:8px">' + form(m) + '</div></div>';

  const actionButtons = '<div class="row">' +
    '<button class="btn" id="s-sv">' + (cur.dup ? "SAVE ANYWAY" : "SAVE MATCH") + '</button>' +
    '<button class="btn alt" id="s-sk">' + (queue.length > 1 ? "SKIP" : "CANCEL") + '</button>' +
    (queue.length > 1 ? '<button class="btn danger" id="s-ca">CANCEL ALL</button>' : '') +
    '</div>';

  $("#preview").innerHTML = qBar + headerCard +
    '<div id="pl-ed">' + playersHtml + '</div>' +
    detailsCard + actionButtons;

  renderQH();
  bindTier($("#pvf"));

  $$(".btn-mvp-toggle").forEach(b => {
    b.onclick = () => b.classList.toggle("on");
  });

  $$(".btn-del-pl").forEach(b => {
    b.onclick = () => {
      cur.m.us.splice(+b.closest(".pl-edit-card").dataset.i, 1);
      renderRev();
      toast("Removed");
    };
  });

  $("#s-sv").onclick = async () => {
    m.result = $("#e-res").value;
    m.score_us = parseInt($("#e-us").value) || 0;
    m.score_them = parseInt($("#e-th").value) || 0;
    const ren = {};
    const us = [];
    $$(".pl-edit-card").forEach(c => {
      const nm = c.querySelector(".nm").value.trim() || "?";
      const o = c.querySelector(".nm").dataset.o;
      if (nm !== o) ren[o] = nm;
      us.push({
        name: nm,
        score: parseInt(c.querySelector(".st-s").value) || 0,
        kills: parseInt(c.querySelector(".st-k").value) || 0,
        deaths: parseInt(c.querySelector(".st-d").value) || 0,
        assists: parseInt(c.querySelector(".st-a").value) || 0,
        time: parseInt(c.querySelector(".st-t").value) || 0,
        impact: parseInt(c.querySelector(".st-i").value) || 0,
        mvp: c.querySelector(".btn-mvp-toggle").classList.contains("on")
      });
    });
    m.us = us;
    try {
      D = await post("/save", { match: { ...m, ...read($("#pvf")) }, renames: ren });
      render();
      cur.s = "saved";
      toast("Saved");
      advQ();
    } catch (x) {
      alert(x.message);
    }
  };

  $("#s-sk").onclick = advQ;
  if ($("#s-ca")) $("#s-ca").onclick = clrQ;
}

function advQ() {
  const n = queue.findIndex((q, i) => i > queueIndex && q.s !== "saved");
  if (n !== -1) {
    queueIndex = n;
    renderRev();
  } else {
    const a = queue.findIndex(q => q.s !== "saved");
    if (a !== -1) {
      queueIndex = a;
      renderRev();
    } else {
      clrQ();
      say("Batch complete.");
      toast("Batch Complete");
    }
  }
}

function clrQ() {
  queue = [];
  queueIndex = 0;
  $("#preview").innerHTML = "";
  say("Select screenshot(s) to add.");
}

document.addEventListener("click", e => {
  const b = e.target.closest(".q-chip-btn");
  if (b) {
    queueIndex = +b.dataset.idx;
    renderRev();
  }
});

if ($("#file")) {
  $("#file").onchange = () => {
    const f = Array.from($("#file").files || []);
    if (!f.length) return;
    queue = f.map((file, i) => ({
      idx: i, f: file, fn: file.name,
      s: "wait", m: null, dup: false, e: null
    }));
    queueIndex = 0;
    say("Processing " + f.length + " screenshots...");
    renderRev();
    runQ();
    $("#file").value = "";
  };
}

tab(location.hash.slice(1) || "overview");
fetch("/data").then(r => r.json()).then(d => {
  D = d;
  render();
});
