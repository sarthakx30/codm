/**
 * Honors Engine: 14-Day Rolling Window Calculations
 */

export function calculateHonors(matches = []) {
  if (!matches || !matches.length) return null;

  // Determine latest match time
  let maxTime = Date.now();
  const timestamps = matches
    .map(m => new Date(m.played_at || m.added_at || 0).getTime())
    .filter(t => !isNaN(t) && t > 0);

  if (timestamps.length) {
    maxTime = Math.max(...timestamps);
  }

  // 14-day rolling window (14 * 24 * 60 * 60 * 1000 = 1,209,600,000 ms)
  const TWO_WEEKS_MS = 1209600000;
  const recentMatches = matches.filter(m => {
    const t = new Date(m.played_at || m.added_at || 0).getTime();
    return maxTime - t <= TWO_WEEKS_MS;
  });

  const playersMap = {};

  recentMatches.forEach(m => {
    const isHp = String(m.mode || '').toLowerCase().includes('hardpoint');
    const won = m.result === 'W';

    (m.us || []).forEach(p => {
      const name = p.name || '?';
      const node = playersMap[name] = playersMap[name] || {
        name,
        games: 0,
        wins: 0,
        kills: 0,
        deaths: 0,
        assists: 0,
        impact: 0,
        mvps: 0,
        hpTime: 0,
        hpGames: 0,
        score: 0
      };

      node.games++;
      if (won) node.wins++;
      node.kills += (p.kills || 0);
      node.deaths += (p.deaths || 0);
      node.assists += (p.assists || 0);
      node.impact += (p.impact || 0);
      node.score += (p.score || 0);
      if (p.mvp) node.mvps++;
      if (isHp) {
        node.hpGames++;
        node.hpTime += (p.time || 0);
      }
    });
  });

  const qualified = Object.values(playersMap).filter(p => p.games >= 2);

  // 1. Top Performer (Highest Average Impact)
  const topPerformer = qualified.slice().sort((a, b) => (b.impact / b.games) - (a.impact / a.games))[0] || null;

  // 2. Top Slayer (Highest KPM)
  const topSlayer = qualified.slice().sort((a, b) => (b.kills / b.games) - (a.kills / a.games))[0] || null;

  // 3. Best OBJ (Highest Avg Hill Time in Hardpoint)
  const bestObj = Object.values(playersMap)
    .filter(p => p.hpGames >= 1 && p.hpTime > 0)
    .sort((a, b) => (b.hpTime / b.hpGames) - (a.hpTime / a.hpGames))[0] || null;

  // 4. Best Support (Assists & score efficiency)
  const bestSupport = qualified.slice().sort((a, b) => {
    const scoreA = (a.assists / a.games) * 2 + (a.score / Math.max(a.kills, 1) * 0.02);
    const scoreB = (b.assists / b.games) * 2 + (b.score / Math.max(b.kills, 1) * 0.02);
    return scoreB - scoreA;
  })[0] || null;

  // 5. The Clincher (Highest MVP Rate)
  const theClincher = qualified
    .filter(p => p.mvps > 0)
    .sort((a, b) => (b.mvps / b.games) - (a.mvps / a.games))[0] || null;

  return {
    topPerformer: topPerformer ? {
      name: topPerformer.name,
      avgImpact: Math.round(topPerformer.impact / topPerformer.games),
      kd: (topPerformer.kills / Math.max(topPerformer.deaths, 1)).toFixed(2),
      games: topPerformer.games,
      winRate: Math.round(topPerformer.wins / topPerformer.games * 100)
    } : null,
    topSlayer: topSlayer ? {
      name: topSlayer.name,
      kpm: (topSlayer.kills / topSlayer.games).toFixed(1),
      kd: (topSlayer.kills / Math.max(topSlayer.deaths, 1)).toFixed(2)
    } : null,
    bestObj: bestObj ? {
      name: bestObj.name,
      avgTime: Math.round(bestObj.hpTime / bestObj.hpGames),
      hpGames: bestObj.hpGames
    } : null,
    bestSupport: bestSupport ? {
      name: bestSupport.name,
      apm: (bestSupport.assists / bestSupport.games).toFixed(1),
      avgScore: Math.round(bestSupport.score / bestSupport.games)
    } : null,
    theClincher: theClincher ? {
      name: theClincher.name,
      mvpRate: Math.round(theClincher.mvps / theClincher.games * 100),
      mvps: theClincher.mvps,
      games: theClincher.games
    } : null
  };
}
