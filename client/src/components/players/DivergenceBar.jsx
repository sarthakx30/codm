import React from 'react';
import { THEME_CLASSES } from '../../config/theme';

/**
 * Visual Divergence Bar Component
 * Shows how a player's composite efficiency rating deviates from the team benchmark (0%).
 * 
 * @param {number} delta - Percentage difference vs team (-100 to +100)
 * @param {number} rating - Composite rating index (100 = parity)
 * @param {string} tag - Tactical role/performance tag ('CARRY', 'ANCHOR', 'IMPACT', 'PAR', 'DRAG')
 * @param {object} componentDeltas - Sub-metrics breakdown { kdDelta, scoreDelta, killsDelta, objDelta }
 */
export default function DivergenceBar({ delta = 0, rating = 100, tag = 'PAR', componentDeltas = null }) {
  // Max scale cap for visualization (clamps at +/- 60% for optimal bar resolution)
  const MAX_DISPLAY = 60;
  const clampedDelta = Math.min(Math.max(delta, -MAX_DISPLAY), MAX_DISPLAY);
  const widthPercent = (Math.abs(clampedDelta) / MAX_DISPLAY) * 50; // max 50% width from center

  const isPositive = delta > 0;
  const isNegative = delta < 0;
  const isElite = delta >= 25;
  const isAnchor = tag === 'ANCHOR';

  // Tooltip text showing component breakdown
  const tooltipText = componentDeltas
    ? `K/D: ${componentDeltas.kdDelta >= 0 ? '+' : ''}${componentDeltas.kdDelta}% | Score: ${componentDeltas.scoreDelta >= 0 ? '+' : ''}${componentDeltas.scoreDelta}% | Kills: ${componentDeltas.killsDelta >= 0 ? '+' : ''}${componentDeltas.killsDelta}%${componentDeltas.objDelta ? ` | OBJ: ${componentDeltas.objDelta >= 0 ? '+' : ''}${componentDeltas.objDelta}%` : ''}`
    : `Rating: ${rating} (vs 100 team baseline)`;

  // Badge styling from centralized theme
  const badgeColors = {
    CARRY: THEME_CLASSES.badgeGold,
    ANCHOR: THEME_CLASSES.badgeGold,
    IMPACT: THEME_CLASSES.badgeCyan,
    PAR: THEME_CLASSES.badgeNeutral,
    DRAG: THEME_CLASSES.badgeLoss,
  };

  const badgeIcons = {
    CARRY: '⚡',
    ANCHOR: '🛡️',
    IMPACT: '▲',
    PAR: '⚖️',
    DRAG: '▲',
  };

  return (
    <div className="flex items-center gap-2 group/bar relative" title={tooltipText}>
      {/* Divergence Bar Track */}
      <div className="w-24 sm:w-32 h-3 sm:h-3.5 bg-[#080d18] border border-[#1e2a3c] relative rounded-[2px] overflow-hidden flex items-center shrink-0">
        {/* Center Parity Marker (0%) */}
        <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-[#354b6d] z-10 -translate-x-1/2" />

        {/* Positive Divergence (Right of Center) */}
        {isPositive && (
          <div
            className={`absolute left-1/2 top-0 bottom-0 transition-all duration-500 ${
              isElite || tag === 'CARRY'
                ? 'bg-gradient-to-r from-[#f5b700] to-[#ffd700] shadow-[0_0_8px_rgba(255,215,0,0.5)]'
                : 'bg-gradient-to-r from-[#00e5ff]/80 to-[#00e5ff] shadow-[0_0_8px_rgba(0,229,255,0.4)]'
            }`}
            style={{ width: `${widthPercent}%` }}
          />
        )}

        {/* Negative Divergence (Left of Center) */}
        {isNegative && (
          <div
            className="absolute right-1/2 top-0 bottom-0 bg-gradient-to-l from-[#ff334b]/80 to-[#ff334b] shadow-[0_0_8px_rgba(255,51,75,0.4)] transition-all duration-500"
            style={{ width: `${widthPercent}%` }}
          />
        )}

        {/* Parity Indicator */}
        {!isPositive && !isNegative && (
          <div className="absolute left-1/2 top-0.5 bottom-0.5 w-1 bg-[#7d90a6] -translate-x-1/2 rounded-full" />
        )}
      </div>

      {/* Delta % & Rating */}
      <div className="flex items-center gap-1.5 min-w-[70px]">
        <span
          className={`font-mono-num text-[11px] font-bold ${
            isPositive
              ? tag === 'CARRY' ? 'text-[#ffd700]' : 'text-[#00e5ff]'
              : isNegative ? 'text-[#ff334b]' : 'text-[#7d90a6]'
          }`}
        >
          {delta >= 0 ? `+${delta}%` : `${delta}%`}
        </span>

        {/* Tactical Tag Chip */}
        <span
          className={`text-[9px] font-display uppercase tracking-wider px-1 py-0.2 border clip-corner-sm ${
            badgeColors[tag] || badgeColors.PAR
          }`}
        >
          {badgeIcons[tag]} {tag}
        </span>
      </div>
    </div>
  );
}
