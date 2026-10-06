import React from 'react';
import Sparkline from './Sparkline';
import DivergenceBar from './DivergenceBar';
import { getPlayerMapBreakdown, getPlayerMapHighlights } from '../../engine/playerAnalytics';
import { THEME_CLASSES } from '../../config/theme';

export default function PlayerCardsGrid({ players = [], matches = [] }) {
  if (!players.length) {
    return <p className="text-xs text-[#7d90a6] font-mono-num">No players recorded yet.</p>;
  }

  return (
    <div className="space-y-4 mb-6">
      {players.map(p => {
        const netSign = p.netSpread >= 0 ? '+' : '';
        const tierSign = p.tierDiff >= 0 ? '+' : '';
        const tierColor = p.tierDiff >= 0 ? 'text-[#10b981]' : 'text-[#ff334b]';
        const breakdown = getPlayerMapBreakdown(matches, p.name);
        const highlights = getPlayerMapHighlights(breakdown);

        return (
          <div
            key={p.name}
            className="bg-[#0b101b] border border-[#1a2438] border-l-4 border-l-[#f5b700] p-5 sm:p-6 transition-all shadow-xl"
          >
            {/* Top row: Name, Role tag, MVP badge */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl sm:text-3xl font-extrabold font-display text-white tracking-wide">
                  {p.name}
                </span>
                <span className="text-xs font-display border border-[#00e5ff]/50 bg-[#00e5ff]/10 text-[#00e5ff] px-2 py-0.5 tracking-wider uppercase font-bold">
                  {p.roleTag}
                </span>
              </div>
              {p.mvp > 0 && (
                <div className="border border-[#ffd700]/60 bg-[#f5b700]/15 text-[#ffd700] font-display text-xs font-bold px-2.5 py-0.5 tracking-wider">
                  {p.mvp} MVPS
                </div>
              )}
            </div>

            {/* Open 4-Column Metric Matrix (Row 1) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-4">
              <div>
                <div className="text-[11px] font-mono-num font-semibold text-[#7d90a6] uppercase tracking-wider mb-1">
                  K/D
                </div>
                <div className="font-mono-num text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-none">
                  {p.kd.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-mono-num font-semibold text-[#7d90a6] uppercase tracking-wider mb-1">
                  KPM
                </div>
                <div className="font-mono-num text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-none">
                  {p.kpm.toFixed(1)}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-mono-num font-semibold text-[#7d90a6] uppercase tracking-wider mb-1">
                  KILL SHARE
                </div>
                <div className="font-mono-num text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-none">
                  {Math.round(p.killShare)}%
                </div>
              </div>
              <div>
                <div className="text-[11px] font-mono-num font-semibold text-[#7d90a6] uppercase tracking-wider mb-1">
                  NET +/-
                </div>
                <div className={`font-mono-num text-2xl sm:text-3xl font-extrabold tracking-tight leading-none ${p.netSpread >= 0 ? 'text-[#10b981]' : 'text-[#ff334b]'}`}>
                  {netSign}{p.netSpread}
                </div>
              </div>
            </div>

            {/* Open 4-Column Metric Matrix (Row 2) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-4">
              <div>
                <div className="text-[11px] font-mono-num font-semibold text-[#7d90a6] uppercase tracking-wider mb-1">
                  IMPACT
                </div>
                <div className="font-mono-num text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-none">
                  {Math.round(p.impact)}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-mono-num font-semibold text-[#7d90a6] uppercase tracking-wider mb-1">
                  OBJ SHARE
                </div>
                <div className="font-mono-num text-2xl sm:text-3xl font-extrabold text-[#f5b700] tracking-tight leading-none">
                  {Math.round(p.objShare)}%
                </div>
              </div>
              <div>
                <div className="text-[11px] font-mono-num font-semibold text-[#7d90a6] uppercase tracking-wider mb-1">
                  T1/2 vs T3
                </div>
                <div className={`font-mono-num text-2xl sm:text-3xl font-extrabold tracking-tight leading-none ${tierColor}`}>
                  {tierSign}{Math.round(p.tierDiff)}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-mono-num font-semibold text-[#7d90a6] uppercase tracking-wider mb-1">
                  WIN %
                </div>
                <div className="font-mono-num text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-none">
                  {Math.round(p.win)}%
                </div>
              </div>
            </div>

            {/* Actionable Takeaway Chips (Stronghold & Vulnerable) */}
            {(highlights.best || highlights.worst) && (
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                {highlights.best && (
                  <div
                    className="flex items-center gap-1.5 text-xs font-mono-num font-bold bg-[#00e5ff]/10 border border-[#00e5ff]/40 text-[#00e5ff] px-2.5 py-1 rounded-xs"
                    title={`+${highlights.best.delta}% composite efficiency vs teammates on ${highlights.best.label} (${highlights.best.played} games)`}
                  >
                    <span>STRONGHOLD:</span>
                    <span className="text-white uppercase">{highlights.best.map}</span>
                    <span className="text-[#00e5ff]">+{highlights.best.delta}%</span>
                  </div>
                )}
                {highlights.worst && (
                  <div
                    className="flex items-center gap-1.5 text-xs font-mono-num font-bold bg-[#ff334b]/10 border border-[#ff334b]/40 text-[#ff334b] px-2.5 py-1 rounded-xs"
                    title={`${highlights.worst.delta}% composite efficiency vs teammates on ${highlights.worst.label} (${highlights.worst.played} games)`}
                  >
                    <span>VULNERABLE:</span>
                    <span className="text-white uppercase">{highlights.worst.map}</span>
                    <span className="text-[#ff334b]">{highlights.worst.delta}%</span>
                  </div>
                )}
              </div>
            )}

            {/* Metadata Summary & Right-Aligned Trend Sparkline */}
            <div className="flex items-center justify-between text-xs font-mono-num text-[#7d90a6] mb-3">
              <span>
                {p.games} games · {p.avgHpTime > 0 ? `${Math.round(p.avgHpTime)}s OBJ` : '0s OBJ'}
              </span>
              <div className="flex items-center gap-2.5">
                <span className="text-[11px] font-mono-num uppercase tracking-widest text-[#7d90a6]">
                  TREND
                </span>
                <Sparkline points={p.trend} strokeColor="#00e5ff" />
              </div>
            </div>

            {/* Collapsible Map-Mode Drilldown with Visual Divergence */}
            {breakdown && breakdown.length > 0 && (
              <details className="mt-3 pt-3 border-t border-[#1a2438] text-xs group" open>
                <summary className="cursor-pointer font-display text-xs text-[#00e5ff] tracking-wider select-none hover:text-[#38bdf8] transition-colors flex items-center justify-between py-1">
                  <span>▶ MAP EFFICIENCY & SQUAD DIVERGENCE ({breakdown.length})</span>
                  <span className="text-[10px] text-[#7d90a6] font-mono-num font-normal group-open:hidden">
                    Click to view map stats
                  </span>
                </summary>
                <div className="overflow-x-auto mt-2">
                  <table className="w-full text-left font-mono-num text-xs border-collapse min-w-[550px]">
                    <thead>
                      <tr className="border-b border-[#1f2b3e] text-[#7d90a6] text-[11px] uppercase tracking-wider">
                        <th className="py-2.5 px-3 font-semibold">Map - Mode</th>
                        <th className="py-2.5 px-2 text-center font-semibold">Games</th>
                        <th className="py-2.5 px-3 text-right font-semibold">K/D (vs Team)</th>
                        <th className="py-2.5 px-2 text-center font-semibold">Win %</th>
                        <th className="py-2.5 px-3 text-left font-semibold">Efficiency vs Squad</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#172030]">
                      {breakdown.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-[#121929]/50 transition-colors">
                          <td className="py-3 px-3">
                            <span className="text-white font-bold text-xs uppercase block">{row.map}</span>
                            <span className="text-[10px] text-[#60738a] uppercase block mt-0.5">{row.mode}</span>
                          </td>
                          <td className="py-3 px-2 text-center text-[#cbd5e1] font-mono-num text-xs">
                            {row.played}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span className="text-white font-bold text-xs font-mono-num block">{row.kd}</span>
                            <span className="text-[10px] text-[#7d90a6] font-mono-num block">tm: {row.teamKd}</span>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span className={`font-bold font-mono-num text-xs ${row.winRate >= 60 ? 'text-[#00e5ff]' : row.winRate <= 40 ? 'text-[#ff334b]' : 'text-white'}`}>
                              {row.winRate}%
                            </span>
                          </td>
                          <td className="py-3 px-3">
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
