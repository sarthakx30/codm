import React from 'react';
import { normalizeTier, TIERS, TIER_SUBTIERS } from '../../config/matchOptions';

/**
 * Compact tier selector for batch controls and other tight layouts.
 */
export default function TierSelect({ value = '', onChange, className = '' }) {
  return (
    <select
      value={normalizeTier(value)}
      onChange={event => onChange(event.target.value)}
      aria-label="Opponent tier"
      className={`bg-[#080c14] border border-[#354b6d] text-white px-2 py-1 text-xs rounded-xs focus:border-[#f5b700] outline-none ${className}`}
    >
      <option value="">Tier: no change</option>
      {TIERS.map(tier => (
        <optgroup key={tier.value} label={tier.label}>
          {TIER_SUBTIERS.map(sub => (
            <option key={`${tier.value}${sub.value}`} value={`${tier.value}${sub.value}`}>
              {tier.label} · {sub.label}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
