import React from 'react';
import { THEME_CLASSES } from '../../config/theme';

export default function RecordBox({ record }) {
  if (!record) return null;

  const { wins, losses, winRate, streak, streakType, recentPips } = record;

  return (
    <div className="bg-gradient-to-b from-[#162030] to-[#0c111a] border border-[#243044] p-3.5 mb-5 clip-corner shadow-lg">
      <div className="flex items-baseline gap-3 flex-wrap">
        <div className="flex items-baseline gap-1.5">
          <span className="text-5xl font-bold font-display text-[#f5b700] leading-none drop-shadow-[0_0_12px_rgba(245,183,0,0.35)]">
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
        <span className={`${THEME_CLASSES.badgeGold} text-xs font-display px-2 py-0.5 ml-auto`}>
          {winRate}% WIN RATE
        </span>

        {/* Streak Badge */}
        {streak > 0 && streakType && (
          <span
            className={`text-xs font-display px-2 py-0.5 border ${
              streakType === 'W'
                ? THEME_CLASSES.badgeGold
                : THEME_CLASSES.badgeLoss
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
                  ? 'bg-[#f5b700] shadow-[0_0_8px_rgba(245,183,0,0.5)]'
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
