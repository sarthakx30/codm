/**
 * Map Veto & Pick/Ban Strategy Matrix Engine
 */
import { calculateMatchWeightedMargin } from './tierAnalytics.js';
import { normalizeMode } from '../config/matchOptions.js';

export function calculateMapVeto(matches = []) {
  if (!matches || !matches.length) return [];

  const mapModeMap = {};

  matches.forEach(m => {
    if (!m.mode && !m.map) return;
    const mode = normalizeMode(m.mode) || 'Unknown';
    const key = `${m.map || 'Unknown'} - ${mode}`;
    const node = mapModeMap[key] = mapModeMap[key] || {
      name: key,
      map: m.map || 'Unknown',
      mode,
      played: 0,
      wins: 0,
      roundDiff: 0,
      weightedMarginsTotal: 0,
      effectiveWinsTotal: 0,
      effectiveLossesTotal: 0
    };

    node.played++;
    if (m.result === 'W') node.wins++;
    node.roundDiff += ((m.score_us || 0) - (m.score_them || 0));

    const matchIntel = calculateMatchWeightedMargin(m);
    node.weightedMarginsTotal += matchIntel.weightedMarginPct;
    node.effectiveWinsTotal += matchIntel.effectiveWinCredit;
    node.effectiveLossesTotal += matchIntel.effectiveLossPenalty;
  });

  return Object.values(mapModeMap)
    .map(g => {
      const losses = g.played - g.wins;
      const winRate = Math.round((g.wins / g.played) * 100);
      const totalDecisions = g.effectiveWinsTotal + g.effectiveLossesTotal;
      const weightedWinRate = totalDecisions > 0
        ? Math.round((g.effectiveWinsTotal / totalDecisions) * 100)
        : winRate;
      const weightedMargin = g.played > 0
        ? Math.round((g.weightedMarginsTotal / g.played) * 10) / 10
        : 0;

      let recommendation = 'CONTESTED';

      if (g.played >= 2) {
        if (weightedWinRate >= 65 && weightedMargin >= 10) {
          recommendation = 'AUTO-PICK';
        } else if (weightedWinRate < 40 || weightedMargin <= -12) {
          recommendation = 'AUTO-BAN';
        }
      }

      return {
        ...g,
        losses,
        winRate,
        weightedWinRate,
        weightedMargin,
        recommendation,
        avgDiff: Math.round(g.roundDiff / g.played)
      };
    })
    .sort((a, b) => b.played - a.played || b.weightedWinRate - a.weightedWinRate);
}
