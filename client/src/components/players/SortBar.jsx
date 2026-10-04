import React from 'react';
import { LayoutGrid, Table } from 'lucide-react';

export const SORT_COLS = [
  { key: 'impact', label: 'Impact' },
  { key: 'kd', label: 'K/D' },
  { key: 'kpm', label: 'KPM' },
  { key: 'killShare', label: 'Kill%' },
  { key: 'objShare', label: 'OBJ%' },
  { key: 'netSpread', label: '+/-' },
  { key: 'score', label: 'Avg Score' },
  { key: 'mvp', label: 'MVPs' },
  { key: 'win', label: 'Win%' },
  { key: 'games', label: 'Games' }
];

export default function SortBar({ sortKey, onSortChange, viewMode, onViewModeToggle }) {
  return (
    <div className="flex items-center justify-between gap-2 mb-4">
      {/* Scrollable Sort Chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {SORT_COLS.map(col => {
          const isActive = sortKey === col.key;
          return (
            <button
              key={col.key}
              onClick={() => onSortChange(col.key)}
              className={`px-2.5 py-1 text-xs font-display whitespace-nowrap transition-all border ${
                isActive
                  ? 'border-[#00e5ff] text-[#00e5ff] bg-[#00e5ff]/10 shadow-[0_0_8px_rgba(0,229,255,0.25)]'
                  : 'border-[#223046] text-[#7d90a6] bg-[#111723] hover:text-white'
              } clip-corner-sm`}
            >
              {col.label}
            </button>
          );
        })}
      </div>

      {/* View Switcher Button */}
      <button
        onClick={onViewModeToggle}
        className="flex items-center gap-1.5 px-2.5 py-1 bg-transparent border border-[#354b6d] text-xs font-display text-[#7d90a6] hover:text-white hover:border-[#00e5ff] transition-colors whitespace-nowrap"
      >
        {viewMode === 'cards' ? (
          <>
            <Table size={13} />
            <span>TABLE</span>
          </>
        ) : (
          <>
            <LayoutGrid size={13} />
            <span>CARDS</span>
          </>
        )}
      </button>
    </div>
  );
}
