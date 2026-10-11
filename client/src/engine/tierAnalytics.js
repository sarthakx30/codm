/**
 * Opponent Tier & Team Head-to-Head Engine
 */
import { parseTier } from './playerAnalytics';

export function getTierWeight(tier = '') {
  const pt = parseTier(tier);
  if (!pt.main) return 999;
  const mainWeight = pt.main === 'T1' ? 10 : pt.main === 'T2' ? 20 : pt.main === 'T3' ? 30 : 40;
  const subWeight = pt.sub === 'H' ? 1 : pt.sub === 'M' ? 2 : pt.sub === 'L' ? 3 : 4;
  return mainWeight + subWeight;
}

export function compareTiers(tierA = '', tierB = '') {
  return getTierWeight(tierA) - getTierWeight(tierB);
}

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
    subtierList: Object.values(t.subtiers)
      .sort((a, b) => compareTiers(a.name, b.name))
      .map(s => ({
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
    const cleanName = m.opponent.trim();
    if (!cleanName) return;
    const key = cleanName.toLowerCase();
    const node = oppMap[key] = oppMap[key] || {
      name: cleanName,
      tier: '',
      played: 0,
      wins: 0
    };
    node.played++;
    if (m.result === 'W') node.wins++;
    // Keep most recent tier recorded against this opponent
    if (m.tier) node.tier = m.tier;
  });

  // Sort by tier hierarchy first (T1H -> T1M -> T1L -> T2H...), then games played
  return Object.values(oppMap).sort((a, b) => {
    const tierDiff = compareTiers(a.tier, b.tier);
    if (tierDiff !== 0) return tierDiff;
    return b.played - a.played;
  });
}
