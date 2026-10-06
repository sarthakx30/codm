import React from 'react';

export default function OpponentList({ opponentList }) {
  if (!opponentList || !opponentList.length) {
    return (
      <div className="mb-6">
        <h2 className="text-lg font-display text-white flex items-center gap-2 mb-2.5">
          <span className="w-1 h-3.5 bg-[#ffb800] inline-block"></span>
          OPPONENTS
        </h2>
        <p className="text-xs text-[#7d90a6] font-mono-num">No opponents recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h2 className="text-lg font-display text-white flex items-center gap-2 mb-2.5">
        <span className="w-1 h-3.5 bg-primary inline-block"></span>
        OPPONENTS
      </h2>

      <div className="overflow-x-auto border border-[#223046] bg-[#111723] clip-corner-sm">
        <table className="w-full text-left font-mono-num text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#223046] text-[#7d90a6] bg-[#0c111a]/80">
              <th className="py-2 px-3 font-semibold">TEAM</th>
              <th className="py-2 px-2 font-semibold">TIER</th>
              <th className="py-2 px-2 text-right font-semibold">PLAYED</th>
              <th className="py-2 px-3 text-right font-semibold">RECORD</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#223046]/40">
            {opponentList.map((opp, idx) => (
              <tr key={idx} className="hover:bg-[#161e2e]/50 transition-colors">
                <td className="py-2 px-3 font-display text-sm font-semibold text-white tracking-wide">
                  {opp.name}
                </td>
                <td className="py-2 px-2 text-secondary font-bold">{opp.tier || '-'}</td>
                <td className="py-2 px-2 text-right text-[#f0f4f8]">{opp.played}</td>
                <td className="py-2 px-3 text-right text-[#7d90a6]">
                  <span className="text-win">{opp.wins}</span> -{' '}
                  <span className="text-loss">{opp.played - opp.wins}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
