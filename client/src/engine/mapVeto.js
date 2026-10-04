/**
 * Map Veto & Pick/Ban Strategy Matrix Engine
 */

export function calculateMapVeto(matches = []) {
  if (!matches || !matches.length) return [];

  const mapModeMap = {};

  matches.forEach(m => {
    if (!m.mode && !m.map) return;
    const key = `${m.map || 'Unknown'} - ${m.mode || 'Unknown'}`;
    const node = mapModeMap[key] = mapModeMap[key] || {
      name: key,
      map: m.map || 'Unknown',
      mode: m.mode || 'Unknown',
      played: 0,
      wins: 0,
      roundDiff: 0
    };

    node.played++;
    if (m.result === 'W') node.wins++;
    node.roundDiff += ((m.score_us || 0) - (m.score_them || 0));
  });

  return Object.values(mapModeMap)
    .map(g => {
      const losses = g.played - g.wins;
      const winRate = Math.round((g.wins / g.played) * 100);
      let recommendation = 'CONTESTED';

      if (g.played >= 2) {
        if (winRate >= 65) recommendation = 'AUTO-PICK';
        else if (winRate < 40) recommendation = 'AUTO-BAN';
      }

      return {
        ...g,
        losses,
        winRate,
        recommendation,
        avgDiff: Math.round(g.roundDiff / g.played)
      };
    })
    .sort((a, b) => b.played - a.played || b.winRate - a.winRate);
}
