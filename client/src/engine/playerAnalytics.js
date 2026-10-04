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
      const label = `${m.map || 'Unknown'} - ${m.mode || 'Unknown'}`;
      const node = mm[label] = mm[label] || {
        label,
        played: 0,
        wins: 0,
        kills: 0,
        deaths: 0,
        score: 0,
        time: 0
      };
      node.played++;
      if (m.result === 'W') node.wins++;
      node.kills += (u.kills || 0);
      node.deaths += (u.deaths || 0);
      node.score += (u.score || 0);
      node.time += (u.time || 0);
    });

  return Object.values(mm)
    .sort((a, b) => b.played - a.played)
    .map(v => ({
      label: v.label,
      played: v.played,
      kd: (v.kills / Math.max(v.deaths, 1)).toFixed(2),
      avgScore: Math.round(v.score / v.played),
      avgHpTime: v.time ? Math.round(v.time / v.played) : 0,
      winRate: Math.round((v.wins / v.played) * 100)
    }));
}
