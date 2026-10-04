import React from 'react';

export default function MapVetoTable({ vetoList }) {
  if (!vetoList || !vetoList.length) {
    return (
      <div className="mb-6">
        <h2 className="text-lg font-display text-white flex items-center gap-2 mb-2.5">
          <span className="w-1 h-3.5 bg-[#ffb800] inline-block"></span>
          MAP VETO & PICK STRATEGY
        </h2>
        <p className="text-xs text-[#7d90a6] font-mono-num">Play 2+ matches per map to view draft recommendations.</p>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h2 className="text-lg font-display text-white flex items-center gap-2 mb-2.5">
        <span className="w-1 h-3.5 bg-[#ffb800] inline-block"></span>
        MAP VETO & PICK STRATEGY
      </h2>

      <div className="overflow-x-auto border border-[#223046] bg-[#111723] clip-corner-sm">
        <table className="w-full text-left font-mono-num text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#223046] text-[#7d90a6] bg-[#0c111a]/80">
              <th className="py-2 px-3 font-semibold">MAP - MODE</th>
              <th className="py-2 px-2 text-right font-semibold">PLAYED</th>
              <th className="py-2 px-2 text-right font-semibold">RECORD</th>
              <th className="py-2 px-2 text-right font-semibold">WIN %</th>
              <th className="py-2 px-3 text-right font-semibold">RECOMMENDATION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#223046]/50">
            {vetoList.map((item, idx) => {
              const isPick = item.recommendation === 'AUTO-PICK';
              const isBan = item.recommendation === 'AUTO-BAN';
              return (
                <tr key={idx} className="hover:bg-[#161e2e]/50 transition-colors">
                  <td className="py-2 px-3 font-display text-sm font-semibold text-white tracking-wide">
                    {item.name}
                  </td>
                  <td className="py-2 px-2 text-right text-[#f0f4f8]">{item.played}</td>
                  <td className="py-2 px-2 text-right text-[#7d90a6]">
                    <span className="text-[#00e5ff]">{item.wins}</span> -{' '}
                    <span className="text-[#ff334b]">{item.losses}</span>
                  </td>
                  <td className="py-2 px-2 text-right font-bold text-white">{item.winRate}%</td>
                  <td className="py-2 px-3 text-right">
                    <span
                      className={`inline-block text-[11px] font-display font-bold px-2 py-0.5 border ${
                        isPick
                          ? 'border-[#22c55e] text-[#22c55e] bg-[#22c55e]/15'
                          : isBan
                          ? 'border-[#ff334b] text-[#ff334b] bg-[#ff334b]/15'
                          : 'border-[#223046] text-[#7d90a6] bg-transparent'
                      }`}
                    >
                      {item.recommendation}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
