/**
 * Player Performance & Role Classification Engine
 */

export function parseTier(t = '') {
  const m = String(t || '').toUpperCase().match(/^(T[123])([HML])?$/);
  return m ? { main: m[1], sub: m[2] || '' } : { main: '', sub: '' };
}

export function getPlayerRoleTag(p) {
  if (p.objShare >= 28) return 'OBJ Anchor';
  if (p.sndKd >= 1.35 && p.sndGames >= 2) return 'S&D Specialist';
  if (p.kpm >= 18) return 'Primary Fragger';
  if (p.apm >= 5.5) return 'Support Flex';
  return 'Flex Operator';
}

export function calculatePlayerStats(matches = []) {
  if (!matches || !matches.length) return [];

  const playersMap = {};

  matches.forEach(m => {
    const squadKills = (m.us || []).reduce((acc, p) => acc + (p.kills || 0), 0);
    const isHp = String(m.mode || '').toLowerCase().includes('hardpoint');
    const squadHpTime = isHp ? (m.us || []).reduce((acc, p) => acc + (p.time || 0), 0) : 0;
    const pt = parseTier(m.tier);
    const isHighTier = pt.main === 'T1' || pt.main === 'T2';
    const isLowTier = pt.main === 'T3';
    const isSnd = String(m.mode || '').toLowerCase().includes('search');

    (m.us || []).forEach(p => {
      const name = p.name || '?';
      const node = playersMap[name] = playersMap[name] || {
        name,
        matchRecords: [],
        kills: 0,
        deaths: 0,
        assists: 0,
        score: 0,
        impact: 0,
        mvps: 0,
        teamKillsInGames: 0,
        hpTime: 0,
        hpGames: 0,
        teamHpTimeInGames: 0,
        highImpact: 0,
        highGames: 0,
        lowImpact: 0,
        lowGames: 0,
        sndKills: 0,
        sndDeaths: 0,
        sndGames: 0
      };

      node.matchRecords.push({ ...p, result: m.result });
      node.kills += (p.kills || 0);
      node.deaths += (p.deaths || 0);
      node.assists += (p.assists || 0);
      node.score += (p.score || 0);
      node.impact += (p.impact || 0);
      node.teamKillsInGames += squadKills;
      if (p.mvp) node.mvps++;

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

  return Object.values(playersMap).map(x => {
    const totalGames = x.matchRecords.length;
    const wins = x.matchRecords.filter(r => r.result === 'W').length;
    const avgHigh = x.highGames ? (x.highImpact / x.highGames) : (x.impact / totalGames);
    const avgLow = x.lowGames ? (x.lowImpact / x.lowGames) : avgHigh;

    const stats = {
      name: x.name,
      games: totalGames,
      wins,
      kd: x.kills / Math.max(x.deaths, 1),
      kpm: x.kills / totalGames,
      apm: x.assists / totalGames,
      killShare: x.teamKillsInGames ? (x.kills / x.teamKillsInGames * 100) : 0,
      objShare: x.teamHpTimeInGames ? (x.hpTime / x.teamHpTimeInGames * 100) : 0,
      netSpread: x.kills - x.deaths,
      score: x.score / totalGames,
      impact: x.impact / totalGames,
      mvp: x.mvps,
      win: (wins / totalGames) * 100,
      trend: x.matchRecords.map(r => r.impact || 0),
      avgHpTime: x.hpGames ? (x.hpTime / x.hpGames) : 0,
      tierDiff: avgHigh - avgLow,
      sndKd: x.sndGames ? (x.sndKills / Math.max(x.sndDeaths, 1)) : 0,
      sndGames: x.sndGames
    };

    return {
      ...stats,
      roleTag: getPlayerRoleTag(stats)
    };
  });
}

export function getPlayerMapBreakdown(matches = [], playerName = '') {
  const mm = {};

  matches
    .filter(m => (m.us || []).some(u => u.name === playerName))
    .forEach(m => {
      const u = m.us.find(x => x.name === playerName);
      const teammates = (m.us || []).filter(x => x.name !== playerName);
      const mapName = m.map || 'Unknown';
      const modeName = m.mode || 'Unknown';
      const label = `${mapName} - ${modeName}`;

      const node = mm[label] = mm[label] || {
        label,
        map: mapName,
        mode: modeName,
        played: 0,
        wins: 0,
        kills: 0,
        deaths: 0,
        score: 0,
        time: 0,
        teammateKills: 0,
        teammateDeaths: 0,
        teammateScore: 0,
        teammateTime: 0,
        teammateSlots: 0
      };

      node.played++;
      if (m.result === 'W') node.wins++;
      node.kills += (u.kills || 0);
      node.deaths += (u.deaths || 0);
      node.score += (u.score || 0);
      node.time += (u.time || 0);

      teammates.forEach(t => {
        node.teammateKills += (t.kills || 0);
        node.teammateDeaths += (t.deaths || 0);
        node.teammateScore += (t.score || 0);
        node.teammateTime += (t.time || 0);
        node.teammateSlots++;
      });
    });

  return Object.values(mm)
    .sort((a, b) => b.played - a.played)
    .map(v => {
      const slots = Math.max(v.teammateSlots, 1);
      const isHp = v.mode.toLowerCase().includes('hardpoint');
      const isSnd = v.mode.toLowerCase().includes('search');

      // Player averages
      const pKd = v.kills / Math.max(v.deaths, 1);
      const pKpm = v.kills / v.played;
      const pAvgScore = v.score / v.played;
      const pAvgHpTime = v.time ? v.time / v.played : 0;

      // Teammate baseline in same matches
      const tmKd = v.teammateKills / Math.max(v.teammateDeaths, 1);
      const tmAvgKills = v.teammateKills / slots;
      const tmAvgScore = v.teammateScore / slots;
      const tmAvgHpTime = v.teammateTime / slots;

      // Safe normalized ratios against team baseline (clamped 0.2 to 3.0 to prevent division distortion)
      const kdRatio = Math.min(Math.max(tmKd > 0 ? pKd / tmKd : 1.0, 0.2), 3.0);
      const scoreRatio = Math.min(Math.max(tmAvgScore > 0 ? pAvgScore / tmAvgScore : 1.0, 0.2), 3.0);
      const killsRatio = Math.min(Math.max(tmAvgKills > 0 ? pKpm / tmAvgKills : 1.0, 0.2), 3.0);
      const objRatio = isHp && tmAvgHpTime > 0 ? Math.min(Math.max(pAvgHpTime / tmAvgHpTime, 0.2), 3.0) : 1.0;

      // Mode-specific weights
      let wKd = 0.40, wScore = 0.30, wKills = 0.30, wObj = 0.00;
      if (isHp) {
        wKd = 0.30;
        wScore = 0.25;
        wKills = 0.25;
        wObj = 0.20;
      } else if (isSnd) {
        wKd = 0.50;
        wScore = 0.30;
        wKills = 0.20;
        wObj = 0.00;
      }

      // Composite Map Efficiency Rating (100 is exact team parity)
      const rating = Math.round((wKd * kdRatio + wScore * scoreRatio + wKills * killsRatio + wObj * objRatio) * 100);
      const delta = rating - 100;

      // Component individual deltas vs team
      const kdDelta = Math.round((kdRatio - 1) * 100);
      const scoreDelta = Math.round((scoreRatio - 1) * 100);
      const killsDelta = Math.round((killsRatio - 1) * 100);
      const objDelta = isHp ? Math.round((objRatio - 1) * 100) : 0;

      // Tactical Performance Role Tag
      let tag = 'PAR';
      let tagColor = '#7d90a6';
      if (isHp && pAvgHpTime >= 50 && objRatio >= 1.5) {
        tag = 'ANCHOR';
        tagColor = '#ffb800';
      } else if (delta >= 25) {
        tag = 'CARRY';
        tagColor = '#ffb800';
      } else if (delta >= 8) {
        tag = 'IMPACT';
        tagColor = '#00e5ff';
      } else if (delta <= -8) {
        tag = 'DRAG';
        tagColor = '#ff334b';
      }

      return {
        label: v.label,
        map: v.map,
        mode: v.mode,
        played: v.played,
        wins: v.wins,
        winRate: Math.round((v.wins / v.played) * 100),
        kd: pKd.toFixed(2),
        teamKd: tmKd.toFixed(2),
        avgScore: Math.round(pAvgScore),
        teamAvgScore: Math.round(tmAvgScore),
        avgHpTime: Math.round(pAvgHpTime),
        teamAvgHpTime: Math.round(tmAvgHpTime),
        rating,
        delta,
        tag,
        tagColor,
        isHp,
        isSnd,
        componentDeltas: {
          kdDelta,
          scoreDelta,
          killsDelta,
          objDelta
        }
      };
    });
}

export function getPlayerMapHighlights(breakdown = []) {
  if (!breakdown || !breakdown.length) return { best: null, worst: null };

  // Prioritize maps with >= 2 games for statistical significance
  const qualified = breakdown.filter(b => b.played >= 2);
  const pool = qualified.length ? qualified : breakdown;

  const sorted = [...pool].sort((a, b) => b.delta - a.delta);
  const best = sorted[0] && sorted[0].delta > 0 ? sorted[0] : null;
  const worst = sorted[sorted.length - 1] && sorted[sorted.length - 1].delta < 0 ? sorted[sorted.length - 1] : null;

  return { best, worst };
}
