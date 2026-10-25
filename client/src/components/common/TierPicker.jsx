import React from 'react';
import { normalizeTier, TIERS, TIER_SUBTIERS, tierLabel } from '../../config/matchOptions';

/**
 * Main tier and subtier picker.
 * Picking a main tier defaults the subtier to Mid, so the value is always valid.
 */
export default function TierPicker({ value = '', onChange, className = '' }) {
  const tier = normalizeTier(value);
  const main = tier ? tier.slice(0, 2) : '';
  const sub = tier ? tier.slice(2) : '';

  const chooseMain = (nextMain) => {
    if (!nextMain) {
      onChange('');
      return;
    }
    onChange(`${nextMain}${sub || 'M'}`);
  };

  const chooseSub = (nextSub) => {
    if (main) onChange(`${main}${nextSub}`);
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex gap-1" role="group" aria-label="Opponent tier">
        {TIERS.map(option => {
          const isActive = main === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isActive}
              onClick={() => chooseMain(option.value)}
              className={`flex-1 min-w-0 px-1.5 py-1 text-[10px] sm:text-xs font-display border transition-all ${
                isActive
                  ? 'border-[#f5b700] text-[#ffd700] bg-[#f5b700]/15 font-bold'
                  : 'border-[#223046] text-[#7d90a6] bg-[#080c14] hover:border-[#f5b700]/50'
              }`}
            >
              {option.label}
            </button>
          );
        })}
        <button
          type="button"
          aria-pressed={!main}
          onClick={() => chooseMain('')}
          className={`flex-1 min-w-0 px-1.5 py-1 text-[10px] sm:text-xs font-display border transition-all ${
            !main
              ? 'border-[#7d90a6] text-white bg-[#7d90a6]/15 font-bold'
              : 'border-[#223046] text-[#7d90a6] bg-[#080c14] hover:border-[#7d90a6]/60'
          }`}
        >
          Unrated
        </button>
      </div>

      {main && (
        <div>
          <div className="flex items-center justify-between text-[10px] font-mono-num text-[#8292a8] mb-1">
            <span>Subtier</span>
            <span className="text-[#f5b700] font-bold">{tierLabel(tier)}</span>
          </div>
          <div className="flex gap-1" role="group" aria-label="Opponent subtier">
            {TIER_SUBTIERS.map(option => {
              const isActive = sub === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => chooseSub(option.value)}
                  className={`flex-1 min-w-0 py-1 text-[10px] sm:text-xs font-display border transition-all ${
                    isActive
                      ? 'border-[#f5b700] text-[#ffd700] bg-[#f5b700]/25 font-bold shadow-[0_0_8px_rgba(245,183,0,0.3)]'
                      : 'border-[#223046] text-[#7d90a6] bg-[#080c14] hover:border-[#f5b700]/50'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
