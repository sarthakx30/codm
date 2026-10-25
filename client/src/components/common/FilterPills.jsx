import React from 'react';

/**
 * Responsive segmented filter.
 * The option row scrolls sideways on narrow screens instead of overflowing.
 */
export default function FilterPills({
  label,
  options,
  value,
  onChange,
  ariaLabel,
  className = '',
  compact = false
}) {
  const padding = compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <div className={`flex items-center gap-2 min-w-0 ${className}`}>
      {label && (
        <span className="shrink-0 text-[10px] font-mono-num text-[#5a6b82] uppercase font-bold tracking-wider">
          {label}
        </span>
      )}
      <div
        className="flex min-w-0 gap-1 overflow-x-auto no-scrollbar py-0.5"
        role="group"
        aria-label={ariaLabel || label}
      >
        {options.map(option => {
          const isActive = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isActive}
              onClick={() => onChange(option.value)}
              className={`shrink-0 whitespace-nowrap uppercase rounded-xs font-display transition-all ${padding} ${
                isActive
                  ? 'bg-[#f5b700] text-[#080c14] font-bold shadow-[0_0_8px_rgba(245,183,0,0.35)]'
                  : 'text-[#7d90a6] hover:text-white hover:bg-[#111723]'
              }`}
            >
              {option.label}
              {option.count !== undefined && (
                <span
                  className={`ml-1 font-mono-num text-[10px] ${
                    isActive ? 'text-[#080c14]/70' : 'text-[#5a6b82]'
                  }`}
                >
                  {option.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
