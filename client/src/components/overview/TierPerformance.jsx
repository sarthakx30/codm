import React from 'react';

export default function TierPerformance({ tierList }) {
  if (!tierList || !tierList.length) {
    return (
      <div className="mb-6">
        <h2 className="text-lg font-display text-white flex items-center gap-2 mb-2.5">
          <span className="w-1 h-3.5 bg-[#ffb800] inline-block"></span>
          OPPONENT TIER PERFORMANCE
        </h2>
        <p className="text-xs text-[#7d90a6] font-mono-num">No tiers logged yet.</p>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h2 className="text-lg font-display text-white flex items-center gap-2 mb-2.5">
        <span className="w-1 h-3.5 bg-primary inline-block"></span>
        OPPONENT TIER PERFORMANCE
      </h2>

      <div className="overflow-x-auto border border-[#223046] bg-[#111723] clip-corner-sm">
        <table className="w-full text-left font-mono-num text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#223046] text-[#7d90a6] bg-[#0c111a]/80">
              <th className="py-2 px-3 font-semibold">TIER</th>
              <th className="py-2 px-2 text-right font-semibold">PLAYED</th>
              <th className="py-2 px-2 text-right font-semibold">RECORD</th>
              <th className="py-2 px-2 text-right font-semibold">WIN %</th>
              <th className="py-2 px-3 text-right font-semibold">AVG +/-</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#223046]/40">
            {tierList.map((t, idx) => {
              const diffCol = t.avgDiff >= 0 ? 'text-win' : 'text-loss';
              const diffSign = t.avgDiff >= 0 ? '+' : '';
              return (
                <React.Fragment key={idx}>
                  <tr className="hover:bg-[#161e2e]/50 transition-colors font-medium">
                    <td className="py-2 px-3 font-display text-sm font-bold text-white tracking-wide">
                      {t.name}
                    </td>
                    <td className="py-2 px-2 text-right text-[#f0f4f8]">{t.played}</td>
                    <td className="py-2 px-2 text-right text-[#7d90a6]">
                      <span className="text-win">{t.wins}</span> -{' '}
                      <span className="text-loss">{t.losses}</span>
                    </td>
                    <td className="py-2 px-2 text-right text-white font-bold">{t.winRate}%</td>
                    <td className={`py-2 px-3 text-right font-bold ${diffCol}`}>
                      {diffSign}{t.avgDiff}
                    </td>
                  </tr>
                  {/* Nested subtiers */}
                  {t.subtierList.map((st, sidx) => (
                    <tr key={`${idx}-${sidx}`} className="text-[#7d90a6] text-[11px] bg-[#0c111a]/30">
                      <td className="py-1 px-3 pl-6 font-mono-num tracking-wide">{st.name}</td>
                      <td className="py-1 px-2 text-right">{st.played}</td>
                      <td className="py-1 px-2 text-right">
                        {st.wins} - {st.losses}
                      </td>
                      <td className="py-1 px-2 text-right">{st.winRate}%</td>
                      <td className="py-1 px-3 text-right">-</td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
