import React, { useState } from 'react';
import MapBannerBackdrop from '../common/MapBannerBackdrop';
import { THEME_CLASSES } from '../../config/theme';
import {
  Users,
  Shield,
  Trophy,
  Flame,
  ChevronDown,
  ChevronUp,
  Target,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export default function MapCard({ mapData }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const m = mapData;
  const diffSign = m.avgDiff > 0 ? `+${m.avgDiff}` : `${m.avgDiff}`;

  const getRoleStyle = (role = '') => {
    if (role === 'PRIMARY SLAYER') return THEME_CLASSES.badgeGold;
    if (role.includes('ANCHOR') || role.includes('CONTROLLER')) return THEME_CLASSES.badgeGold;
    if (role === 'ENTRY FRAGGER') return THEME_CLASSES.badgeLoss;
    if (role === 'SUPPORT FLEX') return THEME_CLASSES.badgeWin;
    return 'bg-[#c084fc]/15 text-[#c084fc] border-[#c084fc]/40';
  };

  return (
    <div className="border border-[#223046] hover:border-[#354b6d] transition-all clip-corner relative overflow-hidden group shadow-lg bg-[#0c111a]">
      {/* Banner Header matching user reference design */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="relative min-h-[105px] sm:min-h-[120px] p-4 flex items-center justify-between cursor-pointer select-none overflow-hidden"
      >
        {/* Shared Map Backdrop and Left Status Accent */}
        <MapBannerBackdrop mapName={m.map} accentColor={m.statusColor} />

        {/* Main Content */}
        <div className="relative z-10 w-full flex items-center justify-between gap-4">
          
          {/* Left Metadata & Map Name */}
          <div>
            {/* Tag Row */}
            <div className="flex items-center gap-2 text-xs font-mono-num mb-1 flex-wrap">
              <span
                className="font-bold tracking-wider px-1.5 py-0.2 rounded-xs text-[11px]"
                style={{
                  backgroundColor: `${m.statusColor}22`,
                  color: m.statusColor,
                  border: `1px solid ${m.statusColor}55`
                }}
              >
                {m.status}
              </span>
              <span className="text-[#a0aec0] uppercase tracking-wider font-semibold">
                {m.mode}
              </span>
              <span className="text-[#64748b]">
                {m.wins}W - {m.losses}L ({m.winRate}% WIN RATE)
              </span>
            </div>

            {/* Map Title */}
            <h3 className="text-2xl sm:text-4xl font-display font-extrabold text-white tracking-wider m-0 leading-none drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
              {m.map.toUpperCase()}
            </h3>

            {/* Optimal 5 Roster Quick Preview */}
            {m.optimalSquad.length > 0 && (
              <div className="mt-2 hidden sm:flex items-center gap-1.5 text-[11px] font-mono-num text-[#7d90a6]">
                <span className="text-[#f5b700] font-bold">BEST SQUAD:</span>
                <span className="text-white">
                  {m.optimalSquad.map(p => p.name).join(' • ')}
                </span>
              </div>
            )}
          </div>

          {/* Right: Avg Margin & Expand Arrow */}
          <div className="flex items-center gap-4 sm:gap-6">
            
            <div className="text-right">
              <span className="text-[10px] font-mono-num text-[#7d90a6] uppercase tracking-wider block">
                AVG DIFFERENTIAL
              </span>
              <span
                className={`font-display text-2xl sm:text-4xl font-extrabold tracking-tight ${
                  m.avgDiff >= 0 ? 'text-[#10b981]' : 'text-[#ff334b]'
                }`}
              >
                {diffSign}
              </span>
              <span className="text-[10px] font-mono-num text-[#7d90a6] block">
                {m.avgScoreUs} vs {m.avgScoreThem}
              </span>
            </div>

            {/* Chevron */}
            <div className="text-[#7d90a6] group-hover:text-white transition-colors">
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>

          </div>

        </div>
      </div>

      {/* Expanded Map Intel: Optimal Squad & Depth Chart */}
      {isExpanded && (
        <div className="p-4 sm:p-5 border-t border-[#223046] bg-[#0c111a]/98 backdrop-blur-md space-y-6 animate-fadeIn">
          
          {/* SECTION 1: OPTIMAL STARTING 5 LINEUP */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-[#ffb800]" />
                <h4 className="font-display font-extrabold text-sm sm:text-base text-white tracking-wider m-0">
                  RECOMMENDED STARTING 5 // OPTIMAL SQUAD
                </h4>
              </div>
              <span className="text-[11px] font-mono-num text-[#7d90a6]">
                Ranked by mode-specific Map Performance Index (MPI) and historical synergy
              </span>
            </div>

            {m.optimalSquad.length === 0 ? (
              <p className="text-xs font-mono-num text-[#7d90a6]">No player data recorded on this map yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {m.optimalSquad.map((player, idx) => (
                  <div
                    key={player.name}
                    className="bg-[#111723] border border-[#223046] p-3.5 clip-corner-sm flex flex-col justify-between hover:border-[#f5b700]/70 transition-all group shadow-md"
                  >
                    <div>
                      {/* Slot # & Diverse Role Badge */}
                      <div className="flex items-center justify-between text-[10px] font-mono-num mb-1.5">
                        <span className="text-[#f5b700] font-bold">#{idx + 1} SQUAD</span>
                        <span className={`px-1.5 py-0.5 rounded-xs border text-[9px] uppercase font-bold tracking-wider ${getRoleStyle(player.role)}`}>
                          {player.role}
                        </span>
                      </div>

                      {/* Player Name */}
                      <div className="font-display font-extrabold text-white text-lg tracking-wide truncate group-hover:text-[#ffd700] transition-colors">
                        {player.name}
                      </div>

                      {/* Selection Rationale */}
                      <p className="text-[10px] font-mono-num text-[#7d90a6] mt-1 mb-0 leading-tight">
                        {player.reason}
                      </p>
                    </div>

                    {/* Stats Strip */}
                    <div className="mt-3 pt-2.5 border-t border-[#223046]/70 space-y-1.5 text-xs font-mono-num">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-[#7d90a6]">MAP K/D</span>
                        <span className={`font-bold ${player.kd >= 1.2 ? 'text-[#ffd700]' : 'text-white'}`}>
                          {player.kd.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-[#7d90a6]">AVG SCORE</span>
                        <span className="font-bold text-[#ffffff]">
                          {player.avgScore ? player.avgScore.toLocaleString() : '0'}
                        </span>
                      </div>
                      {m.mode.includes('HARDPOINT') && (
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-[#7d90a6]">HILL TIME</span>
                          <span className="font-bold text-[#ffd700]">
                            {player.time}s
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-[10px] text-[#5a6b82] pt-0.5">
                        <span>GAMES</span>
                        <span>{player.games} {player.games === 1 ? 'match' : 'matches'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 2: MAP PLAYER DEPTH CHART (BENCH / RESERVES) */}
          {m.allPlayers && m.allPlayers.length > 5 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-display font-bold text-xs text-[#7d90a6] tracking-wider uppercase m-0">
                  RESERVE SQUAD DEPTH ON {m.map} ({m.allPlayers.length - 5} BENCH)
                </h4>
                <span className="text-[10px] font-mono-num text-[#5a6b82]">
                  Ranked below starting 5 on composite Map Performance Index (MPI)
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono-num">
                {m.allPlayers.slice(5).map((p, idx) => (
                  <div key={p.name} className="bg-[#080c14] border border-[#223046] p-2.5 rounded clip-corner-sm flex items-center justify-between">
                    <div>
                      <span className="text-white font-bold block">{p.name}</span>
                      <span className="text-[10px] text-[#7d90a6]">
                        {p.games} {p.games === 1 ? 'match' : 'matches'} • {p.avgScore ? p.avgScore.toLocaleString() : '0'} score
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[#ffd700] font-bold block">{p.kd.toFixed(2)} K/D</span>
                      <span className="text-[9px] text-[#7d90a6]">Reserve #{idx + 6}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 3: RECENT MATCHES ON THIS MAP */}
          <div>
            <h4 className="font-display font-bold text-xs text-[#7d90a6] tracking-wider mb-2 uppercase">
              Recent Match History on {m.map}
            </h4>
            <div className="space-y-1.5">
              {m.recentMatches.map((rm, idx) => (
                <div
                  key={rm.id || idx}
                  className="bg-[#111723] border border-[#223046] px-3 py-2 clip-corner-sm flex items-center justify-between text-xs font-mono-num"
                >
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${rm.result === 'W' ? 'text-[#10b981]' : 'text-[#ff334b]'}`}>
                      {rm.result === 'W' ? 'WIN' : 'LOSS'}
                    </span>
                    <span className="text-white font-bold">{rm.score_us} - {rm.score_them}</span>
                    {rm.opponent && <span className="text-[#7d90a6]">vs {rm.opponent}</span>}
                  </div>
                  <span className="text-[11px] text-[#7d90a6]">{rm.played_at_raw || ''}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
