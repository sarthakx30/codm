import React from 'react';

export default function ScoreboardTable({ players = [], team = 'us' }) {
  const isUs = team === 'us';

  return (
    <div className="overflow-x-auto mb-3">
      <div
        className={`text-xs font-display font-bold px-2 py-1 border-l-2 tracking-wider ${
          isUs ? 'text-[#00e5ff] border-[#00e5ff] bg-[#00e5ff]/5' : 'text-[#ff334b] border-[#ff334b] bg-[#ff334b]/5'
        }`}
      >
        {isUs ? 'OUR TEAM' : 'OPPONENT TEAM'}
      </div>
      <table className="w-full text-right font-mono-num text-xs border-collapse">
        <thead>
          <tr className="border-b border-[#223046] text-[#7d90a6] text-[11px]">
            <th className="py-1 px-2 text-left font-semibold">Player</th>
            <th className="py-1 px-2 text-right font-semibold">Score</th>
            <th className="py-1 px-2 text-right font-semibold">K / D / A</th>
            <th className="py-1 px-2 text-right font-semibold">Impact</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#223046]/40">
          {players.map((p, idx) => (
            <tr key={idx} className="hover:bg-[#161e2e]/50 transition-colors">
              <td className="py-1.5 px-2 text-left font-medium text-white flex items-center gap-1.5">
                {p.mvp && (
                  <span className="bg-[#ffb800] text-black text-[9px] font-bold px-1 rounded-sm leading-none py-0.5">
                    MVP
                  </span>
                )}
                <span className="truncate max-w-[140px]">{p.name}</span>
              </td>
              <td className="py-1.5 px-2 text-[#f0f4f8]">{p.score}</td>
              <td className="py-1.5 px-2 text-[#7d90a6]">
                <span className="text-white font-bold">{p.kills}</span> / {p.deaths} / {p.assists}
                {p.time > 0 && <span className="text-[#ffb800] ml-1">[{p.time}s]</span>}
              </td>
              <td className="py-1.5 px-2 font-bold text-[#00e5ff]">{p.impact}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
