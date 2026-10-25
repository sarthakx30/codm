import React from 'react';
import { MODES, normalizeMode } from '../../config/matchOptions';

/**
 * Three-way mode selector. Short labels keep the control usable on phones.
 */
export default function ModePicker({ value = '', onChange, className = '' }) {
  const selected = normalizeMode(value);

  return (
    <div className={`flex gap-1 ${className}`} role="group" aria-label="Game mode">
      {MODES.map(mode => {
        const isActive = selected === mode.value;
        return (
          <button
            key={mode.id}
            type="button"
            aria-pressed={isActive}
            aria-label={mode.label}
            title={mode.label}
            onClick={() => onChange(mode.value)}
            className={`flex-1 min-w-0 px-1.5 py-1 text-[10px] sm:text-xs font-display border transition-all ${
              isActive
                ? 'border-[#f5b700] text-[#ffd700] bg-[#f5b700]/15 font-bold'
                : 'border-[#223046] text-[#7d90a6] bg-[#080c14] hover:border-[#f5b700]/50'
            }`}
          >
            <span>{mode.label}</span>
          </button>
        );
      })}
    </div>
  );
}
