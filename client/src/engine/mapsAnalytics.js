/**
 * Maps Analytics Engine
 * Computes mode-aware map statistics, win rates, individual player ratings,
 * tier-normalized performance margins, and starting 5 squad recommendations.
 */
import { PALETTE } from '../config/theme.js';
import { getModeId, normalizeMode } from '../config/matchOptions.js';
import { calculatePlayerStats, parseTier } from './playerAnalytics.js';
import {
  getTierDifficulty,
  calculateMatchWeightedMargin
} from './tierAnalytics.js';

export function calculateMapsIntel(matches = []) {
  if (!matches || matches.length === 0) return [];

  // Group matches by "mode:::map"
  const mapGroups = new Map();

  matches.forEach(m => {
    const mode = normalizeMode(m.mode) || 'UNKNOWN';
    const modeId = getModeId(mode);
    const mapName = (m.map || 'UNKNOWN').trim().toUpperCase();
    const key = `${mode}:::${mapName}`;

    if (!mapGroups.has(key)) {
      mapGroups.set(key, {
        mode,
        modeId,
        map: mapName,
        matches: [],
        wins: 0,
        losses: 0,
        scoreUsTotal: 0,
        scoreThemTotal: 0,
        weightedMarginsTotal: 0,
        effectiveWinsTotal: 0,
        effectiveLossesTotal: 0,
        tierBreakdown: {}
      });
    }

    const group = mapGroups.get(key);
    group.matches.push(m);
    if (m.result === 'W') group.wins++;
    else group.losses++;
    group.scoreUsTotal += (m.score_us || 0);
    group.scoreThemTotal += (m.score_them || 0);

    // Calculate match tier-normalized metrics
    const matchIntel = calculateMatchWeightedMargin(m);
    group.weightedMarginsTotal += matchIntel.weightedMarginPct;
    group.effectiveWinsTotal += matchIntel.effectiveWinCredit;
    group.effectiveLossesTotal += matchIntel.effectiveLossPenalty;

    // Track tier breakdown
    const tierClean = (m.tier || '').trim().toUpperCase();
    const pt = parseTier(tierClean);
    const tierCategory = pt.main || 'OTHER';
    if (!group.tierBreakdown[tierCategory]) {
      group.tierBreakdown[tierCategory] = { played: 0, wins: 0, losses: 0 };
    }
    group.tierBreakdown[tierCategory].played++;
    if (m.result === 'W') group.tierBreakdown[tierCategory].wins++;
    else group.tierBreakdown[tierCategory].losses++;
  });

  // Calculate detailed analytics for each map
  const results = [];

  for (const group of mapGroups.values()) {
    const totalGames = group.matches.length;
    const winRate = totalGames > 0 ? Math.round((group.wins / totalGames) * 100) : 0;
    const avgScoreUs = Math.round(group.scoreUsTotal / totalGames);
    const avgScoreThem = Math.round(group.scoreThemTotal / totalGames);
    const avgDiff = Math.round((group.scoreUsTotal - group.scoreThemTotal) / totalGames);

    // Tier-Weighted Metrics:
    const weightedMargin = totalGames > 0
      ? Math.round((group.weightedMarginsTotal / totalGames) * 10) / 10
      : 0;

    const totalEffectiveDecisions = group.effectiveWinsTotal + group.effectiveLossesTotal;
    const weightedWinRate = totalEffectiveDecisions > 0
      ? Math.round((group.effectiveWinsTotal / totalEffectiveDecisions) * 100)
      : winRate;

    // Player stats on this specific map
    const playerMapStats = calculatePlayerStats(group.matches);

    // Map match records per player to calculate tier-weighted ratings
    const playerTierStats = new Map();
    group.matches.forEach(m => {
      const diff = getTierDifficulty(m.tier);
      (m.us || []).forEach(p => {
        const name = p.name || '?';
        if (!playerTierStats.has(name)) {
          playerTierStats.set(name, {
            weightedKdTotal: 0,
            weightedScoreTotal: 0,
            weightedHpTimeTotal: 0,
            weightedImpactTotal: 0,
            games: 0
          });
        }
        const node = playerTierStats.get(name);
        node.games++;
        const pKills = p.kills || 0;
        const pDeaths = p.deaths || 0;
        const matchKd = pKills / Math.max(pDeaths, 1);
        const kdMult = pKills >= pDeaths ? diff : (2.0 - diff);
        node.weightedKdTotal += (matchKd * kdMult);
        node.weightedScoreTotal += ((p.score || 0) * diff);
        node.weightedHpTimeTotal += ((p.time || 0) * diff);
        const pImpact = p.impact || 0;
        const impactMult = pImpact >= 0 ? diff : (2.0 - diff);
        node.weightedImpactTotal += (pImpact * impactMult);
      });
    });

    const isHP = group.modeId === 'hardpoint';
    const isSnD = group.modeId === 'snd';

    // Rank players for this map using robust, mode-aware Map Performance Index (MPI)
    const rankedPlayers = playerMapStats.map(p => {
      const kd = Number(p.kd) || 0;
      const kpm = Number(p.kpm) || 0;
      const apm = Number(p.apm) || 0;
      const avgScore = Number(p.score) || 0;
      const avgHpTime = Number(p.avgHpTime) || 0;
      const mvpCount = Number(p.mvp) || 0;
      const impact = Number(p.impact) || 0;
      const games = Number(p.games) || 1;

      const tierNode = playerTierStats.get(p.name);
      const weightedKd = tierNode && tierNode.games > 0
        ? tierNode.weightedKdTotal / tierNode.games
        : kd;
      const weightedScore = tierNode && tierNode.games > 0
        ? tierNode.weightedScoreTotal / tierNode.games
        : avgScore;
      const weightedHpTime = tierNode && tierNode.games > 0
        ? tierNode.weightedHpTimeTotal / tierNode.games
        : avgHpTime;
      const weightedImpact = tierNode && tierNode.games > 0
        ? tierNode.weightedImpactTotal / tierNode.games
        : impact;

      let scoreWeight = 0;
      if (isHP) {
        // Hardpoint: Gunskill & Slaying (35%) + Hill Time & Zone Control (35%) + Score & Impact (30%)
        scoreWeight = (weightedKd * 35) + (kpm * 0.8) + (weightedHpTime * 0.45) + (weightedScore * 0.006) + (mvpCount * 8);
      } else if (isSnD) {
        // Search & Destroy: Round K/D & Survival (55%) + Impact & Opening Picks (45%)
        scoreWeight = (weightedKd * 55) + (kpm * 8) + (weightedScore * 0.02) + (weightedImpact * 0.15) + (mvpCount * 10);
      } else {
        // Control: Slaying & Lives (45%) + Point Capture & Pressure (55%)
        scoreWeight = (weightedKd * 40) + (kpm * 0.7) + (weightedScore * 0.008) + (weightedImpact * 0.15) + (mvpCount * 8);
      }

      return {
        name: p.name,
        games,
        kd,
        weightedKd: Math.round(weightedKd * 100) / 100,
        kpm,
        apm,
        avgScore: Math.round(avgScore),
        avgHpTime: Math.round(avgHpTime),
        mvp: mvpCount,
        impact,
        selectionScore: scoreWeight
      };
    }).sort((a, b) => b.selectionScore - a.selectionScore);

    // Top 5 Candidates
    const top5Candidates = rankedPlayers.slice(0, 5);

    // Dynamic, Distinct Tactical Role Allocation across the 5 starters
    const assignedRoles = new Map();

    // 1. Identify Primary Slayer (highest pure slaying power & kill efficiency)
    let bestSlayerPlayer = null;
    let maxSlay = -1;
    top5Candidates.forEach(p => {
      const slayVal = (p.weightedKd * 2.5) + (p.kpm * 0.1);
      if (slayVal > maxSlay) {
        maxSlay = slayVal;
        bestSlayerPlayer = p.name;
      }
    });
    if (bestSlayerPlayer) {
      assignedRoles.set(bestSlayerPlayer, 'PRIMARY SLAYER');
    }

    // 2. Identify OBJ Anchor (highest hill time for HP, or best anchor for SnD/Control among remaining)
    let bestObjPlayer = null;
    let maxObj = -1;
    top5Candidates.forEach(p => {
      if (assignedRoles.has(p.name)) return;
      const objVal = isHP ? p.avgHpTime : p.avgScore;
      if (objVal > maxObj) {
        maxObj = objVal;
        bestObjPlayer = p.name;
      }
    });
    if (bestObjPlayer) {
      assignedRoles.set(bestObjPlayer, isHP ? 'OBJ ANCHOR' : isSnD ? 'SITE ANCHOR' : 'ZONE CONTROLLER');
    }

    // 3. Identify Support Flex (highest assists / trade presence among remaining)
    let bestSupportPlayer = null;
    let maxSupport = -1;
    top5Candidates.forEach(p => {
      if (assignedRoles.has(p.name)) return;
      if (p.apm > maxSupport) {
        maxSupport = p.apm;
        bestSupportPlayer = p.name;
      }
    });
    if (bestSupportPlayer) {
      assignedRoles.set(bestSupportPlayer, 'SUPPORT FLEX');
    }

    // 4. Identify Entry Fragger (highest remaining engagement pace / KPM)
    let bestEntryPlayer = null;
    let maxEntry = -1;
    top5Candidates.forEach(p => {
      if (assignedRoles.has(p.name)) return;
      if (p.kpm > maxEntry) {
        maxEntry = p.kpm;
        bestEntryPlayer = p.name;
      }
    });
    if (bestEntryPlayer) {
      assignedRoles.set(bestEntryPlayer, 'ENTRY FRAGGER');
    }

    // 5. Remaining player -> FLEX OPERATOR
    top5Candidates.forEach(p => {
      if (!assignedRoles.has(p.name)) {
        assignedRoles.set(p.name, 'FLEX OPERATOR');
      }
    });

    // Build Optimal 5 starting roster with reasons
    const optimalSquad = top5Candidates.map((p) => {
      const role = assignedRoles.get(p.name) || 'FLEX OPERATOR';
      let reason = '';
      if (role === 'PRIMARY SLAYER') {
        reason = `Top fragging efficiency (${p.weightedKd.toFixed(2)} Tier-Wt K/D, ${Math.round(p.kpm)} kills/game)`;
      } else if (role.includes('ANCHOR') || role.includes('CONTROLLER')) {
        reason = isHP
          ? `Top hill presence (${p.avgHpTime}s avg objective time)`
          : `Anchor defense & site control (${p.avgScore.toLocaleString()} score)`;
      } else if (role === 'ENTRY FRAGGER') {
        reason = `Aggressive frontline pace (${Math.round(p.kpm)} kills/game)`;
      } else if (role === 'SUPPORT FLEX') {
        reason = `Team fight trades & assists (${p.apm.toFixed(1)} assists/game)`;
      } else {
        reason = `Balanced lane rotation & secondary objective support`;
      }

      return {
        name: p.name,
        role,
        reason,
        kd: p.kd,
        weightedKd: p.weightedKd,
        kpm: p.kpm,
        time: p.avgHpTime,
        avgScore: p.avgScore,
        impact: p.impact,
        games: p.games
      };
    });

    // Map status determination based on tier-weighted performance
    let status = 'CONTESTED';
    let statusColor = PALETTE.primary; // gold
    if (totalGames >= 2) {
      if (weightedWinRate >= 65 && weightedMargin >= 10) {
        status = 'STRONGHOLD';
        statusColor = PALETTE.win; // emerald
      } else if (weightedWinRate <= 35 || weightedMargin <= -12) {
        status = 'VULNERABLE';
        statusColor = PALETTE.loss; // crimson
      }
    }

    results.push({
      mode: group.mode,
      modeId: group.modeId,
      map: group.map,
      totalGames,
      wins: group.wins,
      losses: group.losses,
      winRate,
      weightedWinRate,
      avgScoreUs,
      avgScoreThem,
      avgDiff,
      weightedMargin,
      status,
      statusColor,
      tierBreakdown: group.tierBreakdown,
      optimalSquad,
      allPlayers: rankedPlayers,
      recentMatches: group.matches.slice(0, 5)
    });
  }

  // Sort by mode then totalGames descending
  return results.sort((a, b) => {
    if (a.mode !== b.mode) return a.mode.localeCompare(b.mode);
    return b.totalGames - a.totalGames;
  });
}
