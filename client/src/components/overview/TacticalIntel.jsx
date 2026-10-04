import React from 'react';

export default function TacticalIntel({ slayMatrix, clutch }) {
  if (!slayMatrix || !clutch) return null;

  return (
    <div className="mb-6">
      <h2 className="text-lg font-display text-white flex items-center gap-2 mb-2.5">
        <span className="w-1 h-3.5 bg-[#ffb800] inline-block"></span>
        TACTICAL INTELLIGENCE
      </h2>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#111723] border border-[#223046] p-2.5 clip-corner-sm">
          <div className="text-[11px] text-[#7d90a6] uppercase font-mono-num">Out-Slay & Won</div>
          <div className="text-xl font-bold font-mono-num text-[#00e5ff] mt-0.5">
            {slayMatrix.outslayedWon} <span className="text-xs font-normal text-[#7d90a6]">Matches</span>
          </div>
        </div>

        <div className="bg-[#111723] border border-[#223046] p-2.5 clip-corner-sm">
          <div className="text-[11px] text-[#7d90a6] uppercase font-mono-num">Out-Slay but Lost (Wasted)</div>
          <div className="text-xl font-bold font-mono-num text-[#ff334b] mt-0.5">
            {slayMatrix.outslayedLost} <span className="text-xs font-normal text-[#7d90a6]">Matches</span>
          </div>
        </div>

        <div className="bg-[#111723] border border-[#223046] p-2.5 clip-corner-sm">
          <div className="text-[11px] text-[#7d90a6] uppercase font-mono-num">Out-Slayed by Enemy but Won</div>
          <div className="text-xl font-bold font-mono-num text-[#ffb800] mt-0.5">
            {slayMatrix.underslayedWon} <span className="text-xs font-normal text-[#7d90a6]">OBJ Steals</span>
          </div>
        </div>

        <div className="bg-[#111723] border border-[#223046] p-2.5 clip-corner-sm">
          <div className="text-[11px] text-[#7d90a6] uppercase font-mono-num">Clutch Win Rate (Close Games)</div>
          <div className="text-xl font-bold font-mono-num text-white mt-0.5">
            {clutch.pct}{' '}
            <span className="text-xs font-normal text-[#7d90a6]">
              ({clutch.won}/{clutch.total})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
