import React from 'react';
import { SORT_COLS } from './SortBar';

export default function PlayerTableView({ players = [], sortKey, onSortChange }) {
  if (!players.length) {
    return <p className="text-xs text-[#7d90a6] font-mono-num">No players recorded yet.</p>;
  }

  return (
    <div className="overflow-x-auto border border-[#223046] bg-[#111723] clip-corner-sm mb-6">
      <table className="w-full text-right font-mono-num text-xs border-collapse min-w-[620px]">
        <thead>
          <tr className="border-b border-[#223046] text-[#7d90a6] bg-[#0c111a]/80">
            <th className="py-2.5 px-3 text-left font-semibold sticky left-0 bg-[#0c111a] z-10">
              PLAYER
            </th>
            {SORT_COLS.map(c => {
              const isSorted = sortKey === c.key;
              return (
                <th
                  key={c.key}
                  onClick={() => onSortChange(c.key)}
                  className={`py-2.5 px-2 font-semibold cursor-pointer select-none transition-colors hover:text-white ${
                    isSorted ? 'text-[#00e5ff] shadow-[inset_0_-2px_#00e5ff]' : ''
                  }`}
                >
                  {c.label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#223046]/40">
          {players.map(p => {
            const netSign = p.netSpread >= 0 ? '+' : '';
            return (
              <tr key={p.name} className="hover:bg-[#161e2e]/50 transition-colors">
                <td className="py-2.5 px-3 text-left font-display text-sm font-bold text-white sticky left-0 bg-[#111723] z-10 border-r border-[#223046]/50">
                  {p.name}
                </td>
                <td className="py-2.5 px-2 text-[#7d90a6]">{Math.round(p.impact)}</td>
                <td className="py-2.5 px-2 font-bold text-white">{p.kd.toFixed(2)}</td>
                <td className="py-2.5 px-2 text-[#f0f4f8]">{p.kpm.toFixed(1)}</td>
                <td className="py-2.5 px-2 text-[#f0f4f8]">{Math.round(p.killShare)}%</td>
                <td className="py-2.5 px-2 text-[#ffb800]">{Math.round(p.objShare)}%</td>
                <td className={`py-2.5 px-2 font-bold ${p.netSpread >= 0 ? 'text-[#00e5ff]' : 'text-[#ff334b]'}`}>
                  {netSign}{p.netSpread}
                </td>
                <td className="py-2.5 px-2 text-[#f0f4f8]">{Math.round(p.score)}</td>
                <td className="py-2.5 px-2 font-bold text-[#ffb800]">{p.mvp}</td>
                <td className="py-2.5 px-2 text-white font-bold">{Math.round(p.win)}%</td>
                <td className="py-2.5 px-2 text-[#7d90a6]">{p.games}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
