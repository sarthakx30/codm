import React from 'react';
import { GAME_TYPES, normalizeGameType } from '../../config/matchOptions';

/**
 * Two-way match category selector. A value is always selected.
 */
export default function GameTypePicker({ value = '', onChange, className = '' }) {
  const selected = normalizeGameType(value);

  return (
    <div className={`flex gap-1 ${className}`} role="group" aria-label="Match category">
      {GAME_TYPES.map(type => {
        const isActive = selected === type.value;
        return (
          <button
            key={type.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(type.value)}
            className={`flex-1 min-w-0 px-2 py-1 text-[10px] sm:text-xs font-display border uppercase transition-all ${
              isActive
                ? 'border-[#f5b700] text-[#ffd700] bg-[#f5b700]/15 font-bold'
                : 'border-[#223046] text-[#7d90a6] bg-[#080c14] hover:border-[#f5b700]/50'
            }`}
          >
            {type.label}
          </button>
        );
      })}
    </div>
  );
}
