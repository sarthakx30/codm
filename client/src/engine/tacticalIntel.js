/**
 * Tactical Intelligence & Record Engine
 */

export function calculateTacticalIntel(matches = []) {
  if (!matches || !matches.length) {
    return {
      record: { wins: 0, losses: 0, winRate: 0, streak: 0, streakType: null, recentPips: [] },
      slayMatrix: { outslayedWon: 0, outslayedLost: 0, underslayedWon: 0, underslayedLost: 0 },
      clutch: { won: 0, total: 0, pct: 'N/A' }
    };
  }

  // Sorted chronologically
  const sorted = matches.slice().sort((a, b) => {
    const ta = new Date(a.played_at || a.added_at || 0).getTime();
    const tb = new Date(b.played_at || b.added_at || 0).getTime();
    return ta - tb;
  });

  let wins = 0;
  let outslayedWon = 0;
  let outslayedLost = 0;
  let underslayedWon = 0;
  let underslayedLost = 0;
  let clutchWon = 0;
  let clutchTotal = 0;

  sorted.forEach(m => {
    const isWin = m.result === 'W';
    if (isWin) wins++;

    const squadKills = (m.us || []).reduce((acc, p) => acc + (p.kills || 0), 0);
    const enemyKills = (m.them || []).reduce((acc, p) => acc + (p.kills || 0), 0);

    if (squadKills >= enemyKills) {
      if (isWin) outslayedWon++;
      else outslayedLost++;
    } else {
      if (isWin) underslayedWon++;
      else underslayedLost++;
    }

    // Clutch detection
    const diff = Math.abs((m.score_us || 0) - (m.score_them || 0));
    const mode = String(m.mode || '').toLowerCase();
    let isClutch = false;

    if (mode.includes('hardpoint') && diff <= 30) isClutch = true;
    else if ((mode.includes('search') || mode.includes('control')) && diff <= 1) isClutch = true;
    else if (diff <= 15) isClutch = true;

    if (isClutch) {
      clutchTotal++;
      if (isWin) clutchWon++;
    }
  });

  const total = sorted.length;
  const losses = total - wins;
  const winRate = total ? Math.round((wins / total) * 100) : 0;

  // Calculate streak from the most recent matches
  let streak = 0;
  let lastResult = total ? sorted[total - 1].result : null;
  if (total) {
    for (let i = total - 1; i >= 0; i--) {
      if (sorted[i].result === lastResult) streak++;
      else break;
    }
  }

  const recentPips = sorted.slice(-10).map(m => m.result);
  const clutchPct = clutchTotal ? `${Math.round((clutchWon / clutchTotal) * 100)}%` : 'N/A';

  return {
    record: {
      wins,
      losses,
      winRate,
      streak,
      streakType: lastResult,
      recentPips
    },
    slayMatrix: {
      outslayedWon,
      outslayedLost,
      underslayedWon,
      underslayedLost
    },
    clutch: {
      won: clutchWon,
      total: clutchTotal,
      pct: clutchPct
    }
  };
}
