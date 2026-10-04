import React from 'react';
import Sparkline from './Sparkline';
import DivergenceBar from './DivergenceBar';
import { getPlayerMapBreakdown, getPlayerMapHighlights } from '../../engine/playerAnalytics';

export default function PlayerCardsGrid({ players = [], matches = [] }) {
  if (!players.length) {
    return <p className="text-xs text-[#7d90a6] font-mono-num">No players recorded yet.</p>;
  }

  return (
    <div className="space-y-3 mb-6">
      {players.map(p => {
        const isHiKd = p.kd >= 1.5;
        const netSign = p.netSpread >= 0 ? '+' : '';
        const tierSign = p.tierDiff >= 0 ? '+' : '';
        const tierColor = p.tierDiff >= 0 ? 'text-[#00e5ff]' : 'text-[#ff334b]';
        const breakdown = getPlayerMapBreakdown(matches, p.name);
        const highlights = getPlayerMapHighlights(breakdown);

        return (
          <div
            key={p.name}
            className={`bg-[#111723] border border-[#223046] border-l-4 p-3.5 clip-corner transition-all ${
              p.mvp > 0 ? 'border-l-[#ffb800]' : 'border-l-[#354b6d]'
            }`}
          >
            {/* Top row: Name, Role tag, MVP badge */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold font-display text-white tracking-wide">{p.name}</span>
                <span className="text-[11px] font-display border border-[#00e5ff] text-[#00e5ff] px-1.5 py-0.2">
                  {p.roleTag}
                </span>
              </div>
              {p.mvp > 0 && (
                <div className="bg-[#ffb800]/15 border border-[#ffb800] text-[#ffb800] font-display text-xs px-2 py-0.5">
                  {p.mvp} MVP{p.mvp > 1 ? 'S' : ''}
                </div>
              )}
            </div>

            {/* Primary stat grid */}
            <div className="grid grid-cols-4 gap-1.5 bg-black/25 p-2 rounded-sm border border-white/5">
              <div>
                <div className="text-[10px] text-[#7d90a6] font-mono-num">K/D</div>
                <div className={`font-mono-num text-base font-bold ${isHiKd ? 'text-[#00e5ff]' : 'text-white'}`}>
                  {p.kd.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[#7d90a6] font-mono-num">KPM</div>
                <div className="font-mono-num text-base font-bold text-white">{p.kpm.toFixed(1)}</div>
              </div>
              <div>
                <div className="text-[10px] text-[#7d90a6] font-mono-num">KILL SHARE</div>
                <div className="font-mono-num text-base font-bold text-white">{Math.round(p.killShare)}%</div>
              </div>
              <div>
                <div className="text-[10px] text-[#7d90a6] font-mono-num">NET +/-</div>
                <div className={`font-mono-num text-base font-bold ${p.netSpread >= 0 ? 'text-[#00e5ff]' : 'text-[#ff334b]'}`}>
                  {netSign}{p.netSpread}
                </div>
              </div>
            </div>

            {/* Secondary sub-grid */}
            <div className="grid grid-cols-4 gap-1.5 bg-black/15 p-2 mt-1.5 border-t border-white/5">
              <div>
                <div className="text-[10px] text-[#7d90a6] font-mono-num">IMPACT</div>
                <div className="font-mono-num text-sm font-bold text-[#f0f4f8]">{Math.round(p.impact)}</div>
              </div>
              <div>
                <div className="text-[10px] text-[#7d90a6] font-mono-num">OBJ SHARE</div>
                <div className="font-mono-num text-sm font-bold text-[#ffb800]">{Math.round(p.objShare)}%</div>
              </div>
              <div>
                <div className="text-[10px] text-[#7d90a6] font-mono-num">T1/2 vs T3</div>
                <div className={`font-mono-num text-sm font-bold ${tierColor}`}>
                  {tierSign}{Math.round(p.tierDiff)}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[#7d90a6] font-mono-num">WIN %</div>
                <div className="font-mono-num text-sm font-bold text-[#f0f4f8]">{Math.round(p.win)}%</div>
              </div>
            </div>

            {/* Map Highlights Quick Chips */}
            {(highlights.best || highlights.worst) && (
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5 flex-wrap">
                {highlights.best && (
                  <div
                    className="flex items-center gap-1.5 text-[10px] font-mono-num bg-[#00e5ff]/10 border border-[#00e5ff]/30 px-2 py-0.5 rounded-xs"
                    title={`+${highlights.best.delta}% composite efficiency vs teammates on ${highlights.best.label} (${highlights.best.played} games, min. 2 to qualify)`}
                  >
                    <span className="text-[#00e5ff] font-bold">STRONGHOLD:</span>
                    <span className="text-white font-medium truncate max-w-[130px]">{highlights.best.map}</span>
                    <span className="text-[#00e5ff] font-bold">+{highlights.best.delta}%</span>
                    <span className="text-[#5a6b82] text-[9px]">({highlights.best.played}G)</span>
                  </div>
                )}
                {highlights.worst && (
                  <div
                    className="flex items-center gap-1.5 text-[10px] font-mono-num bg-[#ff334b]/10 border border-[#ff334b]/30 px-2 py-0.5 rounded-xs"
                    title={`${highlights.worst.delta}% composite efficiency vs teammates on ${highlights.worst.label} (${highlights.worst.played} games, min. 2 to qualify)`}
                  >
                    <span className="text-[#ff334b] font-bold">VULNERABLE:</span>
                    <span className="text-white font-medium truncate max-w-[130px]">{highlights.worst.map}</span>
                    <span className="text-[#ff334b] font-bold">{highlights.worst.delta}%</span>
                    <span className="text-[#5a6b82] text-[9px]">({highlights.worst.played}G)</span>
                  </div>
                )}
                <span className="text-[9px] font-mono-num text-[#5a6b82] hidden sm:inline ml-auto">
                  *min. 2 games to qualify
                </span>
              </div>
            )}

            {/* Sparkline & games summary */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10 text-xs font-mono-num text-[#7d90a6]">
              <span>
                {p.games} games {p.avgHpTime > 0 ? `• ${Math.round(p.avgHpTime)}s OBJ` : ''}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider text-[#7d90a6]">Trend</span>
                <Sparkline points={p.trend} />
              </div>
            </div>

            {/* Collapsible Map-Mode Drilldown with Visual Divergence */}
            {breakdown && breakdown.length > 0 && (
              <details className="mt-2.5 pt-2 border-t border-[#223046] text-xs group">
                <summary className="cursor-pointer font-display text-xs text-[#00e5ff] tracking-wider select-none hover:text-white transition-colors flex items-center justify-between">
                  <span>▶ MAP EFFICIENCY & SQUAD DIVERGENCE ({breakdown.length})</span>
                  <span className="text-[10px] text-[#7d90a6] font-mono-num font-normal group-open:hidden">
                    Click to view map stats
                  </span>
                </summary>
                <div className="overflow-x-auto mt-2 border border-[#223046] bg-[#0c111a]/80">
                  <table className="w-full text-left font-mono-num text-[11px] border-collapse min-w-[500px]">
                    <thead>
                      <tr className="border-b border-[#223046] text-[#7d90a6] bg-[#0c111a]">
                        <th className="py-1.5 px-2.5 font-semibold">Map - Mode</th>
                        <th className="py-1.5 px-1.5 text-center font-semibold">Games</th>
                        <th className="py-1.5 px-2 text-right font-semibold">K/D (vs Team)</th>
                        <th className="py-1.5 px-2 text-center font-semibold">Win %</th>
                        <th className="py-1.5 px-2.5 text-left font-semibold">Efficiency vs Squad</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#223046]/40">
                      {breakdown.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-[#161e2e]/50 transition-colors">
                          <td className="py-1.5 px-2.5 text-white font-medium">
                            <span className="text-white font-bold">{row.map}</span>
                            <span className="text-[10px] text-[#7d90a6] block leading-tight">{row.mode}</span>
                          </td>
                          <td className="py-1.5 px-1.5 text-center text-[#7d90a6]">{row.played}</td>
                          <td className="py-1.5 px-2 text-right">
                            <span className="text-white font-bold">{row.kd}</span>
                            <span className="text-[10px] text-[#7d90a6] block">tm: {row.teamKd}</span>
                          </td>
                          <td className="py-1.5 px-2 text-center">
                            <span className={`font-bold ${row.winRate >= 60 ? 'text-[#00e5ff]' : row.winRate <= 40 ? 'text-[#ff334b]' : 'text-[#f0f4f8]'}`}>
                              {row.winRate}%
                            </span>
                          </td>
                          <td className="py-1.5 px-2.5">
                            <DivergenceBar
                              delta={row.delta}
                              rating={row.rating}
                              tag={row.tag}
                              componentDeltas={row.componentDeltas}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            )}
          </div>
        );
      })}
    </div>
  );
}
