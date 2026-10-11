import React, { useState, useMemo } from 'react';
import { compareTiers } from '../../engine/tierAnalytics';
import { ChevronUp, ChevronDown } from 'lucide-react';

export default function OpponentList({ opponentList }) {
  const [sortCol, setSortCol] = useState('tier');
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortAsc(prev => !prev);
    } else {
      setSortCol(col);
      // For played/record, default descending; for tier/name, default ascending
      setSortAsc(col === 'tier' || col === 'name');
    }
  };

  const sortedList = useMemo(() => {
    if (!opponentList || !opponentList.length) return [];
    return [...opponentList].sort((a, b) => {
      let diff = 0;
      if (sortCol === 'tier') {
        diff = compareTiers(a.tier, b.tier);
        if (diff === 0) diff = b.played - a.played;
      } else if (sortCol === 'name') {
        diff = a.name.localeCompare(b.name);
      } else if (sortCol === 'played') {
        diff = a.played - b.played;
      } else if (sortCol === 'record') {
        const winRateA = a.played ? a.wins / a.played : 0;
        const winRateB = b.played ? b.wins / b.played : 0;
        diff = winRateA - winRateB;
      }
      return sortAsc ? diff : -diff;
    });
  }, [opponentList, sortCol, sortAsc]);

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

  const renderSortIndicator = (col) => {
    if (sortCol !== col) return null;
    return sortAsc ? (
      <ChevronUp size={12} className="inline ml-1 text-[#f5b700]" />
    ) : (
      <ChevronDown size={12} className="inline ml-1 text-[#f5b700]" />
    );
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2.5">
        <h2 className="text-lg font-display text-white flex items-center gap-2 m-0">
          <span className="w-1 h-3.5 bg-primary inline-block"></span>
          OPPONENTS
        </h2>
        <span className="text-[11px] font-mono-num text-[#7d90a6]">
          SORTED BY: <span className="text-[#f5b700] uppercase font-bold">{sortCol}</span>
        </span>
      </div>

      <div className="overflow-x-auto border border-[#223046] bg-[#111723] clip-corner-sm">
        <table className="w-full text-left font-mono-num text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#223046] text-[#7d90a6] bg-[#0c111a]/80 select-none">
              <th
                onClick={() => handleSort('name')}
                className="py-2 px-3 font-semibold cursor-pointer hover:text-white transition-colors"
              >
                TEAM {renderSortIndicator('name')}
              </th>
              <th
                onClick={() => handleSort('tier')}
                className="py-2 px-2 font-semibold cursor-pointer hover:text-white transition-colors"
              >
                TIER {renderSortIndicator('tier')}
              </th>
              <th
                onClick={() => handleSort('played')}
                className="py-2 px-2 text-right font-semibold cursor-pointer hover:text-white transition-colors"
              >
                PLAYED {renderSortIndicator('played')}
              </th>
              <th
                onClick={() => handleSort('record')}
                className="py-2 px-3 text-right font-semibold cursor-pointer hover:text-white transition-colors"
              >
                RECORD {renderSortIndicator('record')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#223046]/40">
            {sortedList.map((opp, idx) => (
              <tr key={idx} className="hover:bg-[#161e2e]/50 transition-colors">
                <td className="py-2 px-3 font-display text-sm font-semibold text-white tracking-wide">
                  {opp.name}
                </td>
                <td className="py-2 px-2 text-secondary font-bold font-mono-num">
                  {opp.tier || '-'}
                </td>
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

