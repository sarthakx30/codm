/**
 * Maps Analytics Engine
 * Computes mode-aware map statistics, win rates, individual player ratings,
 * and algorithmically verified starting 5 squad recommendations with diverse roles.
 */
import { calculatePlayerStats } from './playerAnalytics.js';

export function calculateMapsIntel(matches = []) {
  if (!matches || matches.length === 0) return [];

  // Group matches by "mode:::map"
  const mapGroups = new Map();

  matches.forEach(m => {
    const mode = (m.mode || 'UNKNOWN').trim().toUpperCase();
    const mapName = (m.map || 'UNKNOWN').trim().toUpperCase();
    const key = `${mode}:::${mapName}`;

    if (!mapGroups.has(key)) {
      mapGroups.set(key, {
        mode,
        map: mapName,
        matches: [],
        wins: 0,
        losses: 0,
        scoreUsTotal: 0,
        scoreThemTotal: 0
      });
    }

    const group = mapGroups.get(key);
    group.matches.push(m);
    if (m.result === 'W') group.wins++;
    else group.losses++;
    group.scoreUsTotal += (m.score_us || 0);
    group.scoreThemTotal += (m.score_them || 0);
  });

  // Calculate detailed analytics for each map
  const results = [];

  for (const group of mapGroups.values()) {
    const totalGames = group.matches.length;
    const winRate = totalGames > 0 ? Math.round((group.wins / totalGames) * 100) : 0;
    const avgScoreUs = Math.round(group.scoreUsTotal / totalGames);
    const avgScoreThem = Math.round(group.scoreThemTotal / totalGames);
    const avgDiff = Math.round((group.scoreUsTotal - group.scoreThemTotal) / totalGames);

    // Player stats on this specific map
    const playerMapStats = calculatePlayerStats(group.matches);

    const isHP = group.mode.includes('HARDPOINT');
    const isSnD = group.mode.includes('SEARCH') || group.mode.includes('S&D');

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

      let scoreWeight = 0;
      if (isHP) {
        // Hardpoint: Gunskill & Slaying (35%) + Hill Time & Zone Control (35%) + Score & Impact (30%)
        scoreWeight = (kd * 35) + (kpm * 0.8) + (avgHpTime * 0.45) + (avgScore * 0.006) + (mvpCount * 8);
      } else if (isSnD) {
        // Search & Destroy: Round K/D & Survival (55%) + Impact & Opening Picks (45%)
        scoreWeight = (kd * 55) + (kpm * 8) + (avgScore * 0.02) + (impact * 0.15) + (mvpCount * 10);
      } else {
        // Control: Slaying & Lives (45%) + Point Capture & Pressure (55%)
        scoreWeight = (kd * 40) + (kpm * 0.7) + (avgScore * 0.008) + (impact * 0.15) + (mvpCount * 8);
      }

      return {
        name: p.name,
        games,
        kd,
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
    // Ensures a balanced competitive roster: Primary Slayer, OBJ Anchor, Entry Fragger, Support Flex, Flex Operator
    const assignedRoles = new Map();

    // 1. Identify Primary Slayer (highest pure slaying power & kill efficiency)
    let bestSlayerPlayer = null;
    let maxSlay = -1;
    top5Candidates.forEach(p => {
      const slayVal = (p.kd * 2.5) + (p.kpm * 0.1);
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
    const optimalSquad = top5Candidates.map((p, idx) => {
      const role = assignedRoles.get(p.name) || 'FLEX OPERATOR';
      let reason = '';
      if (role === 'PRIMARY SLAYER') {
        reason = `Top fragging efficiency (${p.kd.toFixed(2)} K/D, ${Math.round(p.kpm)} kills/game)`;
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
        kpm: p.kpm,
        time: p.avgHpTime,
        avgScore: p.avgScore,
        impact: p.impact,
        games: p.games
      };
    });

    // Map status determination
    let status = 'CONTESTED';
    let statusColor = '#ffb800'; // gold
    if (winRate >= 70 && totalGames >= 2) {
      status = 'STRONGHOLD';
      statusColor = '#10b981'; // emerald
    } else if (winRate <= 35 && totalGames >= 2) {
      status = 'VULNERABLE';
      statusColor = '#ff334b'; // crimson
    }

    results.push({
      mode: group.mode,
      map: group.map,
      totalGames,
      wins: group.wins,
      losses: group.losses,
      winRate,
      avgScoreUs,
      avgScoreThem,
      avgDiff,
      status,
      statusColor,
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
