import React from 'react';
import { RefreshCw, Radio, AlertOctagon, Tag } from 'lucide-react';
import { APP_VERSION } from '../../config/version';
import { THEME_CLASSES } from '../../config/theme';
import { MATCH_SCOPES } from '../../config/matchOptions';

export default function Header({
  filter,
  onFilterChange,
  isWaking,
  wakingMsg,
  onRefresh,
  loading,
  serverError,
  onOpenAliasModal,
  showScope = true
}) {
  return (
    <header className="mb-6 border-b border-[#243044] pb-4">
      {/* Top Meta Bar */}
      <div className="flex items-center justify-between gap-2 text-[11px] tracking-wider text-[#8292a8] font-mono-num mb-2">
        <div className="flex items-center gap-2 min-w-0">
          {serverError ? (
            <>
              <span className="inline-block w-2 h-2 shrink-0 rounded-full bg-[#ff334b] animate-ping"></span>
              <span className="text-[#ff334b] font-bold">OFFLINE</span>
            </>
          ) : (
            <>
              <span className="inline-block w-2 h-2 shrink-0 rounded-full bg-[#f5b700] animate-pulse shadow-[0_0_8px_#f5b700]"></span>
              <span className="text-white font-semibold truncate">CALL OF DUTY: MOBILE</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className={`hidden sm:inline ${serverError ? 'text-[#ff334b]' : 'text-[#f5b700] font-bold'}`}>
            {serverError ? 'SYSTEM OFFLINE' : 'DATABASE // SYNCED'}
          </span>
          <button
            onClick={onOpenAliasModal}
            className="lg:hidden flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#243044] hover:border-[#f5b700] hover:text-[#f5b700] transition-colors cursor-pointer text-white text-xs font-mono-num active:scale-95"
            title="Roster & Aliases"
            aria-label="Manage roster and aliases"
          >
            <Tag size={11} />
            <span className="hidden sm:inline">ALIASES</span>
          </button>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#243044] hover:border-[#f5b700] hover:text-[#f5b700] transition-colors disabled:opacity-50 cursor-pointer text-white text-xs font-mono-num active:scale-95"
            title="Refresh Match Data"
          >
            <RefreshCw size={11} className={loading ? 'animate-spin text-[#f5b700]' : ''} />
            <span>SYNC</span>
          </button>
        </div>
      </div>

      {/* Main Title & Gold Gradient Accent */}
      <div className="flex items-end justify-between flex-wrap gap-2">
        <div className="flex flex-col">
          <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
            <h1 className="text-3xl sm:text-5xl font-extrabold font-display tracking-wider text-white drop-shadow-[0_0_20px_rgba(245,183,0,0.35)] flex items-baseline gap-2">
              <span>HORIZON</span>
              <span className="text-lg sm:text-2xl font-mono-num font-bold text-[#f5b700] tracking-wider uppercase">
                TATTA
              </span>
            </h1>
            <span className={`text-xs font-mono-num ${THEME_CLASSES.badgeGold} px-2 py-0.5 rounded-xs font-bold`}>
              {APP_VERSION}
            </span>
            {serverError && (
              <span className={`inline-flex items-center gap-1 text-xs font-mono-num ${THEME_CLASSES.badgeLoss} px-2 py-0.5 tracking-wider font-bold animate-pulse clip-corner-sm`}>
                <AlertOctagon size={12} />
                // SERVER UNREACHABLE
              </span>
            )}
          </div>
          <span className="text-[11px] sm:text-xs font-mono-num text-[#8292a8] tracking-wider mt-1">
             Tactical Analysis & Team Tracking Application
          </span>
        </div>
        {!serverError && (
          <span className="text-xs font-mono-num text-[#8292a8] tracking-widest hidden lg:inline">
            // TACTICAL INTELLIGENCE & SQUAD OPTIMIZATION
          </span>
        )}
      </div>
      <div className="h-[2px] mt-2 bg-gradient-to-r from-[#ffd700] via-[#f5b700] to-[#8a6515] rounded-full"></div>

      {/* Render Cold-Start Waking Alert */}
      {isWaking && (
        <div className={`mt-3 px-3 py-2 ${THEME_CLASSES.badgeGold} font-mono-num text-xs flex items-center gap-2 rounded clip-corner-sm animate-pulse`}>
          <Radio size={14} className="animate-spin" />
          <span>{wakingMsg || '// WAKING SERVER (EST. 30S)...'}</span>
        </div>
      )}

      {/* Filter Scope Bar */}
      {showScope && (
        <div className="mt-4 flex flex-col gap-2 bg-[#111622] border border-[#243044] px-3.5 py-2 clip-corner-sm sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs font-display text-[#8292a8] tracking-wider">MATCH SCOPE</span>
          <div className="flex gap-1.5 w-full sm:w-auto" role="group" aria-label="Match scope">
            {MATCH_SCOPES.map(opt => (
              <button
                key={opt.value || 'all'}
                type="button"
                aria-pressed={filter === opt.value}
                onClick={() => onFilterChange(opt.value)}
                className={`flex-1 sm:flex-none px-2 sm:px-3 py-1.5 sm:py-1 text-[11px] sm:text-xs font-display text-center uppercase transition-all active:scale-95 ${
                  filter === opt.value
                    ? THEME_CLASSES.btnPrimary
                    : 'text-[#8292a8] hover:text-white border border-transparent'
                } clip-corner-sm cursor-pointer`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
