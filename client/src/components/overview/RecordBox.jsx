import React from 'react';

export default function RecordBox({ record }) {
  if (!record) return null;

  const { wins, losses, winRate, streak, streakType, recentPips } = record;

  return (
    <div className="bg-gradient-to-b from-[#162030] to-[#0f1624] border border-[#354b6d] p-3.5 mb-5 clip-corner shadow-lg">
      <div className="flex items-baseline gap-3 flex-wrap">
        <div className="flex items-baseline gap-1.5">
          <span className="text-5xl font-bold font-display text-[#ffb800] leading-none drop-shadow-[0_0_10px_rgba(255,184,0,0.3)]">
            {wins}
          </span>
          <span className="text-xs font-mono-num text-[#7d90a6]">WINS</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-5xl font-bold font-display text-[#ff334b] leading-none">
            {losses}
          </span>
          <span className="text-xs font-mono-num text-[#7d90a6]">LOSSES</span>
        </div>

        {/* Win Rate Badge */}
        <span className="bg-[#ffb800]/15 border border-[#ffb800] text-[#ffb800] text-xs font-display px-2 py-0.5 ml-auto">
          {winRate}% WIN RATE
        </span>

        {/* Streak Badge */}
        {streak > 0 && streakType && (
          <span
            className={`text-xs font-display px-2 py-0.5 border ${
              streakType === 'W'
                ? 'bg-[#00e5ff]/15 border-[#00e5ff] text-[#00e5ff]'
                : 'bg-[#ff334b]/15 border-[#ff334b] text-[#ff334b]'
            }`}
          >
            {streak} {streakType === 'W' ? 'WIN' : 'LOSS'} STREAK
          </span>
        )}
      </div>

      {/* Skewed Result Pips */}
      {recentPips && recentPips.length > 0 && (
        <div className="flex gap-1.5 mt-3 pt-2 border-t border-white/5">
          {recentPips.map((res, i) => (
            <div
              key={i}
              className={`flex-1 h-3.5 clip-pip transition-all ${
                res === 'W'
                  ? 'bg-[#ffb800] shadow-[0_0_6px_rgba(255,184,0,0.4)]'
                  : 'bg-transparent border-2 border-[#ff334b]'
              }`}
              title={res === 'W' ? 'Victory' : 'Defeat'}
            />
          ))}
        </div>
      )}
    </div>
  );
}
