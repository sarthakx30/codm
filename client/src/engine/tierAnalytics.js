/**
 * Opponent Tier & Team Head-to-Head Engine
 */
import { parseTier } from './playerAnalytics';

export function calculateTierPerformance(matches = []) {
  const tiers = {
    'Tier 1': { name: 'Tier 1', played: 0, wins: 0, diff: 0, subtiers: {} },
    'Tier 2': { name: 'Tier 2', played: 0, wins: 0, diff: 0, subtiers: {} },
    'Tier 3': { name: 'Tier 3', played: 0, wins: 0, diff: 0, subtiers: {} },
    'Other':  { name: 'Other',  played: 0, wins: 0, diff: 0, subtiers: {} }
  };

  matches.forEach(m => {
    const pt = parseTier(m.tier);
    const mainKey = pt.main === 'T1' ? 'Tier 1' : pt.main === 'T2' ? 'Tier 2' : pt.main === 'T3' ? 'Tier 3' : 'Other';
    const node = tiers[mainKey];
    node.played++;
    if (m.result === 'W') node.wins++;
    node.diff += ((m.score_us || 0) - (m.score_them || 0));

    if (m.tier) {
      const subKey = m.tier.toUpperCase();
      node.subtiers[subKey] = node.subtiers[subKey] || { name: subKey, played: 0, wins: 0 };
      node.subtiers[subKey].played++;
      if (m.result === 'W') node.subtiers[subKey].wins++;
    }
  });

  return Object.values(tiers).filter(t => t.played > 0).map(t => ({
    ...t,
    losses: t.played - t.wins,
    winRate: Math.round((t.wins / t.played) * 100),
    avgDiff: Math.round(t.diff / t.played),
    subtierList: Object.values(t.subtiers).map(s => ({
      ...s,
      losses: s.played - s.wins,
      winRate: Math.round((s.wins / s.played) * 100)
    }))
  }));
}

export function calculateOpponents(matches = []) {
  const oppMap = {};

  matches.forEach(m => {
    if (!m.opponent) return;
    const key = m.opponent.trim().toLowerCase();
    const node = oppMap[key] = oppMap[key] || {
      name: m.opponent.trim(),
      tier: m.tier || '',
      played: 0,
      wins: 0
    };
    node.played++;
    if (m.result === 'W') node.wins++;
    if (m.tier && !node.tier) node.tier = m.tier;
  });

  return Object.values(oppMap).sort((a, b) => b.played - a.played);
}
